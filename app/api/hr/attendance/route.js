import { NextResponse } from 'next/server';
import {
  getMonthlyAttendanceSummary,
  bulkMarkAttendance,
  getDetailedMonthlyAttendance,
  getMarkedAttendanceMonths,
} from '../../../../lib/attendanceService';

/**
 * GET /api/hr/attendance?month=YYYY-MM&employeeId=xxx&detailed=true
 * Fetch monthly attendance summary
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const employeeId = searchParams.get('employeeId');
    const detailed = searchParams.get('detailed') === 'true';
    const action = searchParams.get('action');

    if (action === 'getMonths') {
      const months = await getMarkedAttendanceMonths();
      return NextResponse.json(months);
    }

    if (!month) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    const summary = detailed
      ? await getDetailedMonthlyAttendance(month, employeeId)
      : await getMonthlyAttendanceSummary(month, employeeId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance summary' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hr/attendance
 * Bulk mark attendance for a specific date
 * Body: { date: "YYYY-MM-DD", records: [{ employeeId, status, remarks }] }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { date, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Date and records array are required' },
        { status: 400 }
      );
    }

    const result = await bulkMarkAttendance(date, records);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
