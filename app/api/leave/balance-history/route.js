// app/api/leave/balance-history/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { safeExecute } from '../../../../lib/dbHelpers.js';

// GET /api/leave/balance-history?employeeId=...
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId is required' },
        { status: 400 }
      );
    }

    // Fetch balance history
    const history = await safeExecute((prisma) =>
      prisma.leaveBalanceHistory.findMany({
        where: { employeeId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      })
    );

    // Fetch approved leave requests for this employee
    const approvedLeaves = await safeExecute((prisma) =>
      prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: 'APPROVED',
        },
        select: {
          leaveType: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          isHalfDay: true,
          createdAt: true,
        },
      })
    );

    // Fetch all company holidays
    const companyHolidays = await safeExecute((prisma) =>
      prisma.companyHoliday.findMany({
        select: { holidayDate: true },
      })
    );
    // Fetch confirmed permission requests for this employee
    const confirmedPermissions = await safeExecute((prisma) =>
      prisma.permissionRequest.findMany({
        where: {
          employeeId,
          isConfirmed: true,
        },
        select: {
          date: true,
          actualHours: true,
        },
      })
    );

    const holidaySet = new Set(
      (companyHolidays || []).map((h) => {
        const d = new Date(h.holidayDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    // Helper: count working days of a leave that fall in a specific month/year (excludes Sundays + holidays)
    const countUsageInMonth = (leave, targetMonth, targetYear) => {
      if (leave.isHalfDay) {
        const d = new Date(leave.startDate);
        if (
          d.getMonth() + 1 === targetMonth &&
          d.getFullYear() === targetYear
        ) {
          return leave.totalDays || 0.5;
        }
        return 0;
      }
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      let count = 0;
      for (
        let dt = new Date(start.getTime());
        dt <= end;
        dt.setDate(dt.getDate() + 1)
      ) {
        if (
          dt.getMonth() + 1 === targetMonth &&
          dt.getFullYear() === targetYear &&
          dt.getDay() !== 0 // skip Sundays
        ) {
          const dtNorm = new Date(
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate()
          ).getTime();
          if (!holidaySet.has(dtNorm)) {
            count++;
          }
        }
      }
      return count;
    };

    // Sort leaves chronologically
    const sortedLeaves = approvedLeaves.sort((a, b) => {
      const dateDiff =
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
      );
    });

    // Merge usage data into history records by performing sequential deduction per month
    const enrichedHistory = history.map((record) => {
      const targetMonth = record.month;
      const targetYear = record.year;
      const clAllocated = record.cl || 0;
      const slAllocated = record.sl || 0;

      let clUsed = 0;
      let slUsed = 0;
      let lopUsed = 0;

      // Only consider leaves that overlap with this month
      const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      sortedLeaves.forEach((leave) => {
        const lStart = new Date(leave.startDate);
        const lEnd = new Date(leave.endDate);
        if (lEnd < monthStart || lStart > monthEnd) return;

        const usage = countUsageInMonth(leave, targetMonth, targetYear);
        if (usage <= 0) return;

        const type = String(leave.leaveType || '').toUpperCase();
        if (/CL|CASUAL/i.test(type)) {
          const remainingCl = Math.max(0, clAllocated - clUsed);
          const deduct = Math.min(remainingCl, usage);
          clUsed += deduct;
          lopUsed += usage - deduct;
        } else if (/SL|SICK/i.test(type)) {
          const remainingSl = Math.max(0, slAllocated - slUsed);
          const deduct = Math.min(remainingSl, usage);
          slUsed += deduct;
          lopUsed += usage - deduct;
        } else if (/LOP/i.test(type)) {
          lopUsed += usage;
        }
      });

      // --- ADD PERMISSION USAGE ---
      // Apply the cumulative monthly rule: ≤2h=0; 2-4.5=0.5; >4.5=1.0
      // AND apply CL to LOP overflow logic
      const monthPermissions = (confirmedPermissions || []).filter((p) => {
        const d = new Date(p.date);
        return (
          d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
        );
      });

      const totalPermHours = monthPermissions.reduce(
        (sum, p) => sum + (p.actualHours || 0),
        0
      );
      let permDeduction = 0;
      if (totalPermHours > 4.5) permDeduction = 1;
      else if (totalPermHours > 2) permDeduction = 0.5;

      // Split permDeduction between CL and LOP
      let permClDeduction = 0;
      let permLopDeduction = 0;

      if (permDeduction > 0) {
        const remainingCl = Math.max(0, clAllocated - clUsed);
        if (remainingCl >= permDeduction) {
          permClDeduction = permDeduction;
        } else {
          permClDeduction = remainingCl;
          permLopDeduction = permDeduction - remainingCl;
        }
      }

      const finalClUsed = clUsed + permClDeduction;
      const finalLopUsed = lopUsed + permLopDeduction;

      return {
        ...record,
        clUsed: finalClUsed,
        slUsed,
        lopUsed: finalLopUsed,
      };
    });

    return NextResponse.json(enrichedHistory);
  } catch (error) {
    console.error('GET /api/leave/balance-history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}

// POST /api/leave/balance-history
// body: { employeeId, month, year, cl, sl, lop }
export async function POST(req) {
  try {
    const body = await req.json();
    const { employeeId, month, year, cl, sl, lop, remarks, createdBy, updatedBy } = body;

    if (!employeeId || month === undefined || year === undefined) {
      return NextResponse.json(
        { error: 'employeeId, month, and year are required' },
        { status: 400 }
      );
    }

    const history = await safeExecute((prisma) =>
      prisma.leaveBalanceHistory.upsert({
        where: {
          employeeId_month_year: {
            employeeId,
            month: parseInt(month),
            year: parseInt(year),
          },
        },
        create: {
          employeeId,
          month: parseInt(month),
          year: parseInt(year),
          cl: parseFloat(cl || 0),
          sl: parseFloat(sl || 0),
          lop: parseFloat(lop || 0),
          remarks: remarks || null,
          createdBy: createdBy || null,
          updatedBy: updatedBy || null,
        },
        update: {
          cl: parseFloat(cl || 0),
          sl: parseFloat(sl || 0),
          lop: parseFloat(lop || 0),
          remarks: remarks || null,
          updatedBy: updatedBy || null,
        },
      })
    );

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('POST /api/leave/balance-history error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to save balance history' },
      { status: 500 }
    );
  }
}

// DELETE /api/leave/balance-history?employeeId=...&month=...&year=...
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: 'employeeId, month, and year are required' },
        { status: 400 }
      );
    }

    await safeExecute((prisma) =>
      prisma.leaveBalanceHistory.delete({
        where: {
          employeeId_month_year: {
            employeeId,
            month: parseInt(month),
            year: parseInt(year),
          },
        },
      })
    );

    return NextResponse.json({
      message: 'History record deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/leave/balance-history error:', error);
    return NextResponse.json(
      { error: 'Failed to delete balance history record' },
      { status: 500 }
    );
  }
}
