'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  Package,
  Shield,
  TrendingUp,
  ArrowRight,
  FileText,
  CreditCard,
  Briefcase,
  CheckCircle,
  Activity,
  Layers,
  LayoutDashboard,
  Rocket,
  UserCircle2Icon,
  ChartNoAxesCombined,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const ExpensesChart = dynamic(() => import('./ExpensesChartClient'), {
  ssr: false,
});

/* ================= HELPER COMPONENTS ================= */

function AdminKpiCard({ label, value, subLabel, change }) {
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
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50 transition-all duration-300 group-hover:bg-[#2daadf] group-hover:text-white group-hover:shadow-md">
          <TrendingUp size={14} strokeWidth={2.5} className="text-[#2daadf] group-hover:text-white transition-colors" />
          <span className="text-[12px] font-bold text-slate-800 group-hover:text-white">{change}</span>
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-white/80">
            vs last period
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================= SHARED COMPONENTS ================= */

function StatusBadge({ label, count, color }) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border ${variants[color]} transition-all hover:scale-[1.02]`}
    >
      <span className="text-xs font-bold text-[#004475] tracking-tight uppercase opacity-80">
        {label}
      </span>
      <span className="text-lg font-semibold text-[#004475] tracking-tighter">
        {count}
      </span>
    </div>
  );
}

/* ================= NEW ANALYTIC COMPONENTS ================= */

function HrModuleDetails({ statsData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-lg font-bold text-[#004475] uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full  " />
          HR Module Details
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-4 flex-grow text-[#004475]">
        <StatusBadge
          label="Total Head Count"
          count={statsData.employees}
          color="blue"
        />
        <StatusBadge
          label="Today's Absent"
          count={statsData.todaysAbsent || '00'}
          color={
            statsData.todaysAbsent && statsData.todaysAbsent !== '00'
              ? 'blue'
              : 'blue'
          }
        />
        <StatusBadge
          label="Pending Leave"
          count={statsData.pendingLeaves || '00'}
          color={
            statsData.pendingLeaves && statsData.pendingLeaves !== '00'
              ? 'blue'
              : 'blue'
          }
        />

        <StatusBadge
          label="Departments"
          count={statsData.departments || '00'}
          color="blue"
        />
      </div>
      <div className="mt-6 flex justify-end">
        <Link
          href="/dashboard/hr"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#004475] to-[#005a9c] text-white rounded-xl shadow-sm shadow-[#004475]/20  transition-all group/btn font-bold text-[10px] uppercase tracking-widest w-fit"
        >
          <span>Handle Activities </span>
          <ArrowRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}

import { useRouter } from 'next/navigation';

function PendingEmployeesList({ pendingEmployeesData = [] }) {
  const router = useRouter();

  // Slice to max 6 to prevent overwhelming the layout
  const pendingStaff = pendingEmployeesData.slice(0, 6).map((emp) => {
    return {
      name:
        emp.name ||
        `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
        'Unknown',
      role: emp.designation || 'Employee',
      status: emp.status || 'Pending',
      date: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
      originalData: emp,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-bold text-[#004475] uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" />
          Pending Employee List
        </h4>
        <div
          onClick={() => router.push('/dashboard/hr?tab=pendingEmployees')}
          className="px-2 py-1 text-[#004475] text-[11px] font-semibold rounded-lg underline cursor-pointer hover:bg-slate-50 transition-all"
        >
          View List
        </div>
      </div>
      <div className="space-y-3.5 flex-grow overflow-y-auto max-h-[220px] pr-2 no-scrollbar">
        {pendingStaff.length > 0 ? (
          pendingStaff.map((staff, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-300 hover:border-[#2daadf]/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm border border-slate-100 bg-[#004475] transition-all">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[#004475] leading-none mb-1">
                    {staff.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-700 font-medium uppercase ">
                    <span>{staff.role}</span>
                  </div>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-md text-[9px] text-white font-medium uppercase ${staff.status.toUpperCase() === 'REVIEW'
                  ? 'bg-amber-500 border-amber-600'
                  : 'bg-[#2daadf] border-[#2daadf]'
                  }`}
              >
                {staff.status}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-20 text-[11px] text-slate-400 font-medium h-full">
            No pending approvals
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceHub({ statsData, invoiceData = [], paymentData = [] }) {
  const completedPayments = paymentData;
  const pendingInvoices = invoiceData.filter(
    (inv) =>
      (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial') &&
      inv.invoiceType !== 'proforma'
  );

  const completedTotal = completedPayments.reduce(
    (sum, pay) => sum + (Number(pay.amount) || Number(pay.receivedAmount) || 0),
    0
  );
  const pendingTotal = pendingInvoices.reduce(
    (sum, inv) =>
      sum +
      (Number(inv.remainingAmount) ||
        Number(inv.total) ||
        Number(inv.totalAmount) ||
        0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Half: Approved / Completed */}
      <div className="flex-1 pb-4 flex flex-col">
        <span className="text-xl font-bold text-[#2daadf] mb-1">Payments</span>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[15px] font-bold text-[#004475]">
            Completed Payments
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-md font-bold text-[#004475]">
              ₹{completedTotal.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              {completedPayments.length} PAID
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar flex-grow">
          {completedPayments.length > 0 ? (
            completedPayments.slice(0, 5).map((pay, i) => (
              <div
                key={pay.id || i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-300 hover:border-emerald-00 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 w-[40%]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-[10px] font-black border border-emerald-100">
                    {(pay.client || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-gray-800 leading-none mb-1 truncate">
                      {pay.client || 'Unknown Client'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">
                      {pay.invoiceNumber || `INV-${i + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Paid On
                  </span>
                  <span className="text-[10px] font-black text-[#004475] tracking-tight">
                    {pay.paymentDate
                      ? new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })
                      : 'N/A'}
                  </span>
                </div>

                <div className="text-right w-[30%]">
                  <p className="text-[12px] font-bold text-[#004475]">
                    ₹
                    {(
                      Number(pay.amount) ||
                      Number(pay.receivedAmount) ||
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold text-emerald-500 uppercase">
                    Paid
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-[11px] text-slate-400 font-medium font-bold uppercase tracking-widest">
              No completed payments yet
            </div>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent my-1" />

      {/* Bottom Half: Pending */}
      <div className="flex-1 pt-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-[#004475]">Pending Payments</h4>
          <div className="flex items-center gap-2">
            <span className="text-md font-bold text-amber-600">
              ₹{pendingTotal.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              {pendingInvoices.length} DUE
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar flex-grow">
          {pendingInvoices.length > 0 ? (
            pendingInvoices.slice(0, 5).map((inv, i) => (
              <div
                key={inv.id || i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-300 hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 w-[40%]">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-[10px] font-black border border-amber-100">
                    {(inv.client || inv.customer?.name || '?').charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-gray-800 leading-none mb-1 truncate">
                      {inv.client || inv.customer?.name || 'Unknown Client'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">
                      {inv.invoiceNumber || `INV-${i + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Due Date
                  </span>
                  <span className="text-[10px] font-black text-amber-600 tracking-tight">
                    {inv.invoiceDate || inv.createdAt
                      ? new Date(
                        inv.invoiceDate || inv.createdAt
                      ).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })
                      : 'N/A'}
                  </span>
                </div>

                <div className="text-right w-[30%]">
                  <p className="text-[12px] font-bold text-amber-600">
                    ₹
                    {(
                      Number(inv.remainingAmount) ||
                      Number(inv.total) ||
                      Number(inv.totalAmount) ||
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold text-amber-400 uppercase">
                    {inv.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-[11px] text-slate-400 font-medium font-bold uppercase tracking-widest">
              No pending payments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function AdminDashboard({
  statsData,
  roleName,
  visibleQuickActions,
  invoiceData,
  paymentData = [],
  pendingEmployeesData = [],
}) {
  return (
    <div className="bg-[#f8fafc] h-full">
      {/* <div className="text-[#004475] font-bold text-3xl mt-1 mb-2 pl-6">
        Control Center
      </div> */}
      <div className="animate-dashboard-reveal-delayed space-y-3">
        {/* 1. System Pulse (KPI Strip) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ">
          <AdminKpiCard
            label="Total Strength"
            subLabel="Staffing"
            value={statsData.employees}
            change={statsData.employeeChange || '0'}
          />
          <AdminKpiCard
            label="Estimated Payroll"
            subLabel="Finance"
            value={
              String(statsData.payroll).includes('₹')
                ? statsData.payroll
                : `₹${statsData.payroll}`
            }
            change={statsData.payrollChange || '0%'}
          />
          <AdminKpiCard
            label="Total Assets"
            subLabel="Inventory"
            value={statsData.assets}
            change={statsData.assetChange || '0%'}
          />
          <AdminKpiCard
            label="Invoice Billing"
            subLabel="Revenue"
            value={
              String(statsData.invoices).includes('₹')
                ? statsData.invoices
                : `₹${statsData.invoices}`
            }
            change={statsData.invoiceChange || '0%'}
          />
        </div>

        {/* Row 2: Operation & Control Section */}
        <div className="grid grid-cols-12 gap-4">
          {/* Wide Section: HR + Pending (9/12 cols) */}
          <div className="col-span-12 lg:col-span-9 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row group divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="flex-1 p-5 ">
              <HrModuleDetails statsData={statsData} />
            </div>
            <div className="flex-1 p-5 bg-slate-50/10">
              <PendingEmployeesList
                pendingEmployeesData={pendingEmployeesData}
              />
            </div>
          </div>

          {/* Narrow Section: System Control (3/12 cols) */}
          <div className="col-span-12 lg:col-span-3 bg-gradient-to-br from-[#004475] to-[#2daadf] rounded-[2.5rem] p-5 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                  <Shield size={24} className="text-blue-100" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase tracking-wider leading-none pt-1">
                    Admin Control
                  </h3>
                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                    Role-based Access & Customer Logs
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <Link
                  href="/dashboard/admin?tab=customers"
                  className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Customers Database
                  </span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/dashboard/admin?tab=roles"
                  className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Roles & Rights
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 text-white/5 rotate-12 pointer-events-none">
              <Rocket size={180} />
            </div>
          </div>
        </div>

        {/* Row 3: Financial Analysis Section */}
        <div className="grid grid-cols-12 gap-4">
          {/* Expenses Chart (6/12 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden py-5 px-4 group relative bg-gradient-to-b from-white to-slate-50/30">
            <ExpensesChart statsData={statsData} />
          </div>

          {/* Invoices Hub (6/12 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-5 group relative bg-gradient-to-br from-white to-slate-50/50">
            <InvoiceHub
              statsData={statsData}
              invoiceData={invoiceData}
              paymentData={paymentData}
            />
            {/* Decor */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#2daadf]/5 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
          </div>
        </div>

        {/* Row 4: Assets, Payroll & Portal */}
        <div className="grid grid-cols-12 gap-4">
          {/* Assets & Inventory */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-6 group relative">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-[#004475] flex items-center gap-2">
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

            <div className="flex flex-col items-center justify-center h-[220px]">
              <div className="relative w-full max-w-[300px] aspect-square shrink-0 mt-2">
                <svg
                  viewBox="-2 -2 4 4"
                  className="w-full h-full overflow-visible"
                >
                  {(() => {
                    const slices = statsData.assetDistribution || [];
                    const total =
                      slices.reduce((sum, s) => sum + s.value, 0) || 1;
                    let cumulativePercent = 0;

                    // Angle starts at top (-Math.PI/2)
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

                      // Callout calculation
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
                            strokeWidth="0.02" // Thinner borders between slices
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

          {/* Payroll Hub */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 group relative">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-[#004475] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" />
                Payroll Hub
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
              <Link href="/dashboard/payroll?tab=previous" className="block">
                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group-hover:bg-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-emerald-900 leading-none mb-1">
                        Global Payroll
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Standard Configuration
                      </p>
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
              </Link>
              <Link href="/dashboard/payroll?tab=setup" className="block">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm">
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-gray-700 leading-none mb-1">
                        Salary Setup
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {statsData.employees} Records
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-[#004475]" />
                </div>
              </Link>
              <div className="flex items-center justify-between p-4 bg-[#004475]/5 rounded-2xl border border-[#004475]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#004475] shadow-sm">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-md font-bold text-[#004475] leading-none mb-1">
                      Last Run
                    </p>
                    <p className="text-[10px] text-[#2daadf] font-bold flex items-center gap-2">
                      {statsData.lastRun || statsData.payroll}
                      {statsData.lastRunPeriod && (
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                          ({statsData.lastRunPeriod})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <TrendingUp size={14} className="text-[#2daadf]" />
              </div>
            </div>
          </div>

          {/* Portal Pulse */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] border border-gray-300 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 group relative">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-[#004475] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" />
                Portal Pulse
              </h4>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase">
                  Live
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/dashboard/asset" className="block">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#2daadf]">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-gray-700 leading-none mb-1">
                        Unassigned Asset
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        {statsData.unassignedAssets || '0'} Items Available
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              </Link>

              <Link
                href="/dashboard/hr?tab=leave&subtab=leaveRequests"
                className="block"
              >
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-purple-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-gray-700 leading-none mb-1">
                        Leave Pendings
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        {statsData.pendingLeaves || '00'} Active Requests
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              </Link>

              <Link href="/dashboard/hr?tab=pendingEmployees" className="block">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500">
                      <UserCircle2Icon size={18} />
                    </div>
                    <div>
                      <p className="text-md font-bold text-gray-700 leading-none mb-1">
                        New Onboarding
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        {pendingEmployeesData.length || '0'} In Progress
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings({ size, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
