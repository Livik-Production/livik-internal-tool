import { NextResponse } from 'next/server';
import {
  getAssetCategoryById,
  updateAssetCategory,
  deleteAssetCategory,
} from '../../../../lib/assetCategoryService';

// GET → Fetch category by ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const category = await getAssetCategoryById(id);
    if (!category)
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(category)));
  } catch (error) {
    console.error('GET /asset-categories/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT → Update category
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const updated = await updateAssetCategory(id, data);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /asset-categories/:id error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violated' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE → Remove category
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const result = await deleteAssetCategory(id);
    return NextResponse.json(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    console.error('DELETE /asset-categories/:id error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
