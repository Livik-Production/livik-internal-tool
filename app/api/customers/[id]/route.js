import { NextResponse } from 'next/server';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../../../../lib/customerService.js';
import { uploadCustomerDocument } from '../../../../lib/customerDocumentService.ts';

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

export async function GET(req, context) {
  try {
    const params = await context.params;
    const customer = await getCustomerById(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(JSON.stringify(customer)));
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const params = await context.params;
    const { body, file } = await parseRequest(req);

    if (file && typeof file === 'object' && file.name) {
       const customerName = body.name || 'unknown-customer';
       const key = await uploadCustomerDocument(customerName, file);
       body.uploads = key;
    } else if (body.uploads === 'null' || !body.uploads || typeof body.uploads === 'object') {
       body.uploads = null;
    }

    const updated = await updateCustomer(params.id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update customer' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const deleted = await deleteCustomer(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
