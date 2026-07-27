import { NextResponse } from 'next/server';
import { createContactSubmission, getAllContactSubmissions } from '../../../lib/contactSubmissionService.js';

// Helper to add CORS headers
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const submissions = await getAllContactSubmissions();
    const response = NextResponse.json({
      message: 'Success',
      data: submissions,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('GET /api/contact-submissions error:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createContactSubmission(body);

    const response = NextResponse.json(
      { message: 'Submission successful', data: created },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error) {
    console.error('POST /api/contact-submissions error:', error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to submit' },
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
