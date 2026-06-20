'use server';

import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../../lib/s3';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Uploads an asset document (invoice or warranty) to S3 inside 'asset-documents' folder,
 * named after the assetTag and document type.
 *
 * @param {File} file - The file to upload.
 * @param {string} assetTag - The asset tag (ID).
 * @param {string} documentType - "invoice" | "warranty"
 * @returns {Promise<string>} - The signed S3 URL.
 */
export async function uploadAssetDocument(file, assetTag, documentType) {
  if (!file) throw new Error('No file provided');
  if (!assetTag) throw new Error('Asset tag (ID) is required');

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large (max 10MB)');
  }

  // Get extension from original file name
  const extension = file.name.split('.').pop() || 'pdf';
  // Create name: asset-documents/{assetTag}_{documentType}.{extension}
  const cleanAssetTag = assetTag.replace(/[^a-zA-Z0-9-_]/g, '');
  const key = `asset-documents/${cleanAssetTag}_${documentType}.${extension}`;

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
