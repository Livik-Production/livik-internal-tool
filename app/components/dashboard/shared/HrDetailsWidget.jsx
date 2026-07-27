'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
      className={`flex items-center justify-between p-3.5 rounded-2xl border ${variants[color] || variants.blue} transition-all hover:scale-[1.02] bg-white shadow-sm border-gray-100`}
    >
      <span className="text-[10px] font-bold text-[#004475] tracking-tight uppercase opacity-80">
        {label}
      </span>
      <span className="text-lg font-black text-[#004475] tracking-tighter">
        {count}
      </span>
    </div>
  );
}

/**
 * HrDetailsWidget - Displays key HR metrics in a focused grid.
 * Extracted from AdminDashboard for shared use.
 */
export default function HrDetailsWidget({ statsData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h4 className="text-xl font-bold text-[#004475] uppercase tracking-[0.2em] flex items-center gap-2">
          HR Operations
        </h4>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
          Workforce Status Overview
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 flex-grow mt-2">
        <StatusBadge
          label="Head Count"
          count={statsData.employees || '0'}
          color="blue"
        />
        <StatusBadge
          label="Today's Absent"
          count={statsData.todaysAbsent || '00'}
          color="blue"
        />
        <StatusBadge
          label="Pending Leave"
          count={statsData.pendingLeaves || '00'}
          color="blue"
        />
        <StatusBadge
          label="Departments"
          count={statsData.departments || '00'}
          color="blue"
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/dashboard/hr"
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#004475] to-[#005a9c] text-white rounded-xl shadow-lg shadow-[#004475]/10 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn font-bold text-[10px] uppercase tracking-widest w-fit"
        >
          <span>Manage Workforce</span>
          <ArrowRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}
