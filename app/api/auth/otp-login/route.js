import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeExecute } from '../../../../lib/dbHelpers';

export async function POST(req) {
  try {
    const { mobile, email, otp } = await req.json();

    if ((!mobile && !email) || !otp) {
      return NextResponse.json(
        { message: 'Mobile/Email and OTP are required' },
        { status: 400 }
      );
    }

    // 1. Find employee to get ID
    const employee = await safeExecute((prisma) =>
      prisma.employee.findFirst({
        where: {
          OR: [
            mobile ? { phoneNumber: mobile } : {},
            email ? { email: email } : {},
          ].filter((cond) => Object.keys(cond).length > 0),
        },
        select: {
          id: true,
          empId: true,
          workType: true,
          workMode: true,
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

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // 2. Verify OTP in DB
    const validOtp = await safeExecute((prisma) =>
      prisma.otp.findFirst({
        where: {
          empId: employee.id,
          otp: otp,
          expiryTime: {
            gt: new Date(), // Must be in the future
          },
        },
        orderBy: {
          createdAt: 'desc', // Get the latest one if multiple
        },
      })
    );

    if (!validOtp) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // 3. Delete used OTP (Optional but recommended)
    try {
      await safeExecute((prisma) =>
        prisma.otp.delete({
          where: { id: validOtp.id },
        })
      );
    } catch (e) {
      console.warn('Failed to delete used OTP:', e);
    }

    // 4. Session payload (MUST MATCH middleware expectations)
    const sessionPayload = {
      employeeId: employee.id,
      empId: employee.empId || null,
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

    const cookieStore = await cookies();

    cookieStore.set('auth_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
