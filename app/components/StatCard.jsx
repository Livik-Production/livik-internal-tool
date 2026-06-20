'use client';

import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
  <div onClick={onClick} className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
      <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
        {title}
      </span>
      <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
        {value}
      </h3>
      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />}
        <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
          {trend || 'View Details'}
        </span>
      </div>
    </div>
  </div>
);

export default StatCard;
