// app/api/leave/balance/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  getLeaveBalances,
  creditLeaveBalance,
} from '../../../../lib/leaveService';

// GET /api/leave/balance?employeeId=...
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required' },
        { status: 400 }
      );
    }
    const res = await getLeaveBalances(employeeId);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/leave/balance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}

// POST /api/leave/balance  body: { employeeId, leaveType, amount }
export async function POST(req) {
  try {
    const body = await req.json();
    const { employeeId, leaveType, amount } = body;
    if (!employeeId || !leaveType || amount == null) {
      return NextResponse.json(
        { error: 'employeeId, leaveType and amount required' },
        { status: 400 }
      );
    }
    const res = await creditLeaveBalance(employeeId, leaveType, amount);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('POST /api/leave/balance error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to credit' },
      { status: 500 }
    );
  }
}
