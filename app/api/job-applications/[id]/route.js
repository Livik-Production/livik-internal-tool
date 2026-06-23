import { NextResponse } from 'next/server';
import { getJobApplicationById, deleteJobApplication } from '../../../../lib/jobApplicationService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const application = await getJobApplicationById(id);
    if (!application) {
      return addCorsHeaders(NextResponse.json({ error: 'Job application not found' }, { status: 404 }));
    }
    return addCorsHeaders(NextResponse.json({ message: 'Success', data: application }));
  } catch (error) {
    console.error(`GET /api/job-applications/[id] error:`, error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch job application' }, { status: 500 }));
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await deleteJobApplication(id);
    return addCorsHeaders(NextResponse.json({ message: 'Job application deleted successfully' }));
  } catch (error) {
    console.error(`DELETE /api/job-applications/[id] error:`, error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete job application' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
