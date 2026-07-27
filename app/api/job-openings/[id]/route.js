import { NextResponse } from 'next/server';
import { getJobOpeningById, updateJobOpening, deleteJobOpening } from '../../../../lib/jobOpeningService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const opening = await getJobOpeningById(id);
    if (!opening) {
      return addCorsHeaders(NextResponse.json({ error: 'Job opening not found' }, { status: 404 }));
    }
    return addCorsHeaders(NextResponse.json({ message: 'Success', data: opening }));
  } catch (error) {
    console.error(`GET /api/job-openings/[id] error:`, error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch job opening' }, { status: 500 }));
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const updated = await updateJobOpening(id, body);
    return addCorsHeaders(NextResponse.json({ message: 'Job opening updated successfully', data: updated }));
  } catch (error) {
    console.error(`PUT /api/job-openings/[id] error:`, error);
    return addCorsHeaders(NextResponse.json({ error: error.message ?? 'Failed to update job opening' }, { status: 400 }));
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await deleteJobOpening(id);
    return addCorsHeaders(NextResponse.json({ message: 'Job opening deleted successfully' }));
  } catch (error) {
    console.error(`DELETE /api/job-openings/[id] error:`, error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete job opening' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
