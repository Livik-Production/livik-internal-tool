import { NextResponse } from 'next/server';
import {
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from '../../../../../lib/attendanceService';

/**
 * PUT /api/hr/attendance/[id]
 * Update individual attendance record
 */
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await updateAttendanceRecord(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/hr/attendance/[id]
 * Delete attendance record
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await deleteAttendanceRecord(id);
    return NextResponse.json({ message: 'Attendance record deleted' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
