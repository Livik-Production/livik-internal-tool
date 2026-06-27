'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, User } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../../components/CustomAlertForm';

export default function AssignRoleModal({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  roles = ['Admin', 'Manager', 'Employee', 'Viewer'],
  preselectedRole = '',
  isLoading = false,
}) {
  const getRoleValue = (role) => {
    if (!role) return '';
    return typeof role === 'object' ? role.id || role.name || '' : role;
  };

  const getRoleDisplayName = (role) => {
    if (!role) return '';
    return typeof role === 'object'
      ? role.name || role.displayName || role.id || ''
      : role;
  };

  const [formData, setFormData] = useState({
    employeeId: '',
    dbId: '',
    employeeName: '',
    role: getRoleValue(preselectedRole),
    comments: '',
    currentRole: null,
  });

  const [errors, setErrors] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const suggestionsRef = useRef(null);
  const suggestionsNameRef = useRef(null);
  const modalRef = useRef(null);

  const activeEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const statusUpper = (emp.status || emp.__raw?.status || '').toUpperCase();
      const isPending =
        statusUpper === 'PENDING' || statusUpper === 'PENDING_ADMIN';
      return !isPending;
    });
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = (formData.employeeId || '').trim().toLowerCase();
    if (!query) return activeEmployees;
    return activeEmployees.filter(
      (emp) =>
        (emp.id || '').toLowerCase().includes(query) ||
        (emp.name || '').toLowerCase().includes(query)
    );
  }, [formData.employeeId, activeEmployees]);

  const filteredNameEmployees = useMemo(() => {
    const query = (formData.employeeName || '').trim().toLowerCase();
    if (!query) return activeEmployees;
    return activeEmployees.filter(
      (emp) =>
        (emp.id || '').toLowerCase().includes(query) ||
        (emp.name || '').toLowerCase().includes(query)
    );
  }, [formData.employeeName, activeEmployees]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeId: '',
        dbId: '',
        employeeName: '',
        role: getRoleValue(preselectedRole),
        comments: '',
        currentRole: null,
      });
      setErrors({});
      setShowSuggestions(false);
      setShowNameSuggestions(false);
      setShowConfirm(false);
    }
  }, [isOpen, preselectedRole]);

  useEffect(() => {
    const handleClickOutsideSuggestions = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      if (
        suggestionsNameRef.current &&
        !suggestionsNameRef.current.contains(event.target)
      ) {
        setShowNameSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideSuggestions);
    return () =>
      document.removeEventListener('mousedown', handleClickOutsideSuggestions);
  }, []);

  useEffect(() => {
    const handleClickOutsideModal = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutsideModal);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideModal);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleSelectEmployee = (employee) => {
    setFormData((prev) => ({
      ...prev,
      employeeId: employee.id,
      dbId: employee.dbId,
      employeeName: employee.name,
      currentRole: employee.role || null,
    }));
    setShowSuggestions(false);
    setShowNameSuggestions(false);

    if (errors.employeeId || errors.employeeName) {
      setErrors((prev) => ({
        ...prev,
        employeeId: '',
        employeeName: '',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      if (name === 'employeeId' || name === 'employeeName') {
        updated.dbId = '';
        updated.currentRole = null;
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(false);
    onSubmit(formData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (formData.currentRole) {
        setShowConfirm(true);
      } else {
        onSubmit(formData);
      }
    }
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderFooter = (
    <div className="flex justify-end gap-3 w-full">
      <Button onClick={handleCloseModal} disabled={isLoading}>
        Cancel
      </Button>
      <PrimaryButton
        type="submit"
        form="assignRoleForm"
        disabled={isLoading}
        className="min-w-[120px]"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Assigning...
          </>
        ) : (
          'Assign Role'
        )}
      </PrimaryButton>
    </div>
  );

  return (
    <>
      <CustomModalForm
        open={isOpen}
        onClose={handleCloseModal}
        title="Assign Role to Employee"
        footer={renderFooter}
        widthClass="max-w-md"
      >
        <div className="p-4">
          <form
            id="assignRoleForm"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {preselectedRole && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold text-blue-800">
                    Preselected Role:
                  </span>{' '}
                  {getRoleDisplayName(preselectedRole)}
                </p>
              </div>
            )}

            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee ID *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all text-sm"
                  placeholder="Search by ID or name..."
                  disabled={isLoading}
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(true)}
                />
              </div>

              {showSuggestions && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden border-t-0 p-1">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleSelectEmployee(employee)}
                      className="w-full px-3 py-2.5 text-left hover:bg-blue-50/50 rounded-lg focus:bg-blue-50/50 focus:outline-none flex items-center gap-3 transition-colors group/item"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover/item:bg-white group-focus/item:bg-white transition-colors">
                        <User className="h-4 w-4 text-gray-500 group-hover/item:text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate text-sm">
                          {employee.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ID: {employee.id}
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity">
                        SELECT
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {errors.employeeId && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.employeeId}
                </p>
              )}
            </div>

            <div className="relative" ref={suggestionsNameRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee Name *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all text-sm"
                  placeholder="Enter employee name"
                  disabled={isLoading}
                  autoComplete="off"
                  onFocus={() => setShowNameSuggestions(true)}
                  onClick={() => setShowNameSuggestions(true)}
                />
              </div>

              {showNameSuggestions && filteredNameEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden border-t-0 p-1">
                  {filteredNameEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleSelectEmployee(employee)}
                      className="w-full px-3 py-2.5 text-left hover:bg-blue-50/50 rounded-lg focus:bg-blue-50/50 focus:outline-none flex items-center gap-3 transition-colors group/item"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover/item:bg-white group-focus/item:bg-white transition-colors">
                        <User className="h-4 w-4 text-gray-500 group-hover/item:text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate text-sm">
                          {employee.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ID: {employee.id}
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity">
                        SELECT
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {errors.employeeName && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.employeeName}
                </p>
              )}
              <p className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                Search by ID or name, then select from suggestions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none bg-white transition-all text-sm font-medium text-gray-700"
                  disabled={isLoading}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => {
                    const val = getRoleValue(role);
                    const display = getRoleDisplayName(role);
                    return (
                      <option key={val} value={val}>
                        {display}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-focus-within:text-blue-500">
                  <svg
                    className="h-4 w-4 transition-transform group-focus-within:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.role}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comments (Optional)
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-3">
                  <svg
                    className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows="3"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none transition-all text-sm"
                  placeholder="Add any additional comments or notes..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </form>
        </div>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Role Assignment"
        message="Are you sure you want to assign the employee to this role, while they in other role?"
        type="warning"
        confirmText="Yes, Assign"
        cancelText="Cancel"
        details={
          <div className="text-sm mt-2 p-2.5 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 leading-relaxed font-sans">
            <p className="mb-1">
              <span className="font-semibold text-yellow-900">Employee:</span>{' '}
              {formData.employeeName}
            </p>
            <p className="mb-1">
              <span className="font-semibold text-yellow-900">
                Current Role:
              </span>{' '}
              {formData.currentRole?.displayName ||
                formData.currentRole?.roleName ||
                'Unknown'}
            </p>
            <p>
              <span className="font-semibold text-yellow-900">New Role:</span>{' '}
              {(() => {
                const r = roles.find((role) => {
                  const val =
                    typeof role === 'object'
                      ? role.id || role.name || ''
                      : role;
                  return val === formData.role;
                });
                return typeof r === 'object'
                  ? r.name || r.displayName || r.id
                  : r || formData.role;
              })()}
            </p>
          </div>
        }
      />
    </>
  );
}
