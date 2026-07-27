import { NextResponse } from 'next/server';
import { 
  createDocumentRequest, 
  getDocumentRequests, 
  processDocumentRequest 
} from '../../../lib/documentService';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const requestedByRole = url.searchParams.get('requestedByRole');
    const employeeId = url.searchParams.get('employeeId');

    const requests = await getDocumentRequests({ status, requestedByRole, employeeId });
    return NextResponse.json(JSON.parse(JSON.stringify(requests)));
  } catch (error) {
    console.error('GET /api/document-requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createDocumentRequest(body);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), { status: 201 });
  } catch (error) {
    console.error('POST /api/document-requests error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create request' }, { status: 400 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { requestId, status, processedBy, remarks } = body;

    if (!requestId || !status || !processedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await processDocumentRequest(requestId, status, processedBy, remarks);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PATCH /api/document-requests error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 400 });
  }
}
