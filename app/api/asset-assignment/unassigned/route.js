import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../../lib/assetAssignmentService';

export async function GET() {
  const data = await assetAssignmentService.unassignedAssets();
  return NextResponse.json({ data });
}
