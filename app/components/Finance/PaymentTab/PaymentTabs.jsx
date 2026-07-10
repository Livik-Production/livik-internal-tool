// components/Finance/PaymentTabs.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, SquarePen, X } from 'lucide-react';
import CustomTable from '../../CustomTable'; // Adjust path as needed
import TabButton from '../../Buttons/TabButton';
import IconButton from '../../Buttons/IconButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import Pagination from '../../Pagination';

export default function PaymentTabs({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredPendingInvoices,
  filteredCompletedInvoices,
  totalFilteredPendingAmount,
  totalFilteredCompletedAmount,
  handleInvoiceDetailClick,
  handlePaymentClick,
  showLoading,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default to 10

  // Reset pagination when active tab or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDueDateStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return { text: 'Overdue', color: 'text-red-600', bg: 'bg-red-100' };
    if (diffDays <= 3)
      return {
        text: 'Due Soon',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
      };
    if (diffDays <= 7)
      return {
        text: 'Upcoming',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
      };
    return { text: 'On Track', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getClientCity = (invoice) => {
    return (
      invoice.clientCity ||
      invoice.customer?.city ||
      invoice.city ||
      'Not specified'
    );
  };

  const getClientMobile = (invoice) => {
    return (
      invoice.clientMobile ||
      invoice.customer?.mobile ||
      invoice.mobile ||
      invoice.phone ||
      'Not specified'
    );
  };

  // Filter out proforma invoices from pending invoices
  const actualPendingInvoices = filteredPendingInvoices.filter(
    (invoice) => invoice.invoiceType !== 'proforma'
  );

  // Calculate total amount for actual invoices only
  const totalActualPendingAmount = actualPendingInvoices.reduce(
    (sum, invoice) => sum + (invoice.amount || 0),
    0
  );

  // Count of actual pending invoices
  const actualPendingInvoicesCount = actualPendingInvoices.length;

  const paginatedPendingInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return actualPendingInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [actualPendingInvoices, currentPage, itemsPerPage]);

  const paginatedCompletedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCompletedInvoices.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredCompletedInvoices, currentPage, itemsPerPage]);

  // Filter for partial payments
  const partialInvoices = actualPendingInvoices.filter(
    (invoice) => invoice.paymentStatus === 'partial'
  );

  const partialPaymentsCount = partialInvoices.length;

  const paginatedPartialInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return partialInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [partialInvoices, currentPage, itemsPerPage]);

  // Pending Payments Table Columns
  const pendingColumns = [
    {
      key: 'invoice',
      label: 'Invoice',
      render: (invoice) => (
        <HyperlinkButton
          onClick={() => handleInvoiceDetailClick(invoice)}
          className="font-medium text-[#33a8d9] cursor-pointer hover:underline text-left flex flex-col items-start disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={showLoading}
        >
          <span className="text-sm font-semibold">{invoice.invoiceNumber}</span>
          <span className="text-xs text-gray-500 mt-0.5">
            {formatDate(invoice.date)}
          </span>
          {invoice.invoiceType && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${invoice.invoiceType === 'proforma'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
                }`}
              title="click to view pending payments"
            >
              {invoice.invoiceType === 'proforma' ? 'Proforma' : 'Actual'}
            </span>
          )}
        </HyperlinkButton>
      ),
    },
    {
      key: 'client',
      label: 'Client Name',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {invoice.client || invoice.customer?.name || 'Unknown Client'}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {getClientCity(invoice)}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (invoice) => (
        <div className="text-gray-900 font-medium text-center">
          {getClientMobile(invoice)}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900 text-base">
            ₹{invoice.amount}
          </div>
        </div>
      ),
    },
    {
      key: 'tax',
      label: 'Tax Amount',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-medium text-gray-700">
            ₹{invoice.tax.toFixed(2) || 0}
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (invoice) => {
        const dueStatus = getDueDateStatus(invoice.dueDate);
        return (
          <div className="text-center">
            <div className={`font-medium ${dueStatus.color} text-sm`}>
              {formatDate(invoice.dueDate)}
            </div>
            <div className="mt-1.5">
              <span
                className={`inline-block px-2.5 py-1 ${dueStatus.bg} ${dueStatus.color} rounded-full text-xs font-medium`}
              >
                {dueStatus.text}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (invoice) => {
        const dueStatus = getDueDateStatus(invoice.dueDate);
        const isPartial = invoice.paymentStatus === 'partial';
        return (
          <div className="text-center">
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${isPartial
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : dueStatus.text === 'Overdue'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
            >
              {isPartial ? `Partial ` : 'Pending'}
            </span>
          </div>
        );
      },
    },
  ];

  // Partial Payments Table Columns
  const partialColumns = [
    {
      key: 'invoice',
      label: 'Invoice',
      render: (invoice) => (
        <HyperlinkButton
          onClick={() => handleInvoiceDetailClick(invoice)}
          className="font-medium text-[#33a8d9] cursor-pointer hover:underline text-left flex flex-col items-start disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={showLoading}
        >
          <span className="text-sm font-semibold">{invoice.invoiceNumber}</span>
          <span className="text-xs text-gray-500 mt-0.5">
            {formatDate(invoice.date)}
          </span>
        </HyperlinkButton>
      ),
    },
    {
      key: 'client',
      label: 'Client Name',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {invoice.client || invoice.customer?.name || 'Unknown Client'}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {getClientCity(invoice)}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            ₹{invoice.totalAmount || invoice.amount || 0}
          </div>
        </div>
      ),
    },
    {
      key: 'partialAmount',
      label: 'Paid Amount',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-semibold text-green-600">
            ₹{invoice.partialAmount || 0}
          </div>
        </div>
      ),
    },
    {
      key: 'remainingAmount',
      label: 'Remaining Balance',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-semibold text-red-600">
            ₹{invoice.remainingAmount || 0}
          </div>
        </div>
      ),
    },

    {
      key: 'dueDate',
      label: 'Due Date',
      render: (invoice) => {
        const dueStatus = getDueDateStatus(invoice.dueDate);
        return (
          <div className="text-center">
            <div className={`font-medium ${dueStatus.color} text-sm`}>
              {formatDate(invoice.dueDate)}
            </div>
          </div>
        );
      },
    },
  ];

  // Completed Payments Table Columns
  const completedColumns = [
    {
      key: 'invoice',
      label: 'Invoice',
      render: (invoice) => (
        <HyperlinkButton
          onClick={() => handleInvoiceDetailClick(invoice)}
          className="font-medium text-[#33a8d9]  hover:underline text-left flex flex-col items-start disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={showLoading}
        >
          <span className="text-sm font-semibold">{invoice.invoiceNumber}</span>
          <span className="text-xs text-gray-500 mt-0.5">
            {formatDate(invoice.date)}
          </span>
          {invoice.invoiceType && (
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${invoice.invoiceType === 'proforma'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
                }`}
              title="click to view completed payments"
            >
              {invoice.invoiceType === 'proforma' ? 'Proforma' : 'Actual'}
            </span>
          )}
        </HyperlinkButton>
      ),
    },
    {
      key: 'client',
      label: 'Client Name',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {invoice.client || invoice.customer?.name || 'Unknown Client'}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {getClientCity(invoice)}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (invoice) => (
        <div className="text-gray-900 font-medium text-center">
          {getClientMobile(invoice)}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (invoice) => (
        <div className="text-center">
          <div className="font-semibold text-green-600 text-base">
            ₹{invoice.totalAmount}
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (invoice) => (
        <div className="font-medium text-gray-700 text-center">
          {formatDate(invoice.dueDate)}
        </div>
      ),
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      render: (invoice) => (
        <div className="font-medium text-gray-900 text-center">
          {formatDate(invoice.paymentDate)}
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Mode',
      render: (invoice) => (
        <div className="text-right">
          <span
            className={`inline-block px-3 py-1.5 text-xs font-medium rounded-lg ${invoice.paymentMethod === 'Bank Transfer'
              ? 'bg-purple-100 text-purple-800 border border-purple-200'
              : invoice.paymentMethod === 'Credit Card'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : invoice.paymentMethod === 'UPI'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : invoice.paymentMethod === 'Cheque'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : invoice.paymentMethod === 'Cash'
                      ? 'bg-gray-100 text-gray-800 border border-gray-200'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
          >
            {invoice.paymentMethod}
          </span>
        </div>
      ),
    },
  ];

  // Action column for pending invoices
  const pendingActions = (invoice) => (
    <div className="flex items-center justify-end">
      <IconButton
        onClick={() => handlePaymentClick(invoice)}
        disabled={showLoading}
        title="Edit Payment"
      >
        {showLoading ? (
          <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
        ) : (
          <SquarePen size={16} />
        )}
      </IconButton>
    </div>
  );

  // Empty state components
  const PendingEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <svg
        className="w-16 h-16 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
      <p className="text-lg font-medium text-gray-700 mb-2">
        {searchQuery
          ? 'No matching actual invoices found'
          : 'No pending actual invoices'}
      </p>
      <p className="text-sm text-gray-500">
        {searchQuery
          ? 'Try a different search term'
          : 'Proforma invoices are not shown in pending payments'}
      </p>
    </div>
  );

  const CompletedEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <svg
        className="w-16 h-16 text-gray-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-lg font-medium text-gray-700 mb-2">
        {searchQuery ? 'No matching payments found' : 'No completed payments'}
      </p>
      <p className="text-sm text-gray-500">
        {searchQuery
          ? 'Try a different search term'
          : 'All completed payments will appear here'}
      </p>
    </div>
  );

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex items-center space-x-2 mb-3 border-b border-gray-300">
        <TabButton
          isActive={activeTab === 'pending'}
          onClick={() => {
            setActiveTab('pending');
            setSearchQuery('');
          }}
          disabled={showLoading}
        >
          Pending Payments ({actualPendingInvoicesCount})
        </TabButton>

        <TabButton
          isActive={activeTab === 'partial'}
          onClick={() => {
            setActiveTab('partial');
            setSearchQuery('');
          }}
          disabled={showLoading}
        >
          Partial Payments ({partialPaymentsCount})
        </TabButton>

        <TabButton
          isActive={activeTab === 'completed'}
          onClick={() => {
            setActiveTab('completed');
            setSearchQuery('');
          }}
          disabled={showLoading}
        >
          Completed Payments ({filteredCompletedInvoices.length})
        </TabButton>
      </div>

      {/* Search Bar */}
      <div className="mb-3 justify-end flex">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'pending'
                  ? 'Search actual invoices (proforma excluded)...'
                  : 'Search completed payments...'
              }
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#173469]/20 focus:border-[#173469] focus:bg-white sm:text-sm transition-all duration-200"
              disabled={showLoading}
            />
            {searchQuery && (
              <div className="absolute right-1 top-1.5">
                <IconButton
                  onClick={() => setSearchQuery('')}
                  disabled={showLoading}
                  title="Clear search"
                >
                  <X size={16} />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Payments Table */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {actualPendingInvoices.length === 0 ? (
            <PendingEmptyState />
          ) : (
            <>
              <CustomTable
                columns={pendingColumns}
                data={paginatedPendingInvoices}
                actions={pendingActions}
                actionsHeader="Update"
                className="max-h-[60vh]"
                tableClassName="min-w-full divide-y divide-gray-200"
                theadClassName="bg-gray-50"
                tbodyClassName="bg-white divide-y divide-gray-200"
                rowClassName="hover:bg-gray-50/50 transition-colors duration-150"
              />
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    {actualPendingInvoicesCount} actual invoice
                    {actualPendingInvoicesCount !== 1 ? 's' : ''} found
                    {searchQuery && ` matching "${searchQuery}"`}
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Total Due (Actual Invoices)
                      </div>
                      <div className="text-lg font-bold text-[#173469]">
                        ₹{totalActualPendingAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200/80 pt-4 mt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={actualPendingInvoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Partial Payments Table */}
      {activeTab === 'partial' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {partialInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {searchQuery
                  ? 'No matching partial payments found'
                  : 'No partial payments'}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Invoices with partial payments will appear here'}
              </p>
            </div>
          ) : (
            <>
              <CustomTable
                columns={partialColumns}
                data={paginatedPartialInvoices}
                actions={pendingActions}
                actionsHeader="Update"
                className="max-h-[60vh]"
                tableClassName="min-w-full divide-y divide-gray-200"
                theadClassName="bg-gray-50"
                tbodyClassName="bg-white divide-y divide-gray-200"
                rowClassName="hover:bg-gray-50/50 transition-colors duration-150"
              />
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    {partialPaymentsCount} partial payment
                    {partialPaymentsCount !== 1 ? 's' : ''} found
                    {searchQuery && ` matching "${searchQuery}"`}
                  </div>
                </div>
                <div className="border-t border-gray-200/80 pt-4 mt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={partialInvoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Completed Payments Table */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {filteredCompletedInvoices.length === 0 ? (
            <CompletedEmptyState />
          ) : (
            <>
              <CustomTable
                columns={completedColumns}
                data={paginatedCompletedInvoices}
                className="max-h-[60vh]"
                tableClassName="min-w-full divide-y divide-gray-200"
                theadClassName="bg-gray-50"
                tbodyClassName="bg-white divide-y divide-gray-200"
                rowClassName="hover:bg-gray-50/50 transition-colors duration-150"
              />
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    {filteredCompletedInvoices.length} payment
                    {filteredCompletedInvoices.length !== 1 ? 's' : ''} found
                    {searchQuery && ` matching "${searchQuery}"`}
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Paid</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{totalFilteredCompletedAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200/80 pt-4 mt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredCompletedInvoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 20, 50, 100]}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
