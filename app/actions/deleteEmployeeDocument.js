/**
 * Deletes an employee document from S3 via the API route.
 * Called directly from client components — no server action needed.
 *
 * @param {string} empId        - The employee's empId (e.g. "LK001").
 * @param {string} documentType - "AADHAR" | "PAN" | "PROFILE_PHOTO"
 */
export async function deleteEmployeeDocument(empId, documentType) {
  if (!empId || !documentType) return;

  try {
    const res = await fetch(
      `/api/employees/${encodeURIComponent(empId)}/documents/${encodeURIComponent(documentType)}`,
      { method: 'DELETE' }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('Document delete failed:', body.error || res.status);
    }
  } catch (err) {
    // Log only — never crash user flow on delete
    console.error('deleteEmployeeDocument error:', err.message);
  }
}
