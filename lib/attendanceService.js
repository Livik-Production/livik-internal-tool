import { safeExecute } from './dbHelpers.js';

/**
 * Get Sundays in a given month
 */
function getSundaysInMonth(year, month) {
  const sundays = [];
  const date = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    date.setDate(day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      // Sunday only
      sundays.push(new Date(date));
    }
  }
  return sundays;
}

/**
 * Get company holidays for a specific month
 */
async function getCompanyHolidaysForMonth(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return safeExecute((prisma) =>
    prisma.companyHoliday.findMany({
      where: {
        holidayDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    })
  );
}

/**
 * Calculate working days for a month (total days in month)
 */
async function calculateWorkingDays(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get detailed monthly attendance summary for all employees
 */
function buildEmployeeCalendar(
  year,
  monthNum,
  empRecords,
  empLeaves,
  companyHolidays
) {
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const dailyAttendance = {};
  const dailyRemarks = {};
  const dailyAudit = {};

  let pCount = 0;
  let aCount = 0;
  let lCount = 0;
  let chCount = 0;
  let wCount = 0;

  // Granular numeric aggregates
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLeave = 0;

  const holidaySet = new Set(
    companyHolidays.map((h) => {
      const d = new Date(h.holidayDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, monthNum - 1, day);
    const isSunday = dateObj.getDay() === 0;

    // 1. Check Approved Leaves
    const leave = empLeaves.find((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return dateObj >= start && dateObj <= end;
    });

    // 2. Check manual attendance
    const record = empRecords.find((r) => {
      const rYear = r.date.getFullYear();
      const rMonth = String(r.date.getMonth() + 1).padStart(2, '0');
      const rDay = String(r.date.getDate()).padStart(2, '0');
      return `${rYear}-${rMonth}-${rDay}` === dateStr;
    });

    if (record) {
      if (record.status === 'PRESENT') {
        dailyAttendance[dateStr] = 'P';
        pCount++;
        totalPresent += 1;
      } else if (record.status === 'ABSENT') {
        dailyAttendance[dateStr] = 'A';
        aCount++;
        totalAbsent += 1;
      } else if (record.status === 'HALF_DAY') {
        dailyAttendance[dateStr] = 'HD';
        totalPresent += 0.5;
        if (leave && leave.isHalfDay) {
          totalLeave += 0.5;
        } else {
          totalAbsent += 0.5;
        }
      } else if (record.status === 'COMPANY_HOLIDAY') {
        dailyAttendance[dateStr] = 'CH'; // display stays CH
        chCount++;
        totalPresent += 1; // CH counts as a present day
      }
      dailyRemarks[dateStr] = record.remarks || (leave ? 'Approved Leave' : '');
      dailyAudit[dateStr] = {
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createBy: record.createBy,
        UpdatedBy: record.UpdatedBy,
      };
      continue;
    }

    if (leave) {
      if (leave.isHalfDay) {
        dailyAttendance[dateStr] = 'HD';
        dailyRemarks[dateStr] = 'Approved Half Day Leave';
        totalLeave += 0.5;
        totalAbsent += 0.5; // If no manual work record for the other half, it's absent
      } else {
        dailyAttendance[dateStr] = 'L';
        dailyRemarks[dateStr] = 'Approved Leave';
        totalLeave += 1;
      }
      dailyAudit[dateStr] = null;
      continue;
    }

    // Check Company Holiday (auto-detected from holidaySet)
    if (holidaySet.has(dateStr)) {
      dailyAttendance[dateStr] = 'CH'; // display stays CH
      chCount++;
      totalPresent += 1; // CH counts as a present day
      continue;
    }

    // Check Sunday (Week Off)
    if (isSunday) {
      dailyAttendance[dateStr] = 'W';
      wCount++;
      continue;
    }
  }

  return {
    dailyAttendance,
    dailyRemarks,
    dailyAudit,
    counts: { 
      P: pCount, 
      A: aCount, 
      L: totalLeave, 
      CH: chCount, 
      W: wCount 
    },
    presentCount: totalPresent,
    absentCount: totalAbsent,
    leaveCount: totalLeave,
    actualWorkingDays: totalPresent + totalAbsent + totalLeave,
  };
}

export async function getDetailedMonthlyAttendance(monthStr, employeeId = null) {
  return safeExecute(async (prisma) => {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const employees = await prisma.employee.findMany({
      where: {
        ...(employeeId ? { id: employeeId } : { status: 'Active' }),
      },
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
      },
    });

    // Filter out employees who joined after this month
    const filteredEmployees = employees.filter((emp) => {
      if (!emp.dateOfJoining) return true;
      const joinDate = new Date(emp.dateOfJoining);
      joinDate.setHours(0, 0, 0, 0);
      return joinDate <= endDate;
    });

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    const companyHolidays = await prisma.companyHoliday.findMany({
      where: {
        holidayDate: { gte: startDate, lte: endDate },
      },
    });

    return filteredEmployees.map((emp) => {
      const empRecords = attendanceRecords.filter(
        (r) => r.employeeId === emp.id
      );
      const empLeaves = approvedLeaves.filter((l) => l.employeeId === emp.id);

      const cal = buildEmployeeCalendar(
        year,
        month,
        empRecords,
        empLeaves,
        companyHolidays
      );

      return {
        id: emp.id,
        empId: emp.empId,
        name: `${emp.firstName} ${emp.lastName}`,
        dateOfJoining: emp.dateOfJoining,
        dailyAttendance: cal.dailyAttendance,
        dailyRemarks: cal.dailyRemarks,
        dailyAudit: cal.dailyAudit,
        actualWorkingDays: cal.actualWorkingDays,
        presentCount: cal.presentCount,
        absentCount: cal.absentCount,
        leaveCount: cal.leaveCount,
        counts: cal.counts,
      };
    });
  });
}
export async function getMonthlyAttendanceSummary(monthStr, employeeId = null) {
  return safeExecute(async (prisma) => {
    // Parse month string (format: YYYY-MM)
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all employees (or specific employee) that are ACTIVE
    const employees = await prisma.employee.findMany({
      where: {
        ...(employeeId ? { id: employeeId } : { status: 'Active' }),
      },
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
      },
    });

    // Filter out employees who joined after this month
    const filteredEmployees = employees.filter((emp) => {
      if (!emp.dateOfJoining) return true;
      const joinDate = new Date(emp.dateOfJoining);
      joinDate.setHours(0, 0, 0, 0);
      return joinDate <= endDate;
    });

    // Get attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        employeeId: employeeId || undefined,
      },
    });

    // Fetch balance histories for the selected month/year
    const histories = await prisma.leaveBalanceHistory.findMany({
      where: { month, year },
    });

    // Fetch approved leaves that overlap with the selected month
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    // Fetch company holidays for usage calculation
    const companyHolidays = await prisma.companyHoliday.findMany({
      where: {
        holidayDate: { gte: startDate, lte: endDate },
      },
    });
    const holidaySet = new Set(
      companyHolidays.map((h) => new Date(h.holidayDate).setHours(0, 0, 0, 0))
    );

    // Helper to count usage in month and get exact dates
    const getUsageDetails = (l) => {
      const dates = [];
      let count = 0;
      if (l.isHalfDay) {
        const d = new Date(l.startDate);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          count = l.totalDays || 0.5;
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          dates.push({ dateStr, value: count });
        }
        return { count, dates };
      }

      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      for (
        let dt = new Date(s.getTime());
        dt <= e;
        dt.setDate(dt.getDate() + 1)
      ) {
        if (
          dt.getMonth() + 1 === month &&
          dt.getFullYear() === year &&
          dt.getDay() !== 0 && // skip Sundays
          !holidaySet.has(dt.setHours(0, 0, 0, 0))
        ) {
          count++;
          const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          dates.push({ dateStr, value: 1 });
        }
      }
      return { count, dates };
    };

    // Calculate global working days for the month
    const globalWorkingDays = await calculateWorkingDays(year, month);
    const holidayCount = companyHolidays.length;

    // Build summary for each employee
    const summary = filteredEmployees.map((emp) => {
      let workingDays = globalWorkingDays;

      const empRecords = attendanceRecords.filter(
        (r) => r.employeeId === emp.id
      );
      const empLeaves = approvedLeaves.filter((l) => l.employeeId === emp.id);

      const cal = buildEmployeeCalendar(
        year,
        month,
        empRecords,
        empLeaves,
        companyHolidays
      );

      // 2. LOP Calculation (Synchronized with leaveService logic)
      const history = histories.find((h) => h.employeeId === emp.id);
      const empLeavesForDeduction = empLeaves.sort((a, b) => {
        const dateDiff =
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
        );
      });

      const clAllocated = history?.cl || 0;
      const slAllocated = history?.sl || 0;
      let clUsedTotal = 0;
      let slUsedTotal = 0;
      let lopDays = 0;
      const lopDates = [];

      empLeavesForDeduction.forEach((l) => {
        const { count: usage, dates: usageDates } = getUsageDetails(l);
        if (usage <= 0) return;

        const type = String(l.leaveType || '').toUpperCase();
        if (/CL|CASUAL/i.test(type)) {
          const remainingCl = Math.max(0, clAllocated - clUsedTotal);
          const deduct = Math.min(remainingCl, usage);
          clUsedTotal += deduct;
          const currentLop = usage - deduct;
          lopDays += currentLop;

          if (currentLop > 0) {
            let lopsToAssign = currentLop;
            for (
              let i = usageDates.length - 1;
              i >= 0 && lopsToAssign > 0;
              i--
            ) {
              const val = Math.min(usageDates[i].value, lopsToAssign);
              lopDates.push({ dateStr: usageDates[i].dateStr, val });
              lopsToAssign -= val;
            }
          }
        } else if (/SL|SICK/i.test(type)) {
          const remainingSl = Math.max(0, slAllocated - slUsedTotal);
          const deduct = Math.min(remainingSl, usage);
          slUsedTotal += deduct;
          const currentLop = usage - deduct;
          lopDays += currentLop;

          if (currentLop > 0) {
            let lopsToAssign = currentLop;
            for (
              let i = usageDates.length - 1;
              i >= 0 && lopsToAssign > 0;
              i--
            ) {
              const val = Math.min(usageDates[i].value, lopsToAssign);
              lopDates.push({ dateStr: usageDates[i].dateStr, val });
              lopsToAssign -= val;
            }
          }
        } else if (/LOP/i.test(type)) {
          lopDays += usage;
          usageDates.forEach((ud) => {
            lopDates.push({ dateStr: ud.dateStr, val: ud.value });
          });
        }
      });

      return {
        id: emp.id,
        empId: emp.empId,
        name: `${emp.firstName} ${emp.lastName}`,
        dateOfJoining: emp.dateOfJoining,
        workingDays,
        presentDays: cal.presentCount,
        absentDays: cal.absentCount,
        actualWorkingDays: cal.actualWorkingDays,
        presentCount: cal.presentCount,
        absentCount: cal.absentCount,
        leaveCount: cal.leaveCount,
        lopDays: lopDays,
        lopDates: lopDates,
        counts: cal.counts,
        dailyAudit: cal.dailyAudit,
        dailyAttendance: cal.dailyAttendance,
      };
    });

    return summary;
  });
}

/**
 * Bulk mark attendance for a specific date
 */
export async function bulkMarkAttendance(date, records) {
  return safeExecute(async (prisma) => {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize to start of day

    let createdCount = 0;
    let updatedCount = 0;

    // Process each record
    for (const record of records) {
      // Check if attendance already exists for this employee on this date
      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId: record.employeeId,
          date: {
            gte: attendanceDate,
            lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existing) {
        // Update existing record
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            remarks: record.remarks || null,
          },
        });
        updatedCount++;
      } else {
        // Create new record
        await prisma.attendance.create({
          data: {
            employeeId: record.employeeId,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks || null,
          },
        });
        createdCount++;
      }
    }

    return {
      count: createdCount + updatedCount,
      created: createdCount,
      updated: updatedCount,
      message: `Attendance marked for ${createdCount + updatedCount} employees (${createdCount} new, ${updatedCount} updated)`,
    };
  });
}

/**
 * Update individual attendance record
 */
export async function updateAttendanceRecord(id, data) {
  return safeExecute((prisma) =>
    prisma.attendance.update({
      where: { id },
      data: {
        status: data.status,
        remarks: data.remarks,
      },
    })
  );
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceRecord(id) {
  return safeExecute((prisma) =>
    prisma.attendance.delete({
      where: { id },
    })
  );
}

/**
 * Get attendance records by date range for an employee
 */
export async function getAttendanceByDateRange(employeeId, startDate, endDate) {
  return safeExecute((prisma) =>
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    })
  );
}
/**
 * Get all months that have attendance records
 */
export async function getMarkedAttendanceMonths() {
  return safeExecute(async (prisma) => {
    const dates = await prisma.attendance.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
    });

    const months = new Set();
    dates.forEach((d) => {
      const year = d.date.getFullYear();
      const monthStr = String(d.date.getMonth() + 1).padStart(2, '0');
      months.add(`${year}-${monthStr}`); // YYYY-MM
    });

    return Array.from(months);
  });
}
