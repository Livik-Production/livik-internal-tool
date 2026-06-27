'use client';

import React, { useState } from 'react';
import CustomModalForm from './CustomModalForm';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

/**
 * PermissionConfirmModal
 * Modal for HR to enter actual hours used and confirm a permission request.
 *
 * Props:
 * - open (bool)
 * - permission (object) - the permission request data
 * - onConfirm (fn) - called with { actualHours }
 * - onCancel (fn)
 */
export default function PermissionConfirmModal({
  open,
  permission,
  onConfirm,
  onCancel,
}) {
  const [actualHours, setActualHours] = useState('');
  const [remarks, setRemarks] = useState(permission?.remarks || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open || !permission) return null;

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDeductionPreview = (hours) => {
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0) return null;
    // Note: Cumulative logic is server-side, this is a per-request estimate or simple rule reminder
    if (h <= 2)
      return {
        text: 'No leave deduction',
        color: 'text-green-600',
        bg: 'bg-green-50',
        icon: CheckCircle,
      };
    if (h <= 4.5)
      return {
        text: 'Half day CL deduction',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        icon: AlertTriangle,
      };
    return {
      text: 'Full day CL deduction',
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: AlertTriangle,
    };
  };

  const preview = getDeductionPreview(actualHours);

  // Helper for generating the system-aligned remark
  const generatedRemark = actualHours
    ? `Confirmed: ${formatDuration(actualHours)} | ${preview?.text || 'Calculating...'}`
    : '';

  const handleSubmit = async () => {
    const hours = parseFloat(actualHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter valid hours (e.g., 1, 1.5, 2)');
      return;
    }
    if (hours > 8) {
      setError('Hours cannot exceed 8');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm({ actualHours: hours, remarks: remarks });
    } catch (err) {
      setError(err.message || 'Failed to confirm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModalForm
      open={open}
      onCancel={onCancel}
      title="Confirm Permission Hours"
      widthClass="max-w-xl"
    >
      <div className="space-y-4 p-4">
        {/* Employee Info - Compact */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              {permission.employee || 'Employee'}
            </div>
            <div className="text-[11px] text-gray-500">
              {formatDate(permission.date || permission.startDate)} •{' '}
              {permission.startTime || '-'} - {permission.endTime || '-'} •{' '}
              Requested: {formatDuration(permission.durationHours)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hours Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-tight">
              Actual Hours Used <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={actualHours}
              onChange={(e) => {
                setActualHours(e.target.value);
                setError('');
              }}
              placeholder="e.g., 1.5"
              min="0.5"
              max="8"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} />
                {error}
              </p>
            )}
          </div>

          {/* Deduction Preview Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-tight">
              Calculated Deduction
            </label>
            {preview ? (
              <div
                className={`flex items-center gap-2.5 p-2 rounded-lg border min-h-[40px] ${preview.bg}`}
              >
                <preview.icon size={16} className={preview.color} />
                <div className={`text-xs font-bold ${preview.color}`}>
                  {preview.text}
                </div>
              </div>
            ) : (
              <div className="flex items-center p-2 rounded-lg border border-gray-100 bg-gray-50 min-h-[40px] text-xs text-gray-400 italic">
                Enter hours to see deduction
              </div>
            )}
          </div>
        </div>

        {/* Remarks Section */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-tight">
            Confirmation Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any internal remarks here..."
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          />
          {generatedRemark && (
            <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                Generated Remark Preview:
              </span>
              <p className="text-xs text-gray-600 line-clamp-1 italic">
                {remarks ? `${remarks} | ` : ''} {generatedRemark}
              </p>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="text-[10px] text-gray-400 bg-gray-50/50 p-2 rounded-lg border border-gray-100 flex gap-1.5">
          <Clock size={12} className="shrink-0 mt-0.5" />
          <span>
            <strong>Rules Reminder:</strong> ≤ 2 hrs/month = No deduction • &gt;
            2 to 4.5 hrs = Half day CL • &gt; 4.5 hrs = Full day CL. Deduction
            is cumulative for the month.
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-white border text-sm font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !actualHours}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </CustomModalForm>
  );
}
