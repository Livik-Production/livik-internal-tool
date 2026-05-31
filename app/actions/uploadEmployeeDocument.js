'use server';

import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Increased to 5MB for documents
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function uploadEmployeeDocument(arg1, folder = 'employee-documents') {
  let file = arg1;
  // Handle FormData input
  if (arg1 instanceof FormData) {
    file = arg1.get('file');
  }

  if (!file) throw new Error('No file provided');

  // 🔐 Type validation
  const fileType = file.type || '';
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw new Error(`Invalid file type (${fileType}). Only JPG, PNG, WEBP and PDF allowed.`);
  }

  // 🔐 Size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large (max 5MB)');
  }

  const safeFileName = file.name.replace(/\s+/g, '-');

  const blob = await put(
    `${folder}/${crypto.randomUUID()}-${safeFileName}`,
    file,
    {
      access: 'public',
      addRandomSuffix: false,
    }
  );

  return blob.url;
}
