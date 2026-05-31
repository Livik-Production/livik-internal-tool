import { NextResponse } from 'next/server';
import { getAllTalentCommunity } from '../../../lib/talentCommunityService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function GET() {
  try {
    const entries = await getAllTalentCommunity();
    return addCorsHeaders(NextResponse.json({
      message: 'Success',
      data: entries,
    }));
  } catch (error) {
    console.error('GET /api/talent-community error:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch talent community entries' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
