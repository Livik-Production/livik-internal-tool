import { NextResponse } from 'next/server';
import {
  updateContactSubmissionFeedback,
  deleteContactSubmission,
} from '../../../../lib/contactSubmissionService.js';

// Helper to add CORS headers
function addCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { feedback } = body;

    const updated = await updateContactSubmissionFeedback(id, feedback);

    const response = NextResponse.json({
      message: 'Feedback updated successfully',
      data: updated,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error(`PUT /api/contact-submissions/${params?.id} error:`, error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to update feedback' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const deleted = await deleteContactSubmission(id);

    const response = NextResponse.json({
      message: 'Submission deleted successfully',
      data: deleted,
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error(`DELETE /api/contact-submissions/${params?.id} error:`, error);
    const response = NextResponse.json(
      { error: error.message ?? 'Failed to delete submission' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// Handle preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}
