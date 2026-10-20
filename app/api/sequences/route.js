import { NextResponse } from 'next/server';
import { getSequenceStatuses } from '../../../lib/sequenceService';

export async function GET() {
  try {
    const statuses = await getSequenceStatuses();
    return NextResponse.json(statuses);
  } catch (error) {
    console.error('GET /api/sequences error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
