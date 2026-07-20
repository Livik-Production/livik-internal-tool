// components/FinanceForm/Tabs/AllExpenseTab.jsx
import React, { useState } from 'react';
import CustomTable from '../../../components/CustomTable';
import Button from '../../Buttons/Button';
import IconButton from '../../Buttons/IconButton';
import Loader from '../../Loader';
import {
  SquarePen,
  Trash,
  Eye,
  X,
  Search,
  SortAsc,
  SortDesc,
  PieChart,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import CustomAlertForm from '../../../components/CustomAlertForm';
import Pagination from '../../../components/Pagination';
import { showSuccessToast, showErrorToast } from '../../../components/Toast';
import FilterDropdown from '../../Buttons/FilterDropdown';

function DonutChart({ data }) {
  const total = React.useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  let accumulatedAngle = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-full h-40 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
        No expense data to display
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full h-full">
      <div className="relative w-36 h-36 flex-shrink-0 animate-in fade-in zoom-in duration-300">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            if (percentage === 0) return null;
            const angle = (percentage / 100) * 360;
            const largeArcFlag = angle > 180 ? 1 : 0;

            const x1 = 50 + 40 * Math.cos((accumulatedAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((accumulatedAngle * Math.PI) / 180);

            const x2 = 50 + 40 * Math.cos(((accumulatedAngle + angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((accumulatedAngle + angle) * Math.PI) / 180);

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
          <circle cx="50" cy="50" r="26" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider mb-0.5">
              Total
            </p>
            <p className="text-xs font-black text-gray-900 leading-none font-bold">
              ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total >= 1000 ? `${Math.round(total / 1000)}k` : total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow w-full max-h-[144px] overflow-y-auto pr-1 no-scrollbar border-l border-gray-100 pl-4 sm:pl-6">
        <div className="space-y-1.5">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between group hover:bg-gray-50/50 px-1.5 py-1 rounded transition-colors duration-200"
            >
              <div className="flex items-center min-w-0 mr-4">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="text-xs font-medium text-gray-600 truncate max-w-[120px]"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-gray-900">
                  ₹{item.value.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-[#004475] bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100/30">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendBarChart({ data }) {
  const maxAmount = React.useMemo(() => Math.max(...data.map((d) => d.amount), 1), [data]);
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-40 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
        No expense trend data
      </div>
    );
  }

  const isHighDensity = data.length > 8;

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-2 pt-4">
        <div
          className="flex items-end justify-between h-32 px-2 min-w-max"
          style={{ width: isHighDensity ? `${data.length * 45}px` : '100%' }}
        >
          {data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center flex-1 min-w-[36px] group relative"
            >
              <div className="h-24 w-full flex items-end justify-center px-1">
                <div
                  className="relative w-full max-w-[14px] bg-gradient-to-t from-[#004475] to-[#33a8d9] rounded-t hover:from-[#00335a] hover:to-[#2890c0] transition-all duration-300 shadow-sm"
                  style={{ height: `${Math.max((item.amount / maxAmount) * 100, 4)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none font-bold">
                    ₹{item.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center h-6 flex items-start justify-center">
                <span
                  className={`text-[9px] text-gray-500 font-bold whitespace-nowrap ${isHighDensity ? 'rotate-45 origin-left mt-0.5 pl-1' : ''}`}
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const AllExpenseTab = ({
  expenses = [],
  pettyCashFlows = [],
  isLoading = false,
  onEdit,
  onView,
  onDeleteSuccess,
  // Filter Props
  searchQuery,
  setSearchQuery,
  selectedMonthNum,
  setSelectedMonthNum,
  selectedYear,
  setSelectedYear,
  selectedCategory,
  setSelectedCategory,
  monthOptions = [],
  yearOptions = [],
  availableCategories = [],
}) => {
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const latestPettyCash = React.useMemo(() => {
    if (!pettyCashFlows || pettyCashFlows.length === 0) return null;
    return [...pettyCashFlows].sort((a, b) => new Date(b.receiveDate) - new Date(a.receiveDate))[0];
  }, [pettyCashFlows]);

  const [latestPettyCashDetail, setLatestPettyCashDetail] = useState(null);

  React.useEffect(() => {
    if (latestPettyCash?.id) {
      fetch(`/api/expense/petty-cash?id=${latestPettyCash.id}`)
        .then(res => res.json())
        .then(data => setLatestPettyCashDetail(data))
        .catch(err => console.error(err));
    }
  }, [latestPettyCash?.id]);

  const chartCategories = React.useMemo(() => {
    const categoriesMap = {};
    let totalAmt = 0;
    expenses.forEach((exp) => {
      const cat = exp.category || 'Uncategorized';
      const amt = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount || 0);
      categoriesMap[cat] = (categoriesMap[cat] || 0) + amt;
      totalAmt += amt;
    });

    const PIE_COLORS = [
      '#004475',
      '#33a8d9',
      '#f59e0b',
      '#10b981',
      '#ec4899',
      '#8b5cf6',
      '#ef4444',
      '#14b8a6',
    ];

    return Object.entries(categoriesMap)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalAmt > 0 ? (value / totalAmt) * 100 : 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const trendData = React.useMemo(() => {
    const validExpenses = expenses.filter(e => e.expenseDate || e.date);
    if (validExpenses.length === 0) return [];
    
    const dates = validExpenses.map(e => new Date(e.expenseDate || e.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const sameMonth = minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear();
    
    const groups = {};
    validExpenses.forEach(exp => {
      const d = new Date(exp.expenseDate || exp.date);
      const amt = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount || 0);
      
      let key;
      if (sameMonth) {
        key = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      } else {
        key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
      }
      
      groups[key] = (groups[key] || 0) + amt;
    });
    
    return Object.entries(groups)
      .map(([label, amount]) => {
        let dateObj;
        if (sameMonth) {
          dateObj = new Date(`${label} ${minDate.getFullYear()}`);
        } else {
          const [m, y] = label.split(" '");
          dateObj = new Date(`1 ${m} 20${y}`);
        }
        return { label, amount, dateObj };
      })
      .sort((a, b) => a.dateObj - b.dateObj)
      .map(({ label, amount }) => ({ label, amount }));
  }, [expenses]);

  const handleItemsPerPageChange = (newCount) => {
    setItemsPerPage(newCount);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleDeleteExpense = (expenseId) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/expense/${expenseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete expense');
      }

      setShowDeleteConfirm(false);
      onDeleteSuccess?.(expenseToDelete.id);
      showSuccessToast('Expense deleted successfully!');
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Delete expense failed:', error);
      showErrorToast(error.message || 'Unable to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'expenseDetails',
      label: 'Expense ID',
      className: 'text-left',
      render: (row) => (
        <div className="text-left">
          <div
            className="group cursor-pointer"
            onClick={() => onView && onView(row)}
          >
            <div className="font-medium text-[#004475]  group-hover:text-[#33a8d9] transition-colors inline-flex items-center">
              {row.itemName || row.description}
              <svg
                className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>

          {row.id && (
            <div className="text-xs text-gray-500 mt-1">
              Expense ID: <span className="font-mono">{row.id}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'expenseUses',
      label: 'Expense Description',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="text-sm text-gray-500">
            {row.category || 'Uncategorized'}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {row.remarks || row.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      className: 'text-center',
      render: (row) => {
        const dateValue = row.expenseDate || row.date;
        return (
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {dateValue
                ? new Date(dateValue).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {dateValue
                ? new Date(dateValue).toLocaleDateString('en-US', {
                    weekday: 'short',
                  })
                : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900 text-lg">
            ₹
            {typeof row.amount === 'number'
              ? row.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : parseFloat(row.amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Mode',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {row.paymentMode || row.paymentMethod || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 mt-1"></div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end flex-nowrap">
          <IconButton
            onClick={() => onEdit && onEdit(row)}
            title="Edit Expense"
          >
            <SquarePen size={16} />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteExpense(row.id)}
            disabled={
              expenseToDelete && expenseToDelete.id === row.id && isDeleting
            }
            title="Delete Expense"
            variant="danger"
          >
            {expenseToDelete && expenseToDelete.id === row.id && isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <Trash size={16} />
            )}
          </IconButton>
        </div>
      ),
    },
  ];

  // Sorting logic
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.expenseDate || a.date || 0);
    const dateB = new Date(b.expenseDate || b.date || 0);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Pagination Logic
  const totalItems = sortedExpenses.length;
  const currentData = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-2">
      {/* Search and Filters Bar - All unified in one flex container with consistent gaps */}
      <div className="flex flex-wrap items-center justify-end mt-2 w-full gap-2">
        {latestPettyCashDetail && (
          <div className="mr-auto animate-dashboard-reveal">
            <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-3">
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-0">
                Balance in Hand
              </p>
              <p className="text-sm font-extrabold text-indigo-900">
                ₹{Number(latestPettyCashDetail.closingBalance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full md:w-56 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={16} />
          </div>

          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all duration-200 bg-white shadow-sm"
          />

          {searchQuery && (
            <div className="absolute right-1 top-1">
              <IconButton
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </IconButton>
            </div>
          )}
        </div>

        {/* Filters */}
        <FilterDropdown
          options={[{ value: 'all', label: 'All Months' }, ...monthOptions]}
          value={selectedMonthNum}
          onChange={setSelectedMonthNum}
          placeholder="Month"
          className="w-full md:w-32"
        />

        <FilterDropdown
          options={[
            { value: 'all', label: 'All Years' },
            ...yearOptions.map((y) => ({ value: y, label: y })),
          ]}
          value={selectedYear}
          onChange={setSelectedYear}
          placeholder="Year"
          className="w-full md:w-29"
        />

        <FilterDropdown
          options={availableCategories.map((cat) => ({
            value: cat,
            label: cat === 'all' ? 'All Categories' : cat,
          }))}
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="Category"
          className="w-full md:w-38"
        />

        {/* Sort Button */}
        <Button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 w-full md:w-auto"
        >
          {sortOrder === 'asc' ? (
            <SortAsc size={18} className="text-blue-600 mr-2" />
          ) : (
            <SortDesc size={18} className="text-blue-600 mr-2" />
          )}
          <span className="md:hidden lg:inline text-sm font-medium">
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm min-h-[400px]">
          <Loader label="Loading expenses..." size="md" fullScreen={false} />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-600 bg-white rounded-lg border border-gray-100 shadow-sm">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-700">No expenses found</p>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or filters to find what you're looking for
          </p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-5 border border-gray-200 rounded-2xl shadow-sm mb-4 animate-dashboard-reveal">
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 flex flex-col h-full min-h-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <PieChart size={16} className="text-[#004475]" />
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Category Breakdown
                </h4>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <DonutChart data={chartCategories} />
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 flex flex-col h-full min-h-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={16} className="text-[#004475]" />
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Expense Trend
                </h4>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <TrendBarChart data={trendData} />
              </div>
            </div>
          </div>

          <CustomTable
            columns={columns}
            data={currentData}
            rowKey="id"
            className="border border-gray-200 rounded-lg"
            maxHeight="60vh"
            showScrollbar={true}
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-sm text-gray-600">
              Showing {expenses.length} expense
              {expenses.length !== 1 ? 's' : ''}
            </div>
            <div className="text-sm font-medium text-gray-900">
              Total: ₹
              {expenses
                .reduce((sum, expense) => {
                  const amount =
                    typeof expense.amount === 'number'
                      ? expense.amount
                      : parseFloat(expense.amount || 0);
                  return sum + amount;
                }, 0)
                .toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </div>
          </div>
        </>
      )}

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          expenseToDelete && (
            <div className="text-sm">
              <p className="font-bold">
                {expenseToDelete.itemName || expenseToDelete.description}
              </p>
              <p className="text-gray-500">
                ₹{parseFloat(expenseToDelete.amount || 0).toLocaleString()}
              </p>
            </div>
          )
        }
      />
    </div>
  );
};

export default AllExpenseTab;
