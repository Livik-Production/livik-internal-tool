// lib/hrDashboardService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Get comprehensive HR statistics for the dashboard
 */
export async function getHRStats() {
  return safeExecute(async (prisma) => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. Basic Counts (Active Only)
    const totalEmployees = await prisma.employee.count({
      where: { status: 'Active' },
    });

    // 2. Leave Request Status Counts
    const leaveStatusCounts = await prisma.leaveRequest.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // 3. Department Distribution
    const departmentCounts = await prisma.employee.groupBy({
      by: ['department'],
      where: { status: 'Active' },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // 4. Designation Distribution (Active Only)
    const designationCounts = await prisma.employee.groupBy({
      by: ['designation'],
      where: { status: 'Active' },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10, // Top 10 designations
    });

    // 5. Joining Trends (Past 6 Months - Active Only)
    const recentJoiners = await prisma.employee.findMany({
      where: {
        status: 'Active',
        dateOfJoining: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        dateOfJoining: true,
      },
    });

    // 6. Recent Hires (Last 5 - Active Only)
    const recentHires = await prisma.employee.findMany({
      where: { status: 'Active' },
      orderBy: {
        dateOfJoining: 'desc',
      },
      take: 5,
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
        dateOfJoining: true,
        photo: true,
      },
    });

    // 7. Attendance Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceToday = await prisma.attendance.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        status: true,
      },
    });

    const attendanceSummary = {
      present: attendanceToday.filter((a) => a.status === 'PRESENT').length,
      absent: attendanceToday.filter((a) => a.status === 'ABSENT').length,
      halfDay: attendanceToday.filter((a) => a.status === 'HALF_DAY').length,
      onLeave: attendanceToday.filter((a) => a.status === 'ON_LEAVE').length,
      total: attendanceToday.length,
    };

    // 8. Next Holiday
    const nextHoliday = await prisma.companyHoliday.findFirst({
      where: {
        holidayDate: {
          gte: todayStart,
        },
      },
      orderBy: {
        holidayDate: 'asc',
      },
    });

    // Process leave counts into a friendlier object
    const leaveSummary = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      total: 0,
    };
    leaveStatusCounts.forEach((item) => {
      leaveSummary[item.status] = item._count.id;
      leaveSummary.total += item._count.id;
    });

    // Process joining trends into monthly data
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const trendsMap = {};

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      trendsMap[key] = 0;
    }

    recentJoiners.forEach((emp) => {
      if (emp.dateOfJoining) {
        const d = new Date(emp.dateOfJoining);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (trendsMap.hasOwnProperty(key)) {
          trendsMap[key]++;
        }
      }
    });

    const joiningTrends = Object.keys(trendsMap)
      .map((key) => ({
        month: key,
        count: trendsMap[key],
      }))
      .reverse();

    return {
      totalEmployees,
      leaveSummary,
      attendanceSummary,
      nextHoliday,
      departmentDistribution: departmentCounts.map((d) => ({
        name: d.department || 'Other',
        count: d._count.id,
      })),
      designationDistribution: designationCounts.map((d) => ({
        name: d.designation || 'Other',
        count: d._count.id,
      })),
      joiningTrends,
      recentHires,
    };
  });
}
