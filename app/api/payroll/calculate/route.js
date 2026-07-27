import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getMonthlyAttendanceSummary } from '../../../../lib/attendanceService';

export async function POST(req) {
  try {
    const { month } = await req.json(); // e.g., "2026-01"

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { status: 400 });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // 0-indexed

    const endDate = new Date(year, monthIndex + 1, 0); // Last day of month
    const totalDaysInMonth = endDate.getDate();

    // 1. Fetch Salary Setups (Latest relevant for each employee)
    const salarySetups = await prisma.salarySetup.findMany({
      orderBy: { effectivedate: 'asc' },
    });

    // 2. Fetch Attendance Summary utilizing shared logic
    // This perfectly calculates workingDays, presentDays, absentDays, and lopDays
    // Centralized filtering in getMonthlyAttendanceSummary now handles join-date logic
    const attendanceSummary = await getMonthlyAttendanceSummary(month);

    const calculatedData = attendanceSummary.map((emp) => {
      // Find applicable salary setups
      const empSetups = salarySetups
        .filter((s) => s.employeeId === emp.id)
        .sort(
          (a, b) =>
            new Date(b.effectivedate).getTime() -
            new Date(a.effectivedate).getTime()
        );

      // Ensure stats
      const workingDays = emp.workingDays || 0;
      const presentDays = emp.presentDays || 0;
      const absentDays = emp.absentDays || 0;
      const lopDays = emp.lopDays || 0;

      let actualGrossPay = 0;
      let joiningDeduction = 0;
      let lopDeduction = 0;

      let joinDate = null;
      if (emp.dateOfJoining) {
        joinDate = new Date(emp.dateOfJoining);
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
          }) || empSetups[empSetups.length - 1];

        let dailyGross = 0;
        if (activeSetup) {
          dailyGross =
            Number(activeSetup.basicPay || 0) +
            Number(activeSetup.houseRentAllowance || 0) +
            Number(activeSetup.otherAllowance || 0);
        }

        const dailyRate = dailyGross / totalDaysInMonth;
        actualGrossPay += dailyRate;

        if (joinDate && currentDate < joinDate) {
          joiningDeduction += dailyRate;
        } else {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          const lopEntry = emp.lopDates?.find((d) => d.dateStr === dateStr);

          if (lopEntry) {
            lopDeduction += dailyRate * lopEntry.val;
          }
        }
      }

      if (lopDays > 0 && (!emp.lopDates || emp.lopDates.length === 0)) {
        const setup =
          empSetups.find((s) => {
            const sDate = new Date(s.effectivedate);
            sDate.setHours(0, 0, 0, 0);
            return sDate <= monthEnd;
          }) || empSetups[0];
        const gross = setup
          ? Number(setup.basicPay || 0) +
            Number(setup.houseRentAllowance || 0) +
            Number(setup.otherAllowance || 0)
          : 0;
        const perDayPay = totalDaysInMonth > 0 ? gross / totalDaysInMonth : 0;
        lopDeduction = perDayPay * lopDays;
      }

      const totalDeductions = Math.round(joiningDeduction + lopDeduction);
      const netPay = Math.max(0, Math.round(actualGrossPay - totalDeductions));
      const displayGross = Math.round(actualGrossPay);

      return {
        id: emp.id,
        empId: emp.empId,
        name: emp.name,
        totalDays: totalDaysInMonth,
        workingDays: workingDays,
        presentDays: presentDays,
        absentDays: absentDays,
        lopDays: lopDays,

        grossPay: displayGross,
        netPay: netPay,

        _rawGrossPay: displayGross,
        _rawNetPay: netPay,

        deductions: {
          lopDeduction: lopDeduction,
          joiningDeduction: joiningDeduction,
          totalDeductions: totalDeductions,
        },
      };
    });

    return NextResponse.json(calculatedData);
  } catch (error) {
    console.error('Calculate payroll error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate payroll' },
      { status: 500 }
    );
  }
}
