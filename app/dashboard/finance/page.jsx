'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import OverviewForm from '../../components/Finance/Overview';
import InvoiceTable from '../../components/Finance/InvoiceTab/Invoice';
import PaymentTable from '../../components/Finance/PaymentTab/Payment';
import ExpensesTable from '../../components/Finance/ExpenseTab/Expenses';
import Loader from '../../components/Loader';
import AddExpenseModal from '../../components/Finance/ExpenseTab/AddExpenseModal';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import TabButton from '../../components/Buttons/TabButton';
import Button from '../../components/Buttons/Button';
import CustomModalForm from '../../components/CustomModalForm';
import { ChartNoAxesCombined } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import NotificationBell from '../../components/NotificationBell';

const TAB_CONFIG = [
  { id: 'overview', label: 'Dashboard', right: 'finance_view_overview' },
  { id: 'invoice', label: 'Invoice', right: 'finance_view_invoices' },
  { id: 'payment', label: 'Payments', right: 'finance_view_payments' },
  { id: 'expenses', label: 'Expenses', right: 'finance_view_expenses' },
];

function FinanceContent() {
  const authUser = useSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ... (rest of the logic remains the same)

  // Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState('add');
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Compute visible tabs based on rights
  const visibleTabs = useMemo(() => {
    if (!authUser) return [];

    const { role, rights = [] } = authUser;
    const roleName = (role?.name || role?.roleName || '').toUpperCase();
    const isSuperAdmin =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      rights.includes('ALL_ACCESS');

    if (isSuperAdmin) return TAB_CONFIG;

    return TAB_CONFIG.filter((tab) => rights.includes(tab.right));
  }, [authUser]);

  // Set initial active tab based on visible tabs and URL parameters
  useEffect(() => {
    if (visibleTabs.length > 0) {
      const tabParam = searchParams?.get('tab');

      // If URL param matches a visible tab, use it
      if (tabParam && visibleTabs.find((t) => t.id === tabParam)) {
        if (activeTab !== tabParam) {
          setActiveTab(tabParam);
        }
      }
      // Otherwise, if no active tab is set or current tab is invalid, default to first visible
      else if (!activeTab || !visibleTabs.find((t) => t.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
      }
    }
  }, [visibleTabs, activeTab, searchParams]);

  // Fetch Expenses from API
  const fetchExpenses = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch('/api/expense');
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match your existing structure
        const transformedExpenses = data.map((expense) => ({
          ...expense,
          type: 'expense',
          expenseNumber: `EXP-${expense.id.slice(-6).toUpperCase()}`,
          description: expense.itemName,
          vendor: 'Company', // You might want to add vendor to your expense API
          paymentMethod: expense.paymentMode,
          paymentStatus: expense.status || 'pending',
          receiptNumber: `REC-${expense.id.slice(-6).toUpperCase()}`,
          approvedBy: 'Admin',
          department: 'General',
          notes: expense.remarks || 'No notes',
          // Map API fields to your existing structure
          date: expense.expenseDate,
          category: expense.category,
          amount: expense.amount,
        }));
        setExpenses(transformedExpenses);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Invoices from API
  const fetchInvoices = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        // The service already transforms data to match much of what we need
        // Just ensure type is set for the combined View
        const transformedInvoices = data.map((inv) => ({
          ...inv,
          type: 'invoice',
          // ensure dates are strings if UI expects them
          date: inv.invoiceDate,
          dueDate: inv.dueDate,
        }));
        setInvoices(transformedInvoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchExpenses();
    fetchInvoices();
  }, []);

  // Open View Modal
  const openView = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // Close View Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // Delete Expense via API
  const handleDeleteExpense = async (expenseId) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/expense/${expenseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== expenseId)
        );

        // Close modal if the deleted expense is currently open
        if (selectedRecord && selectedRecord.id === expenseId) {
          closeModal();
        }
        setShowDeleteConfirm(false);
        setRecordToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Delete expense failed:', error);
      showErrorToast(error.message || 'Unable to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (invoiceId) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.filter((invoice) => invoice.id !== invoiceId)
        );
        if (selectedRecord && selectedRecord.id === invoiceId) {
          closeModal();
        }
        setShowDeleteConfirm(false);
        setRecordToDelete(null);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Invoice (Refreshes Data)
  const handleCreateInvoice = async (invoiceData) => {
    // Invoice creation is handled inside InvoiceTable -> InvoiceModal -> API
    // We just need to refresh the list here if InvoiceTable doesn't do it automatically.
    // However, InvoiceTable maintains its own state in the original file, but here we pass `invoices` prop.
    // Wait, InvoiceTable in Invoice.jsx fetches its own data in `useEffect`.
    // But FinancePage PASSES `invoices` to InvoiceTable!
    // Invoice.jsx: const [invoicesData, setInvoicesData] = useState([]); ... useEffect fetch.
    // It ignores props.invoices? Let's check Invoice.jsx again.
    // Invoice.jsx export default InvoiceTable = () => { ... } no props!
    // Ah, logic conflict. The Finance Page tries to manage state, but Invoice.jsx manages its own state.
    // PaymentTable relies on `invoices` prop passed from here.
    // So FinancePage MUST fetch invoices to populate PaymentTable.

    await fetchInvoices();
  };

  // Add Expense via Modal
  const handleAddExpense = () => {
    setExpenseModalMode('add');
    setSelectedExpense(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setExpenseModalMode('edit');
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleViewExpense = (expense) => {
    setExpenseModalMode('view');
    setSelectedExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleExpenseSuccess = async () => {
    // Re-fetch in FinancePage silently to update combined financeData
    await fetchExpenses(true);

    // Trigger internal refresh in ExpensesTable to update its local state without layout reset
    if (typeof window !== 'undefined' && window.refreshFinanceData) {
      window.refreshFinanceData();
    }

    setExpenseModalOpen(false);
  };

  // Mark Invoice as Paid via API
  const handleMarkAsPaid = async (updatedInvoice) => {
    setIsLoading(true);
    try {
      // Calculate amount being paid in this transaction
      // PaymentModal updates `paymentStatus` to 'paid' or 'partial' locally in `updatedInvoice` object relative to PREVIOUS state
      // But we need the ACTUAL AMOUNT being paid right now to send to API
      // `updatedInvoice` passed from Payment.jsx is the RESULTING invoice state.
      // E.g. remainingAmount is new remaining.
      // We need to deduce what was paid? Or simply pass the payment amount explicitly from Payment.jsx?
      // Payment.jsx logic is: handleSubmitPayment -> calls onMarkAsPaid(updatedInvoice).

      // Hack: We can diff the amounts?
      // oldInvoice = invoices.find(i => i.id === updatedInvoice.id)
      // paidAmount = oldInvoice.remainingAmount - updatedInvoice.remainingAmount

      // BETTER: We should rely on `updatedInvoice` having everything we need if we trust Payment.jsx, but Payment.jsx logic is pure frontend state manip.

      // Let's modify Payment.jsx to pass payment details? Or infer here.
      // Let's infer for minimal changes.

      const oldInvoice = invoices.find((i) => i.id === updatedInvoice.id);
      if (!oldInvoice) return;

      const oldRem = oldInvoice.remainingAmount ?? oldInvoice.totalAmount;
      const newRem = updatedInvoice.remainingAmount ?? 0; // if null (paid), then 0

      const amountPaid = oldRem - newRem;

      if (amountPaid <= 0) {
        // Maybe it was fully paid and amountPaid checks out?
        // If status is paid, remaining is 0.
      }

      const payload = {
        invoiceId: updatedInvoice.id,
        amount: amountPaid,
        paymentMethod: updatedInvoice.paymentMethod,
        paymentDate: updatedInvoice.paymentDate,
        notes: updatedInvoice.notes,
        referenceNumber: updatedInvoice.referenceNumber,
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to record payment');

      await fetchInvoices(); // Refresh all data
      showSuccessToast('Payment recorded successfully!');
    } catch (err) {
      console.error(err);
      showErrorToast('Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete based on record type
  const handleDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!recordToDelete) return;
    if (recordToDelete.type === 'expense') {
      handleDeleteExpense(recordToDelete.id);
    } else {
      handleDeleteInvoice(recordToDelete.id);
    }
  };

  // Combined data for overview
  const financeData = [...invoices, ...expenses];

  if (!authUser) return null; // Wait for auth

  if (visibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        You do not have access to any Finance modules.
      </div>
    );
  }

  return (
    <div className="text-left h-full flex flex-col min-h-0">
      <div className="bg-white rounded-2xl shadow-sm p-2.5 m-0.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
            <ChartNoAxesCombined size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Finance Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track invoices, expenses, and financial transactions.
            </p>
          </div>
        </div>
        {activeTab === 'expenses' && (
          <PrimaryButton onClick={handleAddExpense}>
            <span className="text-xl mr-1">+</span>
            Add Expense
          </PrimaryButton>
        )}
        <NotificationBell />
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm p-2.5 m-0.5 mt-1.5 min-h-0">
        <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-4 mb-3 border-b border-gray-300 w-full">
          <div className="flex items-center overflow-x-auto gap-1.5">
            {visibleTabs.map((tab) => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>

        <div
          key={activeTab}
          className="flex-1 overflow-y-auto no-scrollbar transition-all duration-400 min-h-0 animate-dashboard-reveal"
        >
          {isLoading && activeTab !== 'expenses' ? (
            <div className="flex justify-center items-center py-20 min-h-[400px]">
              <Loader label="Loading content..." />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewForm financeData={financeData} />
              )}
              {activeTab === 'invoice' && (
                <InvoiceTable
                  invoices={invoices}
                  onViewDetail={openView}
                  onDelete={handleDeleteInvoice}
                  onCreateInvoice={handleCreateInvoice}
                  onRefresh={fetchInvoices}
                />
              )}
              {activeTab === 'payment' && (
                <PaymentTable
                  invoices={invoices}
                  onMarkAsPaid={handleMarkAsPaid}
                  onViewDetail={openView}
                  isProcessingPayment={isLoading}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesTable
                  expenses={expenses}
                  isLoading={isLoading}
                  onViewDetail={handleViewExpense}
                  onDelete={handleDeleteExpense}
                  onAddExpense={handleAddExpense}
                  onEdit={handleEditExpense}
                  onRefresh={fetchExpenses}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {isModalOpen && selectedRecord && (
        <CustomModalForm
          open={isModalOpen}
          onClose={closeModal}
          title={
            <>
              View {selectedRecord.type === 'invoice' ? 'Invoice' : 'Expense'}:{' '}
              {selectedRecord.type === 'invoice'
                ? selectedRecord.invoiceNumber
                : selectedRecord.expenseNumber}
            </>
          }
          widthClass="max-w-4xl"
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button onClick={closeModal} className="px-4 py-2">
                Close
              </Button>

              {selectedRecord.type === 'expense' && (
                <PrimaryButton
                  onClick={() => {
                    closeModal();
                    handleEditExpense(selectedRecord);
                  }}
                  className="px-4 py-2 shadow-none flex items-center"
                >
                  Edit Expense
                </PrimaryButton>
              )}
              <PrimaryButton
                onClick={() => handleDelete(selectedRecord)}
                disabled={isLoading}
                className="px-4 py-2 !bg-red-600 hover:!bg-red-700 shadow-none"
              >
                {isLoading ? 'Deleting...' : 'Delete Record'}
              </PrimaryButton>
            </div>
          }
        >
          <div className="p-1">
            <p className="text-sm text-gray-500 mb-6">
              {selectedRecord.category} •{' '}
              {new Date(selectedRecord.date).toLocaleDateString()}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedRecord.type === 'invoice'
                      ? 'Invoice Number'
                      : 'Expense Number'}
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedRecord.type === 'invoice'
                      ? selectedRecord.invoiceNumber
                      : selectedRecord.expenseNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="text-gray-900 border-b border-gray-100 pb-1">
                    {selectedRecord.description}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <div className="text-gray-900 border-b border-gray-100 pb-1">
                    {selectedRecord.vendor}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="text-gray-900 border-b border-gray-100 pb-1">
                    {selectedRecord.category}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="text-gray-900 border-b border-gray-100 pb-1">
                    {new Date(selectedRecord.date).toLocaleDateString()}
                  </div>
                </div>

                {selectedRecord.type === 'invoice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <div className="text-gray-900 border-b border-gray-100 pb-1">
                      {new Date(selectedRecord.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Amount Details
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">
                        Base Amount:
                      </span>
                      <span className="font-medium">
                        ₹
                        {selectedRecord.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {selectedRecord.type === 'invoice' &&
                      selectedRecord.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Tax:</span>
                          <span className="font-medium">
                            ₹{selectedRecord.tax.toLocaleString()}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-bold">
                        Total Payable:
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹
                        {selectedRecord.totalAmount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) ||
                          selectedRecord.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <span
                    className={`px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedRecord.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : selectedRecord.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : selectedRecord.paymentStatus === 'approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {selectedRecord.paymentStatus}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <div className="text-gray-900 font-medium">
                    {selectedRecord.paymentMethod || selectedRecord.paymentMode}
                  </div>
                </div>

                {selectedRecord.paymentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <div className="text-gray-900">
                      {new Date(
                        selectedRecord.paymentDate
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {selectedRecord.referenceNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <div className="text-gray-900 font-mono text-xs">
                      {selectedRecord.referenceNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(selectedRecord.notes || selectedRecord.remarks) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Additional Notes
                </label>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                  {selectedRecord.notes ||
                    selectedRecord.remarks ||
                    'No notes available'}
                </div>
              </div>
            )}

            {selectedRecord.type === 'expense' && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  System Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Approved By
                    </label>
                    <div className="text-gray-900 font-medium">
                      {selectedRecord.approvedBy || 'Pending Approval'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Department
                    </label>
                    <div className="text-gray-900 font-medium">
                      {selectedRecord.department || 'General'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CustomModalForm>
      )}
      {/* Expense Modal */}
      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        mode={expenseModalMode}
        expenseData={selectedExpense}
        onSuccess={handleExpenseSuccess}
      />
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<Loader label="Loading Finance Module..." size="md" />}>
      <FinanceContent />
    </Suspense>
  );
}
