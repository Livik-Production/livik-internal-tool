export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { safeExecute } from '../../../../lib/dbHelpers';
import { cookies } from 'next/headers';
import { checkRoleAssignmentPermission } from '../../../../lib/employeeService';

export async function POST(req) {
  try {
    const { employeeId, roleId } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Get current logged-in user session
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;
    if (!sessionValue) {
      return NextResponse.json(
        { error: 'Unauthorized: Session not found' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionValue);
    } catch (err) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    const requesterId = session.employeeId;
    if (!requesterId) {
      return NextResponse.json(
        { error: 'Unauthorized: Employee ID missing in session' },
        { status: 401 }
      );
    }

    // Validate role assignment permissions
    try {
      await checkRoleAssignmentPermission(requesterId, employeeId, roleId);
    } catch (permError) {
      return NextResponse.json(
        { error: permError.message || 'Forbidden' },
        { status: 403 }
      );
    }

    // employeeId should be the UUID (cuid)
    const updated = await safeExecute((prisma) =>
      prisma.employee.update({
        where: { id: employeeId },
        data: { roleId: roleId || null }, // null clears the role
        include: {
          role: true,
        },
      })
    );

    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('POST assign-role error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}

