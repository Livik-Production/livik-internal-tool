import { NextResponse } from 'next/server';
import { pettyCashService } from '../../../../lib/pettyCashService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const detail = await pettyCashService.getInflowDetail(id);
      return NextResponse.json(detail);
    }

    const inflows = await pettyCashService.getAllInflows();
    return NextResponse.json(inflows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await pettyCashService.createInflow(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
