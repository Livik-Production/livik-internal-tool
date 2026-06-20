'use client';

import React, { useState } from 'react';
import Button from './Buttons/Button';
import { Loader2, CheckSquare, Square } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { formatDuration } from '../../utils/formatters';
import HyperlinkButton from './Buttons/HyperlinkButton';
import PrimaryButton from './Buttons/PrimaryButton';

export default function PermissionCard({
  approval,
  onApprove,
  onReject,
  onConfirm,
  isDisabled = false,
  onViewQuickInfo,
  onViewDetails,
}) {
  const permissionId = approval.id || approval.leaveId || 'N/A';
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const getFormData = () => {
    return {
      id: approval.id || '',
      leave_id: approval.leaveId || approval.id || '',
      type: 'Permission',
      category: 'permission',
      date: approval.date || approval.startDate || '',
      startTime: approval.startTime || '',
      endTime: approval.endTime || '',
      durationHours: approval.durationHours || 2,
      reason: approval.reason || approval.details || '',
      status: approval.status || 'Pending',
      employee: approval.employee || '',
      employeeId: approval.employeeId || '',
      empId: approval.empId || '',
      employeePhoto: approval.employeePhoto || null,
      appliedDate: approval.appliedDate || '',
    };
  };

  const handleOpenModal = () => {
    if (onViewDetails) {
      onViewDetails(getFormData());
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isApproved =
    approval.status === 'Pending'
      ? false
      : approval.status === 'Approved' || approval.status === 'APPROVED';
  const isConfirmed = approval.isConfirmed === true;

  return (
    <>
      <div className="p-5 bg-white flex flex-col justify-between h-full">
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {approval.employeePhoto ? (
                  <img
                    src={approval.employeePhoto}
                    alt={approval.employee}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuickInfo?.(approval.empData || approval);
                    }}
                  />
                ) : (
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-gray-100 transition-colors bg-blue-50 text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuickInfo?.(approval.empData || approval);
                    }}
                  >
                    <span className="text-sm font-bold">PR</span>
                  </span>
                )}
                <div>
                  <div
                    className="text-gray-900 font-bold text-base hover:text-blue-600 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuickInfo?.(approval.empData || approval);
                    }}
                  >
                    {approval.employee}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                    <span>{approval.empId || 'N/A'}</span>
                    {approval.appliedDate && (
                      <>
                        <span className="text-gray-300 ml-1">•</span>
                        <span className="normal-case text-gray-400">
                          Applied on {formatDate(approval.appliedDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-gray-300 mx-1">-</span>
                <HyperlinkButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal();
                  }}
                  className="  font-bold text-sm hover:underline transition-colors"
                >
                  {permissionId}
                </HyperlinkButton>
              </div>

              <div className="flex items-center gap-2">
                {/* Green checkmark for confirmed */}
                {isApproved && isConfirmed && (
                  <div
                    className="p-1.5 rounded-lg bg-green-50 border border-green-200"
                    title={`Confirmed: ${approval.actualHours || '?'} hrs used`}
                  >
                    <CheckSquare size={18} className="text-green-600" />
                  </div>
                )}

                <span
                  className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    approval.status === 'Pending'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      : approval.status === 'Approved'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {approval.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                  Request Type
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  Permission
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                  Duration
                </div>
                <div className="text-sm font-extrabold text-blue-700">
                  {approval.durationHours
                    ? formatDuration(approval.durationHours)
                    : 'N/A'}
                  {isConfirmed && approval.actualHours != null && (
                    <span className="ml-1.5 text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      Actual: {formatDuration(approval.actualHours)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                  Date
                </div>
                <div className="text-sm font-semibold text-gray-700">
                  {formatDate(approval.date || approval.startDate)}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                  Time
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  {approval.startTime || '-'} - {approval.endTime || '-'}
                </div>
              </div>
              <div className="w-2/3">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                  Reason
                </div>
                <div className="text-xs text-gray-600 line-clamp-2 italic bg-gray-50/50 px-2 py-1 rounded">
                  {approval.reason || approval.details
                    ? `"${approval.reason || approval.details}"`
                    : 'No reason provided'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 mt-4">
          <div className="flex justify-end gap-3">
            {approval.status === 'Pending' || !approval.status ? (
              <>
                <Button
                  onClick={() => setConfirmAction('reject')}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isDisabled || actionLoading
                      ? 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                  }`}
                  disabled={isDisabled || !!actionLoading}
                >
                  {actionLoading === 'reject' && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                </Button>
                <PrimaryButton
                  onClick={() => setConfirmAction('approve')}
                  disabled={isDisabled || !!actionLoading}
                >
                  {actionLoading === 'approve' && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                </PrimaryButton>
              </>
            ) : (
              isApproved &&
              !isConfirmed && (
                <div className="flex items-center gap-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      onChange={() => onConfirm?.(approval)}
                      disabled={isDisabled}
                    />
                    <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                      Confirm Hours
                    </span>
                  </label>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === 'approve'}
        title="Confirm Approve"
        description={`Are you sure you want to approve this permission request from ${approval.employee}?`}
        confirmLabel="Approve"
        cancelLabel="Cancel"
        destructive={false}
        icon={null}
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('approve');
          try {
            await onApprove?.(approval.id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Confirm Reject"
        description={`Are you sure you want to reject this permission request from ${approval.employee}? This action cannot be undone.`}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        destructive={true}
        icon={null}
        onConfirm={async () => {
          setConfirmAction(null);
          setActionLoading('reject');
          try {
            await onReject?.(approval.id);
          } finally {
            setActionLoading(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
