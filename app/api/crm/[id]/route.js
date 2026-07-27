export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { updateCrmLead, deleteCrmLead } from '../../../../lib/crmLeadService.js';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
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
        console.error('Error creating customer from lead:', custErr);
        // We do not fail the request if customer creation fails, or we could. 
        // For now, let it pass so the lead status remains updated.
      }
    }
    
    return NextResponse.json(lead);
  } catch (error) {
    console.error('PUT crm lead error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteCrmLead(id);
    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('DELETE crm lead error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete lead' }, { status: 500 });
  }
}
