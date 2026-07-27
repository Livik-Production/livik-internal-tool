import { NextResponse } from 'next/server';
import {
  deletePermissionRequest,
  updatePermissionRequest,
  getPermissionRequestById,
} from '../../../../lib/permissionService.js';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const res = await getPermissionRequestById(id);
    if (!res) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/permission/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const deleted = await deletePermissionRequest(id);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/permission/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to delete permission request' },
      { status: 400 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();
    const updated = await updatePermissionRequest(id, data);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/permission/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update permission request' },
      { status: 400 }
    );
  }
}
