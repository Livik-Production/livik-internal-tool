/**
 * Uploads an employee document to S3 via the API route.
 * Called directly from client components — no server action needed.
 *
 * @param {File} file           - The File object from the form input.
 * @param {string} empId        - The employee's empId (e.g. "LK001").
 * @param {string} documentType - "AADHAR" | "PAN" | "PROFILE_PHOTO"
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadEmployeeDocument(file, empId, documentType) {
  if (!file) throw new Error('No file provided');
  if (!empId) throw new Error('Employee ID is required');
  if (!documentType) throw new Error('Document type is required');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const res = await fetch(
    `/api/employees/${encodeURIComponent(empId)}/documents`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }

  const json = await res.json();
  return json.data; // { key, url }
}
