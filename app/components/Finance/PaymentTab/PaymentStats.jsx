// components/Finance/PaymentStats.jsx
'use client';

export default function PaymentStats({
  pendingInvoices,
  filteredOverdueInvoices,
  completedInvoices,
  upcomingPayments,
  totalFilteredPendingAmount,
  totalFilteredCompletedAmount,
  totalUpcomingAmount,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Pending Invoices</div>
        <div className="text-2xl font-bold text-gray-900">
          {pendingInvoices.length}
        </div>
        <div className="text-sm font-medium text-gray-700 mt-1">
          ₹{totalFilteredPendingAmount.toLocaleString()}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Overdue</div>
        <div className="text-2xl font-bold text-red-600">
          {filteredOverdueInvoices.length}
        </div>
        <div className="text-sm font-medium text-red-600 mt-1">
          ₹
          {filteredOverdueInvoices.reduce(
            (sum, inv) => sum + (inv.remainingAmount || inv.totalAmount),
            0
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Completed Payments</div>
        <div className="text-2xl font-bold text-green-600">
          {completedInvoices.length}
        </div>
        <div className="text-sm font-medium text-green-600 mt-1">
          ₹{totalFilteredCompletedAmount.toFixed(2)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Upcoming Payments</div>
        <div className="text-2xl font-bold text-amber-600">
          {upcomingPayments.length}
        </div>
        <div className="text-sm font-medium text-amber-600 mt-1">
          ₹{totalUpcomingAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
