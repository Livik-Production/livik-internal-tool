import { NextResponse } from 'next/server';
import {
  createCustomer,
  getAllCustomers,
} from '../../../lib/customerService.js';
import { uploadCustomerDocument } from '../../../lib/customerDocumentService.ts';

async function parseRequest(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());
    
    if (body.invoiceFromDay) body.invoiceFromDay = parseInt(body.invoiceFromDay, 10);
    if (body.invoiceToDay) body.invoiceToDay = parseInt(body.invoiceToDay, 10);
    if (body.reminderDaysBefore) body.reminderDaysBefore = parseInt(body.reminderDaysBefore, 10);
    if (body.reminderEnabled === 'true') body.reminderEnabled = true;
    if (body.reminderEnabled === 'false') body.reminderEnabled = false;
    
    const file = formData.get('uploads');
    return { body, file };
  } else {
    const body = await req.json();
    return { body, file: null };
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const name = url.searchParams.get('name') ?? undefined;
    const mobile = url.searchParams.get('mobile') ?? undefined;
    const gstnNumber = url.searchParams.get('gstnNumber') ?? undefined;

    const customers = await getAllCustomers({ name, mobile, gstnNumber });
    return NextResponse.json(JSON.parse(JSON.stringify(customers)));
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { body, file } = await parseRequest(req);

    if (file && typeof file === 'object' && file.name) {
       const customerName = body.name || 'unknown-customer';
       const key = await uploadCustomerDocument(customerName, file);
       body.uploads = key;
    } else if (body.uploads === 'null' || !body.uploads || typeof body.uploads === 'object') {
       body.uploads = null;
    }

    const created = await createCustomer(body);

    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create customer' },
      { status: 400 }
    );
  }
}

