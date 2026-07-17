import { NextResponse } from 'next/server';
import {
  getRoleById,
  updateRole,
  deleteRole,
} from '../../../../lib/rolesService.js';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const role = await getRoleById(id);
    if (!role)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(role)));
  } catch (error) {
    console.error('GET role error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const updated = await updateRole(id, data);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT role error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violated' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const deleted = await deleteRole(id);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE role error:', error);
    return NextResponse.json(
      { error: 'Failed to delete role', details: error.message },
      { status: 500 }
    );
  }
}
