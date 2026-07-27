'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * PendingEmployeesWidget - Lists staff members awaiting HR action.
 * Extracted from AdminDashboard for shared use.
 */
export default function PendingEmployeesWidget({ pendingEmployeesData = [] }) {
  const router = useRouter();

  // Limit to prevent overflow
  const pendingStaff = pendingEmployeesData.slice(0, 5).map((emp) => {
    return {
      name:
        emp.name ||
        `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
        'Unknown',
      role: emp.designation || 'Employee',
      status: emp.status || 'Pending',
      originalData: emp,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-bold text-[#004475] uppercase tracking-[0.2em] flex items-center gap-2">
          Approvals
        </h4>
        <div
          onClick={() => router.push('/dashboard/hr?tab=pendingEmployees')}
          className="px-3 py-1 text-[#004475] text-[10px] font-bold rounded-lg underline cursor-pointer hover:bg-slate-50 transition-all uppercase tracking-widest"
        >
          View All
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
        {pendingStaff.length > 0 ? (
          pendingStaff.map((staff, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#2daadf]/50 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm border border-slate-100 bg-[#004475] transition-all group-hover:scale-110">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#004475] leading-none mb-1">
                    {staff.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {staff.role}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-[9px] text-white font-black uppercase tracking-wider ${
                  staff.status.toUpperCase() === 'REVIEW'
                    ? 'bg-amber-500 shadow-amber-100/50 shadow-lg'
                    : 'bg-[#2daadf] shadow-blue-100/50 shadow-lg'
                }`}
              >
                {staff.status}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 opacity-50">
            <p className="text-[11px] font-bold uppercase tracking-widest mt-2">
              No pending approvals
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
