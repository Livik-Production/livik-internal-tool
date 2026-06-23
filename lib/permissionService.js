// lib/permissionService.js
import { safeExecute } from './dbHelpers.js';
import { NotificationService } from '../services/notification.service.js';

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date: ' + s);
  return d;
}

/**
 * Create permission request
 * data: { employeeId, date, startTime, endTime, durationHours, reason, remarks }
 */
export async function createPermissionRequest(data) {
  if (!data || !data.employeeId) {
    throw new Error('employeeId is required');
  }

  const payload = {
    employeeId: data.employeeId,
    date: toDate(data.date),
    startTime: data.startTime,
    endTime: data.endTime,
    durationHours: data.durationHours ?? 2,
    reason: data.reason,
    remarks: data.remarks ?? null,
    // status defaults to "PENDING" at DB level
  };

  return safeExecute((prisma) =>
    prisma.permissionRequest.create({
      data: payload,
    })
  );
}

/** Get all permission requests (optionally filter by employeeId) */
export async function getAllPermissionRequests(filters = {}) {
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

    const where = {
      ...(resolvedEmployeeId ? { employeeId: resolvedEmployeeId } : {}),
      ...(resolvedExcludeId ? { NOT: { employeeId: resolvedExcludeId } } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    if (filters.date) {
      const d = new Date(filters.date);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    return prisma.permissionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        approver: true,
      },
    });
  });
}

/** Delete permission request */
export async function deletePermissionRequest(id) {
  if (!id) throw new Error('id required');
  return safeExecute(async (prisma) => {
    const req = await prisma.permissionRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Permission request not found');
    if (req.status !== 'PENDING') {
      throw new Error('Only pending requests can be deleted');
    }
    return prisma.permissionRequest.delete({
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
  if (r === 'SUPER_ADMIN' || r === 'SUPER ADMIN' || r === 'SUPERADMIN')
    return null;
  return [
    'HR',
    'ADMIN',
    'HR ADMIN',
    'SUPER_ADMIN',
    'SUPER ADMIN',
    'SUPERADMIN',
  ];
}

/** Approve permission request */
export async function approvePermissionRequest(id, approverId, remarks = null) {
  if (!id || !approverId) throw new Error('id and approverId required');

  return safeExecute(async (prisma) => {
    const req = await prisma.permissionRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Permission request not found');
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
      } else if (approverRole !== requiredRoles) {
        throw new Error(`Approver must have role ${requiredRoles}`);
      }
    }

    const isApplicantSuperAdmin =
      applicantRole === 'SUPER_ADMIN' ||
      applicantRole === 'SUPER ADMIN' ||
      applicantRole === 'SUPERADMIN';

    if (approver.id === applicant.id && !isApplicantSuperAdmin) {
      throw new Error('Approver cannot approve own request');
    }

    const updated = await prisma.permissionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        remarks: remarks || null,
      },
    });

    // Send Notification
    await NotificationService.createBulkNotifications([req.employeeId], {
      title: 'Permission Approved',
      message: `Your permission request for ${new Date(req.date).toLocaleDateString()} from ${req.startTime} to ${req.endTime} has been approved.`,
      type: 'LEAVE',
    });

    return updated;
  });
}

/** Reject permission request */
export async function rejectPermissionRequest(id, approverId, remarks = null) {
  if (!id || !approverId) throw new Error('id and approverId required');

  return safeExecute(async (prisma) => {
    const req = await prisma.permissionRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Permission request not found');
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
      } else if (approverRole !== requiredRoles) {
        throw new Error(`Approver must have role ${requiredRoles}`);
      }
    }

    const updated = await prisma.permissionRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        remarks: remarks || null,
      },
    });

    // Send Notification
    await NotificationService.createBulkNotifications([req.employeeId], {
      title: 'Permission Rejected',
      message: `Your permission request for ${new Date(req.date).toLocaleDateString()} from ${req.startTime} to ${req.endTime} has been rejected.`,
      type: 'LEAVE',
    });

    return updated;
  });
}

/** Get single permission request by id */
export async function getPermissionRequestById(id) {
  if (!id) throw new Error('id is required');
  return safeExecute((prisma) =>
    prisma.permissionRequest.findUnique({
      where: { id },
      include: { employee: true, approver: true },
    })
  );
}

/** Update permission request (Only if PENDING) */
export async function updatePermissionRequest(id, data) {
  if (!id) throw new Error('id required');

  return safeExecute(async (prisma) => {
    const req = await prisma.permissionRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Permission request not found');
    if (req.status !== 'PENDING') {
      throw new Error('Only pending requests can be updated');
    }

    return prisma.permissionRequest.update({
      where: { id },
      data: {
        date: toDate(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours: data.durationHours,
        reason: data.reason,
        remarks: data.remarks ?? null,
      },
    });
  });
}

/**
 * Confirm permission hours and calculate leave deduction.
 *
 * Business Rules (cumulative per employee per month):
 *   ≤ 2 hrs     → No deduction
 *   > 2 to 4.5  → 0.5 day (half day) CL deduction
 *   > 4.5 hrs   → 1 day (full day) CL deduction
 *
 * The deduction is incremental: only the difference between the new
 * threshold-level deduction and the previous one is applied.
 */
export async function confirmPermissionHours(
  id,
  actualHours,
  confirmerId,
  remarks = null
) {
  if (!id) throw new Error('id required');
  if (actualHours == null || actualHours <= 0)
    throw new Error('actualHours must be a positive number');

  return safeExecute(async (prisma) => {
    // 1. Fetch the permission request
    const req = await prisma.permissionRequest.findUnique({ where: { id } });
    if (!req) throw new Error('Permission request not found');
    if (req.status !== 'APPROVED')
      throw new Error('Only approved requests can be confirmed');
    if (req.isConfirmed)
      throw new Error('This permission is already confirmed');

    // 2. Get the month/year of this permission
    const permDate = new Date(req.date);
    const targetMonth = permDate.getMonth() + 1;
    const targetYear = permDate.getFullYear();

    // 3. Find all OTHER confirmed permissions for this employee in the same month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const otherConfirmed = await prisma.permissionRequest.findMany({
      where: {
        employeeId: req.employeeId,
        isConfirmed: true,
        date: { gte: monthStart, lte: monthEnd },
        id: { not: id },
      },
    });

    // 4. Calculate previous total and previous deduction
    const previousTotal = otherConfirmed.reduce(
      (sum, p) => sum + (p.actualHours || 0),
      0
    );

    const calcDeduction = (totalHours) => {
      if (totalHours <= 2) return 0;
      if (totalHours <= 4.5) return 0.5;
      return 1;
    };

    const previousDeduction = calcDeduction(previousTotal);
    const newTotal = previousTotal + actualHours;
    const newDeduction = calcDeduction(newTotal);
    const incrementalDeduction = newDeduction - previousDeduction;

    // 5. Update the permission request as confirmed (including deduction info in remarks)
    const deductionText =
      incrementalDeduction === 0
        ? 'No leave deduction'
        : `${incrementalDeduction} day(s) CL deducted`;

    const confirmationRemark = `Confirmed: ${actualHours}hrs (Month total: ${newTotal}hrs) | ${deductionText}`;

    // If remarks were passed from frontend, use them, otherwise use our generated remark
    const finalRemarks = remarks
      ? remarks
      : req.remarks
        ? `${req.remarks} | ${confirmationRemark}`
        : confirmationRemark;

    const updated = await prisma.permissionRequest.update({
      where: { id },
      data: {
        actualHours: actualHours,
        isConfirmed: true,
        remarks: finalRemarks,
      },
    });

    // 6. If there's an incremental deduction, update CL/LOP leave balance
    if (incrementalDeduction > 0) {
      // Find or create CL balance record
      const clBalance = await prisma.leaveBalance.findFirst({
        where: { employeeId: req.employeeId, leaveType: 'CL' },
      });

      let clToDeduct = 0;
      let lopToDeduct = 0;

      if (clBalance) {
        const remainingCl = Math.max(0, clBalance.allocated - clBalance.used);
        if (remainingCl >= incrementalDeduction) {
          clToDeduct = incrementalDeduction;
        } else {
          clToDeduct = remainingCl;
          lopToDeduct = incrementalDeduction - remainingCl;
        }

        // Update CL
        if (clToDeduct > 0) {
          await prisma.leaveBalance.update({
            where: { id: clBalance.id },
            data: { used: { increment: clToDeduct } },
          });
        }
      } else {
        // No CL record at all? Full LOP
        lopToDeduct = incrementalDeduction;
      }

      // Update or create LOP record if needed
      if (lopToDeduct > 0) {
        const lopBalance = await prisma.leaveBalance.findFirst({
          where: { employeeId: req.employeeId, leaveType: 'LOP' },
        });

        if (lopBalance) {
          await prisma.leaveBalance.update({
            where: { id: lopBalance.id },
            data: { used: { increment: lopToDeduct } },
          });
        } else {
          await prisma.leaveBalance.create({
            data: {
              employeeId: req.employeeId,
              leaveType: 'LOP',
              allocated: 0,
              used: lopToDeduct,
              remarks: 'Created during permission LOP overflow',
            },
          });
        }
      }

      // Update remarks with split info if necessary
      if (lopToDeduct > 0) {
        const splitText = `${clToDeduct > 0 ? `${clToDeduct} day(s) CL and ` : ''}${lopToDeduct} day(s) LOP deducted`;
        const updatedRemarks = updated.remarks.replace(
          /(\d+\.?\d* day\(s\) CL deducted|No leave deduction)/,
          splitText
        );

        await prisma.permissionRequest.update({
          where: { id },
          data: { remarks: updatedRemarks },
        });
      }
    }

    return {
      ...updated,
      monthlyTotal: newTotal,
      deductionApplied: incrementalDeduction,
      totalDeductionThisMonth: newDeduction,
    };
  });
}
