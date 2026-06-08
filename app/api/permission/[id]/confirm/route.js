// app/api/permission/[id]/confirm/route.js
import { NextResponse } from 'next/server';
import { confirmPermissionHours } from '../../../../../lib/permissionService';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const { actualHours, confirmerId, remarks } = await req.json();

    if (!actualHours || actualHours <= 0) {
      return NextResponse.json(
        { error: 'actualHours is required and must be positive' },
        { status: 400 }
      );
    }

    const result = await confirmPermissionHours(
      id,
      actualHours,
      confirmerId,
      remarks
    );
    return NextResponse.json(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    console.error('POST /api/permission/[id]/confirm error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to confirm permission hours' },
      { status: 400 }
    );
  }
}
