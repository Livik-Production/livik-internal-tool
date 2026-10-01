// app/api/quotations/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getQuotationById,
  updateQuotation,
  deleteQuotation,
} from '../../../../lib/quotationService.js';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const quotation = await getQuotationById(params.id);

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(JSON.stringify(quotation)));
  } catch (error) {
    console.error('GET /api/quotations/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const params = await context.params;
    const body = await req.json();

    const updated = await updateQuotation(params.id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/quotations/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update quotation' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const deleted = await deleteQuotation(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/quotations/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}
