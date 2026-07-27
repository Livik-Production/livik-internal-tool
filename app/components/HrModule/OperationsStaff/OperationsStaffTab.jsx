'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SquarePen, Trash, Plus, Eye, Search } from 'lucide-react';
import CustomTable from '../../CustomTable';
import CustomModalForm from '../../CustomModalForm';
import ConfirmDialog from '../../ConfirmDialog';
import Pagination from '../../Pagination';
import IconButton from '../../Buttons/IconButton';
import PrimaryButton from '../../Buttons/PrimaryButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import OperationsStaffForm from './OperationsStaffForm';
import { showSuccessToast, showErrorToast } from '../../Toast';

import { useDispatch, useSelector } from 'react-redux';
import { selectEmployeesItems, deleteEmployee as deleteEmployeeAction, addEmployee, updateEmployee as updateEmployeeAction } from '../../../../store/slices/employeesSlice';

export default function OperationsStaffTab({ canControl = true, isViewOnly = false }) {
  const allEmployees = useSelector(selectEmployeesItems);

  const employees = useMemo(() => {
    return allEmployees
      .filter((emp) => emp.workType === 'OPERATIONS_STAFF' || emp.__raw?.workType === 'OPERATIONS_STAFF')
      .map((emp) => {
        const raw = emp.__raw || {};
        return {
          ...emp,
          id: emp.id,
          empId: emp.empId || raw.empId || '',
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          designation: emp.designation || raw.designation || '',
          department: emp.department || raw.department || '',
          phoneNumber: raw.phoneNumber || '',
          employmentType: raw.employmentType || 'Permanent',
        };
      });
  }, [allEmployees]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        (emp.firstName && emp.firstName.toLowerCase().includes(query)) ||
        (emp.lastName && emp.lastName.toLowerCase().includes(query)) ||
        (emp.empId && emp.empId.toLowerCase().includes(query)) ||
        (emp.designation && emp.designation.toLowerCase().includes(query)) ||
        (emp.department && emp.department.toLowerCase().includes(query))
    );
  }, [employees, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedRow(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (row) => {
    setModalMode('edit');
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleOpenView = (row) => {
    setModalMode('view');
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const dispatch = useDispatch();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' });
      dispatch(deleteEmployeeAction(deleteId));
      showSuccessToast('Operations staff deleted successfully.');
    } catch (err) {
      showErrorToast('Failed to delete.');
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const handleFormSubmit = async (formData) => {
    if (modalMode === 'add') {
      try {
        formData.workType = 'OPERATIONS_STAFF';
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        
        const uiRow = {
          id: created.id || created.empId,
          name: `${created.firstName} ${created.lastName}`,
          empId: created.empId,
          email: created.email || '',
          designation: created.designation || '',
          mobile: created.phoneNumber || '',
          status: created.status || 'Active',
          workType: created.workType,
          __raw: created,
        };
        dispatch(addEmployee(uiRow));
        showSuccessToast(`${formData.firstName} ${formData.lastName} created successfully.`);
      } catch (err) {
        showErrorToast('Failed to create operations staff.');
      }
    } else if (modalMode === 'edit') {
      try {
        const res = await fetch(`/api/employees/${selectedRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed');
        const updated = await res.json();
        
        const uiRow = {
          id: updated.id || updated.empId,
          name: `${updated.firstName} ${updated.lastName}`,
          empId: updated.empId,
          email: updated.email || '',
          designation: updated.designation || '',
          mobile: updated.phoneNumber || '',
          status: updated.status || 'Active',
          workType: updated.workType,
          __raw: updated,
        };
        dispatch(updateEmployeeAction(uiRow));
        showSuccessToast('Employee details updated successfully.');
      } catch (err) {
        showErrorToast('Failed to update operations staff.');
      }
    }
    setModalOpen(false);
    setSelectedRow(null);
  };

  const columns = [
    {
      key: 'empId',
      label: 'ID',
      render: (row) => (
        <HyperlinkButton
          type="button"
          onClick={() => handleOpenView(row)}
          className="text-[#33a8d9] hover:underline font-bold text-md"
        >
          {row.empId}
        </HyperlinkButton>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-bold text-gray-900 text-md">{row.firstName} {row.lastName}</span>,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (row) => <span className="text-md text-gray-700">{row.designation || '-'}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => <span className="text-md text-gray-700">{row.department || '-'}</span>,
    },
    {
      key: 'phoneNumber',
      label: 'Mobile',
      render: (row) => <span className="text-md text-gray-700">{row.phoneNumber || '-'}</span>,
    },
    {
      key: 'employmentType',
      label: 'Employment Type',
      render: (row) => <span className="text-md font-semibold text-[#004475]">{row.employmentType || '-'}</span>,
    },
  ];

  const tableActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      {canControl && !isViewOnly && (
        <>
          <IconButton
            onClick={() => handleOpenEdit(row)}
            title="Edit Profile"
          >
            <SquarePen size={15} />
          </IconButton>
          <IconButton
            onClick={() => handleOpenDelete(row.id)}
            title="Delete Employee"
            className="text-red-500 hover:text-red-700"
          >
            <Trash size={15} />
          </IconButton>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-2 mb-1">
        <div className="relative sm:w-70">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operations staff..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-md bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        {canControl && !isViewOnly && (
          <PrimaryButton
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 text-md font-semibold flex items-center justify-center gap-2 shadow-sm rounded-lg"
          >
            <Plus size={16} />
            Add Operations Staff
          </PrimaryButton>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <CustomTable
          columns={columns}
          data={paginatedEmployees}
          rowKey="id"
          actions={tableActions}
          actionsHeader="Actions"
          actionsAlign="center"
        />
      </div>

      {filteredEmployees.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredEmployees.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      )}

      <CustomModalForm
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          modalMode === 'add'
            ? 'Add Operations Staff'
            : modalMode === 'edit'
              ? 'Edit Operations Staff'
              : 'View Operations Staff Details'
        }
        widthClass="max-w-4xl"
      >
        <OperationsStaffForm
          mode={modalMode}
          initialData={selectedRow || {}}
          onCancel={() => setModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      </CustomModalForm>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Operations Staff"
        description="Are you sure you want to delete this operations staff record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
