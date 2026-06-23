import { NextResponse } from 'next/server';
import { pettyCashService } from '../../../../../lib/pettyCashService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const balance = await pettyCashService.getBalanceByDate(date);
    return NextResponse.json({ balance });
  } catch (err) {
    console.error('GET /api/expense/petty-cash/balance error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
