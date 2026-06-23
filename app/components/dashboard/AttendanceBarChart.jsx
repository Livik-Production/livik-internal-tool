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
    <div className="bg-white rounded-[2.5rem] border border-gray-300 p-5 shadow-sm hover:shadow-xl transition-all duration-500 min-h-[340px]">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-xl font-bold text-[#004475] uppercase tracking-widest flex items-center gap-3 underline decoration-[#004475]/30">
            Weekly Attendance
          </h3>
          <div className="px-3 py-1 bg-blue-50 text-[#004475] text-[10px] font-bold rounded-lg uppercase tracking-widest">
            {isLoading ? 'Loading...' : 'Current Week'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Nivo Bar Chart */}
          <div className="lg:col-span-7">
            {isLoading ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-[#004475] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveBar
                  data={data}
                  keys={['hours']}
                  indexBy="day"
                  margin={{ top: 20, right: 0, bottom: 40, left: 0 }}
                  padding={0.5}
                  borderRadius={6}
                  colors={({ data: d }) => getBarColor(d.code)}
                  axisTop={null}
                  axisRight={null}
                  axisLeft={null}
                  axisBottom={{
                    tickSize: 0,
                    tickPadding: 16,
                    tickRotation: 0,
                  }}
                  enableGridY={true}
                  gridYValues={4}
                  enableLabel={false}
                  tooltip={({ id, value, color, data: d }) => (
                    <div className="px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-lg flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                      <span className="text-[13px] font-bold text-gray-700">{d.day}:</span>
                      <span className="text-[13px] font-black" style={{ color }}>{d.status} ({value} hrs)</span>
                    </div>
                  )}
                  theme={{
                    grid: {
                      line: {
                        stroke: '#f1f5f9',
                        strokeWidth: 1,
                        strokeDasharray: '4 4',
                      },
                    },
                    axis: {
                      ticks: {
                        text: {
                          fontSize: 11,
                          fontWeight: 700,
                          fill: '#94a3b8',
                        },
                      },
                    },
                  }}
                  role="application"
                  ariaLabel="Weekly Attendance Bar Chart"
                />
              </div>
            )}
          </div>

          {/* Stats Panel — 2×2 grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-7 self-center">
            <AttendanceStatBox label="Working Days" value={stats.totalWorkingDays} color="blue" />
            <AttendanceStatBox label="Present" value={stats.presentCount} color="blue" />
            <AttendanceStatBox label="Absent" value={stats.absentCount} color="blue" />
            <AttendanceStatBox label="On Leave" value={stats.onLeave} color="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}
