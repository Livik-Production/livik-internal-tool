import { NextResponse } from 'next/server';
import { createJobApplication, getAllJobApplications } from '../../../lib/jobApplicationService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const applications = await getAllJobApplications();
    return addCorsHeaders(NextResponse.json({
      message: 'Success',
      data: applications,
    }));
  } catch (error) {
    console.error('GET /api/job-applications error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch job applications' },
      { status: 500 }
    ));
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createJobApplication(body);

    return addCorsHeaders(NextResponse.json(
      { message: 'Job application submitted successfully', data: created },
      { status: 201 }
    ));
  } catch (error) {
    console.error('POST /api/job-applications error:', error);
    // Handle Prisma unique constraint error for email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return addCorsHeaders(NextResponse.json(
        { error: 'An application with this email already exists.' },
        { status: 400 }
      ));
    }
    return addCorsHeaders(NextResponse.json(
      { error: error.message ?? 'Failed to submit application' },
      { status: 400 }
    ));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
