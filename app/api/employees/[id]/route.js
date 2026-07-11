// app/api/employees/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  checkRoleAssignmentPermission,
} from '../../../../lib/employeeService';
import { cookies } from 'next/headers';
import { createDocumentRequest } from '../../../../lib/documentService';
import { prisma } from '../../../../lib/prisma';
import transporter from '../../../../config/emailConfig';

export async function GET(req, context) {
  try {
    // params can be async; await before using
    const params = await context.params;
    let id = params.id;
    const resolved = await prisma.employee.findFirst({
      where: { OR: [{ id }, { empId: id }] },
      select: { id: true }
    });
    if (resolved) id = resolved.id;

    const emp = await getEmployeeById(id);
    if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Resolve S3 keys to signed URLs for photo, aadhaarCard, panCard
    const { getEmployeeDocument } = await import('../../../../lib/employeeDocumentService');
    const { refreshS3Url } = await import('../../../../lib/documentService');
    const docFields = {
      photo: 'PROFILE_PHOTO',
      aadhaarCard: 'AADHAR',
      panCard: 'PAN'
    };

    for (const [field, docType] of Object.entries(docFields)) {
      const value = emp[field];
      if (!value) continue;

      const isS3Key = !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('blob:');
      if (isS3Key) {
        try {
          const s3Result = await getEmployeeDocument(emp.empId, docType);
          emp[field] = s3Result.url; // Provide pre-signed URL to the client
        } catch (s3Error) {
          console.error(`Failed to generate signed URL for ${field}:`, s3Error);
        }
      } else {
        // If it's a full URL, try to refresh it if it's an S3 URL
        emp[field] = await refreshS3Url(value);
      }
    }

    // Also refresh proofs array
    if (Array.isArray(emp.proofs)) {
      emp.proofs = await Promise.all(emp.proofs.map(async (proof) => ({
        ...proof,
        url: await refreshS3Url(proof.url)
      })));
    }

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
    let id = params.id;
    const resolved = await prisma.employee.findFirst({
      where: { OR: [{ id }, { empId: id }] },
      select: { id: true }
    });
    if (resolved) id = resolved.id;

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

    // Check if roleId or role is being modified in PUT request
    if (('roleId' in body && body.roleId !== undefined) || ('role' in body && body.role !== undefined)) {
      const requesterId = currentUser?.employeeId;
      if (!requesterId) {
        return NextResponse.json(
          { error: 'Unauthorized: Missing employee ID in session' },
          { status: 401 }
        );
      }
      try {
        const newRoleId = body.roleId || body.role || null;
        await checkRoleAssignmentPermission(requesterId, id, newRoleId);
      } catch (permError) {
        return NextResponse.json(
          { error: permError.message || 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const userRole = (currentUser?.roleName || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isHrAdmin = userRole === 'HR_ADMIN';
    // Regular HR roles that need approval/restriction
    const isRestrictedHr =
      (userRole === 'HR' || userRole === 'HR_EXECUTIVE') &&
      !isAdmin &&
      !isHrAdmin;

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
                requestedByRole: 'HR',
              });
              delete body[field]; // Remove from direct update
            } else {
              // Deletion -> Restricted for regular HR, restore original
              body[field] = existing[field];
            }
          }
        }

        // Handle proofs (array)
        if (
          body.proofs &&
          JSON.stringify(body.proofs) !== JSON.stringify(existing.proofs)
        ) {
          const existingUrls = (existing.proofs || []).map((p) => p.url);
          const currentUrls = (body.proofs || []).map((p) => p.url);

          // Identify new proofs added
          const newProofs = (body.proofs || []).filter(
            (p) => !existingUrls.includes(p.url)
          );

          for (const proof of newProofs) {
            await createDocumentRequest({
              employeeId: id,
              documentType: 'proofs', // corrected type name
              proofLabel: proof.label,
              documentUrl: proof.url,
              requestedById: currentUser.employeeId,
              requestedByRole: 'HR',
            });
          }

          // Restore old proofs (blocks both direct additions and ANY removals for restricted HR)
          body.proofs = existing.proofs;
        }
      }
    }

    const updated = await updateEmployee(id, body);

    // If status was changed to PENDING_ADMIN, send email to Admins
    if (body.status === 'PENDING_ADMIN') {
      try {
        const admins = await prisma.employee.findMany({
          where: {
            role: {
              roleName: { in: ['ADMIN', 'SUPER_ADMIN', 'SUPER ADMIN', 'SUPERADMIN'] }
            }
          },
          select: { email: true }
        });

        const adminEmails = admins.map(a => a.email).filter(Boolean);
        
        if (adminEmails.length > 0 && process.env.EMAIL_ID) {
          const empName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
          await transporter.sendMail({
            from: process.env.EMAIL_ID,
            to: adminEmails,
            subject: `Pending Admin Approval: ${empName}`,
            html: `
              <h2>Admin Approval Required</h2>
              <p>The HR team has approved the details for <strong>${empName}</strong> (${updated.empId}).</p>
              <p>They are now awaiting final Admin approval to activate their account.</p>
              <p>Please log in to the internal tool to review and approve.</p>
            `,
          });
        }
      } catch (emailError) {
        console.error('Failed to send Admin approval email:', emailError);
      }
    }

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
    let id = params.id;
    const resolved = await prisma.employee.findFirst({
      where: { OR: [{ id }, { empId: id }] },
      select: { id: true }
    });
    if (resolved) id = resolved.id;

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
