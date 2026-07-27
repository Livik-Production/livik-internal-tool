import { NextResponse } from 'next/server';
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../../../lib/rolesService.js';

export async function GET() {
  try {
    const roles = await getAllRoles();
    return NextResponse.json(JSON.parse(JSON.stringify(roles)));
  } catch (error) {
    console.error('GET roles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const created = await createRole(data);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST role error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create role', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const updated = await updateRole(id, updateData);
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
      { error: 'Failed to update role', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

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
