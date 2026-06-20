// "use client";

// import React from "react";
// import Button from "./Button";

// /**
//  * ApprovalCard - renders an approval item used in the Approvals tab.
//  *
//  * Props:
//  * - approval: { id, type, employee, details, status }
//  * - onApprove: (id) => void
//  * - onReject: (id) => void
//  */
// export default function ApprovalCard({ approval, onApprove, onReject }) {
//   // Extract leave ID from approval object
//   const leaveId = approval.id || approval.leaveId || "N/A";

//   return (
//     <div className="p-5 border border-gray-200 rounded-xl shadow-sm flex justify-between bg-white hover:shadow-md transition cursor-default">
//       <div>
//         {/* Header with leave ID */}
//         <div className="flex items-center gap-2 mb-1">
//           <div className="text-gray-600 font-medium text-base select-text">
//             {approval.type}
//           </div>
//           <span className="text-gray-400 text-sm">•</span>
//           <span className="text-blue-600 font-semibold text-sm">
//             ID: {leaveId}
//           </span>
//         </div>

//         <div className="text-gray-900 font-semibold text-lg select-text">
//           {approval.employee}
//         </div>
//         <div className="text-gray-500 mt-1 text-sm select-text">
//           {approval.details}
//         </div>
//       </div>

//       <div className="flex flex-col items-end gap-2">
//         <span className="inline-block text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-700 font-medium select-none">
//           {approval.status}
//         </span>

//         {approval.status === "Pending" && (
//           <div className="flex gap-3">
//             <Button
//               onClick={() => onApprove?.(approval.id)}
//               className="px-5 py-1 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
//             >
//               Approve
//             </Button>
//             <Button
//               onClick={() => onReject?.(approval.id)}
//               className="px-5 py-1 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
//             >
//               Reject
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState } from 'react';
import Button from './Buttons/Button';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import HyperlinkButton from './Buttons/HyperlinkButton';
import PrimaryButton from './Buttons/PrimaryButton';
// import LeaveRequestForm from "../components/EmployeePortal/LeaveRequestForm";

/**
 * ApprovalCard - renders an approval item used in the Approvals tab.
 *
 * Props:
 * - approval: { id, type, employee, details, status, category } // Added category
 * - onApprove: (id) => void
 * - onReject: (id) => void
 */
export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isDisabled = false,
  onViewDetails,
  onViewStats,
  onViewQuickInfo,
}) {
  // Extract leave ID from approval object
  const leaveId = approval.id || approval.leaveId || 'N/A';
  const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | null

  // Determine if it's a Leave Request or Role Change
  const isLeaveRequest =
    approval.category === 'leave' ||
    approval.type?.toLowerCase().includes('leave') ||
    (approval.details && approval.details.toLowerCase().includes('leave'));

  // Helper function to convert leave type to code
  const getLeaveTypeCode = (type) => {
    if (!type) return 'sl';

    // Strip -LOP suffix if present for code mapping
    const cleanType = type.replace(/-LOP$/i, '');
    const typeLower = cleanType.toLowerCase();

    // Check for exact code matches first (SL, CL, EL, ML, LOP)
    if (typeLower === 'sl') return 'sl';
    if (typeLower === 'cl') return 'cl';
    if (typeLower === 'lop') return 'lop';

    // Then check for full name matches
    if (typeLower.includes('sick')) return 'sl';
    if (typeLower.includes('casual')) return 'cl';

    // Default fallback
    return typeLower;
  };

  // Helper to format leave type display
  const getDisplayType = (type) => {
    if (!type) return 'Leave Request';

    const cleanType = type.replace(/-LOP$/, '');

    // Map codes to names if needed, or just use the code
    let name = cleanType;
    if (cleanType === 'SL') name = 'Sick Leave';
    else if (cleanType === 'CL') name = 'Casual Leave';

    return name;
  };

  // Prepare data for the LeaveRequestForm modal (only for leave requests)
  const getFormData = () => {
    if (!isLeaveRequest) return null;

    return {
      leave_id: approval.leaveId || approval.id,
      id: approval.id || '',
      leave_id: approval.leaveId || '',
      type: getLeaveTypeCode(approval.type || ''),
      from: approval.startDate || approval.from || '',
      to: approval.endDate || approval.to || '',
      details: approval.reason || approval.details || '',
      document: approval.document || null,
      status: approval.status || '',
      employee: approval.employeeName || approval.employee || '',
      days: approval.totalDays ?? approval.days ?? 0,
      totalDays: approval.totalDays ?? approval.days ?? 0,
      applied_date: approval.createdDate || approval.date || '',
      employeeId: approval.employeeId || '',
      empId: approval.empId || '',
      employeePhoto: approval.employeePhoto || null,
      leaveType: approval.type || '',
      isHalfDay: approval.isHalfDay || false,
      halfDayPeriod: approval.halfDayPeriod || '',
    };
  };

  // Handle opening the modal (only for leave requests)
  const handleOpenModal = () => {
    if (isLeaveRequest && onViewDetails) {
      onViewDetails(getFormData());
    }
  };

  // Format dates
  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="p-5 bg-white flex flex-col justify-between h-full border border-blue-300  text-gray-900">
        <div>
          {/* Header section - Redesigned Line 1 */}
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
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-gray-100 transition-colors ${isLeaveRequest ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuickInfo?.(approval.empData || approval);
                    }}
                  >
                    <span className="text-sm font-bold">
                      {isLeaveRequest ? 'LR' : 'RC'}
                    </span>
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
                  </div>
                </div>

                <span className="text-gray-300 mx-1">-</span>

                <HyperlinkButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal();
                  }}
                  className=" cursor-pointer  font-bold text-sm hover:underline transition-colors"
                  title="click to view leave details"
                >
                  {leaveId}
                </HyperlinkButton>
              </div>

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

          <div className="border-t border-gray-100 my-4"></div>

          {/* Content Body - Redesigned nextLines */}
          <div className="space-y-4">
            {isLeaveRequest ? (
              <>
                {/* Line 2: LeaveType TotalDays AppliedOn */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                      Leave Type
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {getDisplayType(approval.type)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                      Total Days
                    </div>
                    <div className="text-sm font-extrabold text-blue-700">
                      {approval.totalDays ?? approval.days} Days
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                      Applied On
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {formatDate(approval.appliedDate || approval.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Line 3: Duration Reason */}
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                      Duration
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      {formatDate(approval.startDate)} -{' '}
                      {formatDate(approval.endDate)}
                    </div>
                  </div>
                  {approval.isHalfDay && (
                    <div className="w-1/3">
                      <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                        Half Day
                      </div>
                      <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                        {approval.halfDayPeriod || 'Yes'}
                      </div>
                    </div>
                  )}
                  <div className={approval.isHalfDay ? 'w-1/3' : 'w-2/3'}>
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-tight">
                      Reason
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-1 italic bg-gray-50/50 px-2 py-0.5 rounded">
                      {approval.details
                        ? `"${approval.details}"`
                        : 'No reason provided'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm">
                {approval.details || 'Request to change role'}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2">
          <div className="flex justify-end gap-3">
            {(approval.status === 'Pending' || !approval.status) && (
              <>
                <Button
                  onClick={() => setConfirmAction('reject')}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isDisabled || actionLoading
                      ? 'bg-red-500 text-white cursor-not-allowed'
                      : 'bg-white text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300'
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
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    isDisabled || actionLoading
                      ? 'bg-[#004475] text-white cursor-not-allowed'
                      : 'bg-[#003273] text-white hover:bg-[#002657] hover:shadow'
                  }`}
                  disabled={isDisabled || !!actionLoading}
                >
                  {actionLoading === 'approve' && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Approve Dialog */}
      <ConfirmDialog
        open={confirmAction === 'approve'}
        title="Confirm Approve"
        description={`Are you sure you want to approve this ${isLeaveRequest ? 'leave request' : 'request'} from ${approval.employee}?`}
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

      {/* Confirm Reject Dialog */}
      <ConfirmDialog
        open={confirmAction === 'reject'}
        title="Confirm Reject"
        description={`Are you sure you want to reject this ${isLeaveRequest ? 'leave request' : 'request'} from ${approval.employee}? This action cannot be undone.`}
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
