'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Bell, Clock, Calendar, Package, Download, ChevronRight } from 'lucide-react';
import SummaryCard from './SummaryCard';

const AttendanceBarChart = dynamic(() => import('../AttendanceBarChart'), { ssr: false });

function RecentRequestItem({ icon, title, date, status }) {
  const getStatusColor = (s) => {
    switch (s?.toUpperCase()) {
      case 'APPROVED': return 'text-emerald-500 bg-emerald-50';
      case 'PENDING': return 'text-amber-500 bg-amber-50';
      case 'REJECTED': return 'text-rose-500 bg-rose-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5">{title}</p>
          <p className="text-[10px] text-slate-400 font-medium">{date}</p>
        </div>
      </div>
      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(status)}`}>
        {status}
      </div>
    </div>
  );
}

export default function EmployeeSummarySection({ employeeStats }) {
  if (!employeeStats) return null;

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-4 px-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <h3 className="text-[11px] font-black text-[#004475] uppercase tracking-[0.4em] opacity-40">
           Personal Insights
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Last Payslip" 
          subLabel="Finance" 
          value={employeeStats.lastPayslip ? `₹${(Number(employeeStats.lastPayslip.basicPay) + Number(employeeStats.lastPayslip.hra)).toLocaleString()}` : '₹0'} 
          change="Available" 
          color="#004475"
        />
        <SummaryCard 
          label="Assigned Assets" 
          subLabel="Inventory" 
          value={employeeStats.assignedAssets || '0'} 
          change="Updated" 
          color="#8B5CF6"
        />
        <SummaryCard 
          label="Leave Balance" 
          subLabel="HR" 
          value={employeeStats.remainingLeaves || '0'} 
          change={`${employeeStats.totalLeaves || '0'} Total`} 
          color="#2daadf"
        />
        <SummaryCard 
          label="Attendance Rate" 
          subLabel="Daily Activity" 
          value={employeeStats.attendanceRate || '0%'} 
          change={employeeStats.attendanceChange} 
          color="#10B981"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
           <AttendanceBarChart />
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           {/* Announcements */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm flex flex-col h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-bold text-[#004475] uppercase tracking-wider">Announcements</h4>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Bell size={16} />
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pr-1">
                {employeeStats.announcements?.length > 0 ? (
                  employeeStats.announcements.map((item, idx) => (
                    <div key={idx} className="relative pl-6 group cursor-pointer border-l-2 border-slate-100 hover:border-blue-400 transition-all py-1">
                      <p className="text-[12px] font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{item.date}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 opacity-50">
                    <Bell size={32} strokeWidth={1} />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Quiet for now</p>
                  </div>
                )}
              </div>
           </div>

           {/* Recent Activity */}
           <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm flex flex-col h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-bold text-[#004475] uppercase tracking-wider">Recent Activity</h4>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                  <Clock size={16} />
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto no-scrollbar flex-1 pr-1">
                {employeeStats.recentActivities?.length > 0 ? (
                  employeeStats.recentActivities.map((activity, idx) => (
                    <RecentRequestItem
                      key={idx}
                      icon={activity.type === 'Leave' ? <Calendar size={18} /> : <Package size={18} />}
                      title={activity.title}
                      date={activity.date}
                      status={activity.status}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 opacity-50">
                    <Clock size={32} strokeWidth={1} />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No recent history</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
