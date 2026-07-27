import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './s3';

const BUCKET = process.env.AWS_BUCKET_NAME!;

/**
 * Uploads a customer document to S3 in the "customers" folder.
 * The path will be: customers/<customer_name>/<unique_id>.<extension>
 */
export async function uploadCustomerDocument(customerName: string, file: File): Promise<string> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'bin';
  
  // Make customer name S3 safe (alphanumeric and dashes only)
  const safeName = customerName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  
  // Create unique filename to avoid overwrites
  const uniqueId = Date.now().toString(36);
  const key = `customers/${safeName}/${uniqueId}.${ext}`;

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
 * Retrieves a signed URL for a customer document.
 */
export async function getCustomerDocumentUrl(key: string): Promise<string> {
  if (!key) return '';
  return await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 60 * 60 } // 1 hour
  );
}

/**
 * Deletes a customer document from S3.
 */
export async function deleteCustomerDocument(key: string): Promise<void> {
  if (!key) return;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
