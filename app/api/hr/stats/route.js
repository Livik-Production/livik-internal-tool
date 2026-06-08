import { NextResponse } from 'next/server';
import { getHRStats } from '../../../../lib/hrDashboardService';

export async function GET() {
  try {
    const stats = await getHRStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('GET /api/hr/stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch HR statistics' },
      { status: 500 }
    );
  }
}
