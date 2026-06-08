'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ExpensesChart = dynamic(() => import('./ExpensesChartClient'), {
  ssr: false,
});
import {
  Users,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  FileText,
  CreditCard,
  Briefcase,
  CheckCircle,
  Activity,
  Layers,
  LayoutDashboard,
  Clock,
  UserCheck,
  UserX,
  ChartNoAxesCombined,
  Shield,
  UserCircle2Icon,
} from 'lucide-react';

/* ================= KPI CARD ================= */

function HrKpiCard({ label, value, subLabel, change }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] p-4 bg-white border border-gray-300 shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group border-t-3 border-t-[#2daadf] hover:border-t-4 cursor-pointer">
      {/* Premium Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className="flex flex-col items-center justify-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#004475] mb-2 leading-none opacity-80 group-hover:opacity-100 transition-opacity">
          {subLabel}
        </span>
        <span className="text-[12px] font-regular text-gray-500 mb-5 leading-none">
          {label}
        </span>
        <h3 className="text-[25px] font-bold text-[#004475] tracking-tight mb-5 leading-none transition-all duration-500 group-hover:scale-110">
          {value}
        </h3>
        {change && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50 transition-all duration-300 group-hover:bg-[#2daadf] group-hover:text-white group-hover:shadow-md">
            <TrendingUp
              size={14}
              strokeWidth={2.5}
              className="text-[#2daadf] group-hover:text-white transition-colors"
            />
            <span className="text-[12px] font-bold text-slate-800 group-hover:text-white">
              {change}
            </span>
            <span className="text-[11px] font-medium text-slate-500 group-hover:text-white/80">
              vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= MAIN HR DASHBOARD ================= */

export default function HrDashboard({
  statsData,
  roleName,
  visibleQuickActions,
  employeesData = [],
  attendanceData = [],
  holidaysData = [],
  permissionsData = [],
}) {
  const router = useRouter();
  const hasModule = (moduleId) =>
    visibleQuickActions.some(
      (a) => a.id.toLowerCase() === moduleId.toLowerCase()
    );

  // Dynamic Layout Calculations
  const visibleHubsCount = [
    hasModule('finance'),
    hasModule('payroll'),
    hasModule('asset'),
  ].filter(Boolean).length;

  const hubSpanClass =
    visibleHubsCount === 1
      ? 'col-span-12'
      : visibleHubsCount === 2
        ? 'col-span-12 lg:col-span-6'
        : 'col-span-12 lg:col-span-4';

  // Real employee list data from prop enriched with today's attendance status
  const recentEmployees = (() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return employeesData.map((emp) => {
      // Find today's attendance status for this specific employee
      const attRecord = attendanceData.find((a) => a.empId === emp.empId);
      const todayStatus = attRecord?.dailyAttendance?.[todayStr];
      const isOnLeave = todayStatus === 'A' || todayStatus === 'HD';

      return {
        name: `${emp.firstName} ${emp.lastName}`.trim(),
        dept: emp.department || 'No Department',
        status: isOnLeave
          ? 'On Leave'
          : emp.status === 'ACTIVE'
            ? 'Active'
            : emp.status,
        avatar: emp.firstName ? emp.firstName.charAt(0).toUpperCase() : 'U',
      };
    });
  })();

  // Real leave members derived from attendance summary
  const leaveMembers = (() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayFormatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return attendanceData
      .filter((row) => {
        const status = row.dailyAttendance?.[todayStr];
        return status === 'A' || status === 'HD';
      })
      .map((row) => {
        const status = row.dailyAttendance?.[todayStr];
        return {
          name: row.name,
          type: status === 'A' ? 'Absent' : 'Half Day',
          days: status === 'A' ? 'Full Day' : '0.5 Day',
          from: todayFormatted,
          status: 'Approved',
        };
      });
  })();

  // Real permission members derived from permissionsData
  const permissionMembers = permissionsData.map((perm) => {
    const emp = perm.employee || {};
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    return {
      name: name || 'Unknown Employee',
      type: 'Permission',
      hours: `${perm.actualHours || perm.durationHours || 0} Hrs`,
      timeRange: `${perm.startTime || ''} - ${perm.endTime || ''}`,
      status: perm.status === 'APPROVED' ? 'Approved' : perm.status,
    };
  });

  // Calculate today's attendance counts for the directory header
  const attendanceStats = (() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let present = 0;
    let leave = 0;

    attendanceData.forEach((row) => {
      const status = row.dailyAttendance?.[todayStr];
      if (status === 'P') present++;
      else if (status === 'A' || status === 'HD') leave++;
    });

    return { present, leave };
  })();

  // Holiday logic
  const holidayStats = (() => {
    const now = new Date();
    // Use local date string comparison to avoid TZ issues for "today"
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const sortedHolidays = [...holidaysData].sort(
      (a, b) => new Date(a.holidayDate) - new Date(b.holidayDate)
    );

    const nextHoliday = sortedHolidays.find((h) => h.holidayDate >= todayStr);

    const holidaysLeft = sortedHolidays.filter(
      (h) => h.holidayDate >= todayStr
    ).length;

    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const thisQuarterHolidays = sortedHolidays.filter((h) => {
      const d = new Date(h.holidayDate);
      const hQuarter = Math.floor(d.getMonth() / 3) + 1;
      return hQuarter === currentQuarter && h.holidayDate >= todayStr;
    }).length;

    let daysAway = 0;
    let formattedDate = 'No Upcoming Holidays';
    let dayOfWeek = '';

    if (nextHoliday) {
      const hDate = new Date(nextHoliday.holidayDate);
      daysAway = Math.ceil((hDate - now) / (1000 * 60 * 60 * 24));
      formattedDate = hDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      dayOfWeek = hDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return {
      nextHoliday,
      holidaysLeft,
      thisQuarterHolidays,
      daysAway,
      formattedDate,
      dayOfWeek,
    };
  })();

  // Quick actions for HR - Filtered by module access
  const hrQuickActions = [
    {
      label: 'Attendance',
      icon: <Clock size={20} />,
      path: '/dashboard/hr?tab=leave&subtab=attendance',
      moduleId: 'hr',
    },
    {
      label: 'Expenses',
      icon: <ChartNoAxesCombined size={20} />,
      path: '/dashboard/finance?tab=overview',
      moduleId: 'finance',
    },
    {
      label: 'Assets',
      icon: <Package size={20} />,
      path: '/dashboard/asset',
      moduleId: 'asset',
    },
    {
      label: 'Documents',
      icon: <FileText size={20} />,
      path: '/dashboard/hr?tab=offerLetter',
      moduleId: 'hr',
    },
  ].filter((action) => hasModule(action.moduleId));

  return (
    <div className="bg-[#f8fafc] pt-3 h-full">
      <div className="animate-dashboard-reveal-delayed space-y-3 pb-6">
        {/* Row 1: Summary KPI Cards - Dynamic Flex for stretching */}
        <div className="flex flex-wrap gap-3">
          {hasModule('hr') && (
            <div className="flex-1 min-w-[240px]">
              <HrKpiCard
                label="Total Employees"
                subLabel="Staffing"
                value={statsData.employees}
                change="+3"
              />
            </div>
          )}
          {hasModule('finance') && (
            <div className="flex-1 min-w-[240px]">
              <HrKpiCard
                label="Expenses Outflow"
                subLabel="Outflow"
                value={statsData.expenses}
                change="+5%"
              />
            </div>
          )}
          {hasModule('asset') && (
            <div className="flex-1 min-w-[240px]">
              <HrKpiCard
                label="Total Assets"
                subLabel="Inventory"
                value={statsData.assets}
                change="92%"
              />
            </div>
          )}
          {hasModule('hr') && (
            <div className="flex-1 min-w-[240px]">
              <HrKpiCard
                label="Attendance Rate"
                subLabel="Today"
                value={statsData.attendanceRate || '0%'}
                change={statsData.attendanceChange || '0%'}
              />
            </div>
          )}
        </div>

        {/* Row 2: Operations Hub */}
        <div className="grid grid-cols-12 gap-3">
          {/* Left Block: Operations Hub (Split into Header + Two Columns) */}
          {hasModule('hr') ? (
            <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col group divide-y divide-gray-300">
              {/* 1. Header Section: Employee Directory & Status Counts */}
              <div className="p-3 pb-4 pt-5 bg-white shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xl font-bold text-[#004475] uppercase tracking-[0.2em] flex items-center gap-3">
                      <div className="" />
                      Employee Directory
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-5">
                      Real-time workforce status
                    </p>
                  </div>

                  <div className="flex items-center gap-10 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Active :
                      </span>
                      <span className="text-xl font-black text-[#004475]">
                        {String(attendanceStats.present).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Absent :
                      </span>
                      <span className="text-xl font-black text-[#004475]">
                        {String(attendanceStats.leave).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Content Row: Leave & Permission Members Side-by-Side */}
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-300 flex-grow min-h-0 overflow-hidden">
                {/* Column A: Leave Members Section */}
                <div className="flex-1 p-4 flex flex-col min-h-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-md font-bold text-[#004475] uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={18} className="text-[#004475]" />
                      Leave Members
                    </h4>
                  </div>

                  {/* List Container */}
                  <div className="space-y-2 overflow-y-auto pr-2 no-scrollbar flex-1 max-h-[350px]">
                    {leaveMembers.map((member, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50/50 rounded-2xl border border-gray-300 hover:bg-white hover:shadow-md transition-all duration-300 group/item"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#004475] flex items-center justify-center text-white font-bold text-[10px] border border-[#004475]/10 shadow-sm">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-[#004475] leading-none mb-1">
                                {member.name}
                              </p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                {member.type}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {member.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold tracking-widest pl-11">
                          <span className="text-slate-400 uppercase">
                            {member.days}
                          </span>
                          <span className="text-[#004475]/60">
                            {member.from}
                          </span>
                        </div>
                      </div>
                    ))}
                    {leaveMembers.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                        <Calendar size={32} className="opacity-10 mb-2" />
                        <p className="text-[9px] font-bold uppercase tracking-widest">
                          Clean Slate: 0 Absentees
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center-safe">
                    <Link
                      href="/dashboard/hr?tab=leave&subtab=leaveRequests"
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#004475] to-[#2daadf] text-white rounded-xl shadow-lg shadow-[#004475]/10 hover:scale-[1.01] transition-all group/btn font-bold text-[9px] uppercase tracking-widest w-fit"
                    >
                      <span>Manage Leaves</span>
                      <ArrowRight
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>

                {/* Column B: Permission Members Section */}
                <div className="flex-1 p-4 flex flex-col min-h-0 bg-slate-50/30">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-md font-bold text-[#004475] uppercase tracking-widest flex items-center gap-2">
                      <Clock size={18} className="text-[#33a8d9]" />
                      Permission Members
                    </h4>
                    <div className="px-2 py-1 bg-[#33a8d9]/10 text-[#004475] text-[8px] font-black rounded-lg uppercase tracking-widest">
                    
                    </div>
                  </div>

                  {/* List Container */}
                  <div className="space-y-2 overflow-y-auto pr-2 no-scrollbar flex-1 max-h-[350px]">
                    {permissionMembers.map((member, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white/80 rounded-2xl border border-gray-300 hover:bg-white hover:shadow-md transition-all duration-300 group/item"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#33a8d9] flex items-center justify-center text-white font-bold text-[10px] border border-[#33a8d9]/10 shadow-sm">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-[#004475] leading-none mb-1">
                                {member.name}
                              </p>
                              <p className="text-[9px] text-[#33a8d9] font-bold uppercase tracking-wider">
                                {member.hours}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {member.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold tracking-widest pl-11">
                          <span className="text-slate-400">SESSION</span>
                          <span className="text-[#33a8d9]">
                            {member.timeRange}
                          </span>
                        </div>
                      </div>
                    ))}
                    {permissionMembers.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 py-10">
                        <Clock size={32} className="opacity-10 mb-2" />
                        <p className="text-[9px] font-bold uppercase tracking-widest text-center">
                          No Active Permissions
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center-safe">
                    <Link
                      href="/dashboard/hr?tab=leave&subtab=leaveRequests"
                      className="flex items-center justify-center gap-2 px-6 py-2 hover:bg-gradient-to-r from-[#004475] to-[#2daadf] text-gray-700 rounded-xl shadow-lg shadow-[#004475]/10 hover:scale-[1.01] transition-all group/btn font-bold text-[9px] uppercase tracking-widest w-fit"
                    >
                      <span>Manage Permissions</span>
                      <ArrowRight
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Right Column: Quick Actions & Next Holiday (Adaptive Width) */}
          <div
            className={`flex flex-col gap-3 ${hasModule('hr') ? 'col-span-12 lg:col-span-4' : 'col-span-12'}`}
          >
            {/* Quick Actions Grid */}
            <div className="bg-white rounded-[2rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-3 group relative shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-lg font-bold text-[#004475] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" />
                  Quick Actions
                </h4>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {hrQuickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(action.path)}
                    className="flex flex-col items-center justify-center gap-2 p-3 py-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-[#004475] hover:text-white hover:border-[#004475] hover:shadow-lg transition-all group/action cursor-pointer"
                  >
                    <div className="text-[#2daadf] group-hover/action:text-white transition-colors">
                      {action.icon}
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600 group-hover/action:text-white/80 transition-colors leading-tight text-center">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Next Holiday */}
            <div className="bg-gradient-to-br from-[#004475] to-[#2daadf] rounded-[2.5rem] p-6 py-5 text-white shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden group flex-1 flex flex-col">
              {/* <div className="relative z-5 flex flex-col h-full justify-between"> */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    Next Holiday
                  </h4>
                  <div className="px-2 py-1 bg-white/10 text-[9px] font-bold rounded-lg uppercase tracking-widest backdrop-blur-sm">
                    Upcoming
                  </div>
                </div>

                <div className="text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">
                    {holidayStats.nextHoliday?.holidayName ||
                      'No Upcoming Holidays'}
                  </h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {holidayStats.formattedDate}
                  </p>
                  {holidayStats.nextHoliday && (
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">
                      {holidayStats.dayOfWeek} — {holidayStats.daysAway}{' '}
                      {holidayStats.daysAway === 1 ? 'Day' : 'Days'} Away
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                      Holidays Left
                    </span>
                    <span className="text-xs font-black">
                      {String(holidayStats.holidaysLeft).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                      This Quarter
                    </span>
                    <span className="text-xs font-black">
                      {String(holidayStats.thisQuarterHolidays).padStart(
                        2,
                        '0'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <Link
                  href="/dashboard/employee_portal?tab=leave&subtab=holiday"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-white text-[#004475] rounded-[1rem] shadow-lg hover:scale-[1.02] transition-all font-black text-[9px] uppercase tracking-widest"
                >
                  View Holiday Calendar
                </Link>
              </div>
              {/* </div> */}

              {/* Background decoration */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute left-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 3: Expenses, Payroll & Assets - Dynamic Columns */}
        <div className="grid grid-cols-12 gap-3">
          {/* Expenses Chart */}
          {hasModule('finance') && (
            <div
              className={`${hubSpanClass} bg-white border border-gray-300 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden py-5 px-4 group relative bg-gradient-to-b from-white to-slate-50/30`}
            >
              <ExpensesChart statsData={statsData} />
            </div>
          )}

          {/* Payroll */}
          {hasModule('payroll') && (
            <div
              className={`${hubSpanClass} bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-4 group relative`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[18px] font-bold text-[#004475] flex items-center gap-2">
                  <div className="" />
                  Payroll
                </h4>
                <Link
                  href="/dashboard/payroll"
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowRight
                    size={16}
                    className="text-gray-400 group-hover:text-[#004475]"
                  />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group-hover:bg-white transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-emerald-900 leading-none mb-1">
                        Global Payroll
                      </p>
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Standard Configuration
                      </p>
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm">
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-slate-900 leading-none mb-1">
                        Salary Setup
                      </p>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {statsData.employees} Records
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#004475]/5 rounded-2xl border border-[#004475]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#004475] shadow-sm">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#004475] leading-none mb-1 uppercase tracking-widest">
                        Last Run
                      </p>
                      <p className="text-[10px] text-[#2daadf] font-bold">
                        {statsData.payroll}
                      </p>
                    </div>
                  </div>
                  <TrendingUp size={14} className="text-[#2daadf]" />
                </div>

                <Link
                  href="/dashboard/payroll"
                  className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#004475] to-[#005a9c] text-white rounded-[1rem] shadow-lg shadow-[#004475]/20 hover:scale-[1.02] transition-all group/btn font-bold text-[9px] uppercase tracking-widest w-fit mx-auto"
                >
                  <span>Process Payroll</span>
                  <ArrowRight
                    size={12}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Assets & Inventory */}
          {hasModule('asset') && (
            <div
              className={`${hubSpanClass} bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-4 group relative`}
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[18px] font-bold text-[#004475] flex items-center gap-2">
                  <div className="" />
                  Assets & Inventory
                </h4>
                <Link
                  href="/dashboard/asset"
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowRight
                    size={16}
                    className="text-gray-400 group-hover:text-[#004475]"
                  />
                </Link>
              </div>

              <div className="flex flex-col items-center justify-center h-[200px]">
                <div className="relative w-full max-w-[290px] aspect-square shrink-0 mt-2">
                  <svg
                    viewBox="-2 -2 4 4"
                    className="w-full h-full overflow-visible"
                  >
                    {(() => {
                      const slices = statsData.assetDistribution || [];
                      const total =
                        slices.reduce((sum, s) => sum + s.value, 0) || 1;
                      let cumulativePercent = 0;

                      const getCoords = (percent) => {
                        const angle = 2 * Math.PI * percent - Math.PI / 2;
                        return [Math.cos(angle), Math.sin(angle)];
                      };

                      return slices.map((slice, i) => {
                        if (slice.value === 0) return null;
                        const percent = slice.value / total;
                        const [startX, startY] = getCoords(cumulativePercent);
                        cumulativePercent += percent;
                        const [endX, endY] = getCoords(cumulativePercent);
                        const largeArcFlag = percent > 0.5 ? 1 : 0;

                        if (percent === 1) {
                          return (
                            <circle
                              key={i}
                              cx="0"
                              cy="0"
                              r="1"
                              fill={slice.color}
                            />
                          );
                        }

                        const pathData = [
                          `M ${startX} ${startY}`,
                          `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          `L 0 0`,
                        ].join(' ');

                        const midPercent = cumulativePercent - percent / 2;
                        const [midX, midY] = getCoords(midPercent);
                        const isRight = midX >= 0;

                        const startLineX = midX * 0.7;
                        const startLineY = midY * 0.7;
                        const elbowX = midX * 1.1;
                        const elbowY = midY * 1.1;
                        const textEndX = isRight ? 1.6 : -1.6;
                        const textEndY = elbowY;

                        return (
                          <g
                            key={i}
                            style={{
                              '--hover-tx': `${midX * 0.15}px`,
                              '--hover-ty': `${midY * 0.15}px`,
                            }}
                            className="transition-transform duration-300 origin-center cursor-pointer group/slice hover:[transform:translate(var(--hover-tx),var(--hover-ty))]"
                          >
                            <path
                              d={pathData}
                              fill={slice.color}
                              stroke="white"
                              strokeWidth="0.02"
                              strokeLinejoin="round"
                            />
                            {percent > 0.05 && (
                              <>
                                <polyline
                                  points={`${startLineX},${startLineY} ${elbowX},${elbowY} ${textEndX},${textEndY}`}
                                  fill="none"
                                  stroke={slice.color}
                                  strokeWidth="0.03"
                                  className="opacity-80 group-hover/slice:opacity-100 transition-opacity"
                                />
                                <text
                                  x={textEndX + (isRight ? -0.05 : 0.05)}
                                  y={textEndY - 0.05}
                                  className="font-bold pointer-events-none"
                                  textAnchor={isRight ? 'end' : 'start'}
                                >
                                  <tspan
                                    x={textEndX + (isRight ? -0.05 : 0.05)}
                                    fontSize="0.25px"
                                    fill="#1e293b"
                                  >
                                    {Math.round(percent * 100)}%
                                  </tspan>
                                  <tspan
                                    x={textEndX + (isRight ? -0.05 : 0.05)}
                                    dy="0.3"
                                    fontSize="0.14px"
                                    fill="#64748b"
                                  >
                                    {slice.label}
                                  </tspan>
                                </text>
                              </>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
