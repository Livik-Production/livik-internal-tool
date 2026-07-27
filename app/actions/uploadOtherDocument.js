'use server';

import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../../lib/s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Uploads a "other/proof" attachment to S3.
 *
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The signed S3 URL.
 */
export async function uploadOtherDocument(file) {
  if (!file) throw new Error('No file provided');

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large (max 5MB)');
  }

  const safeName = file.name.replace(/\s+/g, '-');
  const key = `employee-other/${crypto.randomUUID()}-${safeName}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
      ContentLength: file.size,
    }),
  );

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }),
    { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
  );

  return url;
}
