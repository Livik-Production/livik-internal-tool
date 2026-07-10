// app/api/invoices/[id]/payments/route.js
import { NextResponse } from 'next/server';
import {
  addInvoicePayment,
  getInvoicePayments,
} from '../../../../../lib/invoicePaymentService.js';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const payments = await getInvoicePayments(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(payments)));
  } catch (error) {
    console.error('GET /api/invoices/[id]/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice payments' },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  try {
    const params = await context.params;
    const body = await req.json();

    const payment = await addInvoicePayment(params.id, body);

    return NextResponse.json(JSON.parse(JSON.stringify(payment)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/invoices/[id]/payments error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to add payment' },
      { status: 400 }
    );
  }
}
