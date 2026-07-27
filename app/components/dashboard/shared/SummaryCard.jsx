'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * SummaryCard - A premium KPI card with professional hover effects.
 * Used for top-level metrics like Employee Count, Payroll Total, etc.
 */
export default function SummaryCard({ label, value, subLabel, change, icon: Icon, color = '#2daadf' }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] p-5 bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group border-t-3 hover:border-t-4 min-h-[160px] flex flex-col justify-center cursor-pointer" 
         style={{ borderTopColor: color }}>
      
      {/* Premium Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      
      <div className="flex flex-col items-center justify-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
        <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#004475] mb-2 leading-none opacity-80 group-hover:opacity-100 transition-opacity">
          {subLabel}
        </span>
        <span className="text-[12px] font-regular text-gray-500 mb-5 leading-none">
          {label}
        </span>
        
        <div className="flex items-center gap-2 mb-5">
           {Icon && <Icon size={20} className="text-gray-400 group-hover:text-[#004475] transition-colors" />}
           <h3 className="text-[25px] font-bold text-[#004475] tracking-tight leading-none transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-sm">
             {value}
           </h3>
        </div>

        {change && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50 transition-all duration-300 group-hover:bg-[#2daadf] group-hover:text-white group-hover:shadow-md">
            <TrendingUp
              size={14}
              strokeWidth={2.5}
              className="text-[#2daadf] group-hover:text-white transition-colors"
            />
            <span className="text-[12px] font-bold text-slate-700 group-hover:text-white">
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
