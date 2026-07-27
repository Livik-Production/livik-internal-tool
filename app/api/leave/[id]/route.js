// app/api/leave/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
} from '../../../../lib/leaveService.js';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const res = await getLeaveRequestById(id);
    if (!res) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/leave/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateLeaveRequest(id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/leave/:id error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update request' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const deleted = await deleteLeaveRequest(id);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/leave/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
