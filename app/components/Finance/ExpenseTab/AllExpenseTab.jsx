// components/FinanceForm/Tabs/AllExpenseTab.jsx
import React, { useState } from 'react';
import CustomTable from '../../../components/CustomTable';
import Button from '../../Buttons/Button';
import IconButton from '../../Buttons/IconButton';
import {
  SquarePen,
  Trash,
  Eye,
  X,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import CustomAlertForm from '../../../components/CustomAlertForm';
import Pagination from '../../../components/Pagination';
import { showSuccessToast, showErrorToast } from '../../../components/Toast';
import FilterDropdown from '../../Buttons/FilterDropdown';

const AllExpenseTab = ({
  expenses = [],
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

      onDeleteSuccess?.(expenseToDelete.id);
      showSuccessToast('Expense deleted successfully!');
      setShowDeleteConfirm(false);
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
        <div className="flex justify-center items-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Loading expenses...</p>
          </div>
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
