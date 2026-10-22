export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  updateCrmLead, deleteCrmLead,
  updateCrmCompany, deleteCrmCompany,
  updateCrmInterview, deleteCrmInterview
} from '../../../../lib/crmLeadService.js';
import {
  updateCrmLocalLead, deleteCrmLocalLead
} from '../../../../lib/crmLocalLeadService.js';
import { uploadCompanyDocument } from '../../../../lib/companyDocumentService.ts';

async function parseRequest(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());
    const file = formData.get('document');
    delete body.document; // Prevent Prisma from trying to save the File object
    return { body, file };
  } else {
    const body = await req.json();
    return { body, file: null };
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { body, file } = await parseRequest(request);
    const type = body.type || new URL(request.url).searchParams.get('type') || 'lead';
    
    if (type === 'company') {
      if (file && typeof file === 'object' && file.name) {
        // Upload file to S3
        const companyId = body.companyName || 'unknown-company';
        const key = await uploadCompanyDocument(companyId, file);
        body.documentUrl = key;
      } else if (body.documentUrl === 'null' || !body.documentUrl) {
        // if explicitly null or not provided, we might want to clear or keep it, depends on logic.
        // Usually, if not updating, we either omit or pass existing.
      }
      
      const company = await updateCrmCompany(id, body);
      if (company.documentUrl && !company.documentUrl.startsWith('http') && !company.documentUrl.startsWith('blob:')) {
        company.documentUrl = await getCompanyDocumentUrl(company.documentUrl);
      }
      return NextResponse.json(company);
    } else if (type === 'interview') {
      const interview = await updateCrmInterview(id, body);
      return NextResponse.json(interview);
    } else if (type === 'local-lead' || type === 'locallead') {
      const localLead = await updateCrmLocalLead(id, body);
      return NextResponse.json(localLead);
    }

    // First, update the CRM lead status
    const lead = await updateCrmLead(id, body);
    
    // If the status is moved to 'Won', create a corresponding Customer record
    if (body.status === 'Won') {
      try {
        // We import createCustomer dynamically or at the top. Let's do it inline to avoid circular deps if any.
        const { createCustomer } = await import('../../../../lib/customerService.js');
        await createCustomer({
          name: lead.companyName,
          address1: lead.companyAddress || 'N/A',
          city: 'N/A', // CRM Lead might not have city, fallback to N/A
          state: 'N/A',
          pincode: 'N/A',
          mobile: lead.pocMobile || 'N/A',
          email: lead.companyEmail || lead.pocEmail || null,
          website: lead.companyWebsite || null,
          status: 'active',
          paymentTerms: 'NET30', // default
        });
      } catch (custErr) {
        console.error('Failed to create customer from won lead:', custErr);
      }
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error('PUT crm error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const type = new URL(request.url).searchParams.get('type') || 'lead';

    if (type === 'company') {
      await deleteCrmCompany(id);
      return NextResponse.json({ success: true });
    } else if (type === 'interview') {
      await deleteCrmInterview(id);
      return NextResponse.json({ success: true });
    } else if (type === 'local-lead' || type === 'locallead') {
      await deleteCrmLocalLead(id);
      return NextResponse.json({ success: true });
    } else {
      await deleteCrmLead(id);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('DELETE crm error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
