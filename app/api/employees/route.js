export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import {
  getAllEmployees,
  createEmployee,
  checkRoleAssignmentPermission,
} from '../../../lib/employeeService';
import { cookies } from 'next/headers';
import sendMail from '../../../utils/emailService';

export async function GET() {
  try {
    const employees = await getAllEmployees();

    // Resolve S3 keys to signed URLs for photo, aadhaarCard, panCard
    const { getEmployeeDocument } =
      await import('../../../lib/employeeDocumentService');
    const docFields = {
      photo: 'PROFILE_PHOTO',
      aadhaarCard: 'AADHAR',
      panCard: 'PAN',
    };

    for (const emp of employees) {
      for (const [field, docType] of Object.entries(docFields)) {
        const value = emp[field];
        const isS3Key =
          value &&
          !value.startsWith('http://') &&
          !value.startsWith('https://') &&
          !value.startsWith('blob:');
        if (isS3Key) {
          try {
            const s3Result = await getEmployeeDocument(emp.empId, docType);
            emp[field] = s3Result.url; // Provide pre-signed URL to the client
          } catch (s3Error) {
            console.error(
              `Failed to generate signed URL for ${field}:`,
              s3Error
            );
          }
        }
      }
    }

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

    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('auth_session')?.value;
    let session = null;

    if (sessionValue) {
      try {
        session = JSON.parse(sessionValue);
      } catch (err) {}
    }

    // Check role assignment permission if roleId is provided during creation
    if (body.roleId) {
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized: Session not found or invalid' },
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

    // Add createdByRole to body if session exists
    if (session && session.roleName) {
      const rn = session.roleName.toUpperCase();
      if (
        rn === 'ADMIN' ||
        rn === 'SUPER_ADMIN' ||
        rn === 'SUPER ADMIN' ||
        rn === 'SUPERADMIN'
      ) {
        body.createdByRole = 'SUPER_ADMIN';
      } else {
        body.createdByRole = rn;
      }
    }

    const employee = await createEmployee(body);

    if (employee.email) {
      try {
        await sendMail({
          to: employee.email,
          subject: `Welcome to Livik - Let's Get You Onboarded`,
          html: `
            <p>Dear ${employee.firstName || 'Employee'},</p>
            <p>Welcome to Livik!</p>
            <p>Your employee profile has been created. Please complete your onboarding by following the steps below:</p>
            <ol>
              <li>Go to the employee portal at <a href="https://livik-internal-tool-dev.vercel.app">https://livik-internal-tool-dev.vercel.app</a></li>
              <li>Log in using your registered mobile number: <strong>${employee.phoneNumber || 'your registered number'}</strong></li>
              <li>Complete your profile by filling in your remaining details (Aadhaar, PAN, Address, etc.).</li>
            </ol>
            <p>Once you have filled out your details, HR will be able to review and approve your profile.</p>
            <br/>
            <p>Best regards,<br/>The Livik HR Team</p>
          `,
        });
      } catch (mailError) {
        console.error('Failed to send onboarding email:', mailError);
      }
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('POST employee error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'An employee with this email or phone number already exists.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
