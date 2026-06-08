import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeExecute } from '../../../../lib/dbHelpers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;

    if (!sessionValue) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let session;
    try {
      session = JSON.parse(sessionValue);
    } catch {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const employeeId = session?.employeeId;

    if (!employeeId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const employee = await safeExecute((prisma) =>
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          empId: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          department: true,
          designation: true,
          role: {
            select: {
              id: true,
              roleName: true,
              displayName: true,
            },
          },
        },
      })
    );

    if (!employee) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const roleName = employee.role?.roleName ?? null;
    let rights = [];
    if (!employee.role?.id && roleName === 'Admin') {
      rights = ['ALL_ACCESS'];
    } else {
      // In a real scenario, you might want to fetch rights from the session
      // but here we fetch them from DB for consistency
      const employeeWithRights = await safeExecute((prisma) =>
        prisma.employee.findUnique({
          where: { id: employeeId },
          select: {
            role: {
              select: {
                rights: {
                  select: {
                    right: {
                      select: {
                        rightName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      );
      rights =
        employeeWithRights?.role?.rights?.map((r) => r.right.rightName) || [];
    }

    return NextResponse.json({
      id: employee.id,
      empId: employee.empId,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      email: employee.email,
      mobile: employee.phoneNumber,
      department: employee.department,
      designation: employee.designation || null,
      role: {
        id: employee.role?.id,
        name: roleName,
        displayName: employee.role?.displayName,
      },
      rights: rights,
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
