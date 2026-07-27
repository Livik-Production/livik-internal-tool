import { NextResponse } from 'next/server';
import {
  uploadEmployeeDocument,
  getEmployeeDocument,
  type DocumentType,
} from '../../../../../lib/employeeDocumentService';

// ---------------------------------------------------------------------------
// POST /api/employees/[id]/documents
//
// Upload a document for an employee.
// Accepts multipart/form-data with:
//   - documentType: "AADHAR" | "PAN" | "PROFILE_PHOTO"
//   - file: the file to upload
//
// Returns: { key, url }
// ---------------------------------------------------------------------------

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: empId } = await context.params;

    // Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 },
      );
    }

    const documentTypeRaw = formData.get('documentType');
    const file = formData.get('file');

    // Validate documentType presence
    if (!documentTypeRaw || typeof documentTypeRaw !== 'string') {
      return NextResponse.json(
        {
          error:
            'Missing required field: documentType. Must be one of: AADHAR, PAN, PROFILE_PHOTO',
        },
        { status: 400 },
      );
    }

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing required field: file' },
        { status: 400 },
      );
    }

    const documentType = documentTypeRaw.toUpperCase() as DocumentType;

    const result = await uploadEmployeeDocument(empId, documentType, file);

    return NextResponse.json(
      {
        message: 'Document uploaded successfully',
        data: result,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload document';
    console.error('POST /api/employees/[id]/documents error:', error);

    // Surface validation errors as 400
    const isValidationError =
      error instanceof Error &&
      (message.includes('must be') ||
        message.includes('required') ||
        message.includes('Unsupported') ||
        message.includes('exceeds') ||
        message.includes('not found'));

    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 400 : 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/employees/[id]/documents?documentType=AADHAR
//
// Get a pre-signed download URL for a specific employee document.
// Query param: documentType — "AADHAR" | "PAN" | "PROFILE_PHOTO"
//
// Returns: { key, url }
// ---------------------------------------------------------------------------

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: empId } = await context.params;

    const { searchParams } = new URL(req.url);
    const documentTypeRaw = searchParams.get('documentType');

    if (!documentTypeRaw) {
      return NextResponse.json(
        {
          error:
            'Missing required query param: documentType. Must be one of: AADHAR, PAN, PROFILE_PHOTO',
        },
        { status: 400 },
      );
    }

    const documentType = documentTypeRaw.toUpperCase() as DocumentType;

    const result = await getEmployeeDocument(empId, documentType);

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get document';
    console.error('GET /api/employees/[id]/documents error:', error);

    const isNotFound =
      error instanceof Error &&
      (message.includes('not found') || message.includes('No '));

    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 500 },
    );
  }
}
