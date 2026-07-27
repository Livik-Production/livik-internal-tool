import { NextResponse } from 'next/server';
import {
  getAllRoleRights,
  assignRightToRole,
} from '../../../lib/roleRightsService.js';

export async function GET() {
  try {
    const mappings = await getAllRoleRights();
    return NextResponse.json(JSON.parse(JSON.stringify(mappings)));
  } catch (error) {
    console.error('GET role-rights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role-rights mappings' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const created = await assignRightToRole(data);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST role-rights error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Mapping already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to assign right to role' },
      { status: 500 }
    );
  }
}
