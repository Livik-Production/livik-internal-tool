import { NextResponse } from 'next/server';
import {
  getAssetById,
  updateAsset,
  deleteAsset,
} from '../../../../lib/assetService';

// GET /api/assets/:id
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const asset = await getAssetById(id);
    if (!asset)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(asset)));
  } catch (err) {
    console.error('GET asset error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}

// PUT /api/assets/:id
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateAsset(id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (err) {
    console.error('PUT asset error:', err);
    if (err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset tag already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/:id
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const res = await deleteAsset(id);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (err) {
    console.error('DELETE asset error:', err);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
