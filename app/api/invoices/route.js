// app/api/invoices/route.js
import { NextResponse } from 'next/server';
import { createInvoice, getAllInvoices } from '../../../lib/invoiceService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const fromDate = url.searchParams.get('fromDate') ?? undefined;
    const toDate = url.searchParams.get('toDate') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const invoiceType = url.searchParams.get('invoiceType') ?? undefined;

    const invoices = await getAllInvoices({
      fromDate,
      toDate,
      status,
      invoiceType,
    });
    return NextResponse.json(JSON.parse(JSON.stringify(invoices)));
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createInvoice(body);

    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create invoice' },
      { status: 400 }
    );
  }
}
