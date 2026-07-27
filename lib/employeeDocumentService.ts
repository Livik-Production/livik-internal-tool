import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './s3';
import { prisma } from './prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = 'AADHAR' | 'PAN' | 'PROFILE_PHOTO';

export interface UploadEmployeeDocumentResult {
  /** The S3 object key, e.g. "documents/EMP001/aadhar.pdf" */
  key: string;
  /** Pre-signed URL valid for 5 minutes */
  url: string;
}

export interface GetEmployeeDocumentResult {
  /** The S3 object key stored in the DB */
  key: string;
  /** Pre-signed URL valid for 5 minutes */
  url: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const SIGNED_URL_EXPIRES_IN = 60 * 5; // 5 minutes

const BUCKET = process.env.AWS_BUCKET_NAME!;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps a DocumentType to its file-name prefix inside the employee folder.
 */
function getFileNamePrefix(documentType: DocumentType): string {
  switch (documentType) {
    case 'AADHAR':
      return 'aadhar';
    case 'PAN':
      return 'pan';
    case 'PROFILE_PHOTO':
      return 'profile-photo';
    default: {
      const _exhaustive: never = documentType;
      throw new Error(`Unknown document type: ${_exhaustive}`);
    }
  }
}

/**
 * Maps a DocumentType to the corresponding Employee model field name.
 */
function getEmployeeField(
  documentType: DocumentType,
): 'aadhaarCard' | 'panCard' | 'photo' {
  switch (documentType) {
    case 'AADHAR':
      return 'aadhaarCard';
    case 'PAN':
      return 'panCard';
    case 'PROFILE_PHOTO':
      return 'photo';
    default: {
      const _exhaustive: never = documentType;
      throw new Error(`Unknown document type: ${_exhaustive}`);
    }
  }
}

/**
 * Builds the canonical S3 object key for an employee document.
 *
 * Pattern: documents/{empId}/{prefix}.{extension}
 * Example: documents/EMP001/aadhar.pdf
 */
function buildS3Key(
  empId: string,
  documentType: DocumentType,
  extension: string,
): string {
  const prefix = getFileNamePrefix(documentType);
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `documents/${empId}/${prefix}.${ext}`;
}

/**
 * Derives the file extension from a MIME type.
 */
function extensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'bin';
}

/**
 * Validates common inputs shared by all three exported functions.
 */
function validateInputs(employeeId: string, documentType: DocumentType): void {
  if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
    throw new Error('employeeId must be a non-empty string');
  }

  const validTypes: DocumentType[] = ['AADHAR', 'PAN', 'PROFILE_PHOTO'];
  if (!validTypes.includes(documentType)) {
    throw new Error(
      `documentType must be one of: ${validTypes.join(', ')}. Received: ${documentType}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Uploads an employee document to S3 and stores the generated key in the DB.
 *
 * - Automatically creates the employee folder in S3 (S3 folders are implicit).
 * - Replaces the existing file if the same document type is uploaded again.
 * - Preserves the original file extension derived from the MIME type.
 *
 * @param employeeId  The Employee's `empId` (e.g. "EMP001"), used as the S3 folder name.
 * @param documentType  One of "AADHAR" | "PAN" | "PROFILE_PHOTO".
 * @param file  The uploaded file as a Web API `File` object (available from FormData).
 * @returns  The S3 key and a 5-minute pre-signed URL.
 */
export async function uploadEmployeeDocument(
  employeeId: string,
  documentType: DocumentType,
  file: File,
): Promise<UploadEmployeeDocumentResult> {
  // --- Validation ---
  validateInputs(employeeId, documentType);

  if (!file) {
    throw new Error('file is required');
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds the 10 MB limit`,
    );
  }

  // --- Build S3 key ---
  const extension = extensionFromMime(file.type);
  const key = buildS3Key(employeeId, documentType, extension);

  // --- Upload to S3 ---
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
      ContentLength: file.size,
    }),
  );

  // --- Persist key to DB ---
  const field = getEmployeeField(documentType);

  await prisma.employee.update({
    where: { empId: employeeId },
    data: { [field]: key },
  });

  // --- Generate pre-signed URL ---
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: SIGNED_URL_EXPIRES_IN },
  );

  return { key, url };
}

/**
 * Returns the S3 key and a fresh 5-minute pre-signed URL for an employee document.
 *
 * Reads the stored key from the DB, then generates a signed URL so the caller
 * can download/preview the file without exposing long-lived credentials.
 *
 * @param employeeId  The Employee's `empId` (e.g. "EMP001").
 * @param documentType  One of "AADHAR" | "PAN" | "PROFILE_PHOTO".
 * @returns  The S3 key and a 5-minute pre-signed URL.
 * @throws  If no document has been uploaded for the given type.
 */
export async function getEmployeeDocument(
  employeeId: string,
  documentType: DocumentType,
): Promise<GetEmployeeDocumentResult> {
  // --- Validation ---
  validateInputs(employeeId, documentType);

  // --- Fetch key from DB ---
  const field = getEmployeeField(documentType);

  const employee = await prisma.employee.findUnique({
    where: { empId: employeeId },
    select: { [field]: true },
  });

  if (!employee) {
    throw new Error(`Employee with empId "${employeeId}" not found`);
  }

  const key = (employee as any)[field];

  if (!key) {
    throw new Error(
      `No ${documentType} document found for employee "${employeeId}"`,
    );
  }

  // --- Generate pre-signed URL ---
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: SIGNED_URL_EXPIRES_IN },
  );

  return { key, url };
}

/**
 * Deletes an employee document from S3 and clears the key in the DB.
 *
 * S3 `DeleteObjectCommand` is idempotent — it succeeds even if the object
 * does not exist, so this is safe to call even if the file was already removed.
 *
 * @param employeeId  The Employee's `empId` (e.g. "EMP001").
 * @param documentType  One of "AADHAR" | "PAN" | "PROFILE_PHOTO".
 */
export async function deleteEmployeeDocument(
  employeeId: string,
  documentType: DocumentType,
): Promise<void> {
  // --- Validation ---
  validateInputs(employeeId, documentType);

  // --- Fetch existing key from DB ---
  const field = getEmployeeField(documentType);

  const employee = await prisma.employee.findUnique({
    where: { empId: employeeId },
    select: { [field]: true },
  });

  if (!employee) {
    throw new Error(`Employee with empId "${employeeId}" not found`);
  }

  const key = (employee as any)[field];

  // --- Delete from S3 (idempotent — safe even if key is null/already gone) ---
  if (key) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  }

  // --- Clear key in DB ---
  await prisma.employee.update({
    where: { empId: employeeId },
    data: { [field]: null },
  });
}
