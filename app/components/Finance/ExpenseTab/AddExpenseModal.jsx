'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { showSuccessToast, showErrorToast } from '../../../components/Toast';
import { X, SquarePen, ChevronDown } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CustomModalForm from '../../CustomModalForm';

const AddExpenseModal = ({
  isOpen = false,
  onClose,
  mode = 'add',
  expenseData = null,
  onSuccess,
  existingExpenses: propExistingExpenses = [],
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({
    category: '',
    itemName: '',
    paymentMode: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [existingExpenses, setExistingExpenses] = useState([]);
  const categoryInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  const normalizeDateForInput = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (propExistingExpenses && propExistingExpenses.length > 0) {
      setExistingExpenses(propExistingExpenses);
      return;
    }

    const fetchExpenses = async () => {
      try {
        const res = await fetch('/api/expense');
        if (res.ok) {
          const data = await res.json();
          setExistingExpenses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch existing expenses:', err);
      }
    };

    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen, propExistingExpenses]);

  const duplicateExpense = useMemo(() => {
    if (currentMode !== 'add') {
      return null;
    }

    if (
      !formData.category.trim() ||
      !formData.itemName.trim() ||
      !formData.paymentMode ||
      !formData.amount ||
      parseFloat(formData.amount) <= 0 ||
      !formData.expenseDate
    ) {
      return null;
    }

    const currentFormCategory = formData.category.trim().toLowerCase();
    const currentFormItemName = formData.itemName.trim().toLowerCase();
    const currentFormPaymentMode = formData.paymentMode.trim().toLowerCase();
    const currentFormAmount = parseFloat(formData.amount);
    const currentFormDateStr = normalizeDateForInput(formData.expenseDate);
    const currentFormRemarks = (formData.remarks || '').trim().toLowerCase();

    console.log('[Duplicate Check] Checking current form data:', {
      category: currentFormCategory,
      itemName: currentFormItemName,
      paymentMode: currentFormPaymentMode,
      amount: currentFormAmount,
      expenseDate: currentFormDateStr,
      remarks: currentFormRemarks,
    });

    const match = existingExpenses.find((existing) => {
      const existingCategory = (existing.category || '').trim().toLowerCase();
      const categoryMatch = existingCategory === currentFormCategory;

      const existingItemName = (existing.itemName || existing.description || '')
        .trim()
        .toLowerCase();
      const itemNameMatch = existingItemName === currentFormItemName;

      const existingPaymentMode = (
        existing.paymentMode ||
        existing.paymentMethod ||
        ''
      )
        .trim()
        .toLowerCase();
      const paymentModeMatch = existingPaymentMode === currentFormPaymentMode;

      const existingAmount = parseFloat(existing.amount);
      const amountMatch = existingAmount === currentFormAmount;

      const existingDateStr = normalizeDateForInput(
        existing.expenseDate || existing.date
      );
      const dateMatch = existingDateStr === currentFormDateStr;

      // Handle remarks carefully to match both db and transformed states
      let existingRemarks = '';
      if (existing.remarks !== undefined && existing.remarks !== null) {
        existingRemarks = existing.remarks.toString();
      } else if (
        existing.notes !== undefined &&
        existing.notes !== null &&
        existing.notes !== 'No notes'
      ) {
        existingRemarks = existing.notes.toString();
      }
      const remarksMatch =
        existingRemarks.trim().toLowerCase() === currentFormRemarks;

      const isMatch =
        categoryMatch &&
        itemNameMatch &&
        paymentModeMatch &&
        amountMatch &&
        dateMatch &&
        remarksMatch;

      const isPartialMatch = categoryMatch && itemNameMatch;
      if (isPartialMatch && !isMatch) {
        console.log(
          '[Duplicate Check] Partial match (category & name) but mismatch on ID:',
          existing.id,
          {
            paymentModeMatch,
            amountMatch,
            dateMatch,
            remarksMatch,
            existingDate: existing.expenseDate || existing.date,
            existingDateStr,
            formDateStr: currentFormDateStr,
            existingRemarks,
            formRemarks: currentFormRemarks,
          }
        );
      }

      return isMatch;
    });

    if (match) {
      console.log('[Duplicate Check] Duplicate match found!', match);
    }
    return match;
  }, [formData, existingExpenses, currentMode]);

  const authUser = useSelector((state) => state.auth.user);
  const expenseCategories = [
    'Office Supplies',
    'Travel Expenses',
    'Utility Bills',
    'Marketing',
    'Maintenance',
    'Food & Beverages',
    'Software & Subscriptions',
    'Consultancy Fees',
    'Rent',
    'Insurance',
    'Training & Development',
    'Entertainment',
    'Transportation',
    'Healthcare',
    'Miscellaneous',
  ];

  const [paymentModes, setPaymentModes] = useState([
    { value: 'Credit Card', label: 'Credit Card', icon: '💳' },
    { value: 'Debit Card', label: 'Debit Card', icon: '💳' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'Petty Cash', label: 'Petty Cash', icon: '💼' },
    { value: 'Cash', label: 'Cash', icon: '💰' },
    { value: 'Cheque', label: 'Cheque', icon: '📄' },
    { value: 'Digital Wallet', label: 'Digital Wallet', icon: '📱' },
    { value: 'Corporate Card', label: 'Corporate Card', icon: '💼' },
  ]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await fetch('/api/dropdowns?type=payment_type');
        if (res.ok) {
          const data = await res.json();
          const active = (data.data || []).filter(
            (item) => item.status !== 'inactive'
          );
          // Deduplicate active items by value to prevent duplicate React keys
          const uniqueActive = [];
          const seenValues = new Set();
          for (const item of active) {
            if (item.value && !seenValues.has(item.value)) {
              seenValues.add(item.value);
              uniqueActive.push(item);
            }
          }
          if (uniqueActive.length > 0) {
            const getPaymentIcon = (label) => {
              const lower = label.toLowerCase();
              if (lower.includes('credit') || lower.includes('card'))
                return '💳';
              if (lower.includes('bank') || lower.includes('transfer'))
                return '🏦';
              if (
                lower.includes('petty') ||
                lower.includes('cash') ||
                lower.includes('💼')
              )
                return '💼';
              if (lower.includes('cash')) return '💰';
              if (lower.includes('cheque')) return '📄';
              if (
                lower.includes('wallet') ||
                lower.includes('upi') ||
                lower.includes('digital') ||
                lower.includes('online')
              )
                return '📱';
              return '💸';
            };

            let mapped = uniqueActive.map((item) => ({
              value: item.value,
              label: item.label,
              icon: getPaymentIcon(item.label),
            }));

            // If editing and current paymentMode is not in active options, preserve it
            if (
              expenseData &&
              (expenseData.paymentMode || expenseData.paymentMethod)
            ) {
              const currentModeVal =
                expenseData.paymentMode || expenseData.paymentMethod;
              const hasCurrent = uniqueActive.some(
                (item) =>
                  item.value === currentModeVal || item.label === currentModeVal
              );
              if (!hasCurrent) {
                mapped.push({
                  value: currentModeVal,
                  label: currentModeVal,
                  icon: getPaymentIcon(currentModeVal),
                });
              }
            }

            setPaymentModes(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment modes:', err);
      }
    };

    if (isOpen) {
      fetchPaymentModes();
    }
  }, [isOpen, expenseData]);

  const statusOptions = [
    {
      value: 'pending',
      label: 'Pending',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      value: 'approved',
      label: 'Approved',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      value: 'paid',
      label: 'Paid',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      value: 'rejected',
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
  ];

  const resetForm = () => {
    setFormData({
      category: '',
      itemName: '',
      paymentMode: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      remarks: '',
      status: 'pending',
    });
    setErrors({});
    setSubmitError('');
    setShowCategoryDropdown(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (expenseData) {
      setFormData({
        category: expenseData.category || '',
        itemName: expenseData.itemName || expenseData.description || '',
        paymentMode: expenseData.paymentMode || expenseData.paymentMethod || '',
        amount: expenseData.amount ? expenseData.amount.toString() : '',
        expenseDate: normalizeDateForInput(
          expenseData.expenseDate || expenseData.date
        ),
        remarks: expenseData.remarks || '',
        status: expenseData.status || expenseData.paymentStatus || 'pending',
      });
    } else if (mode === 'add') {
      resetForm();
    }
  }, [expenseData, mode, isOpen]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    if (currentMode === 'add') {
      resetForm();
    }
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (submitError) {
      setSubmitError('');
    }

    if (name === 'category' && value.length > 0 && currentMode !== 'view') {
      setShowCategoryDropdown(true);
    }
  };

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({ ...prev, category }));
    setShowCategoryDropdown(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const handleCategoryInputFocus = () => {
    if (currentMode !== 'view') {
      setShowCategoryDropdown(true);
    }
  };

  const handleCategoryInputMouseDown = (e) => {
    if (currentMode !== 'view') {
      if (document.activeElement === e.target) {
        e.preventDefault();
        setShowCategoryDropdown((prev) => !prev);
      }
    }
  };

  const handlePaymentModeSelect = (paymentMode) => {
    setFormData((prev) => ({ ...prev, paymentMode }));
    if (errors.paymentMode) {
      setErrors((prev) => ({ ...prev, paymentMode: '' }));
    }
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.itemName.trim())
      newErrors.itemName = 'Expense name is required';
    if (!formData.paymentMode)
      newErrors.paymentMode = 'Payment mode is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = 'Valid amount is required';
    if (!formData.expenseDate) newErrors.expenseDate = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (!isOpen) return null;

  if (currentMode === 'edit' && !expenseData?.id) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentMode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        category: formData.category,
        itemName: formData.itemName,
        paymentMode: formData.paymentMode,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        remarks: formData.remarks || null,
        status: formData.status,
      };
      let url = '/api/expense';
      let method = 'POST';

      if (currentMode === 'edit') {
        if (!expenseData?.id) {
          throw new Error(
            'Invalid expense record. Please refresh and try again.'
          );
        }
        url = `/api/expense/${expenseData.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save expense');
      }

      const savedExpense = await response.json();

      onSuccess?.(savedExpense);
      showSuccessToast(
        currentMode === 'add'
          ? 'Expense added successfully!'
          : 'Expense updated successfully!'
      );
      if (currentMode === 'add') {
        resetForm();
      }

      onClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
      showErrorToast(
        error.message || 'Failed to submit expense. Please try again.'
      );
      setSubmitError(
        error.message || 'Failed to submit expense. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = expenseCategories.filter((category) =>
    category.toLowerCase().includes(formData.category.toLowerCase())
  );

  const footer = (
    <>
      {currentMode === 'view' && (
        <PrimaryButton
          type="button"
          onClick={() => setCurrentMode('edit')}
          className="px-5 py-2.5 flex items-center shadow-lg"
        >
          <SquarePen size={18} className="mr-2" />
          Edit Expense
        </PrimaryButton>
      )}

      {currentMode !== 'view' && (
        <PrimaryButton
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 flex items-center"
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              {currentMode === 'add' ? 'Submitting...' : 'Updating...'}
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {currentMode === 'add' ? 'Add Expense' : 'Save Changes'}
            </>
          )}
        </PrimaryButton>
      )}
    </>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={handleClose}
      title={
        currentMode === 'add'
          ? 'Add New Expense'
          : currentMode === 'edit'
            ? 'Edit Expense'
            : 'Expense Details'
      }
      widthClass="max-w-4xl"
      footer={footer}
    >
      <form onSubmit={handleSubmit} id="expenseForm">
        <div className="p-4 overflow-y-auto w-full no-scrollbar">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-800 rounded-md">
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 mt-0.5 mr-2 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{submitError}</span>
              </div>
            </div>
          )}
          {duplicateExpense && (
            <div className="mb-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* <div className="flex items-center gap-2 mb-3 text-amber-800 font-semibold text-sm">
                  <span className="text-base">⚠️</span>
                  <span>Duplicate Expense Detected (An identical record already exists)</span>
                </div> */}

              <div className="overflow-x-auto border border-amber-100 rounded-lg shadow-sm bg-white">
                <table className="min-w-full divide-y divide-amber-100 text-xs text-left">
                  <thead className="bg-amber-50/40 text-amber-800 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Expense Name</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Payment Mode</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium bg-white">
                    <tr>
                      <td className="px-4 py-3 whitespace-nowrap">
                        📁 {duplicateExpense.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {duplicateExpense.itemName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        📅 {normalizeDateForInput(duplicateExpense.expenseDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {duplicateExpense.paymentMode}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-900">
                        ₹
                        {parseFloat(duplicateExpense.amount).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {duplicateExpense.remarks && (
                <div className="mt-3 text-xs text-gray-500 bg-amber-50/30 p-2.5 rounded border border-amber-100/50">
                  <span className="font-semibold text-gray-700">Remarks:</span>{' '}
                  {duplicateExpense.remarks}
                </div>
              )}
            </div>
          )}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Expense Category <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={categoryInputRef}>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={handleCategoryInputFocus}
                    onMouseDown={handleCategoryInputMouseDown}
                    placeholder="Type to search or select a category"
                    className={`w-full px-4 py-2.5 border rounded-lg ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    } ${currentMode === 'view' ? 'bg-gray-50 cursor-default' : ''}`}
                    readOnly={currentMode === 'view'}
                    required
                  />
                  {currentMode !== 'view' && (
                    <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  )}

                  {currentMode !== 'view' &&
                    showCategoryDropdown &&
                    filteredCategories.length > 0 && (
                      <div
                        ref={categoryDropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto no-scrollbar"
                      >
                        {filteredCategories.map((category) => (
                          <div
                            key={category}
                            onClick={() => handleCategorySelect(category)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center">
                              <span className="mr-3">📁</span>
                              <span className="text-gray-800">{category}</span>
                            </div>
                          </div>
                        ))}
                        {formData.category &&
                          !expenseCategories.includes(formData.category) && (
                            <div
                              onClick={() =>
                                handleCategorySelect(formData.category)
                              }
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-gray-50"
                            >
                              <div className="flex items-center text-blue-600">
                                <span className="mr-3">➕</span>
                                <span>
                                  Add "{formData.category}" as new category
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Expense Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Expense Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="e.g., Team lunch, Printer cartridges, Flight tickets"
                  className={`w-full px-4 py-2.5 border rounded-lg ${
                    errors.itemName ? 'border-red-500' : 'border-gray-300'
                  } ${currentMode === 'view' ? 'bg-gray-50 cursor-default' : ''}`}
                  readOnly={currentMode === 'view'}
                  required
                />
                {errors.itemName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.itemName}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg ${
                      errors.expenseDate ? 'border-red-500' : 'border-gray-300'
                    } ${currentMode === 'view' ? 'bg-gray-50 cursor-default' : ''}`}
                    readOnly={currentMode === 'view'}
                    required
                  />
                </div>
                {errors.expenseDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.expenseDate}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    } ${currentMode === 'view' ? 'bg-gray-50 cursor-default' : ''}`}
                    readOnly={currentMode === 'view'}
                    required
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.amount}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                {currentMode === 'view' ? (
                  <div className="flex items-center space-x-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-xl">
                      {paymentModes.find(
                        (p) => p.value === formData.paymentMode
                      )?.icon || '💳'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {paymentModes.find(
                        (p) => p.value === formData.paymentMode
                      )?.label || formData.paymentMode}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => handlePaymentModeSelect(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${
                        errors.paymentMode
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select payment mode</option>
                      {paymentModes.map((payment) => (
                        <option key={payment.value} value={payment.value}>
                          {payment.icon} {payment.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {errors.paymentMode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.paymentMode}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any additional notes or details about this expense..."
                rows="3"
                className={`w-full px-4 py-2.5 border rounded-lg no-scrollbar ${
                  currentMode === 'view'
                    ? 'bg-gray-200 cursor-default'
                    : 'border-gray-200'
                }`}
                readOnly={currentMode === 'view'}
              />
            </div>

            {/* Record Info - shown only in view mode */}
            {currentMode === 'view' &&
              (expenseData?.createdAt || expenseData?.updatedAt) && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Record Info
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {expenseData?.createdAt && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">
                          Created At
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(expenseData.createdAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(expenseData.createdAt).toLocaleTimeString(
                            'en-IN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}
                        </div>
                      </div>
                    )}
                    {expenseData?.updatedAt && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">
                          Last Updated
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(expenseData.updatedAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(expenseData.updatedAt).toLocaleTimeString(
                            'en-IN',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
};

export default AddExpenseModal;
