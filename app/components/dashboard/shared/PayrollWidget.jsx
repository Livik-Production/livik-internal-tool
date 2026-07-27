'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, CheckCircle, LayoutDashboard, DollarSign, TrendingUp } from 'lucide-react';

/**
 * PayrollWidget - Displays status and quick links for payroll management.
 * Extracted from AdminDashboard/HrDashboard for shared use.
 */
export default function PayrollWidget({ statsData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[18px] font-bold text-[#004475] flex items-center gap-2">
          Payroll Hub
        </h4>
        <Link
          href="/dashboard/payroll"
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowRight
            size={16}
            className="text-gray-400 hover:text-[#004475]"
          />
        </Link>
      </div>

      <div className="space-y-3 flex-grow">
        <Link href="/dashboard/payroll?tab=previous" className="block">
          <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:bg-white hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                <Layers size={18} />
              </div>
              <div>
                <p className="text-md font-bold text-emerald-900 leading-none mb-1">
                  Global Payroll
                </p>
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                  Standard Config
                </p>
              </div>
            </div>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
        </Link>

        <Link href="/dashboard/payroll?tab=setup" className="block">
          <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <p className="text-md font-bold text-gray-700 leading-none mb-1">
                  Salary Setup
                </p>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  {statsData.employees || '0'} Records
                </p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
        </Link>

        <div className="flex items-center justify-between p-4 bg-[#004475]/5 rounded-2xl border border-[#004475]/10 group/run">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#004475] shadow-sm border border-[#004475]/10">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-[#004475] leading-none mb-1 uppercase tracking-widest">
                Last Run
              </p>
              <p className="text-[10px] text-[#2daadf] font-bold truncate max-w-[120px]">
                {statsData.lastRun || statsData.payroll || '₹0'}
              </p>
            </div>
          </div>
          <TrendingUp size={14} className="text-[#2daadf] transition-transform group-hover/run:-translate-y-1" />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/dashboard/payroll"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#004475] to-[#005a9c] text-white rounded-xl shadow-lg shadow-[#004475]/20 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn font-bold text-[10px] uppercase tracking-widest"
        >
          <span>Process Payroll</span>
          <ArrowRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}
