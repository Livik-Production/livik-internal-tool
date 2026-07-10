import { NextResponse } from 'next/server';
import {
  updatePettyCash,
  deletePettyCash,
} from '../../../../../lib/pettyCashService';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updatePettyCash(id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/expense/petty-cash/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const result = await deletePettyCash(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DELETE /api/expense/petty-cash/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
