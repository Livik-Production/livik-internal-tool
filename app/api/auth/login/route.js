import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { safeExecute } from '../../../../lib/dbHelpers';

export async function POST(req) {
  try {
    const { mobile, password } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { message: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    const employee = await safeExecute((prisma) =>
      prisma.employee.findFirst({
        where: { phoneNumber: mobile },
        select: {
          id: true,
          empId: true,
          contractEmpId: true,
          workType: true,
          workMode: true,
          password: true,
          email: true,
          firstName: true,
          lastName: true,
          role: {
            include: {
              rights: {
                include: {
                  right: true,
                },
              },
            },
          },
        },
      })
    );

    if (!employee || !employee.password) {
      return NextResponse.json(
        { message: 'Invalid mobile or password' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, employee.password);

    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid mobile or password' },
        { status: 401 }
      );
    }

    // 🔐 Constructed session payload matching middleware expectation
    const sessionPayload = {
      employeeId: employee.id, // Middleware expects employeeId
      empId: employee.empId || null,
      contractEmpId: employee.contractEmpId || null,
      workType: employee.workType || null,
      workMode: employee.workMode || null,
      roleId: employee.role?.id,
      roleName: employee.role?.roleName,
      displayName: employee.role?.displayName,
      rights: employee.role?.rights?.map((r) => r.right.rightName) || [],
      email: employee.email ?? null,
      firstName: employee.firstName,
      lastName: employee.lastName,
    };

    const maxAge = 60 * 60; // 1 hour

    // ✅ MUST await cookies()
    const cookieStore = await cookies();

    cookieStore.set('auth_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
