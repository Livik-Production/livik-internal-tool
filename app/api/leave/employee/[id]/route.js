// app/api/leave/employee/[id]/route.js
import { NextResponse } from 'next/server';
import { getEmployeeLeaveHistory } from '../../../../../lib/leaveService';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const res = await getEmployeeLeaveHistory(id);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/leave/employee/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
