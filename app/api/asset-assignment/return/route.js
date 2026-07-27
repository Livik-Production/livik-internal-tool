export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../../lib/assetAssignmentService';

export async function POST(req) {
  try {
    const { assignmentId, returnDate } = await req.json();
    const updated = await assetAssignmentService.returnAsset(
      assignmentId,
      returnDate
    );
    return NextResponse.json({ message: 'Returned', updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
