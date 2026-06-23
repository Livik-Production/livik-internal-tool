'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  PieChart,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import Loader from '../Loader';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer"
    >
      {/* Premium Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
        <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
          {title}
        </span>
        <p className="text-[13px] text-gray-500 font-medium mb-4">
          {description || '\u00A0'}
        </p>
        <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
          {value}
        </h3>
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
          <Icon className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
          <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
            {trend !== undefined ? (
              <>
                {trend > 0 ? '+' : ''}{trend}% vs last month
              </>
            ) : (
              'View Details'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  description,
  onClick,
  color = 'blue',
}) => {
  const colorSchemes = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
  };

  return (
    <Button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left group w-full"
    >
      <div
        className={`p-3 rounded-xl ${colorSchemes[color].split(' ')[2]} group-hover:scale-110 transition-transform`}
      >
        <Icon size={20} className={colorSchemes[color].split(' ')[1]} />
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-sm">{label}</h4>
        <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight
        size={16}
        className="ml-auto text-gray-300 group-hover:text-blue-500 transition-colors"
      />
    </Button>
  );
};

const PieChartComponent = ({ data }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  let accumulatedAngle = 0;

  const COLORS = [
    '#004475',
    '#33a8d9',
    '#8b5cf6',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#ec4899',
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90 transition-transform duration-1000"
        >
          {data.map((d, i) => {
            const sliceAngle = (d.count / total) * 360;
            const x1 = 50 + 40 * Math.cos((accumulatedAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((accumulatedAngle * Math.PI) / 180);
            const x2 =
              50 +
              40 * Math.cos(((accumulatedAngle + sliceAngle) * Math.PI) / 180);
            const y2 =
              50 +
              40 * Math.sin(((accumulatedAngle + sliceAngle) * Math.PI) / 180);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const color = COLORS[i % COLORS.length];
            accumulatedAngle += sliceAngle;
            return (
              <path
                key={i}
                d={path}
                fill={color}
                className="hover:opacity-80 transition-opacity cursor-pointer stroke-white stroke-1"
                title={`${d.name}: ${d.count}`}
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            Total
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 w-full">
        {data.map((item, i) => (
          <div key={i} className="group">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {item.count}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                  width: `${(item.count / total) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChartComponent = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count), 5);

  return (
    <div className="flex items-end justify-between h-48 gap-2 pt-6">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group gap-2">
          <div className="relative w-full flex items-end justify-center h-40">
            <div
              className="w-full max-w-[32px] bg-[#33a8d9] rounded-t-lg transition-all duration-1000 group-hover:bg-[#004475] relative overflow-hidden"
              style={{ height: `${(d.count / max) * 100}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse" />
              {d.count > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#004475] opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter sm:tracking-normal">
            {d.month.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function HrDashboardTab({ onNavigate, isViewOnly = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/hr/stats');
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return <Loader label="Analyzing HR data..." fullScreen={false} />;
  if (error)
    return (
      <div className="p-10 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100 mx-4 my-8">
        Error: {error}
      </div>
    );
  if (!stats) return null;

  return (
    <div className="animate-in fade-in duration-500 pb-1">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Trends */}
        <div className="lg:col-span-3 space-y-4">
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Force"
              value={stats.totalEmployees}
              icon={Users}
              description="View staff directory"
              color="blue"
              onClick={() => onNavigate('all')}
            />
            <StatCard
              title="Active Leaves"
              value={stats.attendanceSummary.onLeave || 0}
              icon={Calendar}
              description="Today's leave summary"
              color="purple"
              onClick={() => onNavigate('leave', 'attendance')}
            />
            <StatCard
              title="Awaiting Action"
              value={stats.leaveSummary.PENDING}
              icon={Clock}
              description="Approvals dashboard"
              color="orange"
              onClick={() => onNavigate('leave', 'leaveRequests')}
            />
            <StatCard
              title="New Hires"
              value={
                stats.joiningTrends[stats.joiningTrends.length - 1]?.count || 0
              }
              icon={UserPlus}
              description="Joined this month"
              color="green"
              onClick={() => onNavigate('all')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Role Composition */}
            <div className="bg-white p-3 rounded-3xl border border-gray-300 shadow-xl shadow-slate-100/30">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Role Composition
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Workforce distribution by role
                  </p>
                </div>
                <div className="p-2 bg-[#f0f4f8] text-[#33a8d9] rounded-lg">
                  <PieChart size={18} />
                </div>
              </div>
              <PieChartComponent data={stats.designationDistribution} />
            </div>

            {/* Joining Trends */}
            <div className="bg-white p-3 rounded-3xl border border-gray-300 shadow-xl shadow-slate-100/30">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Growth Path
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Hiring trends (6 months)
                  </p>
                </div>
                <div className="p-2 bg-[#f0f4f8] text-[#33a8d9] rounded-lg">
                  <TrendingUp size={18} />
                </div>
              </div>
              <BarChartComponent data={stats.joiningTrends} />
            </div>
          </div>

          {/* Recent Hires */}
          <div className="bg-white p-3 rounded-3xl border border-gray-300 shadow-xl shadow-slate-100/30 h-[480px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Recent Onboarding
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Welcome our new team members
                </p>
              </div>
              <PrimaryButton
                onClick={() => onNavigate('all')}
                className="text-xs font-bold text-[#004475] hover:text-[#33a8d9] flex items-center gap-1 transition-colors"
              >
                View Directory <ChevronRight size={14} />
              </PrimaryButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.recentHires.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#33a8d9] to-[#004475] flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {emp.firstName.charAt(0)}
                      {emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {emp.designation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#004475] bg-[#f0f4f8] px-2 py-0.5 rounded-full">
                      {emp.empId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Quick Info */}
        <div className="space-y-6">
          {/* New Horizontal Quick Actions Row */}
          <div className="bg-white p-4 rounded-3xl border border-gray-300 shadow-xl shadow-slate-100/30 flex justify-between items-center gap-3 relative z-20">
            {[
              {
                icon: UserPlus,
                label: 'Onboard Staff',
                color: 'blue',
                onClick: () => !isViewOnly && onNavigate('all'),
              },
              {
                icon: ClipboardCheck,
                label: 'Attendance',
                color: 'green',
                onClick: () => onNavigate('leave', 'attendance'),
              },
              {
                icon: Clock,
                label: 'Approvals',
                color: 'orange',
                onClick: () => onNavigate('leave', 'leaveRequests'),
              },
              {
                icon: FileText,
                label: 'Offer Letter',
                color: 'purple',
                onClick: () => onNavigate('offerLetter'),
              },
            ].map((action, idx) => (
              <div key={idx} className="group relative flex-1">
                <IconButton
                  onClick={action.onClick}
                  className="w-full flex flex-col items-center justify-center rounded-2xl transition-all border border-transparent shadow-none bg-[#f0f4f8] text-[#004475] hover:bg-[#33a8d9] hover:text-white"
                  disabled={isViewOnly && action.label === 'Onboard Staff'}
                >
                  <action.icon size={17} />
                </IconButton>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-gray-900/90 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl transform -translate-y-1 group-hover:translate-y-0 z-50">
                  {action.label}
                  {/* Arrow */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900/90"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance Summary */}
          <div className="bg-white p-3 rounded-3xl border border-gray-300 shadow-xl shadow-slate-100/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Today's Presence
              </h3>
              <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase">
                Live
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-green-50/50 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-sm font-bold text-green-800">
                    Present
                  </span>
                </div>
                <span className="text-xl font-black text-green-600">
                  {stats.attendanceSummary.present}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100">
                  <span className="text-[10px] font-bold text-orange-700 uppercase block mb-1">
                    On Leave
                  </span>
                  <span className="text-lg font-black text-orange-600">
                    {stats.attendanceSummary.onLeave}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-red-50/50 border border-red-100">
                  <span className="text-[10px] font-bold text-red-700 uppercase block mb-1">
                    Absent
                  </span>
                  <span className="text-lg font-black text-red-600">
                    {stats.attendanceSummary.absent}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  <span>Daily Coverage</span>
                  <span>
                    {stats.totalEmployees > 0
                      ? Math.round(
                          (stats.attendanceSummary.present /
                            stats.totalEmployees) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#33a8d9] rounded-full transition-all duration-1000"
                    style={{
                      width: `${stats.totalEmployees > 0 ? (stats.attendanceSummary.present / stats.totalEmployees) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Holiday Card */}
          {stats.nextHoliday && (
            <div
              className="bg-gradient-to-br from-[#004475] to-[#33a8d9] p-6 rounded-3xl shadow-xl transform hover:-translate-y-1 transition-transform cursor-pointer overflow-hidden relative"
              onClick={() => onNavigate('leave', 'holidayList')}
            >
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-white/80 mb-4">
                  <Calendar size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Next Holiday
                  </span>
                </div>
                <h4 className="text-2xl font-black text-white mb-1">
                  {stats.nextHoliday.holidayName}
                </h4>
                <p className="text-indigo-100 text-sm font-medium">
                  {new Date(stats.nextHoliday.holidayDate).toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white bg-white/20 w-fit px-3 py-1 rounded-full border border-white/20">
                  {stats.nextHoliday.holidayType}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
