'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import Loader from '../../../components/Loader';
import DashboardTab from '../ExpenseTab/DashboardTab';
import AllExpenseTab from '../ExpenseTab/AllExpenseTab';
import CashFlowTab from '../ExpenseTab/CashFlowTab';
import FilterDropdown from '../../Buttons/FilterDropdown';
import TabButton from '../../Buttons/TabButton';

const ExpensesTable = ({
  expenses: propExpenses = [],
  isLoading: propIsLoading = false,
  onViewDetail,
  onDelete,
  onAddExpense,
  onEdit,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [pettyCashFlows, setPettyCashFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');
  const [periodRange, setPeriodRange] = useState('weekly');
  const [yearRange, setYearRange] = useState('');

  const now = new Date();
  const [selectedMonthNum, setSelectedMonthNum] = useState('all'); // Default to all
  const [selectedYear, setSelectedYear] = useState('all'); // Default to all

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Dynamic year options from 2025 to current year
  const startYear = 2025;
  const currentYear = now.getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= startYear; y--) {
    yearOptions.push(y.toString());
  }

  // Filter months based on range: Sep-2025 to Current Month
  const filteredMonthOptions = monthOptions.filter((m) => {
    if (selectedYear === 'all') return true;
    
    const monthVal = parseInt(m.value);
    const selectedYearInt = parseInt(selectedYear);
    const currentMonthNum = now.getMonth() + 1;

    if (selectedYearInt === 2025) {
      return monthVal >= 9;
    }
    if (selectedYearInt === currentYear) {
      return monthVal <= currentMonthNum;
    }
    return true;
  });

  const data = expenses;
  const filteredData = (data || []).filter((expense) => {
    const dateValue = expense.expenseDate || expense.date;
    const expenseDate = new Date(dateValue);
    const expMonthNum = (expenseDate.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const expYear = expenseDate.getFullYear().toString();

    const matchesMonth =
      selectedMonthNum === 'all' || expMonthNum === selectedMonthNum;
    const matchesYear = selectedYear === 'all' || expYear === selectedYear;

    const searchLower = (searchQuery || '').toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      expense.expenseNumber?.toLowerCase().includes(searchLower) ||
      expense.category?.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower) ||
      expense.vendor?.toLowerCase().includes(searchLower) ||
      expense.itemName?.toLowerCase().includes(searchLower) ||
      expense.remarks?.toLowerCase().includes(searchLower) ||
      expense.paymentMode?.toLowerCase().includes(searchLower) ||
      expense.paymentMethod?.toLowerCase().includes(searchLower) ||
      String(expense.amount || '')
        .toLowerCase()
        .includes(searchLower);

    const matchesCategory =
      selectedCategory === 'all' || expense.category === selectedCategory;

    return matchesSearch && matchesCategory && matchesMonth && matchesYear;
  });

  const availableCategories = [
    'all',
    ...new Set(expenses.map((e) => e.category).filter(Boolean)),
  ];

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expRes, pcRes] = await Promise.all([
        fetch('/api/expense', { cache: 'no-store' }),
        fetch('/api/expense/petty-cash', { cache: 'no-store' }),
      ]);

      if (!expRes.ok) throw new Error('Failed to fetch expenses');
      if (!pcRes.ok) throw new Error('Failed to fetch petty cash flow');

      const expData = await expRes.json();
      const pcData = await pcRes.json();

      if (isMounted.current) {
        setExpenses(Array.isArray(expData) ? expData : []);
        setPettyCashFlows(Array.isArray(pcData) ? pcData : []);
      }
    } catch (err) {
      console.error('Fetch data failed:', err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.refreshFinanceData = fetchData;
    return () => {
      delete window.refreshFinanceData;
    };
  }, []);

  const handleRefresh = () => {
    if (window.refreshFinanceData) window.refreshFinanceData();
  };

  const handleExpenseSaved = (savedExpense) => {
    setExpenses((prev) => {
      const index = prev.findIndex((e) => e.id === savedExpense.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = savedExpense;
        return updated;
      }
      return [savedExpense, ...prev];
    });
  };

  const handleDeleteSuccess = async (deletedId) => {
    setIsLoading(true);
    setExpenses((prev) => prev.filter((e) => e.id !== deletedId));
    await fetchData();
  };
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedMonthNum('all');
      setSelectedYear('all');
      setAnimating(false);
      fetchData();
    }, 400);
  };

  const handleAddExpense = () => {
    if (onAddExpense) onAddExpense();
  };
  const handleEditExpense = (expense) => {
    if (onEdit) onEdit(expense);
  };

  const handleViewExpense = (expense) => {
    if (onViewDetail) onViewDetail(expense);
  };

  const handleDeleteExpense = (id) => {
    if (onDelete) onDelete(id);
  };
  const handleSaveExpense = (expenseData, mode) => {
    if (mode === 'add') {
      const newExpense = {
        ...expenseData,
        id: data.length + 1,
        vendor: 'New Vendor',
        approvedBy: 'Current User',
        department: 'General',
      };
    } else if (mode === 'edit') {
    }
  };

  const onViewAll = () => {
    setActiveTab('all');
  };

  return (
    <>
      <div>
        <div className="border-b border-gray-300">
          <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-hide gap-1.5">
            <TabButton
              isActive={activeTab === 'dashboard'}
              onClick={() => handleTabChange('dashboard')}
            >
              Dashboard
            </TabButton>
            <TabButton
              isActive={activeTab === 'all'}
              onClick={() => handleTabChange('all')}
            >
              All Expenses
            </TabButton>
            <TabButton
              isActive={activeTab === 'cashflow'}
              onClick={() => handleTabChange('cashflow')}
            >
              Cash Flow
            </TabButton>
          </div>
        </div>

        <div
          key={activeTab}
          className={`transition-all duration-400 ${
            animating ? 'opacity-0 translate-y-4' : 'animate-dashboard-reveal'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              expenses={expenses}
              periodRange={periodRange}
              setPeriodRange={setPeriodRange}
              yearRange={yearRange}
              setYearRange={setYearRange}
              onViewAll={onViewAll}
              isLoading={isLoading || propIsLoading || loading}
            />
          )}
          {activeTab === 'all' && (
            <AllExpenseTab
              expenses={filteredData}
              pettyCashFlows={pettyCashFlows}
              isLoading={isLoading || propIsLoading || loading}
              onEdit={handleEditExpense}
              onDeleteSuccess={handleDeleteSuccess}
              onView={handleViewExpense}
              // Filter States and Setters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMonthNum={selectedMonthNum}
              setSelectedMonthNum={setSelectedMonthNum}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              monthOptions={filteredMonthOptions}
              yearOptions={yearOptions}
              availableCategories={availableCategories}
            />
          )}
          {activeTab === 'cashflow' && (
            <CashFlowTab
              inflows={pettyCashFlows}
              expenses={expenses}
              onView={handleViewExpense}
              onRefresh={handleRefresh}
              isLoading={isLoading || propIsLoading || loading}
              selectedMonthNum={selectedMonthNum}
              setSelectedMonthNum={setSelectedMonthNum}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              monthOptions={filteredMonthOptions}
              yearOptions={yearOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ExpensesTable;
