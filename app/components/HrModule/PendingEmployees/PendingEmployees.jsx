'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import { useState, useEffect, useMemo } from 'react';
import CustomTable from '../../CustomTable';
import Pagination from '../../Pagination';
import { SquarePen, Trash, CheckCircle } from 'lucide-react';
import ConfirmDialog from '../../ConfirmDialog';
import CustomAlertForm from '../../CustomAlertForm';
import { toast } from 'react-toastify';
import Loader from '../../Loader';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  updateEmployee as updateEmployeeAction,
  selectEmployeesItems,
  selectEmployeesStatus,
  resetStatus,
} from '../../../../store/slices/employeesSlice';

export default function PendingEmployees({
  canEdit = false,
  canApprove = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
  onApproveSuccess,
  isViewOnly = false,
  searchElement = null,
  searchQuery = '',
  isAdmin = false,
}) {
  const dispatch = useDispatch();
  const allEmployees = useSelector(selectEmployeesItems);
  const employeeStatus = useSelector(selectEmployeesStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authUser = useSelector((state) => state.auth?.user);
  const roleName = authUser?.role?.name?.toUpperCase() ?? authUser?.roleName?.toUpperCase() ?? null;

  // Filter only pending employees (including PENDING_ADMIN)
  let employees = allEmployees.filter((emp) => {
    const statusUpper = emp.status?.toUpperCase();
    if (statusUpper === 'ACTIVE' || statusUpper === 'APPROVED' || statusUpper === 'INACTIVE') {
      return false;
    }

    const isPending = statusUpper === 'PENDING';
    const isPendingAdmin = statusUpper === 'PENDING_ADMIN';
    const createdByAdmin = emp.createdByRole === 'SUPER_ADMIN';
    const isLegacy = !emp.createdByRole;

    if (isAdmin) {
      // Admin sees their own pending + anyone's approved + Legacy
      return (isPending && createdByAdmin) || isPendingAdmin || isLegacy;
    } else {
      // HR / HR_ADMIN sees all pending employees
      return isPending;
    }
  });

  const isDetailsComplete = (row) => {
    const r = row.__raw || {};
    if (r.workType === 'CONTRACT') {
      return !!(r.firstName && r.lastName && r.phoneNumber && r.bondRemarks);
    }
    return !!(
      r.aadhaarNumber &&
      r.panNumber &&
      r.dateOfBirth &&
      r.presentAddress
    );
  };

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

  // Force a fresh fetch every time this component mounts so HR always
  // sees the latest employee data (e.g. after an employee fills their profile).
  useEffect(() => {
    dispatch(resetStatus());
  }, [dispatch]);

  useEffect(() => {
    if (employeeStatus === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employeeStatus]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return employees.slice(startIndex, startIndex + itemsPerPage);
  }, [employees, currentPage, itemsPerPage]);

  const hasApprovableEmployees = useMemo(() => {
    return employees.some((emp) => {
      const complete = isDetailsComplete(emp);
      const isPendingAdmin = emp.status?.toUpperCase() === 'PENDING_ADMIN';
      return complete && (isAdmin || !isPendingAdmin);
    });
  }, [employees, isAdmin]);

  // State for confirmation dialog
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // State for alerts and bulk approval confirmation
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });
  const [isApproveAllDialogOpen, setIsApproveAllDialogOpen] = useState(false);

  const showAlert = (title, message, type = 'success') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // StatusBadge component
  const StatusBadge = ({ status = 'pending' }) => {
    const statusConfig = {
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        dotColor: 'bg-yellow-500',
      },
      pending_admin: {
        label: 'Pending Admin',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        dotColor: 'bg-purple-500',
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
      const targetStatus = isAdmin ? 'Active' : 'PENDING_ADMIN';

      const res = await fetch(`/api/employees/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
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

      if (onApproveSuccess) {
        onApproveSuccess(uiRow);
      }

      toast.success(
        `${employee.name} has been approved${!isAdmin ? ' (pending Admin approval)' : ''}!`
      );

      // Close the dialog
      setIsApproveDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveAllClick = () => {
    if (canApprove && employees.length > 0) {
      setIsApproveAllDialogOpen(true);
    }
  };

  const handleApproveAllConfirm = async () => {
    setIsApproveAllDialogOpen(false);
    setIsUpdating(true);
    try {
      let approvedCount = 0;
      for (const emp of employees) {
        // Skip employees who haven't completed their portal setup
        if (!isDetailsComplete(emp)) continue;

        // Skip employees who are already PENDING_ADMIN if we are not Admin
        if (!isAdmin && emp.status?.toUpperCase() === 'PENDING_ADMIN') continue;

        const serverId = emp.__raw?.id || emp.id;
        const targetStatus = isAdmin ? 'Active' : 'PENDING_ADMIN';
        const res = await fetch(`/api/employees/${serverId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus }),
        });
        if (res.ok) {
          const updated = await res.json();
          dispatch(
            updateEmployeeAction({
              ...emp,
              status: targetStatus,
              __raw: { ...emp.__raw, ...updated },
            })
          );
          approvedCount++;
        }
      }
      dispatch(fetchEmployees());
      toast.success(`${approvedCount} employees approved successfully!`);
    } catch (error) {
      toast.error('Some approvals might have failed.');
    } finally {
      setIsUpdating(false);
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

  const tableActions = (row) => {
    const complete = isDetailsComplete(row);
    const isPendingAdmin = row.status?.toUpperCase() === 'PENDING_ADMIN';
    const disableApprove =
      !canApprove || isUpdating || !complete || (!isAdmin && isPendingAdmin);

    let approveTitle = 'Approve Employee';
    if (!canApprove) approveTitle = 'Approve access restricted';
    else if (!complete) approveTitle = 'Pending details from employee portal';
    else if (!isAdmin && isPendingAdmin)
      approveTitle = 'Waiting for Admin approval';

    return (
      <div className="flex items-center justify-center gap-2">
        {/* Approve Button */}
        <IconButton
          onClick={() => handleApproveClick(row)}
          disabled={disableApprove}
          title={approveTitle}
          className="disabled disabled:cursor-not-allowed"
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
  };

  if (employeeStatus === 'loading') {
    return (
      <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        <Loader label="Loading pending employees..." fullScreen={false} />
      </div>
    );
  }

  return (
    <>
      <div className="">
        <div className="flex justify-end items-center mb-2 gap-3 min-h-[56px]">
          {searchElement && <div>{searchElement}</div>}
          <PrimaryButton
            onClick={handleApproveAllClick}
            disabled={!hasApprovableEmployees || isUpdating || employees.length === 0}
            className={`px-4 py-2 m-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              employees.length > 0 ? '' : 'invisible'
            }`}
            title={!canApprove ? 'Approve access restricted' : 'Approve All'}
          >
            <CheckCircle size={16} />
            Approve All ({employees.length})
          </PrimaryButton>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CustomTable
            columns={columns}
            data={paginatedEmployees}
            rowKey="id"
            actions={tableActions}
            actionsHeader="Actions"
            actionsAlign="center"
          />
        </div>

        {/* Footer */}
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={employees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            rowsPerPageOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={isApproveDialogOpen}
        loading={isUpdating}
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

      {/* Approve All Confirmation Dialog */}
      <ConfirmDialog
        open={isApproveAllDialogOpen}
        loading={isUpdating}
        onClose={() => setIsApproveAllDialogOpen(false)}
        title="Approve All Employees"
        description={`Are you sure you want to approve all ${employees.length} pending employees? This will activate their accounts and grant them access.`}
        confirmLabel="Yes, Approve All"
        cancelLabel="Cancel"
        destructive={false}
        onConfirm={handleApproveAllConfirm}
      />

      {/* Custom Alert Dialog */}
      <CustomAlertForm
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        onConfirm={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="OK"
        cancelText="Close"
      />
    </>
  );
}
