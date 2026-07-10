// app/api/permission/[id]/reject/route.js
import { NextResponse } from 'next/server';
import { rejectPermissionRequest } from '../../../../../lib/permissionService.js';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const { approverId, remarks } = await req.json();

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required' },
        { status: 400 }
      );
    }

    const updated = await rejectPermissionRequest(id, approverId, remarks);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('POST /api/permission/[id]/reject error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to reject permission request' },
      { status: 400 }
    );
  }
}
