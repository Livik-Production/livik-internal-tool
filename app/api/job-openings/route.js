import { NextResponse } from 'next/server';
import { createJobOpening, getAllJobOpenings, getActiveJobOpenings } from '../../../lib/jobOpeningService.js';

// Helper to add CORS headers
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';

    const openings = showAll ? await getAllJobOpenings() : await getActiveJobOpenings();
    const response = NextResponse.json({
      message: 'Success',
      data: openings,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('GET /api/job-openings error:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch job openings' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createJobOpening(body);

    const response = NextResponse.json(
      { message: 'Job opening created successfully', data: created },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error) {
    console.error('POST /api/job-openings error:', error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to create job opening' },
      { status: 400 }
    );
    return addCorsHeaders(response);
  }
}

// Handle preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}
