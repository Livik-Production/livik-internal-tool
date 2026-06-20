'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../../store/slices/authSlice';
import RolesTable from './RolesTable';
import AssignRoleModal from './AssignRoleModal';
import RightsSelectionModal from './RightsSelectionModal';
import Loader from '../../../components/Loader';
import CustomAlertForm from '../../../components/CustomAlertForm';
import { showSuccessToast, showErrorToast } from '../../Toast';

export default function RolesTab() {
  const user = useSelector(selectAuthUser);
  const userRole = user?.role?.name?.toUpperCase() || '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [roles, setRoles] = useState([]);

  // Filter out ADMIN and SUPER_ADMIN roles from selection if current user is only ADMIN
  const assignableRoles = roles.filter((role) => {
    if (isSuperAdmin) return true;
    const name = (role.roleName || role.displayName || '').toUpperCase();
    return name !== 'SUPER_ADMIN' && name !== 'ADMIN';
  });
  const [loading, setLoading] = useState(true);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [showViewRole, setShowViewRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentRole, setCurrentRole] = useState({
    id: '',
    displayName: '',
    roleName: '',
    description: '',
    effectiveDate: '',
    selectedRights: [],
  });
  const [employees, setEmployees] = useState([]);

  // Alert state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // "info", "success", "danger", "warning"
  });

  const showAlert = (title, message, type = 'info') =>
    setAlertModal({ isOpen: true, title, message, type });

  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchRoles();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();

      const mapped = data.map((emp) => ({
        id: emp.empId || emp.employeeId,
        dbId: emp.id,
        name:
          `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
          emp.name ||
          'Unknown',
        role: emp.role,
        status: emp.status,
      }));

      setEmployees(mapped);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/roles');

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const data = await response.json();

      setRoles(data);
    } catch (error) {
      showErrorToast('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAssignRole = async (formData) => {
    setIsAssigningRole(true);

    try {
      const response = await fetch('/api/employees/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: formData.dbId,
          roleId: formData.roleId || formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const err = new Error(errorData.error || 'Failed to assign role');
        err.status = response.status;
        throw err;
      }

      const result = await response.json();

      showSuccessToast(
        `Role assigned successfully to ${formData.employeeName}`
      );
      setShowAssignRole(false);

      fetchRoles();
    } catch (error) {
      if (
        error.status === 403 ||
        (error.message && error.message.toLowerCase().includes('forbidden'))
      ) {
        showAlert(
          'Forbidden',
          error.message || 'You do not have permission for this operation.',
          'danger'
        );
      } else {
        showErrorToast(
          error.message || 'Failed to assign role. Please try again.'
        );
      }
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleDeleteRole = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/roles?id=${roleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }
      await fetchRoles();
      setShowDeleteConfirm(false);
      showSuccessToast(
        `Role "${roleToDelete.displayName || roleToDelete.roleName}" deleted successfully!`
      );
      setRoleToDelete(null);
    } catch (error) {
      showErrorToast(
        error.message || 'Failed to delete role. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddRole = () => {
    setCurrentRole({
      id: '',
      displayName: '',
      roleName: '',
      description: '',
      effectiveDate: getTodayDate(),
      selectedRights: [],
    });
    setShowAddRole(true);
  };

  const handleEditRole = async (role) => {
    try {
      const response = await fetch(`/api/roles/${role.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch role details');
      }
      const roleDetails = await response.json();
      const selectedRights =
        roleDetails.rights?.map((rr) => rr.right.displayName) || [];

      setCurrentRole({
        id: roleDetails.id,
        displayName: roleDetails.displayName,
        roleName: roleDetails.roleName,
        description: roleDetails.description || '',
        effectiveDate: getTodayDate(),
        selectedRights: selectedRights,
      });
      setShowEditRole(true);
    } catch (error) {
      console.error('Error fetching role details:', error);
      showErrorToast('Failed to load role details. Please try again.');
    }
  };

  const handleViewRole = async (role) => {
    try {
      const response = await fetch(`/api/roles/${role.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch role details');
      }
      const roleDetails = await response.json();
      const selectedRights =
        roleDetails.rights?.map((rr) => rr.right.displayName) || [];

      setCurrentRole({
        id: roleDetails.id,
        displayName: roleDetails.displayName,
        roleName: roleDetails.roleName,
        description: roleDetails.description || '',
        effectiveDate: getTodayDate(),
        selectedRights: selectedRights,
      });
      setShowViewRole(true);
    } catch (error) {
      console.error('Error fetching role details:', error);
      showErrorToast('Failed to load role details. Please try again.');
    }
  };

  const handleRoleNameChange = (newRoleName) => {
    setCurrentRole((prev) => ({
      ...prev,
      displayName: newRoleName,
    }));
  };

  const handleRightsChange = (newRights) => {
    setCurrentRole((prev) => ({
      ...prev,
      selectedRights: newRights,
    }));
  };

  const handleEffectiveDateChange = (newDate) => {
    setCurrentRole((prev) => ({
      ...prev,
      effectiveDate: newDate,
    }));
  };

  const handleDescriptionChange = (newDescription) => {
    setCurrentRole((prev) => ({
      ...prev,
      description: newDescription,
    }));
  };

  const handleSaveAdd = async (savedRole) => {
    try {
      await fetchRoles();

      setShowAddRole(false);
      resetCurrentRole();

      showSuccessToast(
        `Role "${savedRole.displayName || savedRole.roleName}" created successfully!`
      );
    } catch (error) {
      console.error('Error refreshing roles:', error);
    }
  };

  const handleSaveEdit = async (savedRole) => {
    try {
      await fetchRoles();
      setShowEditRole(false);
      resetCurrentRole();

      showSuccessToast(
        `Role "${savedRole.displayName || savedRole.roleName}" updated successfully!`
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const resetCurrentRole = () => {
    setCurrentRole({
      id: '',
      displayName: '',
      roleName: '',
      description: '',
      effectiveDate: '',
      selectedRights: [],
    });
  };

  const handleCancelModal = () => {
    if (showAddRole) setShowAddRole(false);
    if (showEditRole) setShowEditRole(false);
    if (showViewRole) setShowViewRole(false);
    resetCurrentRole();
  };

  const roleNames = roles.map((role) => role.displayName || role.roleName);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        <Loader label="Loading roles..." size="md" fullScreen={false} />
      </div>
    );
  }

  return (
    <div>
      <RolesTable
        roles={roles}
        onDeleteRole={handleDeleteRole}
        onEditRole={handleEditRole}
        onViewRole={handleViewRole}
        onAssignRole={handleAssignRole}
        employees={employees}
        onAddRole={handleAddRole}
        onOpenAssignRole={() => setShowAssignRole(true)}
        showAssignRoleButton={true}
        showAddRoleButton={true}
      />

      <RightsSelectionModal
        isOpen={showAddRole}
        onClose={handleCancelModal}
        mode="add"
        roleData={{
          ...currentRole,
          onRoleNameChange: handleRoleNameChange,
          onRightsChange: handleRightsChange,
          onEffectiveDateChange: handleEffectiveDateChange,
          onDescriptionChange: handleDescriptionChange,
        }}
        onSave={handleSaveAdd}
        onCancel={handleCancelModal}
      />

      <RightsSelectionModal
        isOpen={showEditRole}
        onClose={handleCancelModal}
        mode="edit"
        roleData={{
          ...currentRole,
          onRoleNameChange: handleRoleNameChange,
          onRightsChange: handleRightsChange,
          onEffectiveDateChange: handleEffectiveDateChange,
          onDescriptionChange: handleDescriptionChange,
        }}
        onSave={handleSaveEdit}
        onCancel={handleCancelModal}
      />

      <RightsSelectionModal
        isOpen={showViewRole}
        onClose={handleCancelModal}
        mode="view"
        roleData={currentRole}
        onCancel={handleCancelModal}
        onEdit={() => {
          setShowViewRole(false);
          setShowEditRole(true);
        }}
      />

      <AssignRoleModal
        isOpen={showAssignRole}
        onClose={() => setShowAssignRole(false)}
        onSubmit={handleAssignRole}
        employees={employees}
        roles={assignableRoles}
        isLoading={isAssigningRole}
      />

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete role "${roleToDelete?.displayName || roleToDelete?.roleName}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          roleToDelete && (
            <div className="text-sm">
              <p className="font-bold">{roleToDelete.roleName}</p>
              <p className="text-gray-500">
                {roleToDelete.description || 'No description'}
              </p>
            </div>
          )
        }
      />

      <CustomAlertForm
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        cancelText="Close"
      />
    </div>
  );
}
