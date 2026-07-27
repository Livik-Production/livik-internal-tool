import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getMonthlyAttendanceSummary } from '../../../../lib/attendanceService';
import { NotificationService } from '../../../../services/notification.service.js';

export async function GET() {
  return NextResponse.json({
    message: 'HR Payslip API is ready (POST required)',
  });
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
    // The frontend might pass either the database 'id' (cuid) or the 'empId' (e.g., LVK001)
    let employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      employee = await prisma.employee.findUnique({
        where: { empId: employeeId },
      });
    }

    if (!employee) {
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
      where: { employeeId: employee.id }, // Use verified internal ID
      orderBy: { effectivedate: 'asc' },
    });

    // Find applicable salary setup: latest one BEFORE or ON endDate
    let setup = salarySetups
      .filter((s) => new Date(s.effectivedate) <= endDate)
      .pop();

    if (!setup && salarySetups.length > 0) {
      setup = salarySetups[0];
    }

    // 3. Fully Dynamic Day-by-Day Payroll Calculation (Mirrors api/payroll/calculate)
    const formattedMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const attendanceSummaries = await getMonthlyAttendanceSummary(
      formattedMonthStr,
      employee.id
    );
    const empSummary = attendanceSummaries[0] || {};

    // Sort setups newest to oldest for easy 'find'
    const empSetups = salarySetups
      .filter((s) => s.employeeId === employee.id)
      .sort(
        (a, b) =>
          new Date(b.effectivedate).getTime() -
          new Date(a.effectivedate).getTime()
      );

    const actualTotalDays = empSummary?.workingDays || totalDaysInMonth;
    const absentDays = empSummary?.lopDays || 0;

    let actualGrossPay = 0;
    let actualBasic = 0;
    let actualHra = 0;
    let actualOther = 0;

    let joiningDeduction = 0;
    let calculatedLopDeduction = 0;

    let joinDate = null;
    if (employee.dateOfJoining) {
      joinDate = new Date(employee.dateOfJoining);
      joinDate.setHours(0, 0, 0, 0);
    }

    const monthEnd = new Date(year, monthIndex + 1, 0);

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const currentDate = new Date(year, monthIndex, day);
      currentDate.setHours(0, 0, 0, 0);

      const activeSetup =
        empSetups.find((s) => {
          const sDate = new Date(s.effectivedate);
          sDate.setHours(0, 0, 0, 0);
          return sDate <= currentDate;
        }) ||
        empSetups[empSetups.length - 1] ||
        setup;

      let dailyGross = 0;
      let dBasic = 0;
      let dHra = 0;
      let dOther = 0;

      if (activeSetup) {
        dBasic = Number(activeSetup.basicPay || 0);
        dHra = Number(activeSetup.houseRentAllowance || 0);
        dOther = Number(activeSetup.otherAllowance || 0);
        dailyGross = dBasic + dHra + dOther;
      }

      const dailyRate = dailyGross / totalDaysInMonth;
      const dailyBasicRate = dBasic / totalDaysInMonth;
      const dailyHraRate = dHra / totalDaysInMonth;
      const dailyOtherRate = dOther / totalDaysInMonth;

      actualGrossPay += dailyRate;
      actualBasic += dailyBasicRate;
      actualHra += dailyHraRate;
      actualOther += dailyOtherRate;

      if (joinDate && currentDate < joinDate) {
        joiningDeduction += dailyRate;
        // Subtract components for pre-joining days so they add up to the correct gross
        actualBasic -= dailyBasicRate;
        actualHra -= dailyHraRate;
        actualOther -= dailyOtherRate;
      } else {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const lopEntry = empSummary?.lopDates?.find(
          (d) => d.dateStr === dateStr
        );

        if (lopEntry) {
          // Determine deduction amount for this LOP day based on this specific day's rate
          calculatedLopDeduction += dailyRate * lopEntry.val;
        }
      }
    }

    // Fallback: Bulk LOP deduction if dates are not populated but summary gave a count
    if (
      absentDays > 0 &&
      (!empSummary?.lopDates || empSummary.lopDates.length === 0)
    ) {
      const activeSetup =
        empSetups.find((s) => {
          const sDate = new Date(s.effectivedate);
          sDate.setHours(0, 0, 0, 0);
          return sDate <= monthEnd;
        }) ||
        empSetups[0] ||
        setup;

      const fallbackGross = activeSetup
        ? Number(activeSetup.basicPay || 0) +
          Number(activeSetup.houseRentAllowance || 0) +
          Number(activeSetup.otherAllowance || 0)
        : 0;
      const perDayPay =
        totalDaysInMonth > 0 ? fallbackGross / totalDaysInMonth : 0;
      calculatedLopDeduction = perDayPay * absentDays;
    }

    // Determine final values and fix floating points
    actualBasic = Math.max(0, actualBasic);
    actualHra = Math.max(0, actualHra);
    actualOther = Math.max(0, actualOther);

    const gross = Math.round(actualGrossPay);
    const lopDeduction = Math.round(calculatedLopDeduction);
    const totalDeductions = Math.round(
      joiningDeduction + calculatedLopDeduction
    );
    const netSalary = Math.max(0, Math.round(actualGrossPay - totalDeductions));

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
      nod: actualTotalDays,
      lopDays: absentDays,
      month,
      year,
      earnings: {
        basicSalary: Math.round(actualBasic),
        hra: Math.round(actualHra),
        medicalAllowance: 0,
        otherAllowances: Math.round(actualOther),
      },
      deductions: {
        lopDeduction: lopDeduction,
      },
      grossSalary: gross,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
    };

    // 5. Send Notification
    await NotificationService.createBulkNotifications([employee.id], {
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
