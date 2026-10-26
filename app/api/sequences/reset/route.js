import { NextResponse } from 'next/server';
import { resetSequence } from '../../../../lib/sequenceService';

export async function POST(req) {
  try {
    const { module: moduleName } = await req.json();
    if (!moduleName) {
      return NextResponse.json({ error: 'Missing module' }, { status: 400 });
    }

    const result = await resetSequence(moduleName);
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/sequences/reset error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
