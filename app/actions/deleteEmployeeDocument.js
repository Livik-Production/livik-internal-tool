'use server';

import { del } from '@vercel/blob';

export async function deleteEmployeeDocument(url) {
  if (!url) return;

  try {
    await del(url);
  } catch (err) {
    // Log only – never crash user flow
    console.error('Blob delete failed:', err.message);
  }
}
