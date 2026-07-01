'use client';

import { Plus, Search, SquarePen, Trash, X } from 'lucide-react';
import { FaUserPlus } from 'react-icons/fa';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../../store/slices/authSlice';
import AssignRoleModal from './AssignRoleModal';
import RoleAssignmentsModal from './RoleAssignmentsModal';
import CustomTable from '../../CustomTable';
import Pagination from '../../Pagination';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import { useEffect, useMemo } from 'react';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

export default function RolesTable({
  roles,
  onDeleteRole,
  employees = [],
  onAssignRole,
  onEditRole,
  onViewRole,
  onAddRole,
  onOpenAssignRole,
  showAssignRoleButton = true,
  showAddRoleButton = true,
}) {
  const user = useSelector(selectAuthUser);
  const userRole = user?.role?.name?.toUpperCase() || '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [searchTerm, setSearchTerm] = useState('');

  // Filter out ADMIN and SUPER_ADMIN roles from selection if current user is only ADMIN
  const assignableRoles = roles.filter((role) => {
    if (isSuperAdmin) return true;
    const name = (role.roleName || role.displayName || '').toUpperCase();
    return name !== 'SUPER_ADMIN' && name !== 'ADMIN';
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [selectedRoleForAssignments, setSelectedRoleForAssignments] =
    useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const shortenId = (id) => {
    if (!id) return 'N/A';
    if (id.length <= 8) return id;
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
  };

  const filteredRoles = roles.filter((role) => {
    if (!role) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      (role.id && role.id.toLowerCase().includes(searchLower)) ||
      (role.displayName &&
        role.displayName.toLowerCase().includes(searchLower)) ||
      (role.roleName && role.roleName.toLowerCase().includes(searchLower))
    );
  });

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roles.length]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleView = (role) => {
    if (onViewRole) {
      onViewRole(role);
    }
  };

  const handleEdit = (role) => {
    if (onEditRole) {
      onEditRole(role);
    }
  };

  const handleDelete = (roleId) => {
    if (onDeleteRole) {
      onDeleteRole(roleId);
    }
  };

  const handleAssign = (role) => {
    setSelectedRole(role);
    setShowAssignModal(true);
  };

  const handleRoleNameClick = (role) => {
    setSelectedRoleForAssignments(role);
    setShowAssignmentsModal(true);
  };

  const handleAssignRoleSubmit = async (formData) => {
    setIsAssigningRole(true);

    try {
      const selectedRoleFromModal = roles.find(
        (r) =>
          r.id === formData.role ||
          (r.displayName || r.roleName) === formData.role
      );

      const assignmentData = {
        ...formData,
        roleId: selectedRoleFromModal
          ? selectedRoleFromModal.id
          : selectedRole.id,
        roleName: selectedRoleFromModal
          ? selectedRoleFromModal.displayName || selectedRoleFromModal.roleName
          : selectedRole.displayName || selectedRole.roleName,
        assignedAt: new Date().toISOString(),
      };

      if (onAssignRole) {
        await onAssignRole(assignmentData);
      }

      setShowAssignModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role. Please try again.');
    } finally {
      setIsAssigningRole(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <div className="flex items-center gap-2">
          <HyperlinkButton
            onClick={() => handleView(row)}
            title={`Full ID: ${row.id}`}
          >
            {row.id.slice(0, 6)}
          </HyperlinkButton>
        </div>
      ),
    },
    {
      key: 'roleName',
      label: 'ROLE NAME',
      render: (row) => (
        <HyperlinkButton
          onClick={() => handleRoleNameClick(row)}
          title="View Role Assignments"
        >
          {row.displayName || 'N/A'}
        </HyperlinkButton>
      ),
    },
    {
      key: 'rightsCount',
      label: 'NO. OF RIGHTS',
      render: (row) => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row._count?.rights || 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'CREATED',
      render: (row) => (
        <div className="text-sm text-gray-500">
          {row.createdAt ? formatDate(row.createdAt) : 'N/A'}
        </div>
      ),
    },
  ];

  const renderActions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        onClick={() => handleAssign(row)}
        title="Assign Role to Employee"
      >
        <FaUserPlus size={16} />
      </IconButton>

      <IconButton onClick={() => handleEdit(row)} title="Edit Role">
        <SquarePen size={16} />
      </IconButton>

      <IconButton onClick={() => handleDelete(row.id)} title="Delete Role">
        <Trash size={16} />
      </IconButton>
    </div>
  );

  return (
    <div className="bg-transparent py-2 rounded-xl">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 mb-3 mt-1">
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          </div>
          <input
            placeholder="Search roles by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 py-2 rounded-md border border-gray-300 w-full sm:w-64 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-[38px]"
          />
          {searchTerm && (
            <div className="absolute right-2 top-1.5">
              <IconButton
                onClick={() => setSearchTerm('')}
                title="Clear search"
                className="p-1"
              >
                <X size={14} />
              </IconButton>
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {showAssignRoleButton && (
            <PrimaryButton
              onClick={onOpenAssignRole}
              className="text-sm px-4 py-1.5"
            >
              Assign Role
            </PrimaryButton>
          )}
          {showAddRoleButton && (
            <PrimaryButton onClick={onAddRole} className="text-sm px-4 py-1.5">
              <Plus size={16} className="mr-1" /> Add Role
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <CustomTable
          columns={columns}
          data={currentData}
          rowKey="id"
          actions={renderActions}
          actionsHeader="ACTIONS"
          actionsAlign="right"
          className=""
          tableClassName="min-w-full divide-y divide-gray-200"
          theadClassName="bg-gray-100"
          tbodyClassName="bg-white divide-y divide-gray-200"
        />
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRoles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </div>

      {roles.length === 0 && filteredRoles.length === 0 && (
        <div className="border border-gray-200 rounded-xl p-10 text-center mt-4">
          <div className="text-gray-400 mb-2">No roles created yet</div>
          <div className="text-sm text-gray-500">
            Click "Add Role" to create your first role
          </div>
        </div>
      )}

      <AssignRoleModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedRole(null);
        }}
        onSubmit={handleAssignRoleSubmit}
        employees={employees}
        roles={assignableRoles.map((r) => ({
          id: r.id,
          name: r.displayName || r.roleName,
        }))}
        preselectedRole={
          selectedRole
            ? {
                id: selectedRole.id,
                name: selectedRole.displayName || selectedRole.roleName,
              }
            : null
        }
        isLoading={isAssigningRole}
      />

      <RoleAssignmentsModal
        isOpen={showAssignmentsModal}
        onClose={() => {
          setShowAssignmentsModal(false);
          setSelectedRoleForAssignments(null);
        }}
        roleName={
          selectedRoleForAssignments?.displayName ||
          selectedRoleForAssignments?.roleName
        }
        roleId={selectedRoleForAssignments?.id}
      />
    </div>
  );
}
