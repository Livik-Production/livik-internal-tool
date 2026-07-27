// app/api/invoices/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '../../../../lib/invoiceService.js';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const invoice = await getInvoiceById(params.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(invoice)));
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const params = await context.params;
    const body = await req.json();

    const updated = await updateInvoice(params.id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update invoice' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const deleted = await deleteInvoice(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
