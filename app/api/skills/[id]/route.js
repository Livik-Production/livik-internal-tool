import { NextResponse } from 'next/server';
import { updateSkill, deleteSkill } from '../../../../lib/skillService';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const updated = await updateSkill(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT skill error:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await deleteSkill(id);
    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('DELETE skill error:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
