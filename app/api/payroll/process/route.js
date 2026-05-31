import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import crypto from 'crypto';
import { getMonthlyAttendanceSummary } from '../../../../lib/attendanceService';
import sendMail from '../../../../utils/emailService';
import { payrollCreatedMessage } from '../../../../utils/messageTemplates';

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

    // Formatting for PayrollCycle
    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const fullMonthNames = [
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
    const monthNameShort = monthNames[monthIndex];
    const monthNameFull = fullMonthNames[monthIndex];

    const cycleId = `PAY-${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const period = `${monthNameFull} ${year}`;

    // 1. Fetch Salary Setups
    const salarySetups = await prisma.salarySetup.findMany({
      orderBy: { effectivedate: 'asc' },
    });

    // 2. Fetch Attendance Summary utilizing shared logic
    // Centralized filtering in getMonthlyAttendanceSummary now handles join-date logic
    const attendanceSummary = await getMonthlyAttendanceSummary(month);

    // Calculate details for each employee (Using best matching historical salary setup)
    const payrollRecords = attendanceSummary.map((emp) => {
      // Find applicable salary setups
      const empSetups = salarySetups
        .filter((s) => s.employeeId === emp.id)
        .sort(
          (a, b) =>
            new Date(b.effectivedate).getTime() -
            new Date(a.effectivedate).getTime()
        );

      const workingDays = emp.workingDays || 0;
      const presentDays = emp.presentDays || 0;
      const absentDays = emp.absentDays || 0;
      const lopDays = emp.lopDays || 0;

      let fullMonthGross = 0;
      let actualGrossPayTotal = 0;
      let joiningDeduction = 0;
      let lopDeduction = 0;

      let joinDate = null;
      if (emp.dateOfJoining) {
        joinDate = new Date(emp.dateOfJoining);
        joinDate.setHours(0, 0, 0, 0);
      }

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
        fullMonthGross += dailyRate;

        if (joinDate && currentDate < joinDate) {
          joiningDeduction += dailyRate;
        } else {
          actualGrossPayTotal += dailyRate;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          const lopEntry = emp.lopDates?.find((d) => d.dateStr === dateStr);

          if (lopEntry) {
            lopDeduction += dailyRate * lopEntry.val;
          }
        }
      }

      // Handle LOP if no specific dates provided
      if (lopDays > 0 && (!emp.lopDates || emp.lopDates.length === 0)) {
        const setup =
          empSetups.find((s) => {
            const sDate = new Date(s.effectivedate);
            sDate.setHours(0, 0, 0, 0);
            return sDate <= endDate;
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
      const netPay = Math.max(0, Math.round(fullMonthGross - totalDeductions));
      const displayGross = Math.round(fullMonthGross);

      // Latest setup for record fields
      const latestSetup = empSetups.find((s) => {
        const sDate = new Date(s.effectivedate);
        sDate.setHours(0, 0, 0, 0);
        return sDate <= endDate;
      }) ||
        empSetups[0] || {
          basicPay: 0,
          houseRentAllowance: 0,
          otherAllowance: 0,
        };

      const holidayDays = emp.counts?.CH || 0;

      return {
        id: crypto.randomUUID(),
        employeeId: emp.id,
        month: monthIndex + 1,
        year: year,
        basicPay: Number(latestSetup.basicPay),
        hra: Number(latestSetup.houseRentAllowance),
        otherAllowance: Number(latestSetup.otherAllowance),
        totalDays: totalDaysInMonth,
        workingDays: workingDays,
        presentDays,
        absentDays,
        leaveDays: lopDays,
        holidayDays: holidayDays,
        grossPay: displayGross,
        lopDeduction: Math.round(lopDeduction),
        otherDeductions: Math.round(joiningDeduction),
        totalDeductions: totalDeductions,
        netPay: netPay,
        status: 'PROCESSED',
      };
    });

    const totalGrossAll = payrollRecords.reduce(
      (sum, r) => sum + r.grossPay,
      0
    );
    const totalNetAll = payrollRecords.reduce((sum, r) => sum + r.netPay, 0);
    const totalDeductionsAll = totalGrossAll - totalNetAll;

    // Use a transaction to save Cycle and Records
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete ALL payroll records for this month/year to prevent unique constraint violations
      await tx.payroll.deleteMany({
        where: { month: monthIndex + 1, year: year },
      });

      // 2. Delete existing cycle if it exists
      const existingCycle = await tx.payrollCycle.findUnique({
        where: { cycleId },
      });
      if (existingCycle) {
        await tx.payrollCycle.delete({
          where: { id: existingCycle.id },
        });
      }

      // 3. Create new PayrollCycle
      const newCycle = await tx.payrollCycle.create({
        data: {
          cycleId,
          month: `${monthNameShort}-${year}`,
          period,
          startDate: new Date(year, monthIndex, 1),
          endDate: endDate,
          processingDate: new Date(),
          paymentDate: endDate,
          employeeCount: payrollRecords.length,
          totalGross: totalGrossAll,
          totalDeductions: totalDeductionsAll,
          totalNet: totalNetAll,
          status: 'PROCESSED',
        },
      });

      // 4. Create Payroll records with the new cycle ID
      if (payrollRecords.length > 0) {
        await tx.payroll.createMany({
          data: payrollRecords.map((r) => ({
            ...r,
            payrollCycleId: newCycle.id,
          })),
        });
      }

      return newCycle;
    });

    // 5. Send Email Notifications
    try {
      // Fetch names and emails for all employees in the payroll
      const employeeDetails = await prisma.employee.findMany({
        where: {
          id: { in: payrollRecords.map((r) => r.employeeId) },
        },
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      });

      // Send emails
      const emailPromises = employeeDetails
        .filter((emp) => emp.email) // Only employees with email
        .map((emp) => {
          const htmlContent = payrollCreatedMessage(
            emp.firstName,
            monthNameFull,
            year
          );
          return sendMail({
            to: emp.email,
            subject: `Payroll Created - ${monthNameFull} ${year}`,
            html: htmlContent,
          });
        });

      // Fire and forget email sending tracking
      Promise.allSettled(emailPromises).then((results) => {
        const failed = results.filter(
          (r) =>
            r.status === 'rejected' ||
            (r.status === 'fulfilled' && !r.value.success)
        );
        if (failed.length > 0) {
          console.error(
            `Failed to send ${failed.length} payroll creation emails`
          );
        } else {
          console.log(
            `Successfully sent ${emailPromises.length} payroll creation emails`
          );
        }
      });
    } catch (emailError) {
      console.error('Error initiating email notifications:', emailError);
    }

    return NextResponse.json({ success: true, cycle: result });
  } catch (error) {
    console.error('Process payroll error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process and save payroll',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
