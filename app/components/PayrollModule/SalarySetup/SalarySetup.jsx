'use client';

import React, { useState, useEffect } from 'react';
import Loader from '../../Loader';
import { SquarePen, Eye, Plus } from 'lucide-react';
import CustomTable from '../../CustomTable';
import SalarySetupModal from './SalarySetupModal';
import CustomAlertForm from '../../CustomAlertForm';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

const SalarySetupTab = ({ isViewOnly = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPayrollAdmin] = useState(true);

  const [employees, setEmployees] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Alert state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  const showAlert = (title, message, type = 'info') =>
    setAlertModal({ isOpen: true, title, message, type });
  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false }));

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payroll/salary-setup');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        } else {
          console.error('Failed to fetch salary data');
          // Fallback or error handling could go here
        }
      } catch (error) {
        console.error('Error fetching salary data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Modal handlers
  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleModalSubmit = async (data) => {
    try {
      setIsLoading(true);
      const isUpdate = !!data.recordId; // recordId comes from history edit

      const payload = {
        id: data.recordId, // used for PATCH
        employeeId: data.id,
        empId: data.empId,
        name: data.name,
        effectiveDate: data.effectiveDate,
        basicPay: data.basicPay,
        hra: data.hra,
        otherAllowances: data.otherAllowances,
      };

      const response = await fetch('/api/payroll/salary-setup', {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isUpdate ? 'update' : 'save'} salary details`
        );
      }

      await response.json();
      showAlert(
        'Success',
        `Salary details ${isUpdate ? 'updated' : 'saved'} successfully!`,
        'success'
      );

      // Refresh data
      const fetchResponse = await fetch('/api/payroll/salary-setup');
      if (fetchResponse.ok) {
        const newData = await fetchResponse.json();
        setEmployees(newData);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      showAlert(
        'Save Failed',
        'Failed to save salary details. Please try again.',
        'danger'
      );
    } finally {
      setIsLoading(false);
      handleCloseModal();
    }
  };

  // Calculate totals for summary
  const totalMonthlyPayroll = employees.reduce(
    (total, emp) => total + emp.salaryMonthly,
    0
  );
  const totalGrossSalary = employees.reduce(
    (total, emp) => total + emp.grossSalary,
    0
  );
  const totalDeductions = employees.reduce(
    (total, emp) => total + emp.deduction,
    0
  );
  const totalNetPay = employees.reduce((total, emp) => total + emp.netPay, 0);



  // Define table columns with Emp ID as hyperlink
  const columns = [
    {
      key: 'empId',
      label: 'Emp ID',
      render: (row) => (
        <HyperlinkButton
          onClick={() => handleViewEmployee(row)}
          title="View salary details"
        >
          {row.empId}
        </HyperlinkButton>
      ),
      className: 'font-medium',
    },
    {
      key: 'name',
      label: 'Name',
      className: 'font-medium text-gray-900',
    },
    {
      key: 'ctc',
      label: 'Annual CTC',
      render: (row) => `₹${Math.round(row.ctc).toLocaleString()}`,
      className: 'font-semibold text-blue-700',
    },
    {
      key: 'salaryMonthly',
      label: 'Basic Pay',
      render: (row) => `₹${row.salaryMonthly.toLocaleString()}`,
      className: 'font-medium',
    },
    {
      key: 'grossSalary',
      label: 'Gross Salary',
      render: (row) => `₹${row.grossSalary.toLocaleString()}`,
    },
    {
      key: 'netPay',
      label: 'Net Pay',
      render: (row) => `₹${row.netPay.toLocaleString()}`,
      className: 'text-green-600 font-medium',
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (row) =>
        row.effectiveDate
          ? new Date(row.effectiveDate).toLocaleDateString()
          : 'N/A',
      className: 'text-gray-600',
    },
  ];

  // Define actions for each row - ONLY EDIT ICON
  const actions = (row) => {
    // View-only: only show eye icon, no edit
    if (isViewOnly) {
      return (
        <div className="flex items-center justify-center gap-2">
          <IconButton
            onClick={() => handleViewEmployee(row)}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </IconButton>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-2">
        <IconButton
          onClick={() => handleEditEmployee(row)}
          className="text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
          title="Edit Salary"
        >
          <SquarePen size={16} />
        </IconButton>
      </div>
    );
  };

  return (
    <div
      key={isLoading}
      className="bg-white rounded-xl animate-dashboard-reveal"
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader label="Loading salary data..." size="md" fullScreen={false} />
        </div>
      ) : (
        <>
      <div className="mb-3 flex justify-end items-center">
        {/* <div>
          <h3 className="text-lg font-semibold text-gray-800">Salary Setup</h3>
          <div className="text-sm text-gray-600 mt-1">
            {isViewOnly
              ? "You have view-only access to salary setup."
              : "Manage employee salary structures and components."}
          </div>
        </div> */}
        {!isViewOnly && (
          <PrimaryButton
            onClick={handleAddEmployee}
            className="flex items-center gap-2 p-2"
          >
            <Plus size={16} />
            Add Salary Setup
          </PrimaryButton>
        )}
      </div>

      {/* Custom Table */}
      <div className="bg-white rounded-lg  overflow-hidden">
        <CustomTable
          columns={columns}
          data={employees}
          rowKey="empId"
          actions={actions}
          actionsHeader="Actions"
          actionsAlign="right"
          tableClassName="min-w-full divide-y divide-gray-200"
          theadClassName="bg-gray-50"
          tbodyClassName="bg-white divide-y divide-gray-200"
        />
      </div>

      {/* Salary Setup Modal */}
      {modalOpen && (
        <SalarySetupModal
          mode={modalMode}
          employeeData={selectedEmployee}
          allEmployees={employees}
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
          onEdit={() => setModalMode('edit')}
        />
      )}

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
        </>
      )}
    </div>
  );
};

export default SalarySetupTab;
