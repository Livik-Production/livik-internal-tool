import { NextResponse } from 'next/server';
import { createLoginAdmin, getAllLoginAdmins } from '../../../lib/loginAdminService';

// Helper to add CORS headers (allows interaction from a separate React project)
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const data = await getAllLoginAdmins();
    const response = NextResponse.json({
      status: 'success',
      data: data,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('GET /api/login-admin error:', error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to fetch login admins' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.mobile || !body.password) {
      throw new Error('Mobile and Password are required');
    }

    const created = await createLoginAdmin(body);

    const response = NextResponse.json(
      { message: 'Login record captured successfully', data: created },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error) {
    console.error('POST /api/login-admin error:', error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to store record' },
      { status: 400 }
    );
    return addCorsHeaders(response);
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}
