import { NextResponse } from 'next/server';
import { getAllAssets, createAsset } from '../../../lib/assetService';

export async function GET() {
  try {
    const assets = await getAllAssets();
    return NextResponse.json(JSON.parse(JSON.stringify(assets)));
  } catch (err) {
    console.error('GET assets error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const asset = await createAsset(body);
    return NextResponse.json(JSON.parse(JSON.stringify(asset)), {
      status: 201,
    });
  } catch (err) {
    console.error('POST asset error:', err);
    // Handle unique constraint on asset_tag (P2002)
    if (err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset tag already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}
