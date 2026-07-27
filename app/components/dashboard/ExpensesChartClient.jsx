'use client';

import React from 'react';


export default function ExpensesChartClient({ statsData }) {
  const trend =
    statsData.expenseTrend && statsData.expenseTrend.length === 6
      ? statsData.expenseTrend
      : [
        { name: 'Jan', amount: 0 },
        { name: 'Feb', amount: 0 },
        { name: 'Mar', amount: 0 },
        { name: 'Apr', amount: 0 },
        { name: 'May', amount: 0 },
        { name: 'Jun', amount: 0 },
      ];

  const maxAmount = Math.max(...trend.map((t) => t.amount), 1);
  const xCoords = [25, 115, 205, 295, 385, 475];

  const points = trend.map((t, i) => {
    const ratio = t.amount / (maxAmount * 1.1); // Add 10% headroom
    const y = 180 - ratio * 160;
    return {
      x: xCoords[i],
      y,
      label: t.name,
      amount: t.amount,
    };
  });

  const pathD = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  const fillD = `${pathD} L ${points[5].x} 200 L ${points[0].x} 200 Z`;

  return (
    <div className="h-full flex flex-col pt-">
      <div className="flex items-center justify-between mb-6 ">
        <div>
          <span className="text-xl font-bold text-[#2daadf]">
            Monthly Trend
          </span>
          <h3 className="text-[15px] font-bold text-[#004475]">
            Expenses Analysis
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-[#004475]">
            {statsData.expenses}
          </p>
          <p
            className={`text-[9px] font-bold uppercase tracking-widest ${String(statsData.expenseChange || '+0%').startsWith('-')
              ? 'text-rose-600'
              : 'text-emerald-600'
              }`}
          >
            {statsData.expenseChange || '+12.5%'} vs Last Mo.
          </p>
        </div>
      </div>
      <div className="flex-grow min-h-[220px] relative w-full h-full pb-5 bg-transparent">
        {/* Custom SVG Line Chart */}
        <svg
          viewBox="0 0 500 200"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              y1={i * 66.66}
              x2="500"
              y2={i * 66.66}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
          ))}

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#2daadf"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Background fill */}
          <path d={fillD} fill="url(#gradientGradient)" opacity="0.5" />

          {/* Dots */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#2daadf"
                className="hover:r-6 hover:fill-[#004475] hover:stroke-white hover:stroke-2 transition-all cursor-pointer group/dot"
              />
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#004475"
                className="pointer-events-none"
              >
                ₹{pt.amount.toLocaleString('en-IN')}
              </text>
              <text
                x={pt.x}
                y="205"
                textAnchor="middle"
                fontSize="9"
                fontWeight="semibold"
                fill="#94a3b8"
              >
                {pt.label}
              </text>
            </g>
          ))}

          <defs>
            <linearGradient id="gradientGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2daadf" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2daadf" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
