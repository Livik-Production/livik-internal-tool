'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Loader from '../../Loader';
import {
  Trash,
  SquarePen,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Settings,
} from 'lucide-react';
import CustomTable from '../../CustomTable';
import CreatePayrollModal from './ProcessPayrollModal';
import CustomAlertForm from '../../CustomAlertForm';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import Pagination from '../../Pagination';

export default function PayrollTab({
  employees = [],
  isViewOnly = false,
  isAdmin = false,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [payrollData, setPayrollData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default to 10
  const [modalMode, setModalMode] = useState('add');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [payrollToDelete, setPayrollToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewPayroll, setViewPayroll] = useState(null); // for month view modal

  const [payrollSettings, setPayrollSettings] = useState({
    sunday: 'Leave',
    saturday: 'Leave',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Real payroll statuses with workflow
  const PAYROLL_STATUS = {
    DRAFT: 'DRAFT',
    IN_PROGRESS: 'IN_PROGRESS',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    PROCESSED: 'PROCESSED',
    DISBURSED: 'DISBURSED',
    CANCELLED: 'CANCELLED',
  };

  // Function to check if a payroll is from a past month
  const isPastMonth = (payroll) => {
    const today = new Date();
    const todayMonth = today.getMonth(); // 0-11
    const todayYear = today.getFullYear();

    try {
      // Parse the month string (e.g., "DEC-2025")
      const [monthStr, yearStr] = payroll.month.split('-');
      const payrollYear = parseInt(yearStr);

      // Convert month string to number
      const monthNames = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
      };

      const payrollMonth = monthNames[monthStr.toUpperCase()];

      // Check if it's a past month
      if (payrollYear < todayYear) {
        return true; // Previous year
      } else if (payrollYear === todayYear && payrollMonth < todayMonth) {
        return true; // Same year, previous month
      }

      return false; // Current or future month
    } catch (error) {
      console.error('Error parsing month:', payroll.month, error);
      return false;
    }
  };

  // Fetch Payroll Data
  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payroll/data');
      if (response.ok) {
        const data = await response.json();
        setPayrollData(data);

        // Find current cycle (matching current month and year)
        const now = new Date();
        const currentMonthStr = `${now.toLocaleString('default', { month: 'short' }).toUpperCase()}-${now.getFullYear()}`; // e.g., "JAN-2026"

        const currentMatch = data.find((p) => p.month === currentMonthStr);
        // Upcoming include current and future
        const upcoming = data.filter((p) => !isPastMonth(p));

        const current =
          currentMatch ||
          (upcoming.length > 0
            ? upcoming[upcoming.length - 1]
            : data.length > 0
              ? data[0]
              : null);

        setCurrentCycle(current);
      } else {
        console.error('Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Payroll Settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/payroll/settings');
      if (response.ok) {
        const data = await response.json();
        setPayrollSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  useEffect(() => {
    fetchPayrollData();
    fetchSettings();
  }, []);

  // Reset pagination when payroll data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [payrollData.length]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedPayrollData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return payrollData.slice(startIndex, startIndex + itemsPerPage);
  }, [payrollData, currentPage, itemsPerPage]);

  // Handle payroll workflow actions
  const handleWorkflowAction = (payrollId, action) => {
    // First update local state for immediate UI feedback
    const updatedData = payrollData.map((item) => {
      if (item.id === payrollId) {
        let updated = { ...item };

        switch (action) {
          case 'submit_for_approval':
            updated.status = PAYROLL_STATUS.PENDING_APPROVAL;
            updated.submittedDate = new Date().toISOString().split('T')[0];
            break;
          case 'approve':
            updated.status = PAYROLL_STATUS.APPROVED;
            updated.approver = 'You';
            updated.approvedDate = new Date().toISOString().split('T')[0];
            break;
          case 'process':
            updated.status = PAYROLL_STATUS.PROCESSED;
            updated.processedBy = 'You';
            updated.processedDate = new Date().toISOString().split('T')[0];
            updated.bankFile = `bankfile_${updated.month
              .replace('-', '_')
              .toLowerCase()}.txt`;
            break;
          case 'disburse':
            updated.status = PAYROLL_STATUS.DISBURSED;
            updated.paymentDate = new Date().toISOString().split('T')[0];
            updated.payslipsGenerated = true;
            break;
          case 'cancel':
            updated.status = PAYROLL_STATUS.CANCELLED;
            updated.cancelledDate = new Date().toISOString().split('T')[0];
            break;
          case 'generate_payslips':
            updated.payslipsGenerated = true;
            break;
          case 'submit_compliance':
            updated.complianceSubmitted = true;
            break;
        }
        return updated;
      }
      return item;
    });

    setPayrollData(updatedData);

    // Send API request to update backend
    const updateBackend = async () => {
      try {
        const payrollItem = updatedData.find((item) => item.id === payrollId);
        // Check if ID is a cycleId (meaning it's the auto-derived ones from our mockup route)
        // In a real app, you'd only PUT if it actually has a DB record.
        // For now, let's keep the mock persistence logic if the route exists.
        const response = await fetch(`/api/payroll/data/${payrollId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payrollItem),
        });

        if (!response.ok) {
          console.error('Failed to update payroll in backend');
          // If 404, it might be because the record doesn't exist yet in DB but is derived
          // We don't necessarily want to refresh if it's just a derived record
        }
      } catch (error) {
        console.error('Error updating payroll:', error);
      }
    };

    updateBackend();

    setAlertConfig({
      isOpen: true,
      title: 'Success',
      message: `Payroll ${action.replace('_', ' ')} successful!`,
      type: 'success',
    });
  };

  // Handle delete payroll
  const handleDeletePayroll = (payroll) => {
    if (!isAdmin) {
      setAlertConfig({
        isOpen: true,
        title: 'Access Denied',
        message: 'Only administrators can delete payroll cycles.',
        type: 'warning',
      });
      return;
    }

    // If user is Admin, we allow deletion regardless of status as requested
    const currentStatus = String(payroll.status || '').toUpperCase();

    if (
      !isAdmin &&
      currentStatus !== 'DRAFT' &&
      currentStatus !== 'CANCELLED' &&
      currentStatus !== 'PROCESSED'
    ) {
      setAlertConfig({
        isOpen: true,
        title: 'Action Not Allowed',
        message: `Cannot delete payroll in ${payroll.status} status. Please cancel the cycle first before attempting deletion.`,
        type: 'warning',
      });
      return;
    }

    setPayrollToDelete(payroll);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePayroll = () => {
    if (!payrollToDelete) return;

    // First update local state
    const updatedData = payrollData.filter(
      (item) => item.id !== payrollToDelete.id
    );
    setPayrollData(updatedData);

    // Then delete from backend
    const deleteFromBackend = async () => {
      try {
        const response = await fetch(
          `/api/payroll/data/${payrollToDelete.id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          console.error('Failed to delete payroll from backend');
        }
      } catch (error) {
        console.error('Error deleting payroll:', error);
      }
    };

    deleteFromBackend();

    setShowDeleteConfirm(false);
    setPayrollToDelete(null);
  };

  // Status badge component with real workflow
  const StatusBadge = ({ status, payroll }) => {
    const getStatusConfig = (status) => {
      const s = String(status || '').toUpperCase();
      const configs = {
        [PAYROLL_STATUS.DRAFT]: {
          color: 'bg-slate-100 text-slate-700 border border-slate-200',
        },
        [PAYROLL_STATUS.IN_PROGRESS]: {
          color: 'bg-[#1e40af] text-white font-bold shadow-md',
          dot: 'bg-white animate-pulse',
        },
        [PAYROLL_STATUS.PENDING_APPROVAL]: {
          color: 'bg-amber-50 text-amber-700 border border-amber-200',
          dot: 'bg-amber-500',
        },
        [PAYROLL_STATUS.APPROVED]: {
          color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          dot: 'bg-emerald-500',
        },
        [PAYROLL_STATUS.PROCESSED]: {
          color: 'bg-green-600 text-white font-bold shadow-sm',
          dot: 'bg-white',
        },
        [PAYROLL_STATUS.DISBURSED]: {
          color: 'bg-teal-50 text-teal-700 border border-teal-200',
          dot: 'bg-teal-500',
        },
        [PAYROLL_STATUS.CANCELLED]: {
          color: 'bg-rose-50 text-rose-700 border border-rose-200',
          dot: 'bg-rose-500',
        },
      };
      return configs[s] || configs[PAYROLL_STATUS.DRAFT];
    };

    const config = getStatusConfig(status);

    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${config.color}`}
        title={`${status}${
          payroll.approver ? ` | Approved by: ${payroll.approver}` : ''
        }`}
      >
        {config.dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 ${config.dot}`}
          ></span>
        )}
        {status}
      </div>
    );
  };

  // Get actionable items for current cycle
  const getCurrentCycleActions = () => {
    if (!currentCycle) return null;

    const actions = [];

    switch (currentCycle.status) {
      case PAYROLL_STATUS.DRAFT:
        actions.push({
          label: 'Start Processing',
          action: () =>
            handleWorkflowAction(currentCycle.id, 'submit_for_approval'),
          color: 'bg-blue-600 hover:bg-blue-700',
          icon: <Clock className="w-4 h-4" />,
        });
        break;

      case PAYROLL_STATUS.PENDING_APPROVAL:
        actions.push({
          label: 'Approve Payroll',
          action: () => handleWorkflowAction(currentCycle.id, 'approve'),
          color: 'bg-green-600 hover:bg-green-700',
          icon: <CheckCircle className="w-4 h-4" />,
        });
        break;

      case PAYROLL_STATUS.APPROVED:
        actions.push({
          label: 'Process Payment',
          action: () => handleWorkflowAction(currentCycle.id, 'process'),
          color: 'bg-purple-600 hover:bg-purple-700',
          icon: <Send className="w-4 h-4" />,
        });
        break;
    }

    return actions;
  };

  // Calculate payroll statistics from all visible data
  const calculateStats = () => {
    const processed = payrollData.filter(
      (item) =>
        item.status === PAYROLL_STATUS.PROCESSED ||
        item.status === PAYROLL_STATUS.DISBURSED
    ).length;

    const pending = payrollData.filter(
      (item) =>
        item.status === PAYROLL_STATUS.DRAFT ||
        item.status === PAYROLL_STATUS.IN_PROGRESS ||
        item.status === PAYROLL_STATUS.PENDING_APPROVAL
    ).length;

    const totalAmount = payrollData
      .filter((item) => item.status === PAYROLL_STATUS.DISBURSED)
      .reduce((sum, item) => {
        const amount = parseFloat(item.totalNet.replace(/[^0-9.-]+/g, '')) || 0;
        return sum + amount;
      }, 0);

    return {
      totalCycles: payrollData.length,
      processed,
      pending,
      totalAmount: `₹${totalAmount.toLocaleString('en-IN')}`,
    };
  };

  const stats = calculateStats();
  const currentActions = getCurrentCycleActions();

  // Define table columns
  const columns = [
    {
      key: 'month',
      label: 'Payroll Month',
      render: (row) => (
        <div>
          <HyperlinkButton
            onClick={() => setViewPayroll(row)}
            title="Click to view payroll details"
          >
            {row.month}
          </HyperlinkButton>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      label: 'Employees',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{row.employeeCount}</span>
        </div>
      ),
    },
    {
      key: 'totalGross',
      label: 'Gross Salary',
      className: 'font-semibold text-gray-900',
      render: (row) =>
        `₹${Number(row.totalGross || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'totalDeductions',
      label: 'Deductions',
      render: (row) =>
        `₹${Number(row.totalDeductions || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'totalNet',
      label: 'Net Pay',
      className: 'font-semibold text-[#173469]',
      render: (row) => `₹${Number(row.totalNet || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      className: 'text-gray-600',
      render: (row) =>
        row.startDate
          ? new Date(row.startDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
    {
      key: 'endDate',
      label: 'End Date',
      className: 'text-gray-600',
      render: (row) =>
        row.endDate
          ? new Date(row.endDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} payroll={row} />,
    },
  ];

  // Custom actions column without header
  const renderActionsColumn = () => {
    return {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            onClick={() => isAdmin && !isViewOnly && handleDeletePayroll(row)}
            disabled={isViewOnly || !isAdmin}
            className={`transition-colors ${
              isViewOnly || !isAdmin
                ? 'text-gray-300'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
            title={
              !isAdmin
                ? 'Only admins can delete'
                : isViewOnly
                  ? 'View only'
                  : 'Delete'
            }
          >
            <Trash size={16} />
          </IconButton>

          {row.status === PAYROLL_STATUS.PENDING_APPROVAL && (
            <IconButton
              onClick={() =>
                !isViewOnly && handleWorkflowAction(row.id, 'approve')
              }
              disabled={isViewOnly}
              className={`transition-colors ${
                isViewOnly
                  ? 'text-gray-300'
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              title={isViewOnly ? 'View only' : 'Approve'}
            >
              <CheckCircle size={16} />
            </IconButton>
          )}
        </div>
      ),
      className: 'text-right',
    };
  };

  // Create columns including the actions column without header
  const tableColumns = [...columns, renderActionsColumn()];

  // Handle new payroll creation
  const handleCreated = (newPayroll) => {
    setPayrollData((prev) => [newPayroll, ...prev]);
    // Optionally update current cycle if it's for the current month
    const now = new Date();
    const currentMonthStr = `${now.toLocaleString('default', { month: 'short' }).toUpperCase()}-${now.getFullYear()}`;
    if (newPayroll.month === currentMonthStr) {
      setCurrentCycle(newPayroll);
    }
  };

  return (
    <div key={isLoading} className="space-y-4 animate-dashboard-reveal">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader
            label="Loading payroll data..."
            size="md"
            fullScreen={false}
          />
        </div>
      ) : (
        <>
          {/* Current Cycle Alert integrated into header below */}

          <div className="flex justify-between items-end mb-4 p-3">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                Payroll Cycles
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">
                  Current Payroll Cycle:
                </span>
                <span className="bg-[#1e40af] text-white px-3 py-1 rounded-full shadow-sm text-sm font-semibold">
                  {(() => {
                    const now = new Date();
                    return `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
                  })()}
                </span>
                {currentCycle && (
                  <>
                    <StatusBadge
                      status={currentCycle.status}
                      payroll={currentCycle}
                    />
                    <div className="flex gap-2 ml-1">
                      {currentActions?.map((action, index) => (
                        <PrimaryButton
                          key={index}
                          onClick={() => !isViewOnly && action.action()}
                          disabled={isViewOnly}
                          className={`px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                            isViewOnly
                              ? 'bg-gray-100 text-gray-400 border border-gray-200'
                              : `${action.color} border border-transparent`
                          }`}
                        >
                          {React.cloneElement(action.icon, { size: 14 })}
                          {action.label}
                        </PrimaryButton>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <PrimaryButton
                onClick={() => !isViewOnly && setIsCreateModalOpen(true)}
                disabled={isViewOnly}
                className="flex items-center gap-2 p-2"
              >
                + Create New Payroll
              </PrimaryButton>
              <PrimaryButton
                disabled={isViewOnly}
                className="flex items-center gap-2 p-2 text-gray-700 border border-gray-300 "
              >
                <Download size={18} />
                Export Summary
              </PrimaryButton>
            </div>
          </div>

          {/* Payroll Cycles Table */}
          {payrollData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Payroll Records
              </h3>
              <p className="text-gray-500">
                Create your first payroll cycle to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <CustomTable
                columns={tableColumns}
                data={paginatedPayrollData}
                rowKey="id"
                rowClassName={(row) => {
                  const now = new Date();
                  const currentMonthStr = `${now.toLocaleString('default', { month: 'short' }).toUpperCase()}-${now.getFullYear()}`;
                  if (row.month === currentMonthStr) {
                    return 'bg-blue-50/70 border-l-4 border-blue-600 hover:bg-blue-100/70';
                  }
                  return 'hover:bg-gray-50';
                }}
                className="border border-gray-200 rounded-lg shadow-sm"
                theadClassName="bg-gray-50/80"
                tbodyClassName="bg-white divide-y divide-gray-200"
              />
              <Pagination
                currentPage={currentPage}
                totalItems={payrollData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                rowsPerPageOptions={[5, 10, 20, 50, 100]}
              />
            </div>
          )}

          {/* Process Payroll Modal */}
          <CreatePayrollModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPayroll(null);
            }}
            mode={modalMode}
            selectedData={selectedPayroll}
            employees={employees}
            onCreated={handleCreated}
            settings={payrollSettings}
          />

          <CustomAlertForm
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDeletePayroll}
            title="Delete Payroll Cycle"
            message={`Are you sure you want to delete the payroll cycle for "${payrollToDelete?.period}"? This action cannot be undone.`}
            type="danger"
            confirmText="Delete"
            cancelText="Cancel"
            details={
              payrollToDelete && (
                <div className="text-sm">
                  <p className="font-bold">
                    Cycle ID: {payrollToDelete.cycleId}
                  </p>
                  <p className="text-gray-500">
                    Status: {payrollToDelete.status}
                  </p>
                </div>
              )
            }
          />

          <CreatePayrollModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            employees={employees}
            onCreated={handleCreated}
            settings={payrollSettings}
          />

          <CustomAlertForm
            isOpen={alertConfig.isOpen}
            onClose={() =>
              setAlertConfig((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={() =>
              setAlertConfig((prev) => ({ ...prev, isOpen: false }))
            }
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            confirmText="OK"
            cancelText="Close"
          />

          <CreatePayrollModal
            isOpen={!!viewPayroll}
            onClose={() => setViewPayroll(null)}
            employees={employees}
            settings={payrollSettings}
            isViewOnly={true}
            viewPayroll={viewPayroll}
          />
        </>
      )}
    </div>
  );
}
