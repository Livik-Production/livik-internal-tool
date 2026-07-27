import { NextResponse } from 'next/server';
import { getAllEmployeesWithBalances } from '../../../../lib/leaveService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    const balances = await getAllEmployeesWithBalances(month, year);
    return NextResponse.json(JSON.parse(JSON.stringify(balances)));
  } catch (error) {
    console.error('GET /api/hr/leave-balances error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave balances' },
      { status: 500 }
    );
  }
}
