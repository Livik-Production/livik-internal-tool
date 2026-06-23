'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Loader from '../../Loader';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import { toast } from 'react-toastify';

const AddPettyCashModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'add',
  initialData = null,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    receiveDate: initialData?.receiveDate
      ? new Date(initialData.receiveDate).toISOString().split('T')[0]
      : getLocalDateString(),
    receiveFrom: initialData?.receiveFrom || '',
    receivedAmount: initialData?.receivedAmount || '',
    paymentMethod: initialData?.paymentMethod || 'Cash',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([
    'Cash',
    'Bank Transfer',
    'Cheque',
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
            if (
              initialData?.paymentMethod &&
              !active.includes(initialData.paymentMethod)
            ) {
              active = [...active, initialData.paymentMethod];
            }
            setPaymentMethods(active);
            setFormData((prev) => {
              if (mode === 'edit' && initialData) {
                return {
                  ...prev,
                  paymentMethod: active.includes(initialData.paymentMethod)
                    ? initialData.paymentMethod
                    : active[0],
                };
              } else {
                return {
                  ...prev,
                  paymentMethod: active.includes('Cash') ? 'Cash' : active[0],
                };
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch petty cash payment methods:', err);
      }
    };
    if (isOpen) {
      fetchMethods();
    }
  }, [isOpen, mode, initialData]);

  const fetchOpeningBalance = async (date) => {
    if (!date) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`/api/expense/petty-cash/balance?date=${date}`);
      if (!res.ok) throw new Error('Failed to load balance');
      const data = await res.json();
      setOpeningBalance(data.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOpeningBalance(formData.receiveDate);
    }
  }, [isOpen, formData.receiveDate]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          receiveDate: new Date(initialData.receiveDate)
            .toISOString()
            .split('T')[0],
          receiveFrom: initialData.receiveFrom,
          receivedAmount: initialData.receivedAmount,
          paymentMethod: initialData.paymentMethod,
        });
      } else if (mode === 'add') {
        setFormData({
          receiveDate: getLocalDateString(),
          receiveFrom: '',
          receivedAmount: '',
          paymentMethod: 'Cash',
        });
      }
      setError('');
    }
  }, [isOpen, initialData, mode]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url =
        mode === 'edit'
          ? `/api/expense/petty-cash/${initialData.id}`
          : '/api/expense/petty-cash';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receivedAmount: parseFloat(formData.receivedAmount),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || `Failed to ${mode === 'edit' ? 'update' : 'add'} top-up`
        );
      }

      toast.success(
        `Successfully ${mode === 'edit' ? 'updated' : 'added'} petty cash record!`
      );
      onSuccess();
      onClose();
      if (mode === 'add') {
        setFormData({
          receiveDate: getLocalDateString(),
          receiveFrom: '',
          receivedAmount: '',
          paymentMethod: 'Cash',
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button type="button" onClick={onClose} className="h-[45px] px-6">
        Cancel
      </Button>

      <PrimaryButton
        type="submit"
        form="add-petty-cash-form"
        disabled={isSubmitting}
        className="h-[45px] px-6 shadow-lg flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : mode === 'edit' ? (
          'Update Details'
        ) : (
          'Confirm Top Up'
        )}
      </PrimaryButton>
    </>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      title="Top Up Petty Cash"
      widthClass="max-w-lg"
      footer={footer}
    >
      <form
        id="add-petty-cash-form"
        onSubmit={handleSubmit}
        className="p-4 space-y-4"
      >
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Amount Received (₹)
            </label>
            <div className="text-xs font-medium text-gray-400">
              {isLoadingBalance ? (
                'Loading balance...'
              ) : (
                <>
                  Opening Balance:{' '}
                  <span className="text-gray-600">
                    ₹{openingBalance.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <input
            required
            type="number"
            step="0.01"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all font-bold text-lg"
            placeholder="0.00"
            value={formData.receivedAmount}
            onChange={(e) =>
              setFormData({ ...formData, receivedAmount: e.target.value })
            }
          />
          {formData.receivedAmount &&
            !isNaN(parseFloat(formData.receivedAmount)) && (
              <p className="text-[10px] text-gray-400 mt-1 italic">
                Closing balance will be: ₹
                {(
                  openingBalance + parseFloat(formData.receivedAmount)
                ).toLocaleString()}
              </p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Received Date
            </label>
            <input
              required
              type="date"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 outline-none"
              value={formData.receiveDate}
              onChange={(e) =>
                setFormData({ ...formData, receiveDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Method
            </label>
            <select
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase">
            Received From
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Finance Dept, Admin"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl  outline-none"
            value={formData.receiveFrom}
            onChange={(e) =>
              setFormData({ ...formData, receiveFrom: e.target.value })
            }
          />
        </div>
      </form>
    </CustomModalForm>
  );
};

export default AddPettyCashModal;
