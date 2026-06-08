'use server';

import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MIME = 'application/pdf';

export async function uploadLeaveDocument(file) {
  if (!file) throw new Error('No file provided');

  // 🔐 Strict PDF validation
  if (file.type !== PDF_MIME) {
    throw new Error('Only PDF documents are allowed');
  }

  // 🔐 Size validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('PDF must be less than 5MB');
  }

  const safeName = file.name.replace(/\s+/g, '-');

  const blob = await put(
    `leave-documents/${crypto.randomUUID()}-${safeName}`,
    file,
    { access: 'public' }
  );

  return blob.url;
}
