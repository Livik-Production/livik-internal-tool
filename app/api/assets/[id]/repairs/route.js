import { NextResponse } from 'next/server';
import { getRepairsByAssetId, createAssetRepair } from '../../../../../lib/assetRepairService';

// GET /api/assets/:id/repairs
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const repairs = await getRepairsByAssetId(id);
    return NextResponse.json(JSON.parse(JSON.stringify(repairs)));
  } catch (err) {
    console.error('GET asset repairs error:', err);
    return NextResponse.json(
      { error: `Failed to fetch repairs: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST /api/assets/:id/repairs
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const repair = await createAssetRepair(id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(repair)), {
      status: 201,
    });
  } catch (err) {
    console.error('POST asset repair error:', err);
    return NextResponse.json(
      { error: `Failed to create repair record: ${err.message}` },
      { status: 500 }
    );
  }
}
