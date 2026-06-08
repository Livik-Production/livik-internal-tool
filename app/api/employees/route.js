export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAllEmployees, createEmployee, checkRoleAssignmentPermission } from '../../../lib/employeeService';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const employees = await getAllEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('GET employees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Check role assignment permission if roleId is provided during creation
    if (body.roleId) {
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

      try {
        await checkRoleAssignmentPermission(requesterId, null, body.roleId);
      } catch (permError) {
        return NextResponse.json(
          { error: permError.message || 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const employee = await createEmployee(body);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('POST employee error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}

