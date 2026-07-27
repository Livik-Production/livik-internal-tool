import { NextResponse } from 'next/server';
import { getSignedResumeUrl } from '../../../../lib/getSignedResumeUrl.ts';

function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return response;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
      );
    }

    const signedUrl = await getSignedResumeUrl(key);
    if (!signedUrl) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Unable to generate signed URL' },
          { status: 500 }
        )
      );
    }

    return addCorsHeaders(NextResponse.json({ url: signedUrl }));
  } catch (error) {
    console.error('GET /api/talent-community/download error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }));
}
