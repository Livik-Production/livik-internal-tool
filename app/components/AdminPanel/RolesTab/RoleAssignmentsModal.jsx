'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../../store/slices/authSlice';
import { Trash, X, AlertCircle, Info } from 'lucide-react';
import CustomAlertForm from '../../CustomAlertForm';
import Loader from '../../Loader';
import CloseButton from '../../Buttons/CloseButton';
import IconButton from '../../Buttons/IconButton';
import CustomTable from '../../CustomTable';
import CustomModalForm from '../../CustomModalForm';

export default function RoleAssignmentsModal({
  isOpen,
  onClose,
  roleName,
  roleId,
}) {
  const user = useSelector(selectAuthUser);
  const userRole = (
    user?.role?.roleName ||
    user?.role?.name ||
    ''
  ).toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignmentToRemove, setAssignmentToRemove] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen && roleId) {
      fetchAssignments();
    }
  }, [isOpen, roleId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/roles/${roleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      const data = await response.json();

      const mappedAssignments = (data.employees || []).map((emp) => ({
        id: emp.id,
        empId: emp.empId || 'N/A',
        empName:
          `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
          emp.name ||
          'Unknown',
        assignedDate: emp.updatedAt,
        assignedBy: emp.assignedBy || 'System',
        status: emp.status || 'Active',
      }));

      setAssignments(mappedAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = (assignment) => {
    setAssignmentToRemove(assignment);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveAssignment = async () => {
    if (!assignmentToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch('/api/employees/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: assignmentToRemove.id,
          roleId: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove assignment');
      }
      setAssignments((prev) =>
        prev.filter((a) => a.id !== assignmentToRemove.id)
      );
      setShowRemoveConfirm(false);
      setAssignmentToRemove(null);
    } catch (err) {
      console.error('Error removing assignment:', err);
      alert(err.message || 'Failed to remove assignment. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderHeader = (
    <div className="flex items-center gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Role Assignments</h2>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Role:</span>
        <span className="font-medium text-gray-900">{roleName}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">ID:</span>
        <span className="font-medium text-blue-600">{roleId}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{assignments.length} assigned</span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <CustomModalForm
        open={isOpen}
        onClose={onClose}
        title={renderHeader}
        widthClass="max-w-6xl"
      >
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader label="Loading assignments..." size="lg" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500 font-medium font-sans">
              Error fetching assignments: {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <CustomTable
                  columns={[
                    { key: 'empId', label: 'Employee ID' },
                    { key: 'empName', label: 'Employee Name' },
                    {
                      key: 'assignedDate',
                      label: 'Assigned Date',
                      render: (row) => formatDate(row.assignedDate),
                    },
                    { key: 'assignedBy', label: 'Assigned By' },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (row) => (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      ),
                    },
                  ]}
                  data={assignments}
                  rowKey="id"
                  actions={(row) => (
                    <div className="flex justify-end">
                      <IconButton
                        onClick={() => handleRemoveAssignment(row)}
                        title={
                          !isSuperAdmin
                            ? 'Remove access restricted (Super Admin only)'
                            : 'Remove assignment'
                        }
                        variant="danger"
                        disabled={!isSuperAdmin}
                      >
                        <Trash size={16} />
                      </IconButton>
                    </div>
                  )}
                  actionsHeader="Actions"
                  actionsAlign="right"
                  maxHeight="400px"
                />
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {assignments.length} of {assignments.length}{' '}
                    assignments
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">
                        Active:{' '}
                        <span className="font-bold">
                          {
                            assignments.filter((a) => a.status === 'Active')
                              .length
                          }
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-600">
                        Inactive:{' '}
                        <span className="font-bold">
                          {
                            assignments.filter((a) => a.status === 'Inactive')
                              .length
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={confirmRemoveAssignment}
        title="Remove Assignment"
        message={`Are you sure you want to remove ${assignmentToRemove?.empName} from the "${roleName}" role?`}
        type="danger"
        confirmText="Remove"
        cancelText="Cancel"
        isSubmitting={isRemoving}
        details={
          assignmentToRemove && (
            <div className="text-sm border-l-4 border-red-500 pl-3 py-1 bg-red-50 mt-2 rounded">
              <p className="font-bold text-red-900">
                {assignmentToRemove.empId}
              </p>
              <p className="text-red-700 text-xs mt-1">
                Employee UUID: {assignmentToRemove.id}
              </p>
            </div>
          )
        }
      />
    </>
  );
}
