import { NextResponse } from 'next/server';
import { getAllRights, createRight } from '../../../lib/rightsService';

export async function GET() {
  try {
    const rights = await getAllRights();
    return NextResponse.json(JSON.parse(JSON.stringify(rights)));
  } catch (error) {
    console.error('GET rights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rights' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const created = await createRight(data);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST right error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Right already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create right' },
      { status: 500 }
    );
  }
}
