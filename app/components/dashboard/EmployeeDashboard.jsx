'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Package,
  CheckCircle,
  Sparkles,
  Users,
  FileText,
  Shield,
  DollarSign,
  Download,
  Bell,
  ArrowUpRight,
  Lightbulb,
  Building2,
  MoreHorizontal,
  TrendingUp,
  Plane,
  Stethoscope,
  Briefcase,
  FileCheck,
  FileBadge,
  Award,
  ChevronRight,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
const AttendanceBarChart = dynamic(() => import('./AttendanceBarChart'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm min-h-[300px] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

/* ================= PRECISE UI COMPONENTS ================= */

function StatCard({ label, value, subLabel, change, children }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] p-4 mt-3 bg-white border border-gray-300 shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group border-t-3 border-t-[#2daadf] hover:border-t-4 cursor-pointer">
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
        {/* {change && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50 transition-all duration-300 group-hover:bg-[#2daadf] group-hover:text-white group-hover:shadow-md">
            <TrendingUp size={14} strokeWidth={2.5} className="text-[#2daadf] group-hover:text-white transition-colors" />
            <span className="text-[12px] font-bold text-slate-800 group-hover:text-white">{change}</span>
            <span className="text-[11px] font-medium text-slate-500 group-hover:text-white/80">
              vs last period
            </span>
          </div>
        )} */}
        {/* {children && <div className="mt-2 w-full">{children}</div>} */}
      </div>
    </div>
  );
}

function SectionHeader({ title, actionText, onAction }) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      {actionText && (
        <button className="text-[12px] text-blue-600 font-bold hover:underline">
          {actionText}
        </button>
      )}
    </div>
  );
}

function LeaveBalanceCircle({ value, label, colorClass, borderClass }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-16 h-16 rounded-full border-2 ${borderClass} flex items-center justify-center`}
      >
        <span className={`text-xl font-bold ${colorClass}`}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
}

function RecentRequestItem({ icon, title, date, status }) {
  const statusStyles = {
    Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Pending: 'bg-slate-50 text-slate-500 border-slate-100',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2daadf] shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-none mb-1">
            {title}
          </p>
          <p className="text-[10px] text-gray-400 font-medium">{date}</p>
        </div>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyles[status] || statusStyles.Pending}`}
      >
        {status}
      </span>
    </div>
  );
}

function DocumentItem({ icon, title, type, size, date, iconBg }) {
  return (
    <div className="flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center text-white shadow-sm`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-800 leading-none mb-1 group-hover:text-[#004475]">
            {title}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {type} • {size} • {date}
          </p>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-[#004475] transition-colors"
      />
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function EmployeeDashboard({
  employeeStats,
  visibleQuickActions,
}) {
  const router = useRouter();

  return (
    <div className="bg-[#f8fafc] h-full font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4 animate-dashboard-reveal-delayed">
        <div className="text-3xl font-bold pl-6 mt-1.5 text-[#004475]">
          <p>Your Workspace </p>
        </div>

        {/* ROW 1: SUMMARY CARDS (Move to First) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Remaining Leaves"
            subLabel="Leaves"
            value={employeeStats.remainingLeaves || '0'}
            change={`${employeeStats.totalLeaves || '0'} days total`}
          />
          <StatCard
            label="Pending Requests"
            subLabel="Approvals"
            value={String(employeeStats.pendingRequests || 0).padStart(1, '0')}
            change="Active"
          />
          <StatCard
            label="Assigned Assets"
            subLabel="Inventory"
            value={String(employeeStats.assignedAssets || 0).padStart(1, '0')}
            change="Units"
          />
          <StatCard
            label="Attendance Rate"
            subLabel="Daily Activity"
            value={employeeStats.attendanceRate || '0%'}
            change={employeeStats.attendanceChange}
          >
            <div className="flex justify-center mt-2">
              <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer shadow-inner">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </StatCard>
        </div>

        {/* ROW 2: ATTENDANCE & ANNOUNCEMENTS (Move to Second) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* LEFT: Attendance */}
          <div className="lg:col-span-8">
            <AttendanceBarChart />
          </div>

          {/* RIGHT: Announcements */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#004475] to-[#2daadf] rounded-[2.5rem] p-4 text-white shadow-lg hover:shadow-2xl relative overflow-hidden group min-h-[340px] flex flex-col">
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Megaphone size={24} className="text-blue-100" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase tracking-wider leading-none pt-1">
                    Announcements
                  </h3>
                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                    Stay updated with company news
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1">
                {employeeStats.announcements?.length > 0 ? (
                  employeeStats.announcements.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10 group/item cursor-pointer"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black tracking-widest text-white/50 uppercase">
                            {item.time}
                          </span>
                          {item.active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1 group-hover/item:text-blue-200 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-white/70 leading-relaxed line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-white/40 group-hover/item:text-white transition-colors group-hover/item:translate-x-1 transition-transform" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full text-white/40 space-y-3">
                    <Bell size={32} className="opacity-20" />
                    <p className="text-sm font-medium uppercase tracking-widest">No new announcements</p>
                  </div>
                )}
              </div>

              {employeeStats.announcements?.length > 0 && (
                <button className="mt-4 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-2 mx-auto">
                  View All Announcements
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>

            {/* Decorative Background Icon */}
            <div className="absolute -right-10 -top-10 text-white/5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Megaphone size={180} />
            </div>
          </div>
        </div>

        {/* ROW 3: Lower Dashboard (3 columns) (At last) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pb-10">
          {/* COL 1: Payslip */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-gray-300 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all min-h-[300px]">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-gray-800">
                  Last Payslip
                </h3>
                <span className="text-[10px] font-bold text-[#33a8d9] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                  September 2023
                </span>
              </div>
              <div className="space-y-2 mt-10 text-center">
                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                  Net Pay
                </div>
                <div className="text-3xl font-bold text-[#004475] tracking-tighter">
                  {employeeStats.lastPayslip
                    ? '₹' +
                    (
                      Number(employeeStats.lastPayslip.basicPay) +
                      Number(employeeStats.lastPayslip.hra) +
                      Number(employeeStats.lastPayslip.otherAllowances)
                    ).toLocaleString()
                    : '0.00'}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 mt-3 bg-emerald-50 w-fit mx-auto px-3 py-1 rounded-full">
                  <ArrowUpRight size={14} />
                  +4% from last month
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-4 bg-[#004475] text-white rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Download size={16} />
              Download PDF
            </button>
          </div>

          {/* COL 2: Leave Balance */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-gray-300 shadow-sm flex flex-col hover:shadow-lg transition-all min-h-[300px]">
            <SectionHeader title="Leave Balance" />

            <div className="flex items-center justify-around mb-8 px-2 mt-6">
              <LeaveBalanceCircle
                value={employeeStats.sickBalance || 0}
                label="SICK"
                colorClass="text-[#004475]"
                borderClass="border-[#004475]/10 bg-blue-50/20"
              />
              <LeaveBalanceCircle
                value={employeeStats.casualBalance || 0}
                label="CASUAL"
                colorClass="text-emerald-700"
                borderClass="border-emerald-100 bg-emerald-50/20"
              />
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex justify-start pl-2">
              <button
                onClick={() => router.push('/dashboard/employee_portal?tab=leave&subtab=pending&action=request-leave')}
                className="px-10 py-3 bg-[#f0f7ff] text-[#004475] rounded-xl font-bold text-[13px] border border-blue-100 shadow-sm hover:bg-blue-100 transition-all"
              >
                Request off
              </button>
            </div>
          </div>

          {/* COL 3: Recent Activities */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-gray-300 shadow-sm flex flex-col hover:shadow-lg transition-all min-h-[300px]">
            <SectionHeader title="Recent Activities" actionText="View All" />

            <div className="space-y-4 flex-1 mt-4 overflow-y-auto pr-1">
              {employeeStats.recentActivities?.length > 0 ? (
                employeeStats.recentActivities.map((activity, idx) => (
                  <RecentRequestItem
                    key={activity.id}
                    icon={activity.type === 'Leave' ? <Calendar size={18} /> : <Package size={18} />}
                    title={activity.title}
                    date={activity.date}
                    status={activity.status}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 pb-6">
                  <Clock size={32} className="text-slate-200" />
                  <p className="text-[13px] font-medium text-center px-4">No recent activities on your account.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
