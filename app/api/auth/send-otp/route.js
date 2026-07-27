import { NextResponse } from 'next/server';
import { safeExecute } from '../../../../lib/dbHelpers';
import sendMail from '../../../../utils/emailService';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { mobile, email } = await req.json();

    if (!mobile && !email) {
      return NextResponse.json(
        { message: 'Mobile number or Email is required' },
        { status: 400 }
      );
    }

    // 1. Find employee
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
          email: true,
          firstName: true,
        },
      })
    );

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!employee.email) {
      return NextResponse.json(
        { message: 'Employee does not have an email address registered.' },
        { status: 400 }
      );
    }

    // 2. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryTime = new Date(Date.now() + 60 * 1000); // 1 minute (60 seconds)

    // 3. Save OTP to DB (Replace existing if any)
    await safeExecute(async (prisma) => {
      // Delete existing OTPs for this employee
      await prisma.otp.deleteMany({
        where: { empId: employee.id },
      });

      // Create new OTP
      return prisma.otp.create({
        data: {
          empId: employee.id,
          otp: otp,
          expiryTime: expiryTime,
        },
      });
    });

    // 4. Send Email
    const emailResult = await sendMail({
      to: employee.email,
      subject: 'Your Login OTP',
      text: `Hello ${employee.firstName},\n\nYour OTP for login is: ${otp}\n\nThis OTP is valid for 60 seconds.\n\nRegards,\nLivik Admin`,
      html: `<p>Hello <b>${employee.firstName}</b>,</p><p>Your OTP for login is: <b>${otp}</b></p><p>This OTP is valid for 60 seconds.</p><p>Regards,<br>Livik Admin</p>`,
    });

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return NextResponse.json(
        { message: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${employee.email}`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
