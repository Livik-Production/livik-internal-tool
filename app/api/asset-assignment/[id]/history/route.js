export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../../../lib/assetAssignmentService';

export async function GET(_, { params }) {
  const { id } = await params;
  const history = await assetAssignmentService.history(id);
  return NextResponse.json({ history });
}
