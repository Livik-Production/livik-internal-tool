'use client';

import React from 'react';

/**
 * InvoiceWidget - Displays a summary of completed and pending payments.
 * Extracted from AdminDashboard for shared use.
 */
export default function InvoiceWidget({ invoiceData = [], paymentData = [] }) {
  const completedPayments = paymentData;
  const pendingInvoices = invoiceData.filter(
    (inv) =>
      (inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial') &&
      inv.invoiceType !== 'proforma'
  );

  const completedTotal = completedPayments.reduce(
    (sum, pay) => sum + (Number(pay.amount) || Number(pay.receivedAmount) || 0),
    0
  );
  const pendingTotal = pendingInvoices.reduce(
    (sum, inv) =>
      sum +
      (Number(inv.remainingAmount) ||
        Number(inv.total) ||
        Number(inv.totalAmount) ||
        0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Half: Approved / Completed */}
      <div className="flex-1 pb-4 flex flex-col">
        <span className="text-xl font-bold text-[#2daadf] mb-1">Invoices</span>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[15px] font-bold text-[#004475]">
            Completed Payments
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-md font-bold text-[#004475]">
              ₹{completedTotal.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              {completedPayments.length} PAID
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar flex-grow">
          {completedPayments.length > 0 ? (
            completedPayments.slice(0, 5).map((pay, i) => (
              <div
                key={pay.id || i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 w-[40%]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-[10px] font-black border border-emerald-100">
                    {(pay.client || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-gray-800 leading-none mb-1 truncate">
                      {pay.client || 'Unknown Client'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">
                      {pay.invoiceNumber || `INV-${i + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Paid On
                  </span>
                  <span className="text-[10px] font-black text-[#004475] tracking-tight">
                    {pay.paymentDate
                      ? new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'N/A'}
                  </span>
                </div>

                <div className="text-right w-[30%]">
                  <p className="text-[12px] font-bold text-[#004475]">
                    ₹
                    {(
                      Number(pay.amount) ||
                      Number(pay.receivedAmount) ||
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold text-emerald-500 uppercase">
                    Paid
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-[11px] text-slate-400 font-medium font-bold uppercase tracking-widest">
              No completed payments yet
            </div>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-1" />

      {/* Bottom Half: Pending */}
      <div className="flex-1 pt-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-[#004475]">Pending Payments</h4>
          <div className="flex items-center gap-2">
            <span className="text-md font-bold text-amber-600">
              ₹{pendingTotal.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
              {pendingInvoices.length} DUE
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar flex-grow">
          {pendingInvoices.length > 0 ? (
            pendingInvoices.slice(0, 5).map((inv, i) => (
              <div
                key={inv.id || i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 w-[40%]">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-[10px] font-black border border-amber-100">
                    {(inv.client || inv.customer?.name || '?').charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-gray-800 leading-none mb-1 truncate">
                      {inv.client || inv.customer?.name || 'Unknown Client'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase">
                      {inv.invoiceNumber || `INV-${i + 1}`}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Due Date
                  </span>
                  <span className="text-[10px] font-black text-amber-600 tracking-tight">
                    {inv.invoiceDate || inv.createdAt
                      ? new Date(
                          inv.invoiceDate || inv.createdAt
                        ).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'N/A'}
                  </span>
                </div>

                <div className="text-right w-[30%]">
                  <p className="text-[12px] font-bold text-amber-600">
                    ₹
                    {(
                      Number(inv.remainingAmount) ||
                      Number(inv.total) ||
                      Number(inv.totalAmount) ||
                      0
                    ).toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold text-amber-400 uppercase">
                    {inv.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20 text-[11px] text-slate-400 font-medium font-bold uppercase tracking-widest">
              No pending payments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
