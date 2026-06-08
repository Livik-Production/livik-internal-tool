import { NextResponse } from 'next/server';
import {
  getTalentCommunityById,
  deleteTalentCommunity,
} from '../../../../lib/talentCommunityService.js';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return response;
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const entry = await getTalentCommunityById(id);
    if (!entry) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Talent community entry not found' },
          { status: 404 }
        )
      );
    }
    return addCorsHeaders(
      NextResponse.json({ message: 'Success', data: entry })
    );
  } catch (error) {
    console.error(`GET /api/talent-community/[id] error:`, error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to fetch talent community entry' },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await deleteTalentCommunity(id);
    return addCorsHeaders(
      NextResponse.json({
        message: 'Talent community entry deleted successfully',
      })
    );
  } catch (error) {
    console.error(`DELETE /api/talent-community/[id] error:`, error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to delete talent community entry' },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
