'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';
import { ResponsiveBar } from '@nivo/bar';

const STATUS_LABEL = { P: 'Present', A: 'Absent', HD: 'Half Day', L: 'On Leave', CH: 'Holiday', W: 'Weekend' };
const STATUS_TO_HOURS = { P: 9, HD: 4.5, A: 0, L: 0, CH: 0, W: 0 };

function getBarColor(code) {
  if (code === 'P') return '#004475';
  if (code === 'HD') return '#2daadf';
  if (code === 'L') return '#f59e0b'; // Amber for leave
  if (code === 'CH') return '#10b981';
  return '#e2e8f0';
}

function AttendanceStatBox({ label, value, color = 'blue' }) {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl border ${variants[color] || variants.blue} transition-all hover:scale-[1.02]`}
    >
      <span className="text-xs font-bold text-[#004475] tracking-tight uppercase opacity-80">
        {label}
      </span>
      <span className="text-lg font-bold text-[#004475] tracking-tighter">
        {String(value).padStart(1, '0')}
      </span>
    </div>
  );
}

export default function AttendanceBarChart() {
  const authUser = useSelector(selectAuthUser);
  const [chartData, setChartData] = useState([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState({});
  const [stats, setStats] = useState({
    totalWorkingDays: 0,
    presentCount: 0,
    absentCount: 0,
    onLeave: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const employeeId = authUser?.id;
    if (!employeeId) {
      setIsLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Fetch both endpoints in parallel:
        const [summaryRes, detailedRes] = await Promise.all([
          fetch(`/api/hr/attendance?month=${month}&employeeId=${employeeId}`),
          fetch(`/api/hr/attendance?month=${month}&detailed=true&employeeId=${employeeId}`),
        ]);

        // --- STATS from summary endpoint ---
        let statsSet = false;
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          const empSummary = Array.isArray(summaryData)
            ? summaryData.find((d) => String(d.id) === String(employeeId)) || summaryData[0]
            : summaryData;

          if (empSummary && empSummary.actualWorkingDays !== undefined) {
            setStats({
              totalWorkingDays: empSummary.actualWorkingDays || 0,
              presentCount: empSummary.presentCount || 0,
              absentCount: empSummary.absentCount || 0,
              onLeave: empSummary.leaveCount || 0,
            });
            statsSet = true;
          }
        }

        // --- CHART from detailed endpoint ---
        if (detailedRes.ok) {
          const detailedData = await detailedRes.json();
          const empDetailed = Array.isArray(detailedData)
            ? detailedData.find((d) => String(d.id) === String(employeeId)) || (detailedData.length === 1 ? detailedData[0] : null)
            : detailedData;

          if (empDetailed?.dailyAttendance) {
            setMonthlyAttendance(empDetailed.dailyAttendance);
            const today = new Date();
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weekly = dayLabels.map((label, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const code = empDetailed.dailyAttendance[key] ?? null;
              return {
                day: label,
                hours: code ? (STATUS_TO_HOURS[code] ?? 0) : 0,
                status: code ? (STATUS_LABEL[code] || code) : 'No Data',
                code,
              };
            });

            setChartData(weekly);

            // If summary didn't work, compute stats from detailed dailyAttendance
            if (!statsSet && empDetailed.actualWorkingDays !== undefined) {
              setStats({
                totalWorkingDays: empDetailed.actualWorkingDays || 0,
                presentCount: empDetailed.presentCount || 0,
                absentCount: empDetailed.absentCount || 0,
                onLeave: empDetailed.leaveCount || 0,
              });
            }
          }
        }
      } catch (err) {
        console.error('Attendance chart error:', err);
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [authUser?.id]);

  const data =
    chartData.length > 0
      ? chartData
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => ({
        day,
        hours: 0,
        status: 'No Data',
        code: null,
      }));

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-300 p-5 mx-3 shadow-sm hover:shadow-xl transition-all duration-500 min-h-[340px]">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-center w-full mb-2">
          <h3 className="text-2xl font-bold text-[#004475] uppercase tracking-widest flex items-center justify-center underline decoration-[#004475]/30">
            Monthly Attendance
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-16 items-center">
          {/* Monthly Calendar */}
          <div className="lg:col-span-6 flex justify-end">
            <div className="w-full max-w-sm p-4 border border-[#004475] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
              <h3 className="text-center text-red-500 font-bold uppercase tracking-wider mb-4 text-[13px]">
                {new Date().toLocaleString('default', { month: 'long' })}
              </h3>

              <div className="grid grid-cols-7 gap-2 mb-4 text-center border-b border-gray-100 pb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <span key={idx} className={`text-xs font-bold ${idx === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center relative">
                <style>{`
                  @keyframes strike-out-diagonal {
                    0% { transform: rotate(15deg) scaleX(0); opacity: 0; }
                    100% { transform: rotate(15deg) scaleX(1); opacity: 1; }
                  }
                `}</style>
                {(() => {
                  const today = new Date();
                  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  const todayDate = today.getDate();
                  const todayIdx = firstDayOfMonth + todayDate - 1;
                  const todayWeekIndex = Math.floor(todayIdx / 7);

                  return Array.from({ length: firstDayOfMonth }, () => null)
                    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
                    .map((date, idx) => {
                      const isSunday = idx % 7 === 0;
                      const isToday = date === todayDate;
                      const isPast = date && date < todayDate;
                      const isCurrentWeek = Math.floor(idx / 7) === todayWeekIndex;

                      let status = null;
                      let className = 'relative flex items-center justify-center w-8 h-8 mx-auto text-[14px] font-semibold rounded-full ';
                      if (date) {
                        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                        status = monthlyAttendance[dateKey];

                        if (status === 'CH') {
                          className += 'bg-red-500 text-white shadow-sm';
                        } else if (status === 'A' || status === 'LOP') {
                          className += 'bg-yellow-500 text-white shadow-sm';
                        } else if (status === 'L') {
                          className += 'bg-green-500 text-white shadow-sm';
                        } else if (isToday) {
                          className += 'bg-[#004475] text-white shadow-md';
                        } else if (isCurrentWeek) {
                          className += 'border border-blue-300 text-[#004475]';
                          if (isSunday) className = className.replace('text-[#004475]', 'text-red-500');
                        } else {
                          className += isSunday ? 'text-red-500' : 'text-[#004475]';
                        }

                        if (isPast && !['CH', 'A', 'LOP', 'L'].includes(status)) {
                          className += ' opacity-60';
                        }
                      }

                      return (
                        <div key={idx} className={className}>
                          {date ? (
                            <>
                              <span>{date}</span>
                              {(isPast && !['CH', 'A', 'LOP', 'L'].includes(status)) && (
                                <span
                                  className="absolute left-[15%] right-[15%] top-1/2 h-[1.5px] bg-slate-500 origin-right"
                                  style={{ animation: 'strike-out-diagonal 0.5s ease-out forwards', animationDelay: `${date * 0.03}s`, transform: 'rotate(15deg) scaleX(0)' }}
                                />
                              )}
                            </>
                          ) : ''}
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          </div>

          {/* Stats Panel & Legend */}
          <div className="lg:col-span-6 flex flex-col gap-8 self-center">
            <div className="grid grid-cols-2 gap-7">
              <AttendanceStatBox label="Working Days" value={stats.totalWorkingDays} color="blue" />
              <AttendanceStatBox label="Present" value={stats.presentCount} color="blue" />
              <AttendanceStatBox label="Absent" value={stats.absentCount} color="blue" />
              <AttendanceStatBox label="On Leave" value={stats.onLeave} color="blue" />
            </div>

            {/* Legend below stats */}
            <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Monthly Activities Indicator</span>
              <div className="flex items-center justify-end gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>LOP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Leave</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
