export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  getAllCrmLeads, createCrmLead,
  getAllCrmCompanies, createCrmCompany,
  getAllCrmInterviews, createCrmInterview
} from '../../../lib/crmLeadService.js';
import {
  getAllCrmLocalLeads, createCrmLocalLead
} from '../../../lib/crmLocalLeadService.js';
import { uploadCompanyDocument, getCompanyDocumentUrl } from '../../../lib/companyDocumentService.ts';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'lead';

    if (type === 'company') {
      const companies = await getAllCrmCompanies();
      const resolvedCompanies = await Promise.all(companies.map(async (company) => {
        if (company.documentUrl && !company.documentUrl.startsWith('http') && !company.documentUrl.startsWith('blob:')) {
          try {
            company.documentUrl = await getCompanyDocumentUrl(company.documentUrl);
          } catch (e) {
            console.error('Error fetching company document URL:', e);
          }
        }
        return company;
      }));
      return NextResponse.json(resolvedCompanies);
    } else if (type === 'interview') {
      const interviews = await getAllCrmInterviews();
      return NextResponse.json(interviews);
    } else if (type === 'local-lead' || type === 'locallead') {
      const localLeads = await getAllCrmLocalLeads();
      return NextResponse.json(localLeads);
    } else {
      const leads = await getAllCrmLeads();
      return NextResponse.json(leads);
    }
  } catch (error) {
    console.error('GET crm error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { body, file } = await parseRequest(request);
    const type = body.type || 'lead';
    
    if (type === 'company') {
      if (file && typeof file === 'object' && file.name) {
        // Upload file to S3
        const companyId = body.companyName || 'unknown-company';
        const key = await uploadCompanyDocument(companyId, file);
        body.documentUrl = key;
      }
      const company = await createCrmCompany(body);
      if (company.documentUrl && !company.documentUrl.startsWith('http') && !company.documentUrl.startsWith('blob:')) {
        company.documentUrl = await getCompanyDocumentUrl(company.documentUrl);
      }
      return NextResponse.json(company);
    } else if (type === 'interview') {
      const interview = await createCrmInterview(body);
      return NextResponse.json(interview);
    } else if (type === 'local-lead' || type === 'locallead') {
      const localLead = await createCrmLocalLead(body);
      return NextResponse.json(localLead);
    } else {
      const lead = await createCrmLead(body);
      return NextResponse.json(lead);
    }
  } catch (error) {
    console.error('POST crm error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500 });
  }
}
