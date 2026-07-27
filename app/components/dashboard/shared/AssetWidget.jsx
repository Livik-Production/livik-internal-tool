'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * AssetWidget - Displays an SVG-based distribution chart for assets.
 * Extracted from AdminDashboard for shared use.
 */
export default function AssetWidget({ statsData }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-[#004475] flex items-center gap-2">
          Asset Distribution
        </h4>
        <Link
          href="/dashboard/asset"
          className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowRight
            size={16}
            className="text-gray-400 hover:text-[#004475]"
          />
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow min-h-[440px]">
        <div className="relative w-full max-w-[560px] aspect-square shrink-0">
          <svg viewBox="-2 -2 4 4" className="w-full h-full overflow-visible font-sans">
            {(() => {
              const slices = statsData.assetDistribution || [];
              const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
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
                    <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />
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
  );
}
