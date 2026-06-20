import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import { showSuccessToast } from '../../Toast';

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

  // Partial Payment Modal States
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialMethod, setPartialMethod] = useState('');
  const [partialDate, setPartialDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [partialNextDueDate, setPartialNextDueDate] = useState('');
  const [partialNote, setPartialNote] = useState('');
  const [partialErrors, setPartialErrors] = useState({});
  const [isSubmittingPartial, setIsSubmittingPartial] = useState(false);

  const handlePartialSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const amountVal = parseFloat(partialAmount);

    if (!partialAmount || amountVal <= 0) {
      errors.amount = 'Please enter a valid payment amount.';
    } else if (amountVal >= remainingAmount) {
      errors.amount = `Partial payment amount must be less than the remaining balance (${formatCurrency(remainingAmount)}).`;
    }
    if (!partialMethod) {
      errors.method = 'Payment method is required.';
    }
    if (!partialDate) {
      errors.date = 'Payment date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setPartialErrors(errors);
      return;
    }

    setIsSubmittingPartial(true);
    try {
      const payload = {
        invoiceId: invoice.id,
        amount: amountVal,
        paymentMethod: partialMethod,
        paymentDate: partialDate,
        notes: partialNote || undefined,
        referenceNumber: `REF-${Date.now().toString().slice(-6)}`,
        nextInstallmentDate: partialNextDueDate || undefined,
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record partial payment');
      }

      showSuccessToast('Partial payment recorded successfully!');

      // Reset state
      setPartialAmount('');
      setPartialNote('');
      setPartialNextDueDate('');
      setPartialErrors({});
      setShowPartialModal(false);
      onClose(); // Also close the main payment modal

      // Refresh the page data
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 800);
    } catch (err) {
      console.error(err);
      setPartialErrors({ submit: err.message });
    } finally {
      setIsSubmittingPartial(false);
    }
  };

  return (
    <CustomModalForm
      open={true}
      onClose={() => !showLoading && onClose()}
      title={isPartial ? 'Continue Payment' : 'Process Payment'}
      widthClass="max-w-md"
      footer={
        <div className="px-3 py-3 border-t border-gray-200 flex justify-end space-x-3 w-full">
          <Button
            onClick={onClose}
            disabled={showLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Pre-populate with a reasonable default (e.g. half of remaining)
              setPartialAmount(
                Math.max(
                  0.01,
                  parseFloat((remainingAmount / 2).toFixed(2))
                ).toString()
              );
              setPartialMethod(
                paymentMethod || paymentMethods[0] || 'Bank Transfer'
              );
              setPartialDate(new Date().toISOString().split('T')[0]);
              setShowPartialModal(true);
            }}
            disabled={showLoading}
            className="px-4 py-2 border border-amber-500 text-amber-600 rounded-xl text-sm font-semibold hover:bg-amber-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Partial Payment
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

      {showPartialModal && (
        <CustomModalForm
          open={true}
          onClose={() => !isSubmittingPartial && setShowPartialModal(false)}
          title="Record Partial Payment"
          widthClass="max-w-md"
          footer={
            <div className="px-3 py-3 border-t border-gray-200 flex justify-end space-x-3 w-full">
              <Button
                onClick={() => setShowPartialModal(false)}
                disabled={isSubmittingPartial}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Cancel
              </Button>
              <PrimaryButton
                onClick={handlePartialSubmit}
                disabled={
                  !partialAmount ||
                  parseFloat(partialAmount) <= 0 ||
                  parseFloat(partialAmount) >= remainingAmount ||
                  isSubmittingPartial
                }
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPartial ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Confirm Partial'
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

          <div className="p-4 space-y-4">
            {partialErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-800 rounded-md">
                {partialErrors.submit}
              </div>
            )}
            {/* Info Box */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining Balance</p>
                  <p className="font-semibold text-amber-700">
                    {formatCurrency(remainingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Partial Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partial Payment Amount ($){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={partialAmount}
                onChange={(e) => {
                  setPartialAmount(e.target.value);
                  if (partialErrors.amount) {
                    setPartialErrors((prev) => ({ ...prev, amount: '' }));
                  }
                }}
                min="0.01"
                max={(remainingAmount - 0.01).toFixed(2)}
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 ${
                  partialErrors.amount
                    ? 'border-red-500 font-medium'
                    : 'border-gray-300'
                }`}
                placeholder="Enter partial amount"
                disabled={isSubmittingPartial}
              />
              {partialErrors.amount && (
                <p className="text-red-500 text-xs mt-1">
                  {partialErrors.amount}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={partialMethod}
                onChange={(e) => {
                  setPartialMethod(e.target.value);
                  if (partialErrors.method) {
                    setPartialErrors((prev) => ({ ...prev, method: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 ${
                  partialErrors.method ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmittingPartial}
              >
                <option value="">Select method</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {partialErrors.method && (
                <p className="text-red-500 text-xs mt-1">
                  {partialErrors.method}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={partialDate}
                onChange={(e) => {
                  setPartialDate(e.target.value);
                  if (partialErrors.date) {
                    setPartialErrors((prev) => ({ ...prev, date: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 ${
                  partialErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmittingPartial}
              />
              {partialErrors.date && (
                <p className="text-red-500 text-xs mt-1">
                  {partialErrors.date}
                </p>
              )}
            </div>

            {/* Next Installment/Payment Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Installment Due Date (Optional)
              </label>
              <input
                type="date"
                value={partialNextDueDate}
                onChange={(e) => setPartialNextDueDate(e.target.value)}
                min={partialDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                disabled={isSubmittingPartial}
              />
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partial Payment Notes
              </label>
              <textarea
                value={partialNote}
                onChange={(e) => setPartialNote(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Add any details about this installment..."
                disabled={isSubmittingPartial}
              />
            </div>
          </div>
        </CustomModalForm>
      )}
    </CustomModalForm>
  );
}
