import { NextResponse } from 'next/server';
import { getExpenseDashboardData } from '../../../../lib/expenseDashboardService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const category = searchParams.get('category');
    const period = searchParams.get('period') || 'weekly';

    const data = await getExpenseDashboardData({
      fromDate,
      toDate,
      category,
      period,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Expense Dashboard API Error:', err);
    return NextResponse.json(
      { success: false, message: 'Dashboard fetch failed' },
      { status: 500 }
    );
  }
}
