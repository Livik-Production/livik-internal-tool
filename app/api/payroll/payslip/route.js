import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { NotificationService } from '../../../../services/notification.service.js';

export async function GET() {
  return NextResponse.json({ message: 'Payslip API is ready (POST required)' });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { employeeId, month, year } = body;

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, month, year' },
        { status: 400 }
      );
    }

    // 1. Fetch Employee Details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      console.error('Employee not found:', employeeId);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // 2. Fetch Salary Setup
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthIndex = monthNames.indexOf(month);

    if (monthIndex === -1) {
      return NextResponse.json(
        { error: `Invalid month name: ${month}` },
        { status: 400 }
      );
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    const totalDaysInMonth = endDate.getDate();

    const salarySetups = await prisma.salarySetup.findMany({
      where: { employeeId },
      orderBy: { effectivedate: 'asc' },
    });

    let setup = salarySetups
      .filter((s) => new Date(s.effectivedate) <= endDate)
      .pop();

    if (!setup && salarySetups.length > 0) {
      setup = salarySetups[0];
    }

    // 3. Fetch Attendance for LOP
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let absentDays = 0;
    attendanceRecords.forEach((att) => {
      if (att.status === 'ABSENT') absentDays += 1;
      else if (att.status === 'HALF_DAY') absentDays += 0.5;
    });

    const basicPay = Number(setup?.basicPay || 0);
    const hra = Number(setup?.houseRentAllowance || 0);
    const otherAllowances = Number(setup?.otherAllowance || 0);
    const gross = basicPay + hra + otherAllowances;

    const perDayPay = totalDaysInMonth > 0 ? gross / totalDaysInMonth : 0;
    const lopDeduction = Math.round(perDayPay * absentDays);
    const totalDeductions = lopDeduction;
    const netSalary = gross - totalDeductions;

    // 4. Construct Payslip Response
    const responseData = {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.empId || employee.id,
      designation: employee.designation || '—',
      department: employee.department || '—',
      location: employee.presentAddress || '—',
      bankName: employee.bankName || '—',
      accountNo: employee.accountNumber || '—',
      panNo: employee.panNumber || '—',
      nod: totalDaysInMonth,
      lopDays: absentDays,
      month,
      year,
      earnings: {
        basicSalary: basicPay,
        hra: hra,
        medicalAllowance: 0,
        otherAllowances: otherAllowances,
      },
      deductions: {
        lopDeduction: lopDeduction,
      },
      grossSalary: gross,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
    };

    // 5. Send Notification
    await NotificationService.createBulkNotifications([employeeId], {
      title: 'Payslip Generated',
      message: `Your payslip for ${month} ${year} has been generated. You can download it now.`,
      type: 'PAYROLL',
    });

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate payslip data', details: error.message },
      { status: 500 }
    );
  }
}
