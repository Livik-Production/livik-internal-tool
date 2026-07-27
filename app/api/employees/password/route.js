import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { safeExecute } from '../../../../lib/dbHelpers';

/**
 * POST /api/employees/password/check
 * body: { mobile: "9876543210" }
 * Purpose: Check if employee exists and has password set
 */
export async function POST(req) {
  try {
    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { message: 'Mobile number is required' },
        { status: 400 }
      );
    }

    const employee = await safeExecute((prisma) =>
      prisma.employee.findFirst({
        where: { phoneNumber: mobile },
        select: { password: true },
      })
    );

    if (!employee) {
      return NextResponse.json(
        { exists: false, hasPassword: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      exists: true,
      hasPassword: Boolean(employee.password),
    });
  } catch (error) {
    console.error('Password check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/employees/password
 * body: { mobile: "9876543210", password: "PlainTextPassword" }
 * Purpose: Hash password on SERVER and update DB
 */
export async function PATCH(req) {
  try {
    const { mobile, password } = await req.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { message: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    // 1. Check for active session (set by OTP login)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Unauthorized. Please verify OTP first.' },
        { status: 401 }
      );
    }

    let sessionUser;
    try {
      sessionUser = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json(
        { message: 'Invalid session.' },
        { status: 401 }
      );
    }

    // Optional: Verify mobile/ID matches session
    // Since OTP login sets the session for this specific user, we can trust the session ID.
    // However, the frontend passes 'mobile', we should verify it matches or just use the session ID.
    // Let's use the session ID to be safe, ensuring we update the logged-in user's password.

    // Find employee by mobile to confirm it matches session (double check)
    // Or just find by sessionUser.employeeId

    const employeeId = sessionUser.employeeId;

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Invalid session data.' },
        { status: 401 }
      );
    }

    // 2. Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Update Employee
    await safeExecute((prisma) =>
      prisma.employee.update({
        where: { id: employeeId },
        data: { password: passwordHash },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
