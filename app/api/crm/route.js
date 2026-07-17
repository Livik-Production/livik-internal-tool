export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAllCrmLeads, createCrmLead } from '../../../lib/crmLeadService.js';

export async function GET() {
  try {
    const leads = await getAllCrmLeads();
    return NextResponse.json(leads);
  } catch (error) {
    console.error('GET crm leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = await createCrmLead(body);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('POST crm lead error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create lead' }, { status: 500 });
  }
}
