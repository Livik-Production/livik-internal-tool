export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../../lib/assetAssignmentService';

export async function GET(_, { params }) {
  const { id } = await params;
  const data = await assetAssignmentService.getById(id);
  return !data
    ? NextResponse.json({ error: 'Not Found' }, { status: 404 })
    : NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await assetAssignmentService.deleteAssignment(id);
  return NextResponse.json({ message: 'Deleted' });
}
