// app/api/permission/[id]/approve/route.js
import { NextResponse } from 'next/server';
import { approvePermissionRequest } from '../../../../../lib/permissionService';

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const { approverId, remarks } = await req.json();

    if (!approverId) {
      return NextResponse.json(
        { error: 'approverId is required' },
        { status: 400 }
      );
    }

    const updated = await approvePermissionRequest(id, approverId, remarks);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('POST /api/permission/[id]/approve error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to approve permission request' },
      { status: 400 }
    );
  }
}
