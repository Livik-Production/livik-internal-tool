import { NextResponse } from 'next/server';
import { getCustomerById } from '../../../../../lib/customerService.js';
import { getCustomerDocumentUrl } from '../../../../../lib/customerDocumentService.ts';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const customer = await getCustomerById(params.id);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customer.uploads || typeof customer.uploads !== 'string') {
      return NextResponse.json({ error: 'No document found for this customer' }, { status: 404 });
    }

    const url = await getCustomerDocumentUrl(customer.uploads);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('GET /api/customers/[id]/document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document URL' }, { status: 500 });
  }
}
