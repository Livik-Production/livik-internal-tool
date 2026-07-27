// app/dashboard/payroll/components/Overview.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Loader from '../../Loader'; // Adjust the import path as needed
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Building,
  Wallet,
  Activity,
  FileText,
  PieChart,
  BarChart3,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';
import CustomAlertForm from '../../CustomAlertForm';
import CustomTable from '../../CustomTable';

const Overview = ({ isViewOnly = false, onNavigateToData }) => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const [timeRange, setTimeRange] = useState('6M'); // 6M, 1Y, All

  // Fetch real payroll data from backend
  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payroll/data');
      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);
        setFilteredData(data);
        if (data.length > 0) {
          const latestYear = data[0].month.split('-')[1];
          setSelectedYear(latestYear);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  // Calculate overall statistics
  const calculateStats = () => {
    const currentYearData = filteredData.filter((item) =>
      item.month.includes(selectedYear)
    );

    const totalGross = currentYearData.reduce(
      (sum, item) => sum + item.totalGross,
      0
    );
    const totalNet = currentYearData.reduce(
      (sum, item) => sum + item.totalNet,
      0
    );
    const totalEmployees = currentYearData.reduce(
      (sum, item) => sum + item.employeeCount,
      0
    );
    const avgWorkingDays =
      currentYearData.length > 0
        ? currentYearData.reduce((sum, item) => sum + item.workingDays, 0) /
          currentYearData.length
        : 0;

    const disbursedCount = currentYearData.filter(
      (item) => item.status === 'Disbursed'
    ).length;

    const totalTax = currentYearData.reduce(
      (sum, item) => sum + item.totalTax,
      0
    );

    return {
      totalGross,
      totalNet,
      totalEmployees,
      avgWorkingDays,
      disbursedCount,
      totalTax,
      totalMonths: currentYearData.length,
    };
  };

  const stats = calculateStats();

  // Apply filters
  useEffect(() => {
    let filtered = [...payrollData];

    // Filter by year
    if (selectedYear !== 'All') {
      filtered = filtered.filter((item) => item.month.includes(selectedYear));
    }

    // Filter by time range
    if (timeRange === '6M') {
      filtered = filtered.slice(0, 6); // Last 6 months
    } else if (timeRange === '1Y') {
      filtered = filtered.slice(0, 12); // Last 12 months
    }

    setFilteredData(filtered);
  }, [selectedYear, timeRange, payrollData]);

  // Get years from data
  const years = Array.from(
    new Set(payrollData.map((item) => item.month.split('-')[1]))
  ).sort();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate percentage change
  const calculateGrowth = () => {
    if (filteredData.length < 2) return 0;
    const lastMonth = filteredData[0]?.totalNet || 0;
    const prevMonth = filteredData[1]?.totalNet || 0;
    if (prevMonth === 0) return 0;
    return ((lastMonth - prevMonth) / prevMonth) * 100;
  };

  const growth = calculateGrowth();

  // Prepare data for simple bar chart visualization
  const prepareBarChartData = () => {
    return filteredData.slice(0, 6).map((item) => ({
      name: item.month.split('-')[0],
      gross: Math.round(item.totalGross / 100000), // Convert to lakhs
      net: Math.round(item.totalNet / 100000), // Convert to lakhs
    }));
  };

  const barChartData = prepareBarChartData();

  const departmentData = [
    { name: 'Engineering', percentage: 35, color: '#004475' },
    { name: 'Product', percentage: 20, color: '#33a8d9' },
    { name: 'Development', percentage: 15, color: '#004475' },
    { name: 'Testing', percentage: 10, color: '#33a8d9' },
    { name: 'Design', percentage: 10, color: '#004475' },
    { name: 'Others', percentage: 10, color: '#33a8d9' },
  ];

  const payrollTableColumns = [
    {
      key: 'period',
      label: 'Month',
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.period}</div>
          <div className="text-sm text-gray-500">{item.month}</div>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      label: 'Employees',
      render: (item) => (
        <div className="flex items-center justify-center">
          <Users className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium">{item.employeeCount}</span>
        </div>
      ),
    },
    {
      key: 'totalGross',
      label: 'Gross Salary',
      render: (item) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(item.totalGross)}
        </div>
      ),
    },
    {
      key: 'totalNet',
      label: 'Net Salary',
      render: (item) => (
        <div className="font-medium text-[#004475]">
          {formatCurrency(item.totalNet)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            item.status === 'Disbursed'
              ? 'bg-[#004475] text-white shadow-sm'
              : item.status === 'Processed'
                ? 'bg-[#33a8d9] text-white shadow-sm'
                : item.status === 'Approved'
                  ? 'border border-[#004475] text-[#004475]'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div
      key={isLoading}
      className="bg-white rounded-xl p-1 animate-dashboard-reveal"
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader
            label="Loading payroll overview..."
            size="md"
            fullScreen={false}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
            {/* <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="All">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {['6M', '1Y', 'All'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-[#004475] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setAlertConfig({
                    isOpen: true,
                    title: 'Information',
                    message:
                      'The Export functionality for the overview analytics will be enabled in a future update.',
                    type: 'info',
                  })
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div> */}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {/* Total Gross Salary */}
            <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
              {/* Premium Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  Total Gross
                </span>
                <p className="text-[13px] text-gray-500 font-medium mb-4">
                  Overall Salary
                </p>
                <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
                  {formatCurrency(stats.totalGross)}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
                  <TrendingUp className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
                  <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                    {stats.totalEmployees} employees
                  </span>
                </div>
              </div>
            </div>

            {/* Total Net Pay */}
            <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
              {/* Premium Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  Total Net Pay
                </span>
                <p className="text-[13px] text-gray-500 font-medium mb-4">
                  Estimated Payroll
                </p>
                <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
                  {formatCurrency(stats.totalNet)}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
                  <Activity className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
                  <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                    {growth > 0 ? '+' : ''}
                    {growth.toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Stats */}
            <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
              {/* Premium Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  Staffing
                </span>
                <p className="text-[13px] text-gray-500 font-medium mb-4">
                  Total Strength
                </p>
                <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
                  {stats.totalEmployees}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
                  <Users className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
                  <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                    Active employees
                  </span>
                </div>
              </div>
            </div>

            {/* Tax & Deductions */}
            <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
              {/* Premium Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  Tax & Deductions
                </span>
                <p className="text-[13px] text-gray-500 font-medium mb-4">
                  Estimated Deductions
                </p>
                <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
                  {formatCurrency(stats.totalTax)}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
                  <FileText className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
                  <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                    Compliance tracked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Visualizations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Salary Distribution Card */}
            {/* Monthly Salary Trend – Modern Bar Chart */}
            <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-100 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Monthly Salary Trend
                  </h3>
                  <p className="text-sm text-gray-500">
                    Gross vs Net salary comparison (in Lakhs)
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-lg bg-[#33a8d9] mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Gross Salary
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-lg bg-[#004475] mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Net Salary
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <svg viewBox="0 0 1000 380" className="w-full h-80">
                  {/* Background Grid Lines */}
                  <defs>
                    <linearGradient
                      id="grossGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#33a8d9" stopOpacity="0.9" />
                      <stop
                        offset="100%"
                        stopColor="#33a8d9"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                    <linearGradient
                      id="netGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#004475" stopOpacity="0.9" />
                      <stop
                        offset="100%"
                        stopColor="#004475"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                    <filter
                      id="shadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="8"
                        floodColor="rgba(0,0,0,0.08)"
                      />
                    </filter>
                  </defs>

                  {/* Y-axis labels */}
                  {[0, 2, 4, 6, 8, 10].map((value, index) => (
                    <g key={`y-label-${index}`}>
                      <line
                        x1="80"
                        y1={320 - value * 30}
                        x2="920"
                        y2={320 - value * 30}
                        stroke="#F3F4F6"
                        strokeWidth="1"
                      />
                      <text
                        x="60"
                        y={325 - value * 30}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6B7280"
                        fontWeight="500"
                      >
                        {value}L
                      </text>
                    </g>
                  ))}

                  {/* Bars */}
                  {barChartData.map((item, index) => {
                    const chartWidth = 1000;
                    const padding = 120;
                    const groupWidth =
                      (chartWidth - padding * 2) / barChartData.length;
                    const barWidth = groupWidth / 3;
                    const xBase = padding + index * groupWidth;
                    const spacing = 8;

                    const grossHeight = item.gross * 30;
                    const netHeight = item.net * 30;
                    const maxBarHeight = Math.max(grossHeight, netHeight);

                    return (
                      <g key={index}>
                        {/* Gross Bar with shadow */}
                        <rect
                          x={xBase - barWidth - spacing / 2}
                          y={320 - grossHeight}
                          width={barWidth}
                          height={grossHeight}
                          rx="8"
                          fill="url(#grossGradient)"
                          filter="url(#shadow)"
                          className="transition-all duration-300 hover:opacity-90"
                        />

                        {/* Net Bar with shadow */}
                        <rect
                          x={xBase + spacing / 2}
                          y={320 - netHeight}
                          width={barWidth}
                          height={netHeight}
                          rx="8"
                          fill="url(#netGradient)"
                          filter="url(#shadow)"
                          className="transition-all duration-300 hover:opacity-90"
                        />

                        {/* Value labels on hover area */}
                        <g className="opacity-0 hover:opacity-100 transition-opacity">
                          {/* Gross value */}
                          <rect
                            x={xBase - barWidth - spacing / 2 - 15}
                            y={310 - grossHeight}
                            width="40"
                            height="24"
                            rx="12"
                            fill="#1F2937"
                          />
                          <text
                            x={xBase - barWidth - spacing / 2 + 5}
                            y={325 - grossHeight}
                            textAnchor="middle"
                            fontSize="10"
                            fill="white"
                            fontWeight="600"
                          >
                            {item.gross}L
                          </text>

                          {/* Net value */}
                          <rect
                            x={xBase + barWidth / 2 + spacing / 2 - 15}
                            y={310 - netHeight}
                            width="40"
                            height="24"
                            rx="12"
                            fill="#1F2937"
                          />
                          <text
                            x={xBase + barWidth / 2 + spacing / 2 + 5}
                            y={325 - netHeight}
                            textAnchor="middle"
                            fontSize="10"
                            fill="white"
                            fontWeight="600"
                          >
                            {item.net}L
                          </text>
                        </g>

                        {/* Month Label */}
                        <text
                          x={xBase}
                          y="360"
                          textAnchor="middle"
                          fontSize="13"
                          fill="#4B5563"
                          fontWeight="600"
                        >
                          {item.name}
                        </text>

                        {/* Divider line */}
                        <circle cx={xBase} cy="370" r="2" fill="#E5E7EB" />
                      </g>
                    );
                  })}

                  {/* Axes */}
                  <line
                    x1="80"
                    y1="320"
                    x2="920"
                    y2="320"
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  <line
                    x1="80"
                    y1="320"
                    x2="80"
                    y2="20"
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                </svg>

                {/* Chart Summary Stats */}
                <div className="flex flex-wrap gap-6 mt-10 pt-6 border-t border-gray-100">
                  <div className="px-4 py-3 bg-[#33a8d9] bg-opacity-10 rounded-xl">
                    <p className="text-xs text-white mb-1">Average Gross</p>
                    <p className="text-lg font-bold text-white">
                      {Math.round(
                        (barChartData.reduce(
                          (sum, item) => sum + item.gross,
                          0
                        ) /
                          barChartData.length) *
                          10
                      ) / 10}
                      L
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-[#004475] bg-opacity-10 rounded-xl">
                    <p className="text-xs text-white mb-1">Average Net</p>
                    <p className="text-lg font-bold text-white">
                      {Math.round(
                        (barChartData.reduce((sum, item) => sum + item.net, 0) /
                          barChartData.length) *
                          10
                      ) / 10}
                      L
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-900 mb-1">
                      Avg. Difference
                    </p>
                    <p className="text-lg font-bold text-gray-700">
                      {Math.round(
                        (barChartData.reduce(
                          (sum, item) => sum + (item.gross - item.net),
                          0
                        ) /
                          barChartData.length) *
                          10
                      ) / 10}
                      L
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Distribution Card */}
            {/* <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Department Distribution
              </h3>
              <div className="space-y-6">
                {departmentData.map((dept, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">
                        {dept.name}
                      </span>
                      <span className="font-bold text-gray-900">
                        {dept.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${dept.percentage}%`,
                          backgroundColor: dept.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}
          </div>

          {/* Recent Payroll Cycles */}
          <div className="bg-white rounded-xl border border-gray-200 mb-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Payroll Cycles
                  </h3>
                  <p className="text-sm text-gray-600">
                    Latest payroll processing details
                  </p>
                </div>
                <button
                  onClick={onNavigateToData}
                  className="text-sm text-[#004475] font-medium hover:text-[#33a8d9] flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-0">
              <CustomTable
                columns={payrollTableColumns}
                data={filteredData.slice(0, 5)}
                rowKey="id"
                className="border-0 rounded-none shadow-none"
                maxHeight="none"
                cellAlignment={{ employeeCount: 'center' }}
                headerAlignment={{ employeeCount: 'center' }}
              />
            </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-3">
                Performance Metrics
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Processing Efficiency
                    </span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#004475] h-2 rounded-full"
                      style={{ width: '92%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      On-time Payments
                    </span>
                    <span className="text-sm font-medium">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#33a8d9] h-2 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Tax Compliance
                    </span>
                    <span className="text-sm font-medium">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#004475] h-2 rounded-full"
                      style={{ width: '98%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (isViewOnly) return;
                    setAlertConfig({
                      isOpen: true,
                      title: 'Action Initialized',
                      message:
                        'Generating payroll cycle for the current month. Processing logic will commence momentarily.',
                      type: 'info',
                    });
                  }}
                  className={`w-full text-left p-3 border rounded-lg transition-colors flex items-center justify-between ${
                    isViewOnly
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400'
                      : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
                  }`}
                  disabled={isViewOnly}
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      Process Next Payroll
                    </div>
                    <div className="text-sm text-gray-600">
                      For{' '}
                      {new Date().toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() =>
                    setAlertConfig({
                      isOpen: true,
                      title: 'Report Generation',
                      message:
                        'Building detailed payroll analytics reports. Your download will start shortly.',
                      type: 'info',
                    })
                  }
                  className="w-full text-left p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      Generate Reports
                    </div>
                    <div className="text-sm text-gray-600">
                      Export detailed analytics
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <CustomAlertForm
            isOpen={alertConfig.isOpen}
            onClose={() =>
              setAlertConfig((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={() =>
              setAlertConfig((prev) => ({ ...prev, isOpen: false }))
            }
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            confirmText="OK"
            cancelText="Close"
          />
        </>
      )}
    </div>
  );
};

export default Overview;
