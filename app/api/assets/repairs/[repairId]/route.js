import { NextResponse } from 'next/server';
import { updateAssetRepair, deleteAssetRepair } from '../../../../../lib/assetRepairService';

// PUT /api/assets/repairs/:repairId
export async function PUT(req, { params }) {
  try {
    const { repairId } = await params;
    const body = await req.json();
    const updated = await updateAssetRepair(repairId, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (err) {
    console.error('PUT asset repair error:', err);
    return NextResponse.json(
      { error: `Failed to update repair record: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/repairs/:repairId
export async function DELETE(req, { params }) {
  try {
    const { repairId } = await params;
    const deleted = await deleteAssetRepair(repairId);
    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (err) {
    console.error('DELETE asset repair error:', err);
    return NextResponse.json(
      { error: `Failed to delete repair record: ${err.message}` },
      { status: 500 }
    );
  }
}
