import { NextResponse } from 'next/server';
import { rejectLeave } from '../../../../../lib/leaveService.js';

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { approverId, remarks } = body;

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required' },
        { status: 400 }
      );
    }

    const result = await rejectLeave(id, approverId, remarks);
    return NextResponse.json(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    console.error('POST /api/leave/[id]/reject error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
