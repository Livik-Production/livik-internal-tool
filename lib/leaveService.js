// lib/leaveService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Helpers
 */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date: ' + s);
  return d;
}

/** Calculates working days between two dates, excluding Sundays and company holidays */
async function calcTotalDays(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  if (e < s) throw new Error('endDate must be same or after startDate');

  // Fetch company holidays in the date range
  let holidays = [];
  try {
    const { default: prisma } = await import('./prisma.js');
    const holidayRecords = await prisma.companyHoliday.findMany({
      where: {
        holidayDate: { gte: s, lte: e },
      },
      select: { holidayDate: true },
    });
    holidays = holidayRecords.map((h) => {
      const d = new Date(h.holidayDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
  } catch (err) {
    console.error('Failed to fetch holidays for calcTotalDays:', err);
  }

  let count = 0;
  for (let dt = new Date(s.getTime()); dt <= e; dt.setDate(dt.getDate() + 1)) {
    const isSunday = dt.getDay() === 0;
    const isHoliday = holidays.includes(dt.getTime());
    if (!isSunday && !isHoliday) {
      count++;
    }
  }

  if (count <= 0) count = 1; // At least 1 day if dates are valid
  return count;
}

/**
 * Create leave request
 * data: { employeeId, leaveType, startDate, endDate, reason }
 */
export async function createLeaveRequest(data) {
  if (!data || !data.employeeId) {
    throw new Error('employeeId is required');
  }
  const isHalfDay = data.isHalfDay === true;
  const totalDays = isHalfDay
    ? 0.5
    : await calcTotalDays(data.startDate, data.endDate);

  const payload = {
    employeeId: data.employeeId,
    leaveType: data.leaveType ?? 'CL',
    startDate: toDate(data.startDate),
    endDate: isHalfDay ? toDate(data.startDate) : toDate(data.endDate),
    totalDays,
    isHalfDay,
    halfDayPeriod: isHalfDay ? data.halfDayPeriod || null : null,
    reason: data.reason ?? null,
    attachment: data.attachment ?? null,
    // status defaults to "PENDING" at DB level
  };

  return safeExecute((prisma) =>
    prisma.leaveRequest.create({
      data: payload,
    })
  );
}

/** Get all leave requests (optionally filter by query) */
export async function getAllLeaveRequests(filters = {}) {
  // filters can include status, employeeId, excludeEmployeeId, leaveType, fromDate, toDate
  return safeExecute(async (prisma) => {
    let resolvedEmployeeId = filters.employeeId;
    if (
      resolvedEmployeeId &&
      !resolvedEmployeeId.startsWith('c') &&
      !resolvedEmployeeId.includes('-')
    ) {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [{ id: resolvedEmployeeId }, { empId: resolvedEmployeeId }],
        },
      });
      if (emp) resolvedEmployeeId = emp.id;
    }

    let resolvedExcludeId = filters.excludeEmployeeId;
    if (
      resolvedExcludeId &&
      !resolvedExcludeId.startsWith('c') &&
      !resolvedExcludeId.includes('-')
    ) {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [{ id: resolvedExcludeId }, { empId: resolvedExcludeId }],
        },
      });
      if (emp) resolvedExcludeId = emp.id;
    }

    return prisma.leaveRequest.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(resolvedEmployeeId ? { employeeId: resolvedEmployeeId } : {}),
        ...(resolvedExcludeId
          ? { NOT: { employeeId: resolvedExcludeId } }
          : {}),
        ...(filters.leaveType ? { leaveType: filters.leaveType } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              AND: [
                filters.fromDate
                  ? { startDate: { gte: toDate(filters.fromDate) } }
                  : {},
                filters.toDate
                  ? { endDate: { lte: toDate(filters.toDate) } }
                  : {},
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        approver: true,
      },
    });
  });
}

/** Check if there are any pending leave requests for a given month */
export async function hasPendingLeaveRequests(monthStr) {
  if (!monthStr) return false;
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return safeExecute(async (prisma) => {
    const pendingCount = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    return pendingCount > 0;
  });
}

/** Get single leave request by id */
export async function getLeaveRequestById(id) {
  if (!id) throw new Error('id is required');
  return safeExecute((prisma) =>
    prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, approver: true },
    })
  );
}

/** Update a leave request (simple fields) */
export async function updateLeaveRequest(id, data) {
  if (!id) throw new Error('id required');
  const updateData = {};
  if ('leaveType' in data) updateData.leaveType = data.leaveType ?? null;
  if ('startDate' in data)
    updateData.startDate = data.startDate ? toDate(data.startDate) : null;
  if ('endDate' in data)
    updateData.endDate = data.endDate ? toDate(data.endDate) : null;
  if ('reason' in data) updateData.reason = data.reason ?? null;
  if ('attachment' in data) updateData.attachment = data.attachment ?? null;
  if ('status' in data) updateData.status = data.status ?? null;
  if ('remarks' in data) updateData.remarks = data.remarks ?? null;
  if ('isHalfDay' in data) updateData.isHalfDay = data.isHalfDay === true;
  if ('halfDayPeriod' in data)
    updateData.halfDayPeriod = data.halfDayPeriod ?? null;

  // If half-day, force totalDays to 0.5 and endDate = startDate
  if (updateData.isHalfDay) {
    updateData.totalDays = 0.5;
    if (updateData.startDate) updateData.endDate = updateData.startDate;
  } else if (updateData.startDate && updateData.endDate) {
    // If dates changed, recalc totalDays
    updateData.totalDays = await calcTotalDays(
      updateData.startDate,
      updateData.endDate
    );
  }

  return safeExecute((prisma) =>
    prisma.leaveRequest.update({
      where: { id },
      data: updateData,
    })
  );
}

/** Delete leave request */
export async function deleteLeaveRequest(id) {
  if (!id) throw new Error('id required');
  return safeExecute(async (prisma) => {
    const req = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Leave request not found');
    if (req.status !== 'PENDING') {
      throw new Error('Only pending requests can be deleted');
    }
    return prisma.leaveRequest.delete({
      where: { id },
    });
  });
}

// Helper to safely get role name
function getRoleName(employee) {
  return String(employee?.role?.roleName || '').toUpperCase();
}

/** determine required approver role for applicant role */
function requiredApproverRoleFor(applicantRoleName = '') {
  const r = String(applicantRoleName || '').toUpperCase();

  // If applicant is SUPER_ADMIN, they might not need approval or can auto-approve
  if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN' || r === 'SUPERADMIN')
    return null;

  // Default: Everyone (including HR and ADMIN) can be approved by HR or ADMIN roles.
  // This allows HR Admin and Admin to approve each other's leaves without a Super Admin.
  // Self-approval is still blocked in the approveLeave/rejectLeave functions.
  return [
    'HR',
    'ADMIN',
    'HR ADMIN',
    'SUPER_ADMIN',
    'SUPER ADMIN',
    'SUPERADMIN',
  ];
}

export async function approveLeave(id, approverId, remarks = null) {
  if (!id || !approverId) throw new Error('id and approverId required');

  return safeExecute(async (prisma) => {
    const req = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Leave request not found');
    if (req.status !== 'PENDING')
      throw new Error('Only pending requests can be approved');

    const applicant = await prisma.employee.findUnique({
      where: { id: req.employeeId },
      include: { role: true },
    });
    if (!applicant) throw new Error('Requesting employee not found');

    const approver = await prisma.employee.findUnique({
      where: { id: approverId },
      include: { role: true },
    });
    if (!approver) throw new Error('Approver not found');

    // Role based approver check
    const applicantRole = getRoleName(applicant);
    const approverRole = getRoleName(approver);

    const requiredRoles = requiredApproverRoleFor(applicantRole);

    if (requiredRoles) {
      // If it's an array, allow any of them
      if (Array.isArray(requiredRoles)) {
        // Check if approver has one of the allowed roles
        const hasPermission = requiredRoles.some(
          (role) => approverRole === role || approverRole.includes(role)
        );

        if (!hasPermission) {
          throw new Error(
            `Approver must have role: ${requiredRoles.join(' or ')}`
          );
        }
      } else {
        // Single string requirement (e.g. SUPER_ADMIN)
        if (approverRole !== requiredRoles) {
          throw new Error(`Approver must have role ${requiredRoles}`);
        }
      }
    }

    // If approver is same as applicant and not allowed, reject
    if (approver.id === applicant.id) {
      // if applicant is SUPER_ADMIN, allow auto-approve
      const isApplicantSuperAdmin =
        applicantRole === 'SUPER_ADMIN' ||
        applicantRole === 'SUPER ADMIN' ||
        applicantRole === 'SUPERADMIN';
      if (!isApplicantSuperAdmin) {
        throw new Error('Approver cannot approve own request');
      }
    }

    // Check leave balance across all months the request covers
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);

    // If leave type is pure LOP, approve without balance check
    if (req.leaveType === 'LOP') {
      return prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approverId,
          remarks: remarks ?? null,
        },
      });
    }

    // Determine the base leave type
    const isLopTagged = req.leaveType.endsWith('-LOP');
    const baseLeaveType = isLopTagged
      ? req.leaveType.replace(/-LOP$/, '')
      : req.leaveType;

    // 1. Identify all months covered by this leave
    const monthsCovered = [];
    for (let dt = new Date(start.getTime()); dt <= end; ) {
      monthsCovered.push({ month: dt.getMonth() + 1, year: dt.getFullYear() });
      // Move to first day of next month
      dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 1);
    }

    // 2. Fetch all company holidays in the entire range
    const companyHolidays = await prisma.companyHoliday.findMany({
      where: {
        holidayDate: { gte: start, lte: end },
      },
    });
    const holidaySet = new Set(
      companyHolidays.map((h) => new Date(h.holidayDate).setHours(0, 0, 0, 0))
    );

    let totalDeductFromBalance = 0;
    let totalLopDays = 0;
    const monthStats = [];

    // 3. Sequential deduction month-by-month
    for (const { month: targetMonth, year: targetYear } of monthsCovered) {
      // Calculate working days of THIS request in THIS month
      let requestedInMonth = 0;
      if (req.isHalfDay) {
        requestedInMonth =
          new Date(req.startDate).getMonth() + 1 === targetMonth
            ? req.totalDays || 0.5
            : 0;
      } else {
        for (
          let dt = new Date(start.getTime());
          dt <= end;
          dt.setDate(dt.getDate() + 1)
        ) {
          if (
            dt.getMonth() + 1 === targetMonth &&
            dt.getFullYear() === targetYear &&
            dt.getDay() !== 0 &&
            !holidaySet.has(dt.setHours(0, 0, 0, 0))
          ) {
            requestedInMonth++;
          }
        }
      }

      if (requestedInMonth <= 0) continue;

      // Fetch monthly history for allocation
      const history = await prisma.leaveBalanceHistory.findFirst({
        where: {
          employeeId: req.employeeId,
          month: targetMonth,
          year: targetYear,
        },
      });

      const allocation = /CL|CASUAL/i.test(baseLeaveType)
        ? history?.cl || 0
        : /SL|SICK/i.test(baseLeaveType)
          ? history?.sl || 0
          : 0;

      // Fetch other approved leaves in THIS month to see what's already used
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0);
      const otherApprovedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: req.employeeId,
          status: 'APPROVED',
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
          id: { not: id },
        },
      });

      const countMonthDayUsage = (l) => {
        if (l.isHalfDay)
          return new Date(l.startDate).getMonth() + 1 === targetMonth
            ? l.totalDays || 0.5
            : 0;
        let count = 0;
        for (
          let dt = new Date(l.startDate);
          dt <= new Date(l.endDate);
          dt.setDate(dt.getDate() + 1)
        ) {
          if (
            dt.getMonth() + 1 === targetMonth &&
            dt.getFullYear() === targetYear &&
            dt.getDay() !== 0 &&
            !holidaySet.has(dt.setHours(0, 0, 0, 0))
          ) {
            count++;
          }
        }
        return count;
      };

      let monthUsedByOthers = 0;
      otherApprovedLeaves.forEach((l) => {
        const type = String(l.leaveType || '').toUpperCase();
        if (
          (baseLeaveType === 'CL' && /CL|CASUAL/i.test(type)) ||
          (baseLeaveType === 'SL' && /SL|SICK/i.test(type))
        ) {
          monthUsedByOthers += countMonthDayUsage(l);
        }
      });

      monthUsedByOthers = Math.min(allocation, monthUsedByOthers);
      const availableInMonth = Math.max(0, allocation - monthUsedByOthers);

      const deduct = Math.min(availableInMonth, requestedInMonth);
      const lop = requestedInMonth - deduct;

      totalDeductFromBalance += deduct;
      totalLopDays += lop;
      monthStats.push({ month: targetMonth, year: targetYear, deduct, lop });
    }

    // Update leave request — add multi-month split info in remarks
    let approvalRemarks = remarks ?? '';
    if (monthStats.length > 1) {
      const splitNote = monthStats
        .map(
          (s) =>
            `${new Date(s.year, s.month - 1).toLocaleString('default', { month: 'short' })}: ${s.deduct} ${baseLeaveType}${s.lop > 0 ? `, ${s.lop} LOP` : ''}`
        )
        .join(' | ');
      approvalRemarks = approvalRemarks
        ? `${approvalRemarks} [${splitNote}]`
        : splitNote;
    } else if (totalLopDays > 0) {
      const lopNote = `${totalDeductFromBalance} day(s) from ${baseLeaveType}, ${totalLopDays} day(s) as LOP`;
      approvalRemarks = approvalRemarks
        ? `${approvalRemarks} | ${lopNote}`
        : lopNote;
    }

    // Update leave request status
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        remarks: approvalRemarks || null,
      },
    });

    // Synchronize with cumulative LeaveBalance table if it exists
    const cumulativeBalance = await prisma.leaveBalance.findFirst({
      where: { employeeId: req.employeeId, leaveType: baseLeaveType },
    });
    if (totalDeductFromBalance > 0 && cumulativeBalance) {
      await prisma.leaveBalance.update({
        where: { id: cumulativeBalance.id },
        data: { used: { increment: totalDeductFromBalance } },
      });
    }

    return updated;
  });
}

/**
 * Reject leave
 * - approverId: who rejected
 * - id: leave id
 * - remarks: optional
 */
export async function rejectLeave(id, approverId, remarks = null) {
  if (!id || !approverId) throw new Error('id and approverId required');

  return safeExecute(async (prisma) => {
    const req = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Leave request not found');
    if (req.status !== 'PENDING')
      throw new Error('Only pending requests can be rejected');

    const approver = await prisma.employee.findUnique({
      where: { id: approverId },
      include: { role: true },
    });
    if (!approver) throw new Error('Approver not found');

    const applicant = await prisma.employee.findUnique({
      where: { id: req.employeeId },
      include: { role: true },
    });

    // Role check
    const applicantRole = getRoleName(applicant);
    const approverRole = getRoleName(approver);
    const requiredRoles = requiredApproverRoleFor(applicantRole);

    if (requiredRoles) {
      if (Array.isArray(requiredRoles)) {
        const hasPermission = requiredRoles.some(
          (role) => approverRole === role || approverRole.includes(role)
        );
        if (!hasPermission) {
          throw new Error(
            `Approver must have role: ${requiredRoles.join(' or ')}`
          );
        }
      } else {
        if (approverRole !== requiredRoles) {
          throw new Error(`Approver must have role ${requiredRoles}`);
        }
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        remarks: remarks ?? null,
      },
    });

    return updated;
  });
}

/** Get/Fetch leave balances (all categories) for an employee */
export async function getLeaveBalances(employeeId) {
  if (!employeeId) throw new Error('employeeId required');
  return safeExecute((prisma) =>
    prisma.leaveBalance.findMany({
      where: { employeeId },
      orderBy: { updatedAt: 'desc' },
    })
  );
}

/** Credit or create leave balance for an employee */
export async function creditLeaveBalance(employeeId, leaveType, amount) {
  if (!employeeId || !leaveType)
    throw new Error('employeeId and leaveType required');
  const amt = Number(amount ?? 0);
  if (Number.isNaN(amt)) throw new Error('amount must be numeric');

  return safeExecute(async (prisma) => {
    // Try find existing
    const existing = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveType },
    });
    if (existing) {
      // increment allocated
      return prisma.leaveBalance.update({
        where: { id: existing.id },
        data: { allocated: { increment: amt } },
      });
    } else {
      // create
      return prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          allocated: amt,
          used: 0,
        },
      });
    }
  });
}

/** Update absolute leave balances for an employee */
export async function updateLeaveBalances(employeeId, balances) {
  if (!employeeId || !Array.isArray(balances))
    throw new Error('employeeId and balances array required');

  return safeExecute(async (prisma) => {
    const results = [];
    for (const item of balances) {
      const { leaveType, allocated, used } = item;

      // Find existing balance for this type
      const existing = await prisma.leaveBalance.findFirst({
        where: { employeeId, leaveType },
      });

      if (existing) {
        // Update
        results.push(
          await prisma.leaveBalance.update({
            where: { id: existing.id },
            data: {
              allocated: Number(allocated),
              used: Number(used),
            },
          })
        );
      } else {
        // Create
        results.push(
          await prisma.leaveBalance.create({
            data: {
              employeeId,
              leaveType,
              allocated: Number(allocated),
              used: Number(used),
            },
          })
        );
      }
    }
    return results;
  });
}

/** Employee leave history */
export async function getEmployeeLeaveHistory(employeeId) {
  if (!employeeId) throw new Error('employeeId required');
  return safeExecute((prisma) =>
    prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { approver: true },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/** Get all employees with their leave balances (optionally for a specific month/year) */
export async function getAllEmployeesWithBalances(month = null, year = null) {
  return safeExecute(async (prisma) => {
    // 1. Fetch active employees with their cumulative balances (for fallback)
    const employees = await prisma.employee.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        leaveBalances: true,
      },
      orderBy: { empId: 'asc' },
    });

    if (!month || !year) return employees;

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // 2. Fetch balance histories for the selected month/year
    const histories = await prisma.leaveBalanceHistory.findMany({
      where: { month: targetMonth, year: targetYear },
    });

    // 3. Fetch approved leaves that overlap with the selected month
    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: {
        employeeId: true,
        leaveType: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        isHalfDay: true,
        createdAt: true,
      },
    });

    // 4. Fetch company holidays for usage calculation
    const companyHolidays = await prisma.companyHoliday.findMany({
      where: {
        holidayDate: { gte: monthStart, lte: monthEnd },
      },
    });
    const holidaySet = new Set(
      companyHolidays.map((h) => new Date(h.holidayDate).setHours(0, 0, 0, 0))
    );

    // Helper to count usage in month
    const countUsageInMonth = (l) => {
      if (l.isHalfDay) {
        const d = new Date(l.startDate);
        if (
          d.getMonth() + 1 === targetMonth &&
          d.getFullYear() === targetYear
        ) {
          return l.totalDays || 0.5;
        }
        return 0;
      }
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      let count = 0;
      for (
        let dt = new Date(s.getTime());
        dt <= e;
        dt.setDate(dt.getDate() + 1)
      ) {
        if (
          dt.getMonth() + 1 === targetMonth &&
          dt.getFullYear() === targetYear &&
          dt.getDay() !== 0 && // skip Sundays
          !holidaySet.has(dt.setHours(0, 0, 0, 0))
        ) {
          count++;
        }
      }
      return count;
    };

    // 5. Enrich employees with monthly-specific data
    return employees.map((emp) => {
      const history = histories.find((h) => h.employeeId === emp.id);

      // Sort leaves by startDate and then createdAt to ensure chronological deduction
      const empLeavesForDeduction = approvedLeaves
        .filter((l) => l.employeeId === emp.id)
        .sort((a, b) => {
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
      let clUsed = 0;
      let slUsed = 0;
      let lopUsed = 0;

      empLeavesForDeduction.forEach((l) => {
        const usage = countUsageInMonth(l);
        if (usage <= 0) return;

        const type = String(l.leaveType || '').toUpperCase();
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

      // Map combined monthly stats to the internal "leaveBalances" structure for the frontend
      // We overwrite/re-map these fields to only represent the SELECTED month
      const monthlyBalances = [
        {
          leaveType: 'CL',
          allocated: clAllocated,
          used: clUsed,
        },
        {
          leaveType: 'SL',
          allocated: slAllocated,
          used: slUsed,
        },
        {
          leaveType: 'LOP',
          allocated: 0,
          used: lopUsed,
        },
      ];

      return {
        ...emp,
        leaveBalances: monthlyBalances,
      };
    });
  });
}
