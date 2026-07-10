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
    const { getEmployeeDocument } = await import('../../../lib/employeeDocumentService');
    const docFields = {
      photo: 'PROFILE_PHOTO',
      aadhaarCard: 'AADHAR',
      panCard: 'PAN'
    };

    for (const emp of employees) {
      for (const [field, docType] of Object.entries(docFields)) {
        const value = emp[field];
        const isS3Key = value && !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('blob:');
        if (isS3Key) {
          try {
            const s3Result = await getEmployeeDocument(emp.empId, docType);
            emp[field] = s3Result.url; // Provide pre-signed URL to the client
          } catch (s3Error) {
            console.error(`Failed to generate signed URL for ${field}:`, s3Error);
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
      if (rn === 'ADMIN' || rn === 'SUPER_ADMIN' || rn === 'SUPER ADMIN' || rn === 'SUPERADMIN') {
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
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.7; color: #333; max-width: 650px; margin: auto;">
      
      <h2 style="color:#2563eb; margin-bottom:0;">
        Welcome to Livik Software Solutions Pvt. Ltd.
      </h2>

      <p>Dear <strong>${employee.firstName || 'Employee'}</strong>,</p>

      <p>
        We are delighted to welcome you to <strong>Livik Software Solutions Pvt. Ltd.</strong>.
        We are excited to have you join our team and look forward to working with you.
      </p>

      <p>
        Your employee account has been created successfully. Please complete your onboarding by following the steps below.
      </p>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px;">
        <h3 style="margin-top:0;color:#111827;">Getting Started</h3>

        <p><strong>Step 1:</strong> Visit the Employee Portal</p>
        <p>
          <a href="https://portal.liviktech.com" style="color:#2563eb;">
            https://portal.liviktech.com
          </a>
        </p>

        <p><strong>Step 2:</strong> Click <strong>"Don't have an account? Sign Up"</strong>.</p>

        <p><strong>Step 3:</strong> Enter your registered Email or Mobile Number.</p>

        <p><strong>Step 4:</strong> Verify the OTP sent to your registered Email/Mobile.</p>

        <p><strong>Step 5:</strong> Create your password and complete your <strong>personal details</strong>.</p>
      </div>

      <br>

      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:4px;">
        <strong>Your Registered Details</strong>
        <br><br>
        Email: <strong>${employee.email}</strong><br>
        Mobile: <strong>${employee.phoneNumber || 'Your Registered Mobile Number'}</strong>
      </div>

      <br>

      <p>
        We are excited to have you as part of the <strong>Livik</strong> family and wish you a successful and rewarding journey with us.
      </p>

      <br>

      <p>
        Warm Regards,<br>
        <strong>HR Team</strong><br>
        Livik Software Solutions Pvt. Ltd.
      </p>

    </div>
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
        { error: 'An employee with this email or phone number already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
