// app/api/expense/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../../../../lib/expenseService.js';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const expense = await getExpenseById(params.id);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(expense)));
  } catch (error) {
    console.error('GET /api/expense/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const params = await context.params;
    const body = await req.json();

    const updated = await updateExpense(params.id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/expense/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update expense' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const deleted = await deleteExpense(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/expense/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
