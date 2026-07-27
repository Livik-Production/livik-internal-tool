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
import EmployeeForm from './EmployeeForm';
import Loader from '../../Loader';
import { showSuccessToast, showErrorToast } from '../../Toast';

// Premium HSL status configurations
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
    dotColor: 'bg-green-500',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    dotColor: 'bg-gray-500',
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.inactive;
  return (
    <div className="inline-flex items-center gap-1.5 justify-center">
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></div>
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

import { useDispatch, useSelector } from 'react-redux';
import { selectEmployeesItems, selectEmployeesStatus } from '../../../../store/slices/employeesSlice';

export default function ContractEmployeeTab({ canControl = true, isViewOnly = false }) {
  const allEmployees = useSelector(selectEmployeesItems);
  const employeesStatus = useSelector(selectEmployeesStatus);

  const employees = useMemo(() => {
    return allEmployees
      .filter((emp) => {
        const isContract = emp.workType === 'CONTRACT' || emp.__raw?.workType === 'CONTRACT';
        const statusUpper = (emp.status || emp.__raw?.status || '').toUpperCase();
        const isPending = statusUpper === 'PENDING' || statusUpper === 'PENDING_ADMIN';
        return isContract && !isPending;
      })
      .map((emp) => {
        const raw = emp.__raw || {};
        const remarks = emp.bondRemarks || raw.bondRemarks || '';
        const skillsetMatch = remarks.match(/Skillset:\s*([^;]+)/i);
        const skillset = skillsetMatch ? skillsetMatch[1].trim() : '';

        return {
          ...emp,
          id: emp.id,
          contractEmpId: emp.empId || raw.empId || raw.contractEmpId,
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          skillset: skillset,
          designation: emp.designation || raw.designation || '',
          contractStartDate: raw.bondStartDate || '',
          contractEndDate: raw.bondEndDate || '',
          contractDuration: emp.bondDuration || raw.bondDuration || '',
        };
      });
  }, [allEmployees]);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedRow, setSelectedRow] = useState(null);

  // Confirm delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filtering
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        (emp.firstName && emp.firstName.toLowerCase().includes(query)) ||
        (emp.lastName && emp.lastName.toLowerCase().includes(query)) ||
        (emp.contractEmpId && emp.contractEmpId.toLowerCase().includes(query)) ||
        (emp.email && emp.email.toLowerCase().includes(query)) ||
        (emp.designation && emp.designation.toLowerCase().includes(query)) ||
        (emp.department && emp.department.toLowerCase().includes(query))
    );
  }, [employees, searchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Actions
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
      dispatch({ type: 'employees/deleteEmployee', payload: deleteId });
      showSuccessToast('Contract employee deleted successfully.');
    } catch (err) {
      showErrorToast('Failed to delete.');
    }
    setDeleteOpen(false);
    setDeleteId(null);
  };

  // Handle Form Submit (Add / Edit)
  const handleFormSubmit = async (formData) => {
    if (modalMode === 'add') {
      try {
        formData.workType = 'CONTRACT';
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        dispatch({ type: 'employees/addEmployee', payload: created });
        showSuccessToast(`${formData.firstName} ${formData.lastName} created successfully.`);
      } catch (err) {
        showErrorToast('Failed to create contract employee.');
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
        dispatch({ type: 'employees/updateEmployee', payload: updated });
        showSuccessToast('Employee details updated successfully.');
      } catch (err) {
        showErrorToast('Failed to update contract employee.');
      }
    }
    setModalOpen(false);
    setSelectedRow(null);
  };

  // Columns Configuration
  const columns = [
    {
      key: 'contractEmpId',
      label: 'ID',
      render: (row) => (
        <HyperlinkButton
          type="button"
          onClick={() => handleOpenView(row)}
          className="text-[#33a8d9] hover:underline font-bold text-md"
        >
          {row.contractEmpId}
        </HyperlinkButton>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-bold text-gray-900 text-md">{row.firstName} {row.lastName}</span>,
    },
    {
      key: 'skillset',
      label: 'Skillset',
      render: (row) => <span className="text-md text-gray-700">{row.skillset || '-'}</span>,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (row) => <span className="text-md text-gray-700">{row.designation || '-'}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => {
        const start = row.contractStartDate ? new Date(row.contractStartDate).toLocaleDateString('en-GB') : '-';
        const end = row.contractEndDate ? new Date(row.contractEndDate).toLocaleDateString('en-GB') : '-';
        return (
          <div className="flex flex-col text-md text-gray-600">
            <span>{start} - {end}</span>
          </div>
        );
      },
    },
    {
      key: 'contractDuration',
      label: 'Contract Months',
      render: (row) => <span className="text-md text-gray-700">{row.contractDuration || '-'}</span>,
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
      {/* Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-2 mb-1">
        <div className="relative  sm:w-70">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contract employees..."
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
            Add Contract Employee
          </PrimaryButton>
        )}
      </div>

      {/* Main Table & Pagination / Loader */}
      {employeesStatus === 'loading' ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-2xl shadow-xl border border-gray-200 min-h-[400px]">
          <Loader label="Loading contract employees..." size="md" fullScreen={false} />
        </div>
      ) : (
        <>
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

          {/* Footer / Pagination */}
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
        </>
      )}

      {/* Employee Add/Edit/View Modal */}
      <CustomModalForm
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          modalMode === 'add'
            ? 'Add Contract Employee'
            : modalMode === 'edit'
              ? 'Edit Contract Employee'
              : 'View Contract Employee Details'
        }
        widthClass="max-w-4xl"
      >
        <EmployeeForm
          mode={modalMode}
          initialData={selectedRow || {}}
          onCancel={() => setModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      </CustomModalForm>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Contract Employee"
        description="Are you sure you want to delete this contract employee record? This action cannot be undone."
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
