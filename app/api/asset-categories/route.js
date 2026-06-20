import { NextResponse } from 'next/server';
import {
  getAllAssetCategories,
  createAssetCategory,
} from '../../../lib/assetCategoryService';

// GET → List all categories
export async function GET() {
  try {
    const categories = await getAllAssetCategories();
    return NextResponse.json(JSON.parse(JSON.stringify(categories)));
  } catch (error) {
    console.error('GET /asset-categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset categories' },
      { status: 500 }
    );
  }
}

// POST → Create new category
export async function POST(req) {
  try {
    const data = await req.json();
    const created = await createAssetCategory(data);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /asset-categories error:', error);
    if (error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create asset category' },
      { status: 500 }
    );
  }
}
