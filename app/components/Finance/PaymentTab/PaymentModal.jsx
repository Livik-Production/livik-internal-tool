import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';

export default function PaymentModal({
  invoice,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentDate,
  setPaymentDate,
  paymentNote,
  setPaymentNote,
  onClose,
  onSubmit,
  showLoading,
}) {
  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || '0'}`;
  };

  const [paymentMethods, setPaymentMethods] = useState([
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'Cash',
    'Cheque',
    'Online Payment',
    'UPI',
  ]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/dropdowns?type=payment_type');
        if (res.ok) {
          const data = await res.json();
          let active = (data.data || [])
            .filter((item) => item.status !== 'inactive')
            .map((item) => item.label);
          active = Array.from(new Set(active));
          if (active.length > 0) {
            if (paymentMethod && !active.includes(paymentMethod)) {
              active = [...active, paymentMethod];
            }
            setPaymentMethods(active);
            if (!paymentMethod) {
              setPaymentMethod(active[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment types:', err);
      }
    };
    fetchMethods();
  }, []);

  const isPartial = invoice.paymentStatus === 'partial';
  const remainingAmount = invoice.remainingAmount || invoice.totalAmount;

  return (
    <CustomModalForm
      open={true}
      onClose={() => !showLoading && onClose()}
      title={isPartial ? 'Continue Payment' : 'Process Payment'}
      widthClass="max-w-md"
      footer={
        <div className="px-3 py-3 border-t border-gray-200 flex justify-end space-x-3 w-full">
          <Button onClick={onClose} disabled={showLoading}>
            Cancel
          </Button>
          <PrimaryButton
            onClick={onSubmit}
            disabled={
              !paymentAmount || parseFloat(paymentAmount) <= 0 || showLoading
            }
          >
            {showLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <>
                {isPartial && parseFloat(paymentAmount) >= remainingAmount
                  ? 'Complete Payment'
                  : isPartial
                    ? 'Record Payment'
                    : 'Mark as Paid'}
              </>
            )}
          </PrimaryButton>
        </div>
      }
    >
      <div className="px-3 py-2 border-b border-gray-200">
        <p className="text-sm text-gray-500 mt-1">
          {invoice.invoiceNumber} •{' '}
          {invoice.client || invoice.customer?.name || 'Unknown Client'}
        </p>
      </div>

      <div className="p-3 space-y-4">
        {/* Payment Details Summary */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
            {isPartial && (
              <>
                <div>
                  <p className="text-xs text-gray-500">Already Paid</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(invoice.partialAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Amount ($)
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            min="0"
            max={remainingAmount}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter amount"
            disabled={showLoading}
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={showLoading}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={showLoading}
          />
        </div>

        {/* Note Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (Optional)
          </label>
          <textarea
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Add any payment notes or comments..."
            disabled={showLoading}
          />
        </div>
      </div>
    </CustomModalForm>
  );
}
