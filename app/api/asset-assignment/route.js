export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../lib/assetAssignmentService';

export async function POST(req) {
  try {
    const { assetId, employeeId, assignedDate, notes } = await req.json();
    const assigned = await assetAssignmentService.assignAsset(
      assetId,
      employeeId,
      assignedDate,
      notes
    );
    return NextResponse.json({ message: 'Assigned', assigned });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const data = await assetAssignmentService.listAssigned();
  return NextResponse.json({ data });
}
