'use client';

import React, { useState, useEffect, useRef } from 'react';
import CustomTable from '../../CustomTable';
import { Trash, SquarePen, X } from 'lucide-react';
import CustomAlertForm from '../../CustomAlertForm';
import CloseButton from '../../Buttons/CloseButton';
import TabButton from '../../Buttons/TabButton';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CustomModalForm from '../../CustomModalForm';

const SalarySetupModal = ({
  mode = 'view', // "view", "edit", "add"
  employeeData = null,
  allEmployees = [],
  onClose,
  onSubmit,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('current');
  const [isInitialized, setIsInitialized] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [employeeNameSearch, setEmployeeNameSearch] = useState('');
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const dropdownNameRef = useRef(null);

  const [salaryRules, setSalaryRules] = useState({
    basicPayPercent: 40.0,
    hraPercent: 50.0,
  });

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch('/api/payroll/settings');
        if (response.ok) {
          const data = await response.json();
          setSalaryRules({
            basicPayPercent:
              data.basicPayPercent !== undefined
                ? Number(data.basicPayPercent)
                : 40.0,
            hraPercent:
              data.hraPercent !== undefined ? Number(data.hraPercent) : 50.0,
          });
        }
      } catch (error) {
        console.error(
          'Failed to fetch payroll rules from backend in SalarySetupModal:',
          error
        );
        // Fallback to localStorage
        const saved = localStorage.getItem('payroll_salary_rules');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSalaryRules({
              basicPayPercent:
                parsed.basicPayPercent !== undefined
                  ? Number(parsed.basicPayPercent)
                  : 40.0,
              hraPercent:
                parsed.hraPercent !== undefined
                  ? Number(parsed.hraPercent)
                  : 50.0,
            });
          } catch (e) {
            console.error(
              'Failed to load payroll rules in SalarySetupModal:',
              e
            );
          }
        }
      }
    };
    fetchRules();
  }, []);

  // Alert/Confirm modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Close',
  });
  const showAlert = (title, message, type = 'info') =>
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
      confirmText: 'OK',
      cancelText: 'Close',
    });
  const showConfirm = (title, message, onConfirm) =>
    setAlertModal({
      isOpen: true,
      title,
      message,
      type: 'danger',
      onConfirm,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowEmployeeDropdown(false);
      }
      if (
        dropdownNameRef.current &&
        !dropdownNameRef.current.contains(e.target)
      ) {
        setShowNameDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize CTC if not present but components are
  const initialCtc =
    employeeData?.ctc ||
    (Number(employeeData?.basicPay) || 0) +
      (Number(employeeData?.hra) || 0) +
      (Number(employeeData?.otherAllowances) || 0); // CTC and Gross are same

  const [formData, setFormData] = useState({
    id: employeeData?.id || '',
    empId: employeeData?.empId || '',
    name: employeeData?.name || '',
    ctc: employeeData?.ctc || (initialCtc > 0 ? initialCtc : 0),
    basicPay: employeeData?.basicPay || 0,
    hra: employeeData?.hra || 0,
    otherAllowances: employeeData?.otherAllowances || 0,
    grossSalary: employeeData?.grossSalary || 0,
    effectiveDate: employeeData?.effectiveDate
      ? new Date(employeeData.effectiveDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    dateOfJoining: employeeData?.dateOfJoining || '',
  });

  // Fetch History from API
  const fetchHistory = async () => {
    if (!employeeData?.id) return;

    try {
      setIsHistoryLoading(true);
      const response = await fetch(
        `/api/payroll/salary-setup?employeeId=${employeeData.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error('Failed to fetch salary history');
      }
    } catch (error) {
      console.error('Error fetching salary history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Fetch history on load
  useEffect(() => {
    if (employeeData?.id) {
      fetchHistory();
    }
  }, [employeeData?.id]);

  // Calculate percentages
  const getPercentageValue = (value) => {
    if (!formData.ctc || formData.ctc === 0) return 0;
    return (Number(value) / formData.ctc) * 100;
  };

  const calculatePercentage = (value) => {
    const percentage = getPercentageValue(value).toFixed(1);
    return `${percentage}%`;
  };

  // Handle percentage change
  const handlePercentageChange = (field, newPercentage) => {
    const ctc = Number(formData.ctc) || 0;
    const percentage = Number(newPercentage) || 0;
    const newAmount = Math.round((ctc * percentage) / 100);

    setFormData((prev) => ({
      ...prev,
      [field]: newAmount,
      effectiveDate: new Date().toISOString().split('T')[0],
    }));
  };

  // Calculate derived fields based on CTC
  const calculateDerivedFields = () => {
    const ctc = Number(formData.ctc) || 0;

    const basicPay = Math.round(ctc * (salaryRules.basicPayPercent / 100));
    const hra = Math.round(basicPay * (salaryRules.hraPercent / 100));
    const otherAllowances = ctc - (basicPay + hra);

    setFormData((prev) => ({
      ...prev,
      basicPay,
      hra,
      otherAllowances,
      grossSalary: ctc,
    }));
  };

  // Set initial tab based on mode
  useEffect(() => {
    if (mode === 'add') {
      setActiveTab('current');
    }
  }, [mode]);

  // Calculate balancing field or gross salary whenever components change
  useEffect(() => {
    const ctc = Number(formData.ctc) || 0;
    const basicPay = Number(formData.basicPay) || 0;
    const hra = Number(formData.hra) || 0;
    const otherAllowances = Number(formData.otherAllowances) || 0;

    // If CTC is the anchor, Other Allowance should be the balance
    if (ctc > 0) {
      const calculatedBalance = ctc - (basicPay + hra);
      if (calculatedBalance !== otherAllowances) {
        setFormData((prev) => ({
          ...prev,
          otherAllowances: calculatedBalance,
          grossSalary: ctc,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          grossSalary: ctc,
        }));
      }
    } else {
      const grossSalary = basicPay + hra + otherAllowances;
      setFormData((prev) => ({
        ...prev,
        grossSalary: Math.round(grossSalary),
      }));
    }
  }, [formData.basicPay, formData.hra, formData.ctc]);

  const prevCtcRef = useRef(formData.ctc);

  // Calculate derived fields when CTC changes or salary rules change
  useEffect(() => {
    const ctcChanged = prevCtcRef.current !== formData.ctc;
    prevCtcRef.current = formData.ctc;

    if (mode === 'add' || (mode === 'edit' && isInitialized && ctcChanged)) {
      calculateDerivedFields();
    }
  }, [formData.ctc, mode, salaryRules, isInitialized]);

  // Set initialization flag after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'effectiveDate') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      let numValue = value === '' ? 0 : Number(value);
      const isSalaryComponent = [
        'ctc',
        'basicPay',
        'hra',
        'otherAllowances',
      ].includes(name);

      if (isSalaryComponent) {
        numValue = Math.round(numValue);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
        ...(isSalaryComponent
          ? { effectiveDate: new Date().toISOString().split('T')[0] }
          : {}),
      }));
    }
  };

  const handleDeleteHistory = (id) => {
    showConfirm(
      'Delete Salary Record',
      'Are you sure you want to delete this salary record? This action cannot be undone.',
      async () => {
        closeAlert();
        try {
          const response = await fetch(`/api/payroll/salary-setup?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            showAlert(
              'Deleted',
              'Salary record deleted successfully.',
              'success'
            );
            fetchHistory();
          } else {
            const errorData = await response.json();
            showAlert(
              'Delete Failed',
              errorData.error || 'Failed to delete salary record.',
              'danger'
            );
          }
        } catch (error) {
          console.error('Error deleting salary record:', error);
          showAlert(
            'Error',
            'An error occurred while deleting the record.',
            'danger'
          );
        }
      }
    );
  };

  const handleEditHistory = (row) => {
    setFormData({
      id: employeeData?.id || '',
      empId: row.empId || employeeData?.empId || '',
      name: row.name || employeeData?.name || '',
      ctc: row.ctc || 0,
      basicPay: row.basicPay || 0,
      hra: row.hra || 0,
      otherAllowances: row.otherAllowances || 0,
      grossSalary: row.grossSalary || 0,
      effectiveDate:
        row.effectiveDate || new Date().toISOString().split('T')[0],
      dateOfJoining: employeeData?.dateOfJoining || '',
    });
    setEditingRecordId(row.id);
    setActiveTab('current');
  };

  const getHistoryRowClass = (row) => {
    const isCurrent = historyData.length > 0 && historyData[0].id === row.id;
    return isCurrent
      ? 'bg-blue-100 border-l-4 border-blue-500 hover:bg-blue-100/50'
      : 'hover:bg-gray-50';
  };

  const handleSubmit = () => {
    // Calculate gross salary
    const ctc = Number(formData.ctc);
    const basicPay = Number(formData.basicPay);
    const hra = Number(formData.hra);
    const otherAllowances = Number(formData.otherAllowances);
    const grossSalary = basicPay + hra + otherAllowances;

    // Determine which record to update:
    // - editingRecordId: set when editing from history tab
    // - latestSalaryId: used when editing current salary in "edit" mode
    // - null: means "add" mode, will create a new record
    const recordId =
      editingRecordId ||
      (mode === 'edit' ? employeeData?.latestSalaryId : null);

    const submitData = {
      ...formData,
      recordId, // Parent checks this to decide POST vs PATCH
      ctc: Math.round(ctc),
      basicPay: Math.round(basicPay),
      hra: Math.round(hra),
      otherAllowances: Math.round(otherAllowances),
      grossSalary: Math.round(grossSalary),
    };

    onSubmit(submitData);
    setEditingRecordId(null); // Reset after submit
  };

  const currentColumns = [
    {
      key: 'field',
      label: 'Component',
      render: (row) => (
        <span className="font-medium text-gray-700">{row.label}</span>
      ),
    },
    {
      key: 'value',
      label: 'Amount (₹)',
      render: (row) => {
        if ((mode === 'edit' || mode === 'add') && row.editable) {
          return (
            <div className="relative">
              <input
                type="number"
                name={row.field}
                value={formData[row.field] || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
              />
            </div>
          );
        }
        return (
          <span className="font-medium">
            ₹{Number(formData[row.field]).toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'percentage',
      label: '% of CTC',
      render: (row) => {
        if (row.showPercentage && formData.ctc > 0) {
          if ((mode === 'edit' || mode === 'add') && row.percentageEditable) {
            return (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={getPercentageValue(formData[row.field]).toFixed(1)}
                  onChange={(e) =>
                    handlePercentageChange(row.field, e.target.value)
                  }
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            );
          }
          return (
            <span className="text-sm text-blue-600 font-medium">
              {calculatePercentage(formData[row.field])}
            </span>
          );
        }
        return '-';
      },
    },
  ];

  const historyColumns = [
    {
      key: 'yearId',
      label: 'Year-Month',
      render: (row) => {
        const isCurrent =
          historyData.length > 0 && historyData[0].id === row.id;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-600">{row.yearId}</span>
            {isCurrent && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] uppercase font-bold rounded-full">
                Current
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'ctc',
      label: 'CTC',
      render: (row) => (
        <span className="font-medium">₹{row.ctc.toLocaleString()}</span>
      ),
    },
    {
      key: 'basicPay',
      label: 'Basic Pay',
      render: (row) => `₹${row.basicPay.toLocaleString()}`,
    },
    {
      key: 'hra',
      label: 'HRA',
      render: (row) => `₹${row.hra.toLocaleString()}`,
    },
    {
      key: 'otherAllowances',
      label: 'Other Allowances',
      render: (row) => `₹${row.otherAllowances.toLocaleString()}`,
    },
    {
      key: 'grossSalary',
      label: 'Gross Salary',
      render: (row) => (
        <span className="text-green-600 font-medium">
          ₹{row.grossSalary.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (row) => (
        <span className="text-gray-600">{row.effectiveDate}</span>
      ),
    },
    {
      key: 'audit',
      label: 'Audit Info',
      render: (row) => (
        <div className="flex flex-col text-[10px] text-gray-400 font-medium whitespace-nowrap">
          {(row.createdAt ||
            row.updatedAt ||
            row.createdBy ||
            row.createBy ||
            row.created_by) && (
            <>
              <span>
                Created:{' '}
                {row.createdAt
                  ? new Date(row.createdAt).toLocaleDateString()
                  : ''}{' '}
                {row.createdBy || row.createBy || row.created_by
                  ? `by ${row.createdBy || row.createBy || row.created_by}`
                  : ''}
              </span>
              {(row.updatedAt || row.updated_at) && (
                <span>
                  Updated:{' '}
                  {new Date(
                    row.updatedAt || row.updated_at
                  ).toLocaleDateString()}{' '}
                  {row.updatedBy || row.UpdatedBy || row.updated_by
                    ? `by ${row.updatedBy || row.UpdatedBy || row.updated_by}`
                    : ''}
                </span>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const isCurrent =
          historyData.length > 0 && historyData[0].id === row.id;
        const editDisabled = isCurrent || isViewMode;
        const deleteDisabled = isCurrent || isViewMode;
        return (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              onClick={() => !editDisabled && handleEditHistory(row)}
              disabled={editDisabled}
              className={`transition-colors ${
                editDisabled
                  ? 'text-gray-300'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={
                isViewMode
                  ? 'Not allowed in view mode'
                  : isCurrent
                    ? 'Current salary cannot be edited here'
                    : 'Edit record'
              }
            >
              <SquarePen size={16} />
            </IconButton>
            <IconButton
              onClick={() => !deleteDisabled && handleDeleteHistory(row.id)}
              disabled={deleteDisabled}
              className={`transition-colors ${
                deleteDisabled
                  ? 'text-gray-300'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title={
                isViewMode
                  ? 'Not allowed in view mode'
                  : isCurrent
                    ? 'Current salary cannot be deleted'
                    : 'Delete record'
              }
            >
              <Trash size={16} />
            </IconButton>
          </div>
        );
      },
    },
  ];

  const currentTableData = [
    {
      field: 'ctc',
      label: 'Cost to Company (CTC)',
      value: formData.ctc,
      editable: true,
      showPercentage: false,
      percentageEditable: false,
    },
    {
      field: 'basicPay',
      label: 'Basic Pay',
      value: formData.basicPay,
      editable: false,
      showPercentage: true,
      percentageEditable: false,
    },
    {
      field: 'hra',
      label: 'House Rent Allowance',
      value: formData.hra,
      editable: false,
      showPercentage: true,
      percentageEditable: false,
    },
    {
      field: 'otherAllowances',
      label: 'Other Allowances',
      value: formData.otherAllowances,
      editable: false,
      showPercentage: true,
      percentageEditable: false,
    },
    {
      field: 'grossSalary',
      label: 'Gross Salary',
      value: formData.grossSalary,
      editable: false,
      showPercentage: true,
      percentageEditable: false,
    },
  ];

  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';
  const isViewMode = mode === 'view';

  // Determine if we should show tabs
  const showTabs = !isAddMode; // Show tabs for view and edit, hide for add

  return (
    <>
      <CustomModalForm
        open={true}
        onClose={onClose}
        widthClass="max-w-6xl"
        title={
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between pr-8">
              <h2 className="text-xl font-bold text-gray-900">
                {isAddMode
                  ? 'Add Salary Structure'
                  : editingRecordId
                    ? 'Editing Historical Record'
                    : isEditMode
                      ? 'Edit Salary Structure'
                      : 'Salary Structure'}
                {!isAddMode && ` - ${formData.name} (${formData.id})`}
              </h2>
            </div>
            {showTabs && (
              <div className="flex items-center gap-1 overflow-x-auto no-scroll border-b border-gray-200">
                <TabButton
                  isActive={activeTab === 'current'}
                  onClick={() => setActiveTab('current')}
                >
                  Current Structure
                </TabButton>
                <TabButton
                  isActive={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                >
                  Salary History
                </TabButton>
              </div>
            )}
          </div>
        }
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button onClick={onClose} className="px-4 py-2">
              Cancel
            </Button>
            {isViewMode && onEdit && (
              <PrimaryButton
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2"
              >
                <SquarePen size={16} />
                Edit Details
              </PrimaryButton>
            )}
            {(isEditMode || isAddMode) && (
              <PrimaryButton onClick={handleSubmit} className="px-4 py-2">
                {isAddMode ? 'Add Salary Structure' : 'Save Changes'}
              </PrimaryButton>
            )}
          </div>
        }
      >
        <div className="p-6">
          {/* Content */}
          <div className="flex-1">
            {/* For Add mode, always show current tab */}
            {isAddMode || (!isAddMode && activeTab === 'current') ? (
              <div className="space-y-6">
                {/* Basic Info - Shown in all modes */}
                {(isAddMode || isEditMode || isViewMode) && (
                  <div className="grid grid-cols-5 gap-4 mb-3">
                    {/* Employee ID field - searchable in Add mode */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID
                      </label>
                      {isAddMode ? (
                        <div className="relative" ref={dropdownRef}>
                          <input
                            type="text"
                            placeholder="Search by ID or name..."
                            value={employeeSearch}
                            onChange={(e) => {
                              setEmployeeSearch(e.target.value);
                              setShowEmployeeDropdown(true);
                            }}
                            onFocus={() => setShowEmployeeDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {showEmployeeDropdown && (
                            <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {allEmployees
                                .filter(
                                  (e) =>
                                    e.name
                                      ?.toLowerCase()
                                      .includes(employeeSearch.toLowerCase()) ||
                                    e.empId
                                      ?.toLowerCase()
                                      .includes(employeeSearch.toLowerCase())
                                )
                                .map((e) => (
                                  <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        id: e.id,
                                        empId: e.empId,
                                        name: e.name,
                                        dateOfJoining: e.dateOfJoining || '',
                                      }));
                                      setEmployeeSearch(e.empId);
                                      setEmployeeNameSearch(e.name);
                                      setShowEmployeeDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  >
                                    <span className="font-medium">
                                      {e.empId}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      {e.name}
                                    </span>
                                  </button>
                                ))}
                              {allEmployees.filter(
                                (e) =>
                                  e.name
                                    ?.toLowerCase()
                                    .includes(employeeSearch.toLowerCase()) ||
                                  e.empId
                                    ?.toLowerCase()
                                    .includes(employeeSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No employees found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.empId}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Employee Name field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Name
                      </label>
                      {isAddMode ? (
                        <div className="relative" ref={dropdownNameRef}>
                          <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={employeeNameSearch}
                            onChange={(e) => {
                              setEmployeeNameSearch(e.target.value);
                              setShowNameDropdown(true);
                            }}
                            onFocus={() => setShowNameDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {showNameDropdown && (
                            <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {allEmployees
                                .filter(
                                  (e) =>
                                    e.name
                                      ?.toLowerCase()
                                      .includes(
                                        employeeNameSearch.toLowerCase()
                                      ) ||
                                    e.empId
                                      ?.toLowerCase()
                                      .includes(
                                        employeeNameSearch.toLowerCase()
                                      )
                                )
                                .map((e) => (
                                  <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        id: e.id,
                                        empId: e.empId,
                                        name: e.name,
                                        dateOfJoining: e.dateOfJoining || '',
                                      }));
                                      setEmployeeSearch(e.empId);
                                      setEmployeeNameSearch(e.name);
                                      setShowNameDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  >
                                    <span className="font-medium text-gray-900">
                                      {e.name}
                                    </span>
                                    <span className="text-gray-500 ml-2 text-xs">
                                      ({e.empId})
                                    </span>
                                  </button>
                                ))}
                              {allEmployees.filter(
                                (e) =>
                                  e.name
                                    ?.toLowerCase()
                                    .includes(
                                      employeeNameSearch.toLowerCase()
                                    ) ||
                                  e.empId
                                    ?.toLowerCase()
                                    .includes(employeeNameSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No employees found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formData.name}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost to Company (CTC)
                      </label>
                      <input
                        type="number"
                        name="ctc"
                        value={formData.ctc || ''}
                        onChange={handleInputChange}
                        readOnly={isViewMode}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100' : ''}`}
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        name="effectiveDate"
                        value={formData.effectiveDate}
                        onChange={handleInputChange}
                        readOnly={isViewMode}
                        min={
                          formData.dateOfJoining
                            ? new Date(formData.dateOfJoining)
                                .toISOString()
                                .split('T')[0]
                            : ''
                        }
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="text"
                        value={
                          formData.dateOfJoining
                            ? new Date(
                                formData.dateOfJoining
                              ).toLocaleDateString()
                            : 'N/A'
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Salary Components Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <CustomTable
                    columns={currentColumns}
                    data={currentTableData}
                    rowKey="field"
                    maxHeight="none"
                    tableClassName="min-w-full"
                    theadClassName="bg-gray-50"
                    tbodyClassName="divide-y divide-gray-200"
                  />
                </div>

                {/* Note */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span>
                    {formData.ctc > 0 ? (
                      <>
                        {' '}
                        When you enter CTC, the system automatically calculates:
                        Basic Pay ({salaryRules.basicPayPercent}% of CTC), HRA (
                        {salaryRules.hraPercent}% of Basic Pay), and Other
                        Allowance as the remaining balance. Gross Salary will
                        always be equal to CTC.
                      </>
                    ) : (
                      ' Enter the Cost to Company (CTC) to automatically calculate salary components.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              /* History Tab - Only for view and edit modes */
              <div className="space-y-4">
                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 font-medium">
                      Fetching salary history...
                    </p>
                  </div>
                ) : historyData.length > 0 ? (
                  <>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <CustomTable
                        columns={historyColumns}
                        data={historyData}
                        rowKey="id"
                        maxHeight="400px"
                        tableClassName="min-w-full"
                        theadClassName="bg-gray-50"
                        tbodyClassName="divide-y divide-gray-200"
                        rowClassName={getHistoryRowClass}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      No History Found
                    </h3>
                    <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                      This employee doesn't have any previous salary records
                      apart from the current setup.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={alertModal.onConfirm || closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
      />
    </>
  );
};

export default SalarySetupModal;
