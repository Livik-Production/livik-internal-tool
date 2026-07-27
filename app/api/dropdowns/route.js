import { NextResponse } from 'next/server';
import { getAllDropdownsGrouped, getDropdownsByType, createDropdown, updateCategoryType, invalidateDropdownCache } from '../../../lib/dropdownService.js';
import { prisma } from '../../../lib/prisma.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type) {
      const options = await getDropdownsByType(type);
      return addCorsHeaders(NextResponse.json({
        message: 'Success',
        data: options,
      }));
    }

    const grouped = await getAllDropdownsGrouped();
    return addCorsHeaders(NextResponse.json({
      message: 'Success',
      data: grouped,
    }));
  } catch (error) {
    console.error('GET /api/dropdowns error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch dropdown values' },
      { status: 500 }
    ));
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createDropdown(body);

    return addCorsHeaders(NextResponse.json(
      { message: 'Dropdown option created successfully', data: created },
      { status: 201 }
    ));
  } catch (error) {
    console.error('POST /api/dropdowns error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to create dropdown option' },
      { status: 400 }
    ));
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      ));
    }

    await prisma.dropdown.deleteMany({
      where: { type },
    });
    
    invalidateDropdownCache();

    return addCorsHeaders(NextResponse.json({
      message: `All dropdown options of type ${type} deleted successfully`,
    }));
  } catch (error) {
    console.error('DELETE /api/dropdowns error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to delete dropdown options' },
      { status: 500 }
    ));
  }
}

export async function PUT(req) {
  try {
    const { oldType, newType } = await req.json();

    if (!oldType || !newType) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Both oldType and newType are required' },
        { status: 400 }
      ));
    }

    const updatedCount = await updateCategoryType(oldType, newType);

    return addCorsHeaders(NextResponse.json({
      message: `Category renamed successfully. Updated ${updatedCount} items.`,
      updatedCount,
    }));
  } catch (error) {
    console.error('PUT /api/dropdowns error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to rename category' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
