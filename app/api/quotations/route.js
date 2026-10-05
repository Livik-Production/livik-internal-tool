// app/api/quotations/route.js
import { NextResponse } from 'next/server';
import {
  createQuotation,
  getAllQuotations,
} from '../../../lib/quotationService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const fromDate = url.searchParams.get('fromDate') ?? undefined;
    const toDate = url.searchParams.get('toDate') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;

    const quotations = await getAllQuotations({ fromDate, toDate, status });
    return NextResponse.json(JSON.parse(JSON.stringify(quotations)));
  } catch (error) {
    console.error('GET /api/quotations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createQuotation(body);

    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/quotations error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create quotation' },
      { status: 400 }
    );
  }
}
