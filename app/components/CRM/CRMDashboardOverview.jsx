import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  ChevronDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function CRMDashboardOverview({
  authUser,
  tasksCount,
  leadsCount,
  qualifiedCount,
  oppCount,
  chartData,
  recentActivities = [],
  upcomingTasks = []
}) {
  // Mock data if not provided
  if (!recentActivities || recentActivities.length === 0) {
    recentActivities = [
      { id: 1, bg: 'bg-blue-50', icon: <CheckCircle size={16} className="text-blue-600" />, text: 'Sent proposal to Tech Solutions', time: '2h ago' },
      { id: 2, bg: 'bg-amber-50', icon: <CalendarCheck size={16} className="text-amber-600" />, text: 'Meeting scheduled with Acme Corp', time: '4h ago' },
      { id: 3, bg: 'bg-emerald-50', icon: <TrendingUp size={16} className="text-emerald-600" />, text: 'Closed deal with Global Logistics', time: '1d ago' },
    ];
  }

  if (!upcomingTasks || upcomingTasks.length === 0) {
    upcomingTasks = [
      { id: 1, time: '10:00 AM', name: 'Product Demo', desc: 'Tech Solutions Inc.' },
      { id: 2, time: '02:30 PM', name: 'Follow up Call', desc: 'Discuss pricing with Acme Corp' },
      { id: 3, time: '04:00 PM', name: 'Contract Review', desc: 'Finalize terms with Global Logistics' },
    ];
  }
  return (
    <div className="space-y-6 [animation-delay:100ms] animate-dashboard-reveal">
      {/* Greetings Banner */}
      <div className="pl-1">
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome back, <span className="text-[#33a8d9]">{authUser?.name || 'Rahul'}</span>
        </h2>
        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
          You have {tasksCount} follow-ups scheduled for today. Let's close some deals.
        </p>
      </div>

      {/* Summary stats cards - designed exactly like Finance dashboard overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        
        {/* Leads Card */}
        <div className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Leads
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-3">
              Total Registered
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-4 transition-all duration-500 group-hover:scale-110">
              {leadsCount}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <TrendingUp className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[11px] font-semibold text-[#004475] group-hover:text-white">
                +12% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Qualified Card */}
        <div className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Qualified
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-3">
              MQL & SQL
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-4 transition-all duration-500 group-hover:scale-110">
              {qualifiedCount}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <CheckCircle className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[11px] font-semibold text-[#004475] group-hover:text-white">
                +8% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Opportunities Card */}
        <div className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Opps
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-3">
              Active Deals
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-4 transition-all duration-500 group-hover:scale-110">
              {oppCount}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <AlertCircle className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[11px] font-semibold text-[#004475] group-hover:text-white">
                -2% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Won Deals Card */}
        <div className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Deals Won
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-3">
              Closed Won
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-4 transition-all duration-500 group-hover:scale-110">
              ₹12L
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <TrendingUp className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[11px] font-semibold text-[#004475] group-hover:text-white">
                +24% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Lost Deals Card */}
        <div className="relative overflow-hidden bg-white py-4 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Deals Lost
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-3">
              Closed Lost
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-4 transition-all duration-500 group-hover:scale-110">
              ₹2L
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <TrendingDown className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[11px] font-semibold text-[#004475] group-hover:text-white">
                -10% vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Stat 6: Today's Tasks */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#004475] to-[#33a8d9] py-4 rounded-[18px] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/20 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-sky-100 uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Tasks
            </span>
            <p className="text-[13px] text-sky-200 font-medium mb-3">
              Scheduled Tasks
            </p>
            <h3 className="text-[28px] font-bold text-white mb-4 transition-all duration-500 group-hover:scale-110">
              {tasksCount}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full transition-all duration-300 group-hover:bg-white group-hover:text-[#004475] group-hover:shadow-md">
              <CalendarCheck className="w-3.5 h-3.5 text-white group-hover:text-[#004475] transition-colors" />
              <span className="text-[11px] font-semibold text-white group-hover:text-[#004475]">
                High Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Monthly Revenue & Lead Sources */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Monthly Revenue Bar Chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                <p className="text-sm text-gray-500 mt-1">Growth performance over last 6 months</p>
              </div>
              <button className="text-xs font-bold text-gray-600 bg-slate-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1">
                Last 6 Months <ChevronDown size={12} />
              </button>
            </div>

            {/* SVG Bar Chart */}
            <div className="relative h-64 w-full flex items-end justify-between pt-6 px-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="border-t border-gray-100 w-full h-0" />
                <div className="border-t border-gray-100 w-full h-0" />
                <div className="border-t border-gray-100 w-full h-0" />
                <div className="border-t border-gray-100 w-full h-0" />
              </div>

              {/* Chart Bars */}
              {chartData.map((d) => (
                <div key={d.month} className="relative z-10 flex flex-col items-center flex-1 group">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-[#004475] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Revenue: {d.revenue}
                  </div>

                  {/* Bar Fill container */}
                  <div className="w-8 sm:w-10 md:w-12 bg-slate-50 hover:bg-slate-100 rounded-lg overflow-hidden h-44 flex items-end transition-all">
                    <div
                      style={{ height: `${d.percentage}%` }}
                      className="w-full bg-gradient-to-t from-[#004475] to-[#33a8d9] hover:from-[#33a8d9] hover:to-[#004475] transition-all duration-300 rounded-t-md origin-bottom group-hover:scale-y-[1.02]"
                    />
                  </div>

                  {/* Label */}
                  <span className="text-xs font-bold text-gray-500 mt-2.5 transition-colors group-hover:text-[#004475]">
                    {d.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Sources Donut Chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution across marketing channels</p>

              {/* Legend details */}
              <div className="flex flex-col gap-2 mt-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-[#004475] rounded-full" />
                  <span className="text-xs font-bold text-gray-700 w-24">Email</span>
                  <span className="text-xs font-black text-gray-900">40%</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-[#33a8d9] rounded-full" />
                  <span className="text-xs font-bold text-gray-700 w-24">Social</span>
                  <span className="text-xs font-black text-gray-900">25%</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-[#bae6fd] rounded-full" />
                  <span className="text-xs font-bold text-gray-700 w-24">Referral</span>
                  <span className="text-xs font-black text-gray-900">20%</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 bg-[#cbd5e1] rounded-full" />
                  <span className="text-xs font-bold text-gray-700 w-24">Direct</span>
                  <span className="text-xs font-black text-gray-900">15%</span>
                </div>
              </div>
            </div>

            {/* Donut Chart SVG */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0 self-center">
              <svg width="100%" height="100%" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#004475"
                  strokeWidth="12"
                  strokeDasharray="314.16"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#33a8d9"
                  strokeWidth="12"
                  strokeDasharray="314.16"
                  strokeDashoffset="-125.66"
                  strokeLinecap="round"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#bae6fd"
                  strokeWidth="12"
                  strokeDasharray="314.16"
                  strokeDashoffset="-204.20"
                  strokeLinecap="round"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#cbd5e1"
                  strokeWidth="12"
                  strokeDasharray="314.16"
                  strokeDashoffset="-267.03"
                  strokeLinecap="round"
                />
              </svg>

              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-3 shadow-xs">
                <span className="text-2xl font-black text-gray-900 leading-none">{leadsCount}</span>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Leads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Cards */}
        <div className="flex flex-col gap-6">
          
          {/* Sales Funnel Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Sales Funnel</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Stage conversion rates</p>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-full bg-[#004475] text-white text-xs font-bold py-3.5 px-4 rounded-xl text-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform">
                Lead ({leadsCount})
              </div>
              <div className="w-[85%] bg-[#1c6295] text-white text-xs font-bold py-3 px-4 rounded-xl text-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform">
                Qualified ({qualifiedCount})
              </div>
              <div className="w-[70%] bg-[#33a8d9] text-white text-xs font-bold py-3 px-4 rounded-xl text-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform">
                Proposal (36)
              </div>
              <div className="w-[55%] bg-[#66c2eb] text-[#004475] text-xs font-bold py-3 px-4 rounded-xl text-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform">
                Negotiation (12)
              </div>
              <div className="w-[40%] bg-[#b3e5fc] text-[#004475] text-xs font-bold py-2.5 px-4 rounded-xl text-center shadow-xs cursor-pointer hover:scale-[1.02] transition-transform">
                Won (8)
              </div>
            </div>
          </div>

          {/* Recent Activities Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                View All
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex gap-3 items-start p-3 rounded-xl border border-gray-50 hover:border-[#33a8d9] hover:bg-[#33a8d9]/5 transition-all duration-200 cursor-pointer group"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${act.bg} border border-slate-50`}>
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-tight group-hover:text-[#004475] transition-colors">
                      {act.text}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 block">
                      {act.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming</h3>
              <span className="bg-[#004475] text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                8 TODAY
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:border-[#33a8d9] hover:bg-[#33a8d9]/5 hover:shadow-xs group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {task.time}
                    </span>
                    <h4 className="text-xs font-black text-gray-900 truncate mt-1 leading-snug">
                      {task.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-gray-500 truncate leading-snug mt-0.5">
                      {task.desc}
                    </p>
                  </div>
                  <button className="text-gray-400 group-hover:text-[#004475] shrink-0 p-1.5 bg-white rounded-lg border border-gray-100 shadow-xs group-hover:translate-x-0.5 transition-all cursor-pointer">
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
