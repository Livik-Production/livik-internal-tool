'use client';

import React, { useState, useEffect } from 'react';
import Button from '../Buttons/Button';
import { useSelector } from 'react-redux';
import ConfirmDialog from '../ConfirmDialog';
import {
  Loader2,
  X,
  Clock,
  Calendar as CalendarIcon,
  FileText,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';
import CloseButton from '../Buttons/CloseButton';
import CustomModalForm from '../CustomModalForm';
import { formatDuration } from '../../../utils/formatters';

export default function PermissionRequestForm({
  mode = 'add', // "add", "view", or "edit"
  initialData = null,
  onClose,
  onSuccess,
  onApprove, // New Prop
  onReject, // New Prop
}) {
  const authUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    remarks: '',
    status: '', // New Field
    id: '', // New Field
    employee: '', // New Field
    empId: '',
    employeePhoto: null,
    employeeDesignation: '',
    employeeDepartment: '',
    appliedDate: '',
    actualHours: null,
    isConfirmed: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null

  // Initialize form
  useEffect(() => {
    if (initialData && mode !== 'add') {
      const rawDate = initialData.date || initialData.startDate || '';
      const formattedDate = rawDate
        ? new Date(rawDate).toISOString().split('T')[0]
        : '';

      setFormData({
        date: formattedDate,
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        reason: initialData.reason || initialData.details || '',
        remarks: initialData.remarks || '',
        status: initialData.status || '',
        id: initialData.id || '',
        employee: initialData.employee || '',
        empId: initialData.empId || '',
        employeePhoto: initialData.employeePhoto || null,
        employeeDesignation: initialData.employeeDesignation || '',
        employeeDepartment: initialData.employeeDepartment || '',
        appliedDate: initialData.appliedDate || '',
        actualHours: initialData.actualHours || null,
        isConfirmed: initialData.isConfirmed || false,
      });
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, date: today }));
    }
  }, [initialData, mode]);

  // Handle startTime change to auto-calculate endTime (+2 hours)
  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;

    if (!newStartTime) {
      setFormData((prev) => ({ ...prev, startTime: '', endTime: '' }));
      return;
    }

    try {
      const [hours, minutes] = newStartTime.split(':');
      const dateObj = new Date();
      dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

      // Add 2 hours as default
      dateObj.setHours(dateObj.getHours() + 2);

      const endHours = String(dateObj.getHours()).padStart(2, '0');
      const endMinutes = String(dateObj.getMinutes()).padStart(2, '0');
      const newEndTime = `${endHours}:${endMinutes}`;

      setFormData((prev) => ({
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime,
      }));

      if (errors.startTime) {
        setErrors((prev) => ({ ...prev, startTime: '' }));
      }
      if (errors.endTime) {
        setErrors((prev) => ({ ...prev, endTime: '' }));
      }
    } catch (err) {
      console.error('Error setting time:', err);
      setFormData((prev) => ({ ...prev, startTime: newStartTime }));
    }
  };

  // Handle endTime change
  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    setFormData((prev) => ({ ...prev, endTime: newEndTime }));
    if (errors.endTime) {
      setErrors((prev) => ({ ...prev, endTime: '' }));
    }
  };

  // Calculate duration in hours between start and end time
  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return null;
    const [sh, sm] = formData.startTime.split(':').map(Number);
    const [eh, em] = formData.endTime.split(':').map(Number);
    const diffMinutes = eh * 60 + em - (sh * 60 + sm);
    if (diffMinutes <= 0) return null;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime) {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      if (eh * 60 + em <= sh * 60 + sm) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;

      const payload = {
        employeeId: authUser?.id,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationHours: Math.round(durationHours * 100) / 100,
        reason: formData.reason,
        remarks: formData.remarks,
      };

      const res = await fetch(
        mode === 'edit'
          ? `/api/permission/${initialData.id}`
          : '/api/permission',
        {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit permission request');
      }

      showSuccessToast(
        `Permission request ${mode === 'edit' ? 'updated' : 'submitted'} successfully!`
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error submitting permission request:', err);
      showErrorToast(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = (
    <div className="flex items-center gap-4">
      {mode === 'view' && formData.employeePhoto ? (
        <img
          src={formData.employeePhoto}
          alt={formData.employee}
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shadow-sm"
        />
      ) : (
        mode === 'view' && (
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border-2 border-blue-100 shadow-sm">
            <span className="text-xl font-bold">{formData.employee?.charAt(0) || 'P'}</span>
          </div>
        )
      )}
      {mode !== 'view' && (
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Clock size={20} />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">
          {mode === 'view'
            ? formData.employee || 'Permission Details'
            : mode === 'edit'
              ? 'Edit Permission Request'
              : 'Apply for Permission'}
        </h2>
        <div className="flex flex-col gap-0.5 mt-1">
          <div className="flex items-center gap-2">
            {mode === 'view' && formData.empId && (
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Emp ID: {formData.empId}
              </span>
            )}
            {mode === 'view' && (formData.employeeDesignation || formData.employeeDepartment) && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-medium text-gray-500">
                  {[formData.employeeDesignation, formData.employeeDepartment]
                    .filter(Boolean)
                    .join(' — ')}
                </span>
              </>
            )}
            {mode === 'view' && (formData.startTime || formData.endTime) && (
              <div className="flex items-center gap-1 ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                <Clock size={12} />
                <span>
                  {formData.startTime} - {formData.endTime}
                </span>
              </div>
            )}
            {mode !== 'view' && <p className="text-sm text-gray-500">Default duration is 2 hours</p>}
          </div>
          {mode === 'view' && formData.appliedDate && (
            <p className="text-[11px] font-medium text-blue-600 mt-0.5">
              Applied on{' '}
              {new Date(formData.appliedDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFooter = (
    <div className="flex justify-end gap-3 w-full">
      <Button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        disabled={isSubmitting || actionLoading !== null}
      >
        {mode === 'view' ? 'Close' : 'Cancel'}
      </Button>

      {mode !== 'view' && (
        <Button
          type="submit"
          form="permissionForm"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#004475] text-white font-semibold rounded-xl transition-colors flex items-center gap-2 min-w-[120px] justify-center shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting...
            </>
          ) : mode === 'edit' ? (
            'Save Changes'
          ) : (
            'Submit Request'
          )}
        </Button>
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
            <Button
              type="button"
              disabled={actionLoading !== null}
              onClick={() => setConfirmAction('approve')}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                actionLoading !== null
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow'
              }`}
            >
              {actionLoading === 'approve' && <Loader2 size={12} className="animate-spin" />}
              {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
          )}
        </div>
      )}
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
      <div className="p-6">
        <form id="permissionForm" onSubmit={handleSubmit} className="space-y-6">
          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-1.5 focus-within:text-blue-600 text-gray-700 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon size={16} /> Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                disabled={mode === 'view'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-50 text-gray-900"
              />
              {errors.date && <p className="text-red-500 text-xs font-medium">{errors.date}</p>}
            </div>

            {/* Empty placeholder for alignment */}
            <div className="hidden md:block"></div>

            {/* Start Time */}
            <div className="space-y-1.5 focus-within:text-blue-600 text-gray-700 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={16} /> Expected Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={handleStartTimeChange}
                disabled={mode === 'view'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-50 text-gray-900"
              />
              {errors.startTime && <p className="text-red-500 text-xs font-medium">{errors.startTime}</p>}
            </div>

            {/* End Time (Editable, defaults to +2 hrs) */}
            <div className="space-y-1.5 focus-within:text-blue-600 text-gray-700 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={16} /> Expected End Time
                {calculateDuration() && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-auto">
                    Duration: {calculateDuration()}
                  </span>
                )}
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={handleEndTimeChange}
                disabled={mode === 'view'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all disabled:bg-gray-50 text-gray-900"
              />
              {errors.endTime && <p className="text-red-500 text-xs font-medium">{errors.endTime}</p>}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5 focus-within:text-blue-600 text-gray-700 transition-colors">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} /> Reason
            </label>
            {mode === 'view' ? (
              <p className="text-gray-900 border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm italic min-h-[60px]">
                {formData.reason || 'No reason provided.'}
              </p>
            ) : (
              <textarea
                value={formData.reason}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }));
                  if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
                }}
                disabled={mode === 'view'}
                rows="3"
                placeholder="Enter reason for permission..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all disabled:bg-gray-50 text-gray-900"
              />
            )}
            {errors.reason && <p className="text-red-500 text-xs font-medium">{errors.reason}</p>}
          </div>

          {/* Confirmation Details (Only in View Mode if Confirmed) */}
          {mode === 'view' && formData.isConfirmed && (
            <div className="mb-6 bg-green-50/50 border border-green-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Confirmation Details
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                  <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1">Confirmed Hours</span>
                  <span className="text-lg font-bold text-green-700">{formatDuration(formData.actualHours)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                  <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1">Planned Hours</span>
                  <span className="text-lg font-bold text-gray-600">{formatDuration(initialData?.durationHours)}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1">HR Remarks & Audit Trail</span>
                <p className="text-sm text-green-800 font-medium bg-white/50 p-2.5 rounded-lg border border-green-50 select-text">
                  {formData.remarks || 'No confirmation remarks.'}
                </p>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1.5 focus-within:text-blue-600 text-gray-700 transition-colors">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <FileText size={16} /> Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
              disabled={mode === 'view'}
              rows="2"
              placeholder="Any additional remarks..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all disabled:bg-gray-50 text-gray-900"
            />
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmAction === 'approve'}
        title="Confirm Approve"
        description={`Are you sure you want to approve this permission request from ${formData.employee || 'the employee'}?`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('approve');
          try {
            await onApprove?.(formData.id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Confirm Reject"
        description={`Are you sure you want to reject this permission request from ${formData.employee || 'the employee'}?`}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('reject');
          try {
            await onReject?.(formData.id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </CustomModalForm>
  );
}
