// app/api/employees/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../../../../lib/employeeService';
import { cookies } from 'next/headers';
import { createDocumentRequest } from '../../../../lib/documentService';

export async function GET(req, context) {
  try {
    // params can be async; await before using
    const params = await context.params;
    const id = params.id;
    const emp = await getEmployeeById(id);
    if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(JSON.parse(JSON.stringify(emp)));
  } catch (error) {
    console.error('GET employee error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    // await params per Next.js guidance
    const params = await context.params;
    const id = params.id;

    const body = await req.json();

    // Check for document updates by HR roles
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;
    let currentUser = null;
    if (sessionValue) {
      try {
        const session = JSON.parse(sessionValue);
        // We need the role from DB to be sure, but let's assume session has roleName
        // For production, we'd fetch fresh role info
        currentUser = session;
      } catch (err) {}
    }

    const userRole = (currentUser?.roleName || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isHrAdmin = userRole === 'HR_ADMIN';
    // Regular HR roles that need approval/restriction
    const isRestrictedHr = (userRole === 'HR' || userRole === 'HR_EXECUTIVE') && !isAdmin && !isHrAdmin;
    
    // Check if documents are being updated for an active employee
    if (isRestrictedHr) {
      const existing = await getEmployeeById(id);
      if (existing) {
        const docFields = ['aadhaarCard', 'panCard'];
        for (const field of docFields) {
          if (body[field] !== existing[field]) {
            if (body[field]) {
              // Addition or Change -> Request Approval
              await createDocumentRequest({
                employeeId: id,
                documentType: field,
                documentUrl: body[field],
                requestedById: currentUser.employeeId,
                requestedByRole: 'HR'
              });
              delete body[field]; // Remove from direct update
            } else {
              // Deletion -> Restricted for regular HR, restore original
              body[field] = existing[field];
            }
          }
        }
        
        // Handle proofs (array)
        if (body.proofs && JSON.stringify(body.proofs) !== JSON.stringify(existing.proofs)) {
          const existingUrls = (existing.proofs || []).map(p => p.url);
          const currentUrls = (body.proofs || []).map(p => p.url);
          
          // Identify new proofs added
          const newProofs = (body.proofs || []).filter(p => !existingUrls.includes(p.url));
          
          for (const proof of newProofs) {
            await createDocumentRequest({
              employeeId: id,
              documentType: 'proofs', // corrected type name
              proofLabel: proof.label,
              documentUrl: proof.url,
              requestedById: currentUser.employeeId,
              requestedByRole: 'HR'
            });
          }
          
          // Restore old proofs (blocks both direct additions and ANY removals for restricted HR)
          body.proofs = existing.proofs;
        }
      }
    }

    const updated = await updateEmployee(id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT employee error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const id = params.id;
    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE employee error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
