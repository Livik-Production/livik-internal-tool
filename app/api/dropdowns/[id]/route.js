import { NextResponse } from 'next/server';
import { updateDropdown, deleteDropdown } from '../../../../lib/dropdownService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateDropdown(id, body);

    return addCorsHeaders(NextResponse.json({
      message: 'Dropdown option updated successfully',
      data: updated,
    }));
  } catch (error) {
    console.error(`PUT /api/dropdowns/[id] error:`, error);
    return addCorsHeaders(NextResponse.json(
      { error: error.message || 'Failed to update dropdown option' },
      { status: 400 }
    ));
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await deleteDropdown(id);

    return addCorsHeaders(NextResponse.json({
      message: 'Dropdown option deleted successfully',
    }));
  } catch (error) {
    console.error(`DELETE /api/dropdowns/[id] error:`, error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to delete dropdown option' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
