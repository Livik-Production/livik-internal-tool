'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Receipt,
} from 'lucide-react';
import Button from '../../Buttons/Button';
import FilterDropdown from '../../Buttons/FilterDropdown';

const DashboardTab = ({
  expenses = [],
  periodRange,
  setPeriodRange,
  yearRange,
  setYearRange,
  onViewAll,
}) => {
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    categories: [],
    recentExpenses: [],
    topSpenders: [],
    monthlyComparison: [],
    weeklyPattern: [],
  });

  const [pettyCash, setPettyCash] = useState({
    received: 0,
    spent: 0,
    remaining: 0,
    recentSpends: [],
    summaryCards: [],
    isLoading: false,
  });

  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const fetchPettyCashSummary = async () => {
    try {
      setPettyCash((prev) => ({ ...prev, isLoading: true }));

      const res = await fetch('/api/expense/petty-cash/summary', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Petty cash API failed');
      }

      const data = await res.json();

      setPettyCash({
        received: Number(data.received || 0),
        spent: Number(data.spent || 0),
        remaining: Number(data.remaining || 0),
        recentSpends: data.recentSpends || [],
        summaryCards: data.summaryCards || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Petty cash fetch error:', err.message);
      setPettyCash((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchPettyCashSummary();
  }, []);

  const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyExpenseMap = dashboardData.recentExpenses.reduce((acc, exp) => {
    if (!exp.expenseDate && !exp.date) return acc;

    const d = new Date(exp.expenseDate || exp.date);
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });

    acc[day] = (acc[day] || 0) + Number(exp.amount || 0);
    return acc;
  }, {});

  const dailyChartData = WEEK_DAYS.map((day) => ({
    day,
    amount: dailyExpenseMap[day] || 0,
  }));

  const maxDailyAmount = Math.max(...dailyChartData.map((d) => d.amount), 1);

  const PIE_COLORS = [
    '#0062ff',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f43f5e',
    '#fb923c',
    '#0ea5e9',
    '#d946ef',
    '#84cc16',
    '#06b6d4',
  ];

  useEffect(() => {
    const weeksMap = {};
    expenses.forEach((exp) => {
      const expDate = new Date(exp.expenseDate || exp.date);
      const weekStart = getStartOfWeek(expDate);
      const weekKey = weekStart.toISOString().split('T')[0];
      weeksMap[weekKey] = (weeksMap[weekKey] || 0) + Number(exp.amount || 0);
    });

    const historicalWeeks = Object.values(weeksMap);
    const avgWeeklySpending =
      historicalWeeks.length > 0
        ? historicalWeeks.reduce((sum, val) => sum + val, 0) /
          historicalWeeks.length
        : 0;
    const avgDailyBudget = avgWeeklySpending / 7;
    const today = new Date();
    let start = new Date(today);
    start.setHours(0, 0, 0, 0);
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    let grouping = 'day';

    if (yearRange === '1y') {
      start.setFullYear(start.getFullYear() - 1);
      grouping = 'month';
    } else if (yearRange === '2y') {
      start.setFullYear(start.getFullYear() - 2);
      grouping = 'month';
    } else {
      switch (periodRange) {
        case 'monthly':
          start.setDate(1);
          grouping = 'week';
          break;
        case '3m':
          start.setMonth(start.getMonth() - 2);
          start.setDate(1);
          grouping = 'month';
          break;
        case '6m':
          start.setMonth(start.getMonth() - 5);
          start.setDate(1);
          grouping = 'month';
          break;
        case 'weekly':
        default:
          start = getStartOfWeek(today);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(end.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          grouping = 'day';
          break;
      }
    }

    const filteredExpenses = expenses.filter((exp) => {
      const d = new Date(exp.expenseDate || exp.date);
      return d >= start && d <= end;
    });

    let chartDataMap = {};
    let chartData = [];

    if (grouping === 'day') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(
        (d) => (chartDataMap[d] = { amount: 0, budget: avgDailyBudget })
      );

      filteredExpenses.forEach((exp) => {
        const d = new Date(exp.expenseDate || exp.date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (chartDataMap[dayName])
          chartDataMap[dayName].amount += Number(exp.amount || 0);
      });
      chartData = days.map((day) => ({ day, ...chartDataMap[day] }));
    } else if (grouping === 'week') {
      for (let i = 1; i <= 5; i++) {
        chartDataMap[`Week ${i}`] = { amount: 0, budget: avgDailyBudget * 7 };
      }
      filteredExpenses.forEach((exp) => {
        const d = new Date(exp.expenseDate || exp.date);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const day = d.getDate();
        const weekNum = Math.ceil((day + offset) / 7);

        const key = `Week ${weekNum > 5 ? 5 : weekNum}`;
        if (chartDataMap[key])
          chartDataMap[key].amount += Number(exp.amount || 0);
      });
      chartData = Object.entries(chartDataMap).map(([day, val]) => ({
        day,
        ...val,
      }));
    } else if (grouping === 'month') {
      let curr = new Date(start);
      curr.setDate(1);
      const endTime = end.getTime();
      while (curr.getTime() <= endTime) {
        const key =
          curr.toLocaleDateString('en-US', { month: 'short' }) +
          (yearRange || periodRange === '6m'
            ? ` '${curr.getFullYear().toString().substr(2)}`
            : '');
        chartDataMap[key] = { amount: 0, budget: avgDailyBudget * 30.4 };
        curr.setMonth(curr.getMonth() + 1);
      }

      filteredExpenses.forEach((exp) => {
        const d = new Date(exp.expenseDate || exp.date);
        const key =
          d.toLocaleDateString('en-US', { month: 'short' }) +
          (yearRange || periodRange === '6m'
            ? ` '${d.getFullYear().toString().substr(2)}`
            : '');
        if (chartDataMap[key])
          chartDataMap[key].amount += Number(exp.amount || 0);
      });

      curr = new Date(start);
      curr.setDate(1);
      chartData = [];
      while (curr.getTime() <= endTime) {
        const key =
          curr.toLocaleDateString('en-US', { month: 'short' }) +
          (yearRange || periodRange === '6m'
            ? ` '${curr.getFullYear().toString().substr(2)}`
            : '');
        if (chartDataMap[key]) {
          chartData.push({ day: key, ...chartDataMap[key] });
        }
        curr.setMonth(curr.getMonth() + 1);
      }
    }

    const categoryMap = {};
    let totalFilteredAmount = 0;
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'Uncategorized';
      const amt = Number(exp.amount || 0);
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      totalFilteredAmount += amt;
    });

    const categories = Object.keys(categoryMap).map((key, index) => {
      const value = categoryMap[key];
      return {
        name: key,
        value,
        percentage:
          totalFilteredAmount > 0 ? (value / totalFilteredAmount) * 100 : 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    });

    const sortedFiltered = [...filteredExpenses].sort(
      (a, b) =>
        new Date(b.expenseDate || b.date) - new Date(a.expenseDate || a.date)
    );
    const recentExpenses = sortedFiltered.slice(0, 5);

    const spenderMap = {};
    filteredExpenses.forEach((e) => {
      const name = e.employeeName || e.itemName || 'Unknown';
      spenderMap[name] = (spenderMap[name] || 0) + Number(e.amount || 0);
    });
    const topSpenders = Object.entries(spenderMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthTotal = expenses
      .filter((e) => {
        const d = new Date(e.expenseDate || e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear =
      currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthTotal = expenses
      .filter((e) => {
        const d = new Date(e.expenseDate || e.date);
        return (
          d.getMonth() === previousMonth &&
          d.getFullYear() === previousMonthYear
        );
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const momChange =
      previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

    const pendingCount = expenses.filter(
      (e) => (e.status || '').toLowerCase() === 'pending'
    ).length;

    const monthsMap = {};
    expenses.forEach((e) => {
      const d = new Date(e.expenseDate || e.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      monthsMap[monthKey] = (monthsMap[monthKey] || 0) + Number(e.amount || 0);
    });
    const monthsCount = Object.keys(monthsMap).length;
    const avgMonthly = monthsCount > 0 ? totalAmount / monthsCount : 0;
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7DaysExpenses = expenses.filter((e) => {
      const d = new Date(e.expenseDate || e.date);
      return d >= sevenDaysAgo;
    });

    const last7DaysTotal = last7DaysExpenses.reduce(
      (s, e) => s + Number(e.amount || 0),
      0
    );
    const last7DaysCount = last7DaysExpenses.length;
    const last7DaysAvg =
      last7DaysCount > 0 ? last7DaysTotal / last7DaysCount : 0;

    setDashboardData({
      summary: {
        totalAmount,
        currentMonthTotal,
        totalCount: expenses.length,
        momChange,
        pendingCount,
        avgMonthly,
        recentAnalysis: {
          total: last7DaysTotal,
          avg: last7DaysAvg,
          count: last7DaysCount,
        },
      },
      weeklyPattern: chartData,
      categories,
      recentExpenses,
      topSpenders,
      monthlyComparison: [],
    });
  }, [expenses, periodRange, yearRange]);

  useEffect(() => {
    if (!dashboardData.weeklyPattern?.length) return;

    const weekData = dashboardData.weeklyPattern;

    const totalSpent = weekData.reduce((s, d) => s + d.amount, 0);
    const totalBudget = weekData.reduce((s, d) => s + d.budget, 0);

    const utilization =
      totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;

    const overBudgetAmount = totalSpent - totalBudget;

    const dailyAverage = weekData.length
      ? Math.round(totalSpent / weekData.length)
      : 0;

    const savingsPotential =
      totalSpent < totalBudget
        ? (((totalBudget - totalSpent) / totalBudget) * 100).toFixed(1)
        : 0;

    const peakDay = weekData.reduce((max, d) =>
      d.amount > max.amount ? d : max
    );

    const efficientDay = weekData.reduce((best, d) =>
      d.amount / d.budget < best.amount / best.budget ? d : best
    );

    const weeklyTrend =
      weekData.length >= 2
        ? (
            ((weekData[weekData.length - 1].amount - weekData[0].amount) /
              (weekData[0].amount || 1)) *
            100
          ).toFixed(1)
        : 0;

    setDashboardData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        weeklyInsights: {
          peakDay,
          efficientDay,
          trend: weeklyTrend,
        },
        budgetStatus: {
          utilization,
          overBudgetAmount,
          dailyAverage,
          savingsPotential,
        },
      },
    }));
  }, [dashboardData.weeklyPattern]);

  const { weeklyPattern, categories, summary, recentExpenses } = dashboardData;
  const CURRENT_WEEK =
    weeklyPattern.length > 0
      ? weeklyPattern
      : [
          { day: 'Mon', amount: 0, budget: 20000 },
          { day: 'Tue', amount: 0, budget: 20000 },
          { day: 'Wed', amount: 0, budget: 20000 },
          { day: 'Thu', amount: 0, budget: 22000 },
          { day: 'Fri', amount: 0, budget: 25000 },
        ];
  const EXPENSE_DISTRIBUTION = categories.length > 0 ? categories : [];

  const weeklySpent = CURRENT_WEEK.reduce((s, d) => s + d.amount, 0);
  const weeklyBudget = CURRENT_WEEK.reduce((s, d) => s + d.budget, 0);
  const weeklyOverBudget = weeklySpent - weeklyBudget;

  const PERIOD_MAP = {
    Weekly: 'weekly',
    Monthly: 'monthly',
    '3M': '3m',
    '6M': '6m',
  };

  return (
    <div className=" space-y-3">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mt-5">
            Expense Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Overview of your expense management
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Button className="flex items-center justify-center space-x-2 w-full md:w-auto">
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {yearRange
                ? 'Yearly Trends'
                : periodRange === 'monthly'
                  ? 'Monthly Expense Pattern'
                  : periodRange === '3m' || periodRange === '6m'
                    ? 'Expense Trends'
                    : 'Weekly Expense Pattern'}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Spending analysis for selected period
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
              {['Weekly', 'Monthly', '3M', '6M'].map((period) => (
                <button
                  key={period}
                  onClick={() => setPeriodRange(PERIOD_MAP[period])}
                  className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${
                    periodRange === PERIOD_MAP[period]
                      ? 'bg-white shadow'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <FilterDropdown
              options={[
                { value: '', label: 'Select Year Range' },
                { value: '1y', label: '1 Year' },
              ]}
              value={yearRange}
              onChange={setYearRange}
              placeholder="Select Year Range"
              className="flex-grow md:flex-grow-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Spent"
            value={`₹${weeklySpent.toLocaleString()}`}
            description="Selected period"
            trend="up"
          />
          <StatCard
            title="Avg Spend"
            value={`₹${Math.round(weeklySpent / CURRENT_WEEK.length).toLocaleString()}`}
            description="Per bar average"
            trend="neutral"
          />

          <StatCard
            title="Over Budget"
            value={`₹${
              weeklyOverBudget > 0 ? weeklyOverBudget.toLocaleString() : 0
            }`}
            description="Selected period"
            trend={weeklyOverBudget > 0 ? 'down' : 'up'}
            color={weeklyOverBudget > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Week-over-Week"
            value="2.1%"
            description="Increase vs last week"
            trend="up"
          />
          <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Current Week
                </h4>
                <p className="text-xs text-gray-500 mt-1">Previous Week</p>
              </div>
              <Button className="text-xs px-3 py-1">Export</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">
              Expense Distribution
            </h4>
            <div className="flex items-center justify-start h-64">
              <PieChartComponent data={EXPENSE_DISTRIBUTION} />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-700">
                {yearRange || periodRange === '3m' || periodRange === '6m'
                  ? 'Monthly Comparison'
                  : 'Day-by-Day Comparison'}
              </h4>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center text-gray-500 font-medium">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5"></div>
                  {yearRange || periodRange === '3m' || periodRange === '6m'
                    ? 'Monthly Spend'
                    : 'Daily Spend'}
                </span>
              </div>
            </div>
            <div className="h-64">
              <ComparisonChart data={CURRENT_WEEK} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 ">
            <h4 className="font-semibold text-gray-700">
              {yearRange || periodRange === '3m' || periodRange === '6m'
                ? 'Monthly Breakdown'
                : 'Day Breakdown'}
            </h4>

            <div className="max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {CURRENT_WEEK.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{day.day}</p>
                    <div
                      className={`flex items-center text-xs font-bold ${
                        day.amount > day.budget
                          ? 'text-red-500'
                          : 'text-green-600'
                      }`}
                    >
                      {day.amount > day.budget ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                      )}
                      {day.budget > 0
                        ? (day.amount > day.budget ? '+' : '') +
                          (
                            ((day.amount - day.budget) / day.budget) *
                            100
                          ).toFixed(1) +
                          '%'
                        : 'No budget'}
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        vs target
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{day.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 ">Weekly Insights</h4>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Peak Spending Day</p>
                  <p className="text-sm text-gray-600">
                    Highest expenses occurred on
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.weeklyInsights?.peakDay?.day || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹
                    {summary.weeklyInsights?.peakDay?.amount?.toLocaleString() ||
                      0}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Most Efficient Day</p>
                  <p className="text-sm text-gray-600">
                    Lowest spending vs budget
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {summary.weeklyInsights?.efficientDay?.day || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {summary.weeklyInsights?.efficientDay
                      ? `${(
                          ((summary.weeklyInsights.efficientDay.budget -
                            summary.weeklyInsights.efficientDay.amount) /
                            summary.weeklyInsights.efficientDay.budget) *
                          100
                        ).toFixed(1)}% under budget`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Trend</p>
                  <p className="text-sm text-gray-600">Spending pattern</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">
                    {summary.weeklyInsights?.trend > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(summary.weeklyInsights?.trend || 0)}%
                  </p>

                  <p className="text-sm text-gray-600">From Mon to Fri</p>
                </div>
              </div>
            </div>
          </div>

          <div className="">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Cash Flow Out</h3>
                <p className="text-gray-600 text-sm">
                  Monthly cash outflow and expense volume
                </p>
              </div>
              <button className="text-gray-600 hover:text-gray-900"></button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-600 mb-1">Total Outflow</p>
                <p className="text-xl font-bold text-red-600">
                  ₹{dashboardData.summary.totalAmount?.toLocaleString() || 0}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-600 mb-1">
                  Avg Monthly Outflow
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹
                  {dashboardData.monthlyComparison.length > 0
                    ? (
                        dashboardData.summary.totalAmount /
                        dashboardData.monthlyComparison.length
                      ).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                    : 0}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-600 mb-1">
                  Highest Outflow Month
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {dashboardData.monthlyComparison[0]?.month || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Petty Cash</h4>

            <div className="grid grid-cols-3 gap-3">
              {pettyCash.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 p-3 rounded-lg text-center animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                    <div className="h-6 bg-gray-300 rounded w-24 mx-auto"></div>
                  </div>
                ))
              ) : pettyCash.summaryCards &&
                pettyCash.summaryCards.length > 0 ? (
                pettyCash.summaryCards.map((card, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center ${card.colorClass || getColorClass(index)}`}
                  >
                    <p className="text-xs text-gray-600">
                      {card.title || getCardTitle(index)}
                    </p>
                    <p
                      className={`text-lg font-bold ${card.textColorClass || getTextColorClass(index)}`}
                    >
                      {card.currency || '₹'}
                      {card.value?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Received</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₹{pettyCash.received.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Spent</p>
                    <p className="text-lg font-bold text-red-600">
                      ₹{pettyCash.spent.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Remaining</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{pettyCash.remaining.toLocaleString('en-IN')}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center mb-4">
                <h6 className="text-md font-semibold text-gray-700">
                  Recent Petty Cash Spend
                </h6>
                <button
                  onClick={fetchPettyCashSummary}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>

              {pettyCash.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-100 rounded-lg px-3 py-3 animate-pulse"
                    >
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-5 bg-gray-300 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : pettyCash.recentSpends.length > 0 ? (
                <div className="space-y-2">
                  {pettyCash.recentSpends.slice(0, 2).map((tx, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.itemName || tx.description || 'Expense'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'No date'}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-red-600">
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                  No petty cash transactions
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Category Distribution
          </h3>

          <div className="space-y-4">
            {dashboardData.categories.length > 0 ? (
              dashboardData.categories.map((category, index) => {
                const categoryColors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-purple-500',
                  'bg-pink-500',
                ];

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          categoryColors[index % categoryColors.length]
                        } mr-3`}
                      ></div>
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold">
                        ₹
                        {category.value.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No category data</p>
                <p className="text-sm mt-1">Categorize your expenses</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total Categories: {dashboardData.categories.length}
              </span>
              <span className="font-medium">
                ₹
                {dashboardData.categories
                  .reduce((sum, cat) => sum + cat.value, 0)
                  .toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Expenses Analysis
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Latest transactions with visual breakdown
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">Last 7 Days</p>
              <p className="text-xl font-bold text-gray-900">
                ₹
                {(
                  dashboardData.summary.recentAnalysis?.total || 0
                ).toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">Avg. Expense</p>
              <p className="text-xl font-bold text-gray-900">
                ₹
                {(
                  dashboardData.summary.recentAnalysis?.avg || 0
                ).toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {dashboardData.summary.recentAnalysis?.count || 0}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Daily Trend (Last 5 Days)
              </h4>
              <span className="text-xs text-gray-500">Amount in ₹</span>
            </div>

            {dailyChartData.length > 0 ? (
              <div className="h-54 flex items-end justify-between px-2 py-4 border border-gray-200 rounded-lg">
                {dailyChartData.map((item, index) => {
                  const barHeight = Math.max(
                    (item.amount / maxDailyAmount) * 80,
                    10
                  );

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-end flex-1 mx-1"
                    >
                      <div className="relative w-8">
                        <div
                          className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg hover:from-blue-600 hover:to-blue-400 transition-all"
                          style={{ height: `${barHeight}px` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-gray-600 mt-2">
                        {item.day}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        ₹
                        {item.amount >= 1000
                          ? `${(item.amount / 1000).toFixed(1)}k`
                          : item.amount.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 border border-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm">No chart data</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                Latest Transactions
              </h4>
              <button
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                onClick={onViewAll}
              >
                View All →
              </button>
            </div>

            {dashboardData.recentExpenses.slice(0, 5).map((expense, index) => {
              const amount = Number(expense.amount || 0);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.itemName || expense.description || 'Expense'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.category || 'Uncategorized'} •{' '}
                      {new Date(
                        expense.expenseDate || expense.date
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    ₹
                    {amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Spending Analytics
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Top spenders with visual comparison
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">
                Top Spenders
              </h4>
            </div>

            <div className="flex flex-col space-y-3">
              {dashboardData.topSpenders?.length > 0 ? (
                dashboardData.topSpenders.map((spender, index) => {
                  const totalSpend = dashboardData.topSpenders.reduce(
                    (sum, s) => sum + s.amount,
                    0
                  );
                  const percentage =
                    totalSpend > 0 ? (spender.amount / totalSpend) * 100 : 0;
                  const colors = [
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-purple-500',
                    'bg-orange-500',
                    'bg-pink-500',
                  ];

                  return (
                    <div key={index} className="w-full">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              colors[index % colors.length]
                            } mr-3`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {spender.name}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span>Rank {index + 1}</span>
                              <span className="mx-2">•</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹
                            {spender.amount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No spender data</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Total Transactions</p>
              <p className="text-lg font-bold text-gray-900">
                {dashboardData.summary.totalCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Avg. Transaction</p>
              <p className="text-lg font-bold text-gray-900">
                ₹
                {(
                  (dashboardData.summary.totalAmount || 0) /
                  (dashboardData.summary.totalCount || 1)
                ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per expense</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Spending Insights
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Highest Spender
                </p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {dashboardData.topSpenders[0]?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ₹
                  {(dashboardData.topSpenders[0]?.amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Top Category
                </p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {dashboardData.categories[0]?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ₹{(dashboardData.categories[0]?.value || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Financial Health
            </h3>
            <p className="text-gray-600 text-sm mt-1">Performance metrics</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Month over Month
              </h4>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            <div className="text-center pt-7">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {Math.abs(dashboardData.summary.momChange || 0).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">
                {(dashboardData.summary.momChange || 0) > 0
                  ? 'Increase'
                  : 'Decrease'}{' '}
                in spending
              </p>
            </div>

            <div
              className={`flex items-center justify-center mt-4 text-xs ${
                (dashboardData.summary.momChange || 0) > 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}
            >
              {(dashboardData.summary.momChange || 0) > 0
                ? '↑ Higher than last month'
                : '↓ Lower than last month'}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Transaction Volume
              </h4>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {dashboardData.summary.totalCount || 0}
              </div>
              <p className="text-sm text-gray-600">
                Total transactions recorded
              </p>
            </div>

            <div className="flex items-center justify-center mt-4 text-xs text-green-600">
              <Clock className="w-3 h-3 mr-1" />
              <span>Synced with backend</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Total Spending
              </h4>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                ₹{(dashboardData.summary.totalAmount || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Total expenses logged
              </div>
            </div>

            <div className="flex items-center justify-center mt-4 text-xs text-blue-600">
              <span className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>Tracked in system</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData.summary.totalCount || 0}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">
              {dashboardData.summary.pendingCount || 0}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Monthly</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {(dashboardData.summary.avgMonthly || 0).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">Savings Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {dashboardData.summary.budgetStatus?.savingsPotential || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const getColorClass = (index) => {
  const colors = ['bg-blue-50', 'bg-red-50', 'bg-green-50'];
  return colors[index % colors.length];
};

const getTextColorClass = (index) => {
  const colors = ['text-blue-600', 'text-red-600', 'text-green-600'];
  return colors[index % colors.length];
};

const getCardTitle = (index) => {
  const titles = ['Received', 'Spent', 'Remaining'];
  return titles[index % titles.length];
};

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white border rounded-xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, description, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <p className={`text-2xl font-bold mt-2 ${colorClasses[color]}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      {trend === 'up' && (
        <div className="flex items-center text-green-600 text-xs mt-2">
          <TrendingUp className="w-3 h-3 mr-1" />
          Increased
        </div>
      )}
      {trend === 'down' && (
        <div className="flex items-center text-red-600 text-xs mt-2">
          <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
          Decreased
        </div>
      )}
    </div>
  );
}

function PieChartComponent({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedAngle = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
        No data available for this range
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      <div className="relative w-48 h-48 flex-shrink-0 animate-in fade-in zoom-in duration-500">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90 drop-shadow-sm"
        >
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            if (percentage === 0) return null;
            const angle = (percentage / 100) * 360;
            const largeArcFlag = angle > 180 ? 1 : 0;

            const x1 = 50 + 40 * Math.cos((accumulatedAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((accumulatedAngle * Math.PI) / 180);

            const x2 =
              50 + 40 * Math.cos(((accumulatedAngle + angle) * Math.PI) / 180);
            const y2 =
              50 + 40 * Math.sin(((accumulatedAngle + angle) * Math.PI) / 180);

            const path = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`,
            ].join(' ');

            accumulatedAngle += angle;

            return (
              <path
                key={index}
                d={path}
                fill={item.color}
                stroke="white"
                strokeWidth="1.5"
                className="hover:opacity-90 transition-all duration-300 cursor-pointer"
              >
                <title>{`${item.name}: ₹${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`}</title>
              </path>
            );
          })}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="white"
            className="shadow-inner"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">
              Total
            </p>
            <p className="text-base font-black text-gray-900 leading-none">
              ₹
              {total >= 100000
                ? `${(total / 100000).toFixed(1)}L`
                : total >= 1000
                  ? `${Math.round(total / 1000)}k`
                  : total}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full max-h-[220px] overflow-y-auto pr-2 custom-scrollbar border-l border-gray-50 pl-6">
        <div className="space-y-2.5">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between group hover:bg-blue-50/50 p-2 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center min-w-0 mr-4">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-3 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="text-xs font-semibold text-gray-700 truncate max-w-[120px]"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-bold text-gray-900">
                  ₹{item.value.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full min-w-[45px] text-center border border-blue-100/50">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
          border: 1px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

function ComparisonChart({ data }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const isHighDensity = data.length > 12;

  return (
    <div className="w-full h-full overflow-x-auto custom-scrollbar pb-2">
      <div
        className="flex items-end justify-between h-full px-4 min-w-max"
        style={{ width: isHighDensity ? `${data.length * 60}px` : '100%' }}
      >
        {data.map((day, index) => {
          const previousAmount =
            index > 0 ? data[index - 1].amount : day.amount;
          const difference = day.amount - previousAmount;
          const percentageChange =
            previousAmount > 0
              ? ((difference / previousAmount) * 100).toFixed(1)
              : 0;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 min-w-[50px] group"
            >
              <div className="relative h-40 w-full flex items-end justify-center px-1">
                <div
                  className="relative w-full max-w-[24px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-all duration-300 shadow-sm"
                  style={{ height: `${(day.amount / maxAmount) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                    ₹{day.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 h-10 flex items-start justify-center text-center">
                <span
                  className={`text-[10px] text-gray-600 font-medium whitespace-nowrap ${isHighDensity ? 'rotate-45 origin-left mt-1' : ''}`}
                >
                  {day.day}
                </span>
              </div>

              <div className="h-6 flex items-center justify-center">
                {index > 0 ? (
                  <span
                    className={`text-[10px] font-bold px-1 rounded flex items-center ${
                      difference > 0
                        ? 'text-red-600 bg-red-50'
                        : difference < 0
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-500 bg-gray-50'
                    }`}
                  >
                    {difference > 0 ? '↑' : difference < 0 ? '↓' : '•'}
                    {Math.abs(percentageChange)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-300">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default DashboardTab;
