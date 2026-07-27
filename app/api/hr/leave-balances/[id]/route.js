import { NextResponse } from 'next/server';
import { updateLeaveBalances } from '../../../../../lib/leaveService';

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id: employeeId } = resolvedParams;
    const body = await req.json();
    const { balances } = body;

    if (!employeeId || !balances || !Array.isArray(balances)) {
      return NextResponse.json(
        { error: 'employeeId and balances array are required' },
        { status: 400 }
      );
    }

    const result = await updateLeaveBalances(employeeId, balances);
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/hr/leave-balances/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update leave balances' },
      { status: 500 }
    );
  }
}
