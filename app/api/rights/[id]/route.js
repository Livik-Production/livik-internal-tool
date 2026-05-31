import { NextResponse } from 'next/server';
import {
  getRightById,
  updateRight,
  deleteRight,
} from '../../../../lib/rightsService';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const right = await getRightById(id);
    if (!right)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(right)));
  } catch (error) {
    console.error('GET right error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch right' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const data = await req.json();
    const updated = await updateRight(id, data);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT right error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violated' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update right' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const deleted = await deleteRight(id);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE right error:', error);
    return NextResponse.json(
      { error: 'Failed to delete right' },
      { status: 500 }
    );
  }
}
