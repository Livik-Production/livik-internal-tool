'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import { useState, useEffect } from 'react';
import CustomTable from '../../CustomTable';
import { SquarePen, Trash, CheckCircle } from 'lucide-react';
import ConfirmDialog from '../../ConfirmDialog';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  updateEmployee as updateEmployeeAction,
  selectEmployeesItems,
  selectEmployeesStatus,
} from '../../../../store/slices/employeesSlice';

export default function PendingEmployees({
  canEdit = false,
  canApprove = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  isViewOnly = false,
  searchElement = null,
  searchQuery = '',
}) {
  const dispatch = useDispatch();
  const allEmployees = useSelector(selectEmployeesItems);
  const employeeStatus = useSelector(selectEmployeesStatus);

  // Filter only pending employees
  let employees = allEmployees.filter(
    (emp) => emp.status?.toUpperCase() === 'PENDING'
  );

  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    employees = employees.filter(
      (emp) =>
        (emp.name && emp.name.toLowerCase().includes(lowerQuery)) ||
        (emp.firstName && emp.firstName.toLowerCase().includes(lowerQuery)) ||
        (emp.lastName && emp.lastName.toLowerCase().includes(lowerQuery)) ||
        (emp.empId && emp.empId.toLowerCase().includes(lowerQuery)) ||
        (emp.email && emp.email.toLowerCase().includes(lowerQuery))
    );
  }

  useEffect(() => {
    if (employeeStatus === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employeeStatus]);

  // State for confirmation dialog
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // StatusBadge component
  const StatusBadge = ({ status = 'pending' }) => {
    const statusConfig = {
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        dotColor: 'bg-yellow-500',
      },
      active: {
        label: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-500',
      },
      approved: {
        label: 'Active',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-500',
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
        dotColor: 'bg-red-500',
      },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

    return (
      <div className="inline-flex items-center gap-1.5 justify-center">
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
        >
          {config.label}
        </span>
      </div>
    );
  };

  const handleApproveClick = (employee) => {
    if (canApprove) {
      setSelectedEmployee(employee);
      setIsApproveDialogOpen(true);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedEmployee) return;

    setIsUpdating(true);
    try {
      const employee = selectedEmployee;
      const serverId = employee.__raw?.id || employee.id;

      const res = await fetch(`/api/employees/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const updatedData = await res.json();

      const id = updatedData.empId ?? updatedData.id;
      const name =
        `${updatedData.firstName ?? ''} ${updatedData.lastName ?? ''}`.trim();

      const uiRow = {
        ...employee,
        id,
        name,
        status: updatedData.status,
        __raw: { ...employee.__raw, ...updatedData },
      };

      dispatch(updateEmployeeAction(uiRow));

      alert(`${employee.name} has been approved and activated!`);

      // Close the dialog
      setIsApproveDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveAll = async () => {
    if (canApprove && employees.length > 0) {
      if (
        window.confirm(
          `Are you sure you want to approve all ${employees.length} employees?`
        )
      ) {
        setIsUpdating(true);
        try {
          for (const emp of employees) {
            const serverId = emp.__raw?.id || emp.id;
            const res = await fetch(`/api/employees/${serverId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Active' }),
            });
            if (res.ok) {
              const updated = await res.json();
              dispatch(
                updateEmployeeAction({
                  ...emp,
                  status: 'Active',
                  __raw: { ...emp.__raw, ...updated },
                })
              );
            }
          }
          alert(`Approved all ${employees.length} employees`);
        } catch (error) {
          alert('Some approvals might have failed.');
        } finally {
          setIsUpdating(false);
        }
      }
    }
  };

  const columns = [
    {
      key: 'empId',
      label: 'EmpID',
      className: 'font-medium text-gray-900 text-left',
      align: 'left',
      render: (row) => (
        <HyperlinkButton
          onClick={() => onView && onView(row)}
          title="View employee details"
          className="text-sm"
        >
          {row.empId || row.id}
        </HyperlinkButton>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex flex-col text-center">
          <span className="font-medium text-gray-900">{row.name}</span>
          <span className="text-sm text-gray-500">{row.designation}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <div className="flex flex-col text-center">
          <span className="font-medium text-gray-900">{row.email}</span>
        </div>
      ),
    },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const tableActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      {/* Approve Button */}
      <IconButton
        onClick={() => handleApproveClick(row)}
        disabled={!canApprove || isUpdating}
        title={!canApprove ? 'Approve access restricted' : 'Approve Employee'}
        className="disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircle size={18} />
      </IconButton>

      {/* Edit Button */}
      <IconButton
        onClick={() => onEdit && onEdit(row)}
        disabled={!canEdit || isUpdating}
        title="Edit Profile"
      >
        <SquarePen size={18} />
      </IconButton>

      {/* Delete Button */}
      <IconButton
        onClick={() => onDelete && onDelete(row.id)}
        disabled={!canDelete || isUpdating}
        title={!canDelete ? 'Delete access restricted' : 'Delete'}
      >
        <Trash size={18} />
      </IconButton>
    </div>
  );

  return (
    <>
      <div className="">
        <div className="flex justify-end items-center mb-2 gap-3">
          {searchElement && <div>{searchElement}</div>}
          {employees.length > 0 && (
            <PrimaryButton
              onClick={handleApproveAll}
              disabled={!canApprove || isUpdating}
              className="px-4 py-2 m-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={!canApprove ? 'Approve access restricted' : 'Approve All'}
            >
              <CheckCircle size={16} />
              Approve All ({employees.length})
            </PrimaryButton>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CustomTable
            columns={columns}
            data={employees}
            rowKey="id"
            actions={tableActions}
            actionsHeader="Actions"
            actionsAlign="center"
          />
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={isApproveDialogOpen}
        onClose={() => {
          setIsApproveDialogOpen(false);
          setSelectedEmployee(null);
        }}
        title="Approve Employee"
        description={
          <div className="space-y-2">
            <p className="font-medium">
              Are you sure you want to approve{' '}
              <span className="text-blue-600">{selectedEmployee?.name}</span>?
            </p>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Employee ID:</span>{' '}
                {selectedEmployee?.empId || selectedEmployee?.id}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Email:</span>{' '}
                {selectedEmployee?.email}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                <span className="font-medium">Designation:</span>{' '}
                {selectedEmployee?.designation}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This will activate their account and grant access to the system.
            </p>
          </div>
        }
        confirmLabel="Yes, Approve"
        cancelLabel="Cancel"
        destructive={false}
        onConfirm={handleStatusChange}
        onCancel={() => {
          setIsApproveDialogOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </>
  );
}
