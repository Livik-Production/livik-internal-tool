import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './s3';

const BUCKET = process.env.AWS_BUCKET_NAME!;

/**
 * Uploads a company document to S3 in the "company_documents" folder.
 * The path will be: company_documents/<company_id>/<unique_id>.<extension>
 */
export async function uploadCompanyDocument(companyId: string, file: File): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'bin';
  
  // Make company ID S3 safe (alphanumeric and dashes only)
  const safeId = companyId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  
  // Create unique filename to avoid overwrites
  const uniqueId = Date.now().toString(36);
  const key = `company_documents/${safeId}/${uniqueId}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
      ContentLength: file.size,
    })
  );

  return key;
}

/**
 * Retrieves a signed URL for a company document.
 */
export async function getCompanyDocumentUrl(key: string): Promise<string> {
  if (!key) return '';
  return await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 60 * 60 } // 1 hour
  );
}

/**
 * Deletes a company document from S3.
 */
export async function deleteCompanyDocument(key: string): Promise<void> {
  if (!key) return;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
