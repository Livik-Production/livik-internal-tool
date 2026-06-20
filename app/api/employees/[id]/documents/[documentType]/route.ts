import { NextResponse } from 'next/server';
import {
  deleteEmployeeDocument,
  type DocumentType,
} from '../../../../../../lib/employeeDocumentService';

// ---------------------------------------------------------------------------
// DELETE /api/employees/[id]/documents/[documentType]
//
// Deletes a specific document from S3 and clears the key in the database.
//
// URL params:
//   - id           — the employee's empId (e.g. "EMP001")
//   - documentType — "AADHAR" | "PAN" | "PROFILE_PHOTO" (case-insensitive)
//
// Returns: { message }
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: Request,
  context: {
    params: Promise<{ id: string; documentType: string }>;
  },
) {
  try {
    const { id: empId, documentType: documentTypeRaw } = await context.params;

    if (!documentTypeRaw) {
      return NextResponse.json(
        {
          error:
            'Missing URL param: documentType. Must be one of: AADHAR, PAN, PROFILE_PHOTO',
        },
        { status: 400 },
      );
    }

    const documentType = documentTypeRaw.toUpperCase() as DocumentType;

    await deleteEmployeeDocument(empId, documentType);

    return NextResponse.json({
      message: `${documentType} document deleted successfully for employee "${empId}"`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete document';
    console.error(
      'DELETE /api/employees/[id]/documents/[documentType] error:',
      error,
    );

    const isNotFound =
      error instanceof Error && message.includes('not found');

    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 500 },
    );
  }
}
