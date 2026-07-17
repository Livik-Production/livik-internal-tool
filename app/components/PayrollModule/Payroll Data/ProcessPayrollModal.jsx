'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AttendanceTabContent from './AttendancePayrolltab'; // Import the separate component
import { showSuccessToast, showErrorToast } from '../../Toast';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../CustomAlertForm';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';

// Main CreatePayrollModal Component
export default function CreatePayrollModal({
  isOpen,
  onClose,
  employees = [],
  onCreated,
  settings,
  isViewOnly = false, // true when opened from the month link
  viewPayroll = null, // the payroll row to view
}) {
  const authUser = useSelector((state) => state.auth?.user);

  // Derive initial selectedMonth from viewPayroll ("MMM-YYYY" → "YYYY-MM") or default to current month
  const toInputMonth = (monthStr) => {
    if (!monthStr) return new Date().toISOString().slice(0, 7);
    const MAP = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12',
    };
    const [m, y] = monthStr.split('-');
    return `${y}-${MAP[m?.toUpperCase()] || '01'}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(
    toInputMonth(viewPayroll?.month)
  );

  // When the viewPayroll changes (modal re-opened for a different row), sync the month
  useEffect(() => {
    if (isViewOnly && viewPayroll?.month) {
      setSelectedMonth(toInputMonth(viewPayroll.month));
    }
  }, [viewPayroll?.month, isViewOnly]);

  // Payroll statuses
  const PAYROLL_STATUS = {
    DRAFT: 'Draft',
    IN_PROGRESS: 'In Progress',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    PROCESSED: 'Processed',
    DISBURSED: 'Disbursed',
    CANCELLED: 'Cancelled',
  };

  // Payroll form state
  const [payrollForm, setPayrollForm] = useState({
    cycleId: '',
    month: '',
    period: '',
    startDate: '',
    endDate: '',
    processingDate: '',
    paymentDate: '',
    employeeCount: 0,
    totalGross: '₹0',
    totalTax: '₹0',
    totalDeductions: '₹0',
    totalNet: '₹0',
    status: PAYROLL_STATUS.DRAFT,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPendingLeaves, setHasPendingLeaves] = useState(false);
  const [checkingPending, setCheckingPending] = useState(false);

  // Alert state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });
  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, title, message, type, onConfirm });
  };
  const closeAlert = () => {
    const cb = alertModal.onConfirm;
    setAlertModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
    if (cb) cb();
  };

  // Handle payroll submission
  const handleSubmitPayroll = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          settings: settings,
          createdBy: authUser?.name || 'Unknown',
          updatedBy: authUser?.name || 'Unknown',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process payroll');
      }

      const result = await res.json();

      if (onCreated) {
        onCreated(result.cycle);
      }

      showSuccessToast('Payroll processed and saved successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      showErrorToast(`Processing Failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for pending leave requests
  const checkPendingLeaves = async (month) => {
    if (!month || isViewOnly) return;
    setCheckingPending(true);
    try {
      const res = await fetch(`/api/leave?checkPending=true&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setHasPendingLeaves(data.hasPending);
      }
    } catch (err) {
      console.error('Failed to check pending leaves:', err);
    } finally {
      setCheckingPending(false);
    }
  };

  useEffect(() => {
    if (selectedMonth && !isViewOnly) {
      checkPendingLeaves(selectedMonth);
    }
  }, [selectedMonth, isViewOnly]);

  // Update payroll form when month changes
  useEffect(() => {
    if (!selectedMonth) return;

    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const monthName = monthNames[month - 1];
    const monthValue = String(month).padStart(2, '0');

    const startDate = `${year}-${monthValue}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const processingDate = `${year}-${monthValue}-25`;
    const paymentDate = endDate;

    setPayrollForm((prev) => ({
      ...prev,
      cycleId: `PAY-${year}-${monthValue}`,
      month: `${monthName}-${year}`,
      period: `${date.toLocaleString('default', { month: 'long' })} ${year}`,
      startDate,
      endDate,
      processingDate,
      paymentDate,
    }));
  }, [selectedMonth]);

  // Handle stats update from attendance child
  const handleStatsCalculated = (stats) => {
    setPayrollForm((prev) => ({
      ...prev,
      employeeCount: stats.totalEmployees,
      totalGross: `₹${stats.totalGrossPay.toLocaleString('en-IN')}`,
      totalNet: `₹${stats.totalNetPay.toLocaleString('en-IN')}`,
      totalTax: '₹0',
    }));
  };

  return (
    <>
      <CustomModalForm
        open={isOpen}
        onClose={onClose}
        widthClass="max-w-[95vw] lg:max-w-[1200px]"
        title={
          isViewOnly
            ? `Payroll Details — ${viewPayroll?.month}`
            : 'Create New Payroll'
        }
        footer={
          <div className="flex flex-col gap-4 w-full">
            {hasPendingLeaves && !isViewOnly && (
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 animate-pulse">
                <span className="text-sm font-medium text-center">
                  ⚠️ There are pending leave requests. Please take action on
                  them before creating the payroll.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 w-full">
              {isViewOnly &&
              (viewPayroll?.createdAt ||
                viewPayroll?.updatedAt ||
                viewPayroll?.createdBy ||
                viewPayroll?.createBy ||
                viewPayroll?.created_by) ? (
                <div className="flex flex-col text-[10px] text-gray-400 font-medium text-left">
                  <span>
                    Created:{' '}
                    {viewPayroll.createdAt
                      ? new Date(viewPayroll.createdAt).toLocaleString()
                      : ''}{' '}
                    {viewPayroll.createdBy ||
                    viewPayroll.createBy ||
                    viewPayroll.created_by
                      ? `by ${viewPayroll.createdBy || viewPayroll.createBy || viewPayroll.created_by}`
                      : ''}
                  </span>
                  {(viewPayroll.updatedAt || viewPayroll.updated_at) && (
                    <span>
                      Updated:{' '}
                      {new Date(
                        viewPayroll.updatedAt || viewPayroll.updated_at
                      ).toLocaleString()}{' '}
                      {viewPayroll.updatedBy ||
                      viewPayroll.UpdatedBy ||
                      viewPayroll.updated_by
                        ? `by ${viewPayroll.updatedBy || viewPayroll.UpdatedBy || viewPayroll.updated_by}`
                        : ''}
                    </span>
                  )}
                </div>
              ) : (
                <div />
              )}
              <div className="flex justify-end gap-3">
                {!isViewOnly && (
                  <Button onClick={onClose} className="px-4 py-2">
                    Cancel
                  </Button>
                )}
                {!isViewOnly && (
                  <PrimaryButton
                    onClick={handleSubmitPayroll}
                    disabled={
                      isProcessing || hasPendingLeaves || checkingPending
                    }
                    className="px-6 py-2"
                  >
                    {isProcessing
                      ? 'Processing...'
                      : checkingPending
                        ? 'Checking...'
                        : 'Create Payroll'}
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        }
      >
        <div className="">
          <AttendanceTabContent
            employees={employees}
            canControlAllEmployees={true}
            selectedMonth={selectedMonth}
            onMonthChange={isViewOnly ? () => {} : setSelectedMonth}
            onStatsCalculated={handleStatsCalculated}
            settings={settings}
          />
        </div>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={alertModal.onConfirm || closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        cancelText="Close"
      />
    </>
  );
}
