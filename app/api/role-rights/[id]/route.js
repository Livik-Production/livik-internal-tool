import { NextResponse } from 'next/server';
import { removeRightFromRole } from '../../../../lib/roleRightsService.js';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const deleted = await removeRightFromRole(id);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE role-right error:', error);
    return NextResponse.json(
      { error: 'Failed to remove right from role' },
      { status: 500 }
    );
  }
}
