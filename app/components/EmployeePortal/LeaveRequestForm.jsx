// components/EmployeePortal/LeaveRequestTab.jsx/LeaveRequestForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Button from '../Buttons/Button';
import { useSelector } from 'react-redux';
import { uploadLeaveDocument } from '../../actions/uploadLeaveDocument';
import ConfirmDialog from '../ConfirmDialog';
import { Loader2, X, Clock, Calendar, FileText, AlertCircle, Info } from 'lucide-react';
import CloseButton from '../Buttons/CloseButton';
import FilterDropdown from '../Buttons/FilterDropdown';
import PrimaryButton from '../Buttons/PrimaryButton';
import CustomModalForm from '../CustomModalForm';

const LeaveRequestForm = ({
  mode = 'add', // "add", "view", or "edit"
  initialData = null,
  onClose,
  onSuccess,
  onApprove, // New Prop
  onReject, // New Prop
}) => {
  // Form state
  const [formData, setFormData] = useState({
    type: 'sl',
    duration: 'full', // "full" or "half"
    from: '',
    to: '',
    reason: '',
    document: '', // ✅ PDF Blob URL
    halfDayPeriod: '', // "FIRST_HALF" or "SECOND_HALF"
    status: '',
    id: '', // Database ID
    leave_id: '', // Display ID
    employeeDesignation: '',
    employeeDepartment: '',
  });

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [existingLeaves, setExistingLeaves] = useState([]);
  const [overlapError, setOverlapError] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [excludedDays, setExcludedDays] = useState([]);
  const [joiningDate, setJoiningDate] = useState(''); // Employee joining date for min restriction
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null
  const authUser = useSelector((state) => state.auth.user);

  // Balance leaves data
  const [balanceLeaves, setBalanceLeaves] = useState({
    sl: 0, // Sick Leave
    cl: 0, // Casual Leave
    total: 0,
  });

  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Leave type options
  const leaveTypes = [
    {
      value: 'sl',
      label: 'SL',
      fullLabel: 'Sick Leave',
      balance: balanceLeaves.sl,
    },
    {
      value: 'cl',
      label: 'CL',
      fullLabel: 'Casual Leave',
      balance: balanceLeaves.cl,
    },
  ];

  // Duration options
  const durationOptions = [
    { value: 'full', label: 'Full Day' },
    { value: 'half', label: 'Half Day' },
  ];

  // Helper: check if current duration is half-day
  const isHalfDayType = formData.duration === 'half';

  // Initialize form with data for view/edit modes
  useEffect(() => {
    const normalizeDateForInput = (value) => {
      if (!value) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const d = new Date(value);
      if (isNaN(d)) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (initialData) {
      const rawFrom =
        initialData.from ||
        initialData.startDate ||
        initialData.start_date ||
        initialData.start ||
        '';
      const rawTo =
        initialData.to ||
        initialData.endDate ||
        initialData.end_date ||
        initialData.end ||
        '';

      const normFrom = normalizeDateForInput(rawFrom);
      const normTo = normalizeDateForInput(rawTo);

      const rawType = (initialData.type || initialData.leaveType || 'sl')
        .toLowerCase()
        .replace('-lop', '');
      const isHalf = initialData.isHalfDay === true;

      setFormData({
        type: rawType,
        duration: isHalf ? 'half' : 'full',
        from: normFrom,
        to: normTo,
        reason: initialData.reason || initialData.details || '',
        document: initialData.attachment || initialData.document || null,
        halfDayPeriod: initialData.halfDayPeriod || '',
        status: initialData.status || '',
        id: initialData.id || '',
        leave_id: initialData.leave_id || initialData.leaveId || '',
        employeeDesignation: initialData.employeeDesignation || '',
        employeeDepartment: initialData.employeeDepartment || '',
      });

      // Calculate days if normalized dates exist
      if (isHalf) {
        setCalculatedDays(0.5);
      } else if (normFrom && normTo) {
        calculateDays(normFrom, normTo);
        checkOverlap(normFrom, normTo);
      }
    }
  }, [initialData]);

  // Fetch company holidays from API
  useEffect(() => {
    let mounted = true;
    const fetchHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const res = await fetch(`/api/hr/holidays?year=${currentYear}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setCompanyHolidays(data);
        }
      } catch (err) {
        console.error('Failed to fetch company holidays:', err);
      }
    };
    fetchHolidays();
    return () => {
      mounted = false;
    };
  }, []);

  // Recalculate days when company holidays are loaded (fixes timing for view mode)
  useEffect(() => {
    // Skip recalculation for half-day leaves — totalDays is always 0.5
    if (formData.duration === 'half') return;

    // We allow recalculation in view mode to populate the excludedDays breakdown
    if (companyHolidays.length > 0 && formData.from && formData.to) {
      calculateDays(formData.from, formData.to);
    }
  }, [companyHolidays, mode]); // Add mode dependency to ensure it runs when mode changes

  // Fetch existing leaves for the current user to check overlaps (pending + approved)
  useEffect(() => {
    let mounted = true;
    const fetchExisting = async () => {
      const targetEmployeeId =
        initialData?.employeeId || initialData?.empId || authUser?.id;
      if (!targetEmployeeId) return;
      try {
        const res = await fetch(`/api/leave?employeeId=${targetEmployeeId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setExistingLeaves(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch existing leaves:', err);
      }
    };

    fetchExisting();
    return () => {
      mounted = false;
    };
  }, [authUser?.id, initialData?.employeeId, initialData?.empId]);

  // Fetch leave balances for the selected year
  useEffect(() => {
    let mounted = true;
    const fetchYearlyBalances = async () => {
      const targetEmployeeId =
        initialData?.employeeId || initialData?.empId || authUser?.id;
      if (!targetEmployeeId) return;

      // Determine target year from formData.from or current date
      let targetYear;
      if (formData.from) {
        const d = parseToDate(formData.from);
        if (d) {
          targetYear = d.getFullYear();
        }
      }

      // If no date selected yet, default to current year for initial display
      if (!targetYear) {
        targetYear = new Date().getFullYear();
      }

      setIsLoadingBalance(true);
      try {
        const res = await fetch(
          `/api/leave/balance-history?employeeId=${targetEmployeeId}`
        );
        if (!res.ok) return;
        const historyData = await res.json();

        if (mounted && Array.isArray(historyData)) {
          // Find records for the specific year
          const yearRecords = historyData.filter((h) => h.year === targetYear);

          const balances = {
            sl: 0,
            cl: 0,
            total: 0,
          };

          if (yearRecords.length > 0) {
            // Sum up remaining balances for all months in the year
            // Remaining = (allocated) - (used)
            yearRecords.forEach((record) => {
              const clUsed = record.clUsed || 0;
              const slUsed = record.slUsed || 0;

              balances.cl += Math.max(0, (record.cl || 0) - clUsed);
              balances.sl += Math.max(0, (record.sl || 0) - slUsed);
            });
            balances.total = balances.cl + balances.sl;
          } else {
            // If no records exist for this year, default to 0
            balances.sl = 0;
            balances.cl = 0;
            balances.total = 0;
          }

          setBalanceLeaves(balances);
        }
      } catch (err) {
        console.error('Failed to fetch leave balances from history:', err);
      } finally {
        if (mounted) setIsLoadingBalance(false);
      }
    };

    fetchYearlyBalances();
    return () => {
      mounted = false;
    };
  }, [
    authUser?.id,
    formData.from,
    initialData?.employeeId,
    initialData?.empId,
  ]);

  // Fetch employee joining date
  useEffect(() => {
    let mounted = true;
    const fetchJoiningDate = async () => {
      const targetEmployeeId =
        initialData?.employeeId || initialData?.empId || authUser?.id;
      if (!targetEmployeeId) return;
      try {
        const res = await fetch(`/api/employees/${targetEmployeeId}`);
        if (!res.ok) return;
        const emp = await res.json();
        if (mounted && emp.dateOfJoining) {
          const doj = new Date(emp.dateOfJoining);
          if (!isNaN(doj)) {
            const yyyy = doj.getFullYear();
            const mm = String(doj.getMonth() + 1).padStart(2, '0');
            const dd = String(doj.getDate()).padStart(2, '0');
            setJoiningDate(`${yyyy}-${mm}-${dd}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch employee joining date:', err);
      }
    };
    fetchJoiningDate();
    return () => {
      mounted = false;
    };
  }, [authUser?.id, initialData?.employeeId, initialData?.empId]);

  // Utility: parse various date inputs into a Date object (start of day)
  const parseToDate = (v) => {
    if (!v) return null;
    // If value is already a Date
    if (v instanceof Date)
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    // If value looks like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(v);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Check if two ranges overlap (inclusive)
  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    return !(aEnd < bStart || aStart > bEnd);
  };

  // Check overlap with existing leaves; sets overlapError state and returns boolean
  const checkOverlap = (fromVal, toVal) => {
    setOverlapError('');
    if (!fromVal || !toVal) return false;

    const newStart = parseToDate(fromVal);
    const newEnd = parseToDate(toVal);
    if (!newStart || !newEnd) return false;

    for (const l of existingLeaves) {
      // skip comparing with the same record when editing
      if (
        mode === 'edit' &&
        (l.id === initialData?.id || l.leave_id === initialData?.leave_id)
      ) {
        continue;
      }

      const rawFrom = l.startDate || l.from || l.start || l.start_date;
      const rawTo = l.endDate || l.to || l.end || l.end_date;
      const exStart = parseToDate(rawFrom);
      const exEnd = parseToDate(rawTo);
      if (!exStart || !exEnd) continue;

      if (rangesOverlap(newStart, newEnd, exStart, exEnd)) {
        const existingLabel = `${formatDate(rawFrom)} to ${formatDate(rawTo)}`;
        const status = l.status || l.state || 'Existing';
        const msg = `A leave request (${existingLabel}) with status '${status}' already exists for these dates.`;
        setOverlapError(msg);
        return true;
      }
    }

    setOverlapError('');
    return false;
  };

  // Helper to check if a date is a company holiday
  const isCompanyHoliday = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return companyHolidays.find((h) => {
      const hDate = new Date(h.holidayDate);
      const hStr = `${hDate.getFullYear()}-${String(hDate.getMonth() + 1).padStart(2, '0')}-${String(hDate.getDate()).padStart(2, '0')}`;
      return hStr === dateStr;
    });
  };

  // Calculate number of days between dates (excluding Sundays & company holidays)
  const calculateDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) {
      setCalculatedDays(0);
      setExcludedDays([]);
      return;
    }

    const from = parseToDate(fromDate);
    const to = parseToDate(toDate);
    if (!from || !to) {
      setCalculatedDays(0);
      setExcludedDays([]);
      return;
    }

    let count = 0;
    const excluded = [];

    for (
      let dt = new Date(from.getTime());
      dt <= to;
      dt.setDate(dt.getDate() + 1)
    ) {
      const isSunday = dt.getDay() === 0;
      const holiday = isCompanyHoliday(dt);

      if (isSunday) {
        excluded.push({
          date: new Date(dt.getTime()),
          reason: 'Sunday',
        });
      } else if (holiday) {
        excluded.push({
          date: new Date(dt.getTime()),
          reason: holiday.holidayName || 'Company Holiday',
        });
      } else {
        count++;
      }
    }

    setExcludedDays(excluded);
    setCalculatedDays(count);
  };

  // Handle date changes
  const handleDateChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };

    // For half-day types, auto-set to = from and fix days at 0.5
    if (isHalfDayType) {
      if (field === 'from') {
        newFormData.to = value;
      }
      setFormData(newFormData);
      setCalculatedDays(value ? 0.5 : 0);
      setExcludedDays([]);
      if (value) checkOverlap(value, value);
      return;
    }

    setFormData(newFormData);

    // Recalculate days if both dates are set
    if (field === 'from' && newFormData.to) {
      calculateDays(value, newFormData.to);
      checkOverlap(value, newFormData.to);
    } else if (field === 'to' && newFormData.from) {
      calculateDays(newFormData.from, value);
      checkOverlap(newFormData.from, value);
    } else if (!newFormData.from || !newFormData.to) {
      setCalculatedDays(0);
      setExcludedDays([]);
      setOverlapError('');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // When switching duration between half/full day
    if (name === 'duration') {
      if (value === 'half') {
        // Reset to date to match from, set 0.5 days
        newFormData.to = newFormData.from;
        newFormData.halfDayPeriod = newFormData.halfDayPeriod || '';
        setCalculatedDays(newFormData.from ? 0.5 : 0);
        setExcludedDays([]);
      } else {
        // Switching to full-day, reset to date and recalculate
        newFormData.to = '';
        newFormData.halfDayPeriod = '';
        setCalculatedDays(0);
        setExcludedDays([]);
      }
    }

    setFormData(newFormData);

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🧠 Client-side guard (UX)
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({
        ...prev,
        document: 'Only PDF files are allowed',
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, document: '' }));

      const documentUrl = await uploadLeaveDocument(file);

      setFormData((prev) => ({
        ...prev,
        document: documentUrl,
      }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        document: err.message || 'PDF upload failed',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Please select leave type';
    }

    if (!formData.from) {
      newErrors.from = 'From date is required';
    }

    // Half-day: require period selection, skip 'to' validation
    if (isHalfDayType) {
      if (!formData.halfDayPeriod) {
        newErrors.halfDayPeriod = 'Please select 1st Half or 2nd Half';
      }
    } else {
      if (!formData.to) {
        newErrors.to = 'To date is required';
      }

      if (formData.from && formData.to) {
        const fromDate = new Date(formData.from);
        const toDate = new Date(formData.to);

        if (toDate < fromDate) {
          newErrors.to = 'To date cannot be before from date';
        }
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    // Check if document is required: Mandatory for Sick Leave exceeding 2 days
    if (
      formData.type === 'sl' &&
      calculatedDays > 2 &&
      !formData.document &&
      mode !== 'view'
    ) {
      newErrors.document =
        'Supporting document (PDF) is required for Sick Leave exceeding 2 days';
    }

    // Overlap check
    if (overlapError) {
      newErrors.submit = overlapError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) return;
    if (!authUser?.id) {
      setErrors({ submit: 'User not authenticated' });
      return;
    }

    setIsSubmitting(true);

    const baseType = formData.type.toUpperCase();
    const currentBalance = getCurrentBalance();
    const isBalanceInsufficient =
      currentBalance !== 'N/A' && calculatedDays > currentBalance;

    try {
      const payload = {
        leaveType: baseType,
        startDate: formData.from,
        endDate: isHalfDayType ? formData.from : formData.to,
        isHalfDay: isHalfDayType,
        halfDayPeriod: isHalfDayType ? formData.halfDayPeriod : null,
        reason: formData.reason.trim(),
        attachment: formData.document || null,
      };

      let res;

      if (mode === 'add') {
        res = await fetch('/api/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: authUser.id,
            ...payload,
          }),
        });
      }

      if (mode === 'edit') {
        res = await fetch(`/api/leave/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save leave request');
      }

      const savedLeave = await res.json();

      // ✅ 1. notify parent FIRST
      onSuccess?.(savedLeave);
      // ✅ 2. then close modal
      onClose();
    } catch (error) {
      console.error('Leave submission error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current leave type balance (never negative)
  const getCurrentBalance = () => {
    const selectedType = leaveTypes.find((lt) => lt.value === formData.type);
    return selectedType ? Math.max(0, selectedType.balance) : 0;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderHeader = (
    <div className="flex items-center gap-4">
      {mode === 'view' && initialData?.employeePhoto && (
        <img
          src={initialData.employeePhoto}
          alt={initialData.employee}
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-sm"
        />
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {mode === 'add' && 'Apply for Leave'}
          {mode === 'edit' && 'Edit Leave Request'}
          {mode === 'view' && (initialData?.employee || 'Leave Request Details')}
        </h2>

        <div className="flex flex-col gap-0.5 text-sm mt-1.5">
          <div className="flex items-center gap-1.5">
            {mode === 'view' && initialData?.empId && (
              <span className="font-bold text-gray-600 uppercase tracking-wider">
                Emp ID: {initialData.empId}
              </span>
            )}

            {mode === 'view' && (formData.employeeDesignation || formData.employeeDepartment) && (
              <>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-500">
                  {[formData.employeeDesignation, formData.employeeDepartment]
                    .filter(Boolean)
                    .join(' — ')}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-600 mt-0.5">
            <div>
              <span className="font-semibold">Balance Leaves: </span>
              {isLoadingBalance ? (
                <span className="text-gray-400 italic">Loading...</span>
              ) : (
                <span className="text-green-600 font-medium">
                  {`${getCurrentBalance()} days (${formData.type.toUpperCase()})`}
                </span>
              )}
            </div>

            {!isLoadingBalance && (
              <div className="text-gray-500 text-xs flex items-center gap-1.5 border-l border-gray-300 pl-2">
                SL : {Math.max(0, balanceLeaves.sl)} | CL : {Math.max(0, balanceLeaves.cl)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFooter = (
    <div className="w-full">
      {/* Document Requirement Notice - Only show in add/edit modes */}
      {mode !== 'view' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> If your leave request exceeds 2 days or more, please upload supporting documents (medical certificate, travel tickets, etc.).
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm transition-all duration-300">
          <span className="font-bold underline">Error:</span> {errors.submit}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-2.5 mb-2.5">
        <Button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {mode === 'view' ? 'Close' : 'Cancel'}
        </Button>

        {mode !== 'view' && (
          <PrimaryButton
            type="submit"
            form="leave-request-form"
            disabled={isSubmitting || Boolean(overlapError)}
            className="px-5 py-2.5 bg-[#004475] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
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
                {mode === 'add' ? 'Submitting...' : 'Updating...'}
              </span>
            ) : mode === 'add' ? (
              'Submit Leave Request'
            ) : (
              'Update Request'
            )}
          </PrimaryButton>
        )}

        {mode === 'view' && (
          <div className="flex gap-3">
            {onReject && formData.status?.toLowerCase() === 'pending' && (
              <Button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction('reject')}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  actionLoading !== null
                    ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                {actionLoading === 'reject' && <Loader2 size={12} className="animate-spin" />}
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
              </Button>
            )}
            {onApprove && formData.status?.toLowerCase() === 'pending' && (
              <PrimaryButton
                type="button"
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction('approve')}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  actionLoading !== null
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-[#003273] text-white hover:bg-[#002657] hover:shadow'
                }`}
              >
                {actionLoading === 'approve' && <Loader2 size={12} className="animate-spin" />}
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </PrimaryButton>
            )}
          </div>
        )}
      </div>
    </div>
  );


  return (
    <CustomModalForm
      open={true}
      onClose={onClose}
      title={renderHeader}
      footer={renderFooter}
      widthClass="max-w-2xl"
    >
      <form id="leave-request-form" onSubmit={handleSubmit} className="px-3 py-2">
          {/* Leave Type + Duration - Same Line */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type of Leave *
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Leave Type Select */}
              <FilterDropdown
                value={formData.type}
                onChange={(val) => {
                  if (mode === 'view') return;
                  setFormData((prev) => ({
                    ...prev,
                    type: val,
                  }));
                  if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
                }}
                disabled={mode === 'view'}
                error={!!errors.type}
                options={leaveTypes.map((type) => ({
                  label: type.fullLabel,
                  value: type.value,
                }))}
                placeholder="Select Leave Type"
                className="min-w-[180px]"
              />

              {/* Half Day Checkbox */}
              {!(mode === 'view' && !isHalfDayType) && (
                <label
                  className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg cursor-pointer transition-all select-none ${
                    isHalfDayType
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-400 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } ${mode === 'view' ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isHalfDayType}
                    onChange={(e) => {
                      if (mode === 'view') return;
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.checked ? 'half' : 'full',
                        halfDayPeriod: e.target.checked
                          ? prev.halfDayPeriod
                          : '',
                      }));
                    }}
                    disabled={mode === 'view'}
                    className="w-4 h-4 accent-blue-600 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-sm">Half Day</span>
                </label>
              )}

              {/* Half Day Period Select - shown only when Half Day is checked */}
              {isHalfDayType && (
                <FilterDropdown
                  value={formData.halfDayPeriod}
                  onChange={(val) => {
                    handleChange({
                      target: { name: 'halfDayPeriod', value: val },
                    });
                  }}
                  disabled={mode === 'view'}
                  error={!!errors.halfDayPeriod}
                  options={[
                    { label: '1st Half', value: 'FIRST_HALF' },
                    { label: '2nd Half', value: 'SECOND_HALF' },
                  ]}
                  placeholder="Select Half"
                  className="min-w-[140px]"
                />
              )}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
            {errors.halfDayPeriod && (
              <p className="mt-1 text-sm text-red-600">
                {errors.halfDayPeriod}
              </p>
            )}
          </div>

          {/* Date Range - Single Line */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range *
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  {/* FROM label above the date input */}
                  <div className="text-sm text-gray-600 font-medium mb-1 px-2">
                    From
                  </div>
                  <input
                    type="date"
                    name="from"
                    value={formData.from}
                    min={joiningDate || undefined}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
                      errors.from ? 'border-red-300' : 'border-gray-300'
                    } ${
                      mode === 'view' ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    }`}
                  />
                </div>
                {errors.from && (
                  <p className="mt-1 text-sm text-red-600">{errors.from}</p>
                )}
              </div>

              {/* To date - always visible, greyed out for half-day */}
              <div className="flex-1">
                <div className="relative">
                  <div className="text-sm text-gray-600 font-medium mb-1 px-2">
                    To
                  </div>
                  <input
                    type="date"
                    name="to"
                    value={isHalfDayType ? formData.from : formData.to}
                    min={joiningDate || undefined}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    disabled={mode === 'view' || isHalfDayType}
                    className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
                      errors.to ? 'border-red-300' : 'border-gray-300'
                    } ${
                      mode === 'view' || isHalfDayType
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white'
                    }`}
                  />
                </div>
                {errors.to && (
                  <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                )}
              </div>

              {/* Calculated Days Display */}
              <div className="flex-1">
                <div className="relative">
                  <div className="text-sm text-gray-600 font-medium mb-1 px-2">
                    Total days
                  </div>
                  <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 flex items-center gap-2">
                    <span className="text-base font-bold text-blue-600">
                      {calculatedDays}
                    </span>
                    <span className="text-sm text-gray-500">
                      day{calculatedDays !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Dates Display */}
            {formData.from && formData.to && (
              <div className="mt-3">
                <div className="text-sm text-gray-600">
                  Selected: {formatDate(formData.from)} to{' '}
                  {formatDate(formData.to)}
                  {calculatedDays > 0 && (
                    <span className="ml-2 font-medium">
                      ({calculatedDays} working day
                      {calculatedDays !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Overlap error display */}
            {overlapError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-sm text-red-800 rounded-md">
                {overlapError}
              </div>
            )}
          </div>

          {/* Reason Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={mode === 'view'}
              rows="4"
              placeholder="Please provide a detailed reason for your leave request..."
              className={`w-full px-4 py-3 border rounded-lg transition-colors resize-none text-sm ${
                errors.reason ? 'border-red-300' : 'border-gray-300'
              } ${mode === 'view' ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
            />
            <div className="flex justify-between mt-1">
              {errors.reason ? (
                <p className="text-sm text-red-600">{errors.reason}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Minimum 10 characters required
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formData.reason.length}/500
              </p>
            </div>
          </div>

          {/* Document Upload (only for add/edit modes) */}
          {mode !== 'view' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Document{' '}
                {formData.type === 'sl' && calculatedDays > 2 && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              {errors.document && (
                <p className="mt-1 mb-3 text-sm text-red-600">
                  {errors.document}
                </p>
              )}

              {formData.document ? (
                <div className="flex items-center justify-between p-3 border border-green-300 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-3 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {formData.document.split('/').pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, document: null }))
                    }
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="document-upload"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="application/pdf"
                  />
                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Click to upload document
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF (Max 10MB)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {mode === 'view' && formData.document && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attached Document
              </label>
              <div className="flex items-center p-3 border border-gray-200 bg-gray-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-gray-700 truncate max-w-[200px]">
                  {typeof formData.document === 'string' &&
                  formData.document.includes('blob.vercel-storage.com')
                    ? formData.document
                        .split('/')
                        .pop()
                        .split('-')
                        .slice(1)
                        .join('-')
                    : 'leave_document.pdf'}
                </span>
                <a
                  href={formData.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View PDF
                </a>
              </div>
            </div>
          )}
        </form>

      <ConfirmDialog
        open={confirmAction === 'approve'}
        title="Confirm Approve"
        description={`Are you sure you want to approve leave request from ${formData.employee || 'the employee'}?`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('approve');
          try {
            await onApprove?.(formData.id || formData.leave_id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Confirm Reject"
        description={`Are you sure you want to reject leave request ${formData.leave_id || 'this'} from ${formData.employee || 'the employee'}? This action cannot be undone.`}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('reject');
          try {
            await onReject?.(formData.id || formData.leave_id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </CustomModalForm>
  );
};

export default LeaveRequestForm;
