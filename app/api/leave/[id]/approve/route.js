import { NextResponse } from 'next/server';
import { approveLeave } from '../../../../../lib/leaveService.js';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const { approverId, remarks } = body;

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required' },
        { status: 400 }
      );
    }

    const result = await approveLeave(id, approverId, remarks);
    return NextResponse.json(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    console.error('POST /api/leave/[id]/approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
