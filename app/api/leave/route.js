// app/api/leave/route.js
import { NextResponse } from 'next/server';
import {
  getAllLeaveRequests,
  createLeaveRequest,
} from '../../../lib/leaveService.js';

export async function GET(req) {
  try {
    // optional query parsing
    const url = new URL(req.url);
    const checkPending = url.searchParams.get('checkPending') === 'true';
    const month = url.searchParams.get('month');

    if (checkPending && month) {
      const { hasPendingLeaveRequests } =
        await import('../../../lib/leaveService.js');
      const hasPending = await hasPendingLeaveRequests(month);
      return NextResponse.json({ hasPending });
    }

    const status = url.searchParams.get('status') ?? undefined;
    const employeeId = url.searchParams.get('employeeId') ?? undefined;
    const excludeEmployeeId =
      url.searchParams.get('excludeEmployeeId') ?? undefined;
    const leaveType = url.searchParams.get('leaveType') ?? undefined;
    const fromDate = url.searchParams.get('fromDate') ?? undefined;
    const toDate = url.searchParams.get('toDate') ?? undefined;

    const filters = {
      status,
      employeeId,
      excludeEmployeeId,
      leaveType,
      fromDate,
      toDate,
    };
    const res = await getAllLeaveRequests(filters);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/leave error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createLeaveRequest(body);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/leave error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create leave request' },
      { status: 400 }
    );
  }
}
