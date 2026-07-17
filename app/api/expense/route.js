// app/api/expense/route.js
import { NextResponse } from 'next/server';
import { createExpense, getAllExpenses } from '../../../lib/expenseService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const category = url.searchParams.get('category') ?? undefined;
    const fromDate = url.searchParams.get('fromDate') ?? undefined;
    const toDate = url.searchParams.get('toDate') ?? undefined;

    const expenses = await getAllExpenses({ category, fromDate, toDate });
    return NextResponse.json(JSON.parse(JSON.stringify(expenses)));
  } catch (error) {
    console.error('GET /api/expense error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createExpense(body);

    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/expense error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create expense' },
      { status: 400 }
    );
  }
}
