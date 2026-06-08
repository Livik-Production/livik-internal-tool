'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, SquarePen, Trash, AlertCircle } from 'lucide-react';
import CustomTable from '../CustomTable';
import { showSuccessToast, showErrorToast } from '../Toast';
import IconButton from '../Buttons/IconButton';

export default function HrModuleSettingsTab() {
  const [activeHrSubTab, setActiveHrSubTab] = useState('attendance');
  const [activePayrollSubTab, setActivePayrollSubTab] = useState('calculation');
  const [isLoading, setIsLoading] = useState(false);
  const [payrollSettings, setPayrollSettings] = useState({
    sunday: 'Leave',
    saturday: 'Leave',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [leaveSettings, setLeaveSettings] = useState({
    employeeReportingRole: 'HR Admin',
    hrReportingRole: 'Admin',
    sendEmailOnRequest: true,
    sendEmailOnApproval: true,
  });
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/payroll/settings');
      if (response.ok) {
        const data = await response.json();
        if (data) setPayrollSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/payroll/settings?all=true');
      if (response.ok) {
        const data = await response.json();
        setPayrollHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, []);

  const handlePayrollSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayrollSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLeaveSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLeaveSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      if (activeHrSubTab === 'attendance') {
        const response = await fetch('/api/payroll/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payrollSettings),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to save attendance settings');
        }
        showSuccessToast('Attendance settings saved successfully to database!');
        fetchHistory(); // Refresh history
      } else {
        // Mock save for leave settings
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showSuccessToast('Leave settings saved successfully (Mock)!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast(error.message || 'Failed to save settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayrollSetting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this setting record?'))
      return;

    try {
      const res = await fetch(`/api/payroll/settings/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showSuccessToast('Setting deleted successfully.');
        fetchHistory();
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to delete setting.');
      }
    } catch (error) {
      console.error('Delete setting error:', error);
      showErrorToast('An error occurred while deleting.');
    }
  };

  const handleUpdatePayrollSetting = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/payroll/settings/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord),
      });

      if (res.ok) {
        showSuccessToast('Setting updated successfully.');
        setEditingRecord(null);
        fetchHistory();
      } else {
        const err = await res.json();
        showErrorToast(err.error || 'Failed to update setting.');
      }
    } catch (error) {
      console.error('Update setting error:', error);
      showErrorToast('An error occurred while updating.');
    } finally {
      setIsLoading(false);
    }
  };

  const historyColumns = [
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      className: 'font-semibold text-slate-800',
      render: (row) => (
        <span>
          {new Date(row.effectiveDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'sunday',
      label: 'Sunday',
      render: (row) => <span>{row.sunday}</span>,
    },
    {
      key: 'saturday',
      label: 'Saturday',
      render: (row) => <span>{row.saturday}</span>,
    },
  ];

  const historyActions = (row) => (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => {
          setEditingRecord(row);
          setIsViewOnly(false);
        }}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Edit Setting"
      >
        <SquarePen size={16} />
      </button>
      <IconButton
        onClick={() => handleDeletePayrollSetting(row.id)}
        className="p-2 hover:bg-red-50 transition-colors"
        title="Delete Setting"
      >
        <Trash size={16} />
      </IconButton>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 mb-6 border-b border-gray-100">
            <button
              onClick={() => setActiveHrSubTab('attendance')}
              className={`relative flex items-center mr-1 px-5 py-2 font-semibold text-base transition-all duration-300 rounded-t-xl ${
                activeHrSubTab === 'attendance'
                  ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                  : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
              }`}
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              Attendance Settings
            </button>
            <button
              onClick={() => setActiveHrSubTab('leave')}
              className={`relative flex items-center mr-1 px-5 py-2 font-semibold text-base transition-all duration-300 rounded-t-xl ${
                activeHrSubTab === 'leave'
                  ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                  : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
              }`}
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              Leave Settings
            </button>
          </div>

          {activeHrSubTab === 'attendance' ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6 border-b border-gray-100">
                <button
                  onClick={() => setActivePayrollSubTab('calculation')}
                  className={`relative flex items-center px-5 py-2 font-semibold text-md transition-all duration-300 rounded-t-xl ${
                    activePayrollSubTab === 'calculation'
                      ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                      : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
                  }`}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  Calculation
                </button>
                <button
                  onClick={() => setActivePayrollSubTab('history')}
                  className={`relative flex items-center px-5 py-2 font-semibold text-md transition-all duration-300 rounded-t-xl ${
                    activePayrollSubTab === 'history'
                      ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                      : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
                  }`}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  Calculation History
                </button>
              </div>

              {activePayrollSubTab === 'calculation' ? (
                <div className="space-y-4 max-w-2xl animate-in fade-in duration-300">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors w-3/4">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        Effective Date
                      </span>
                    </div>
                    <div className="w-40">
                      <input
                        type="date"
                        name="effectiveDate"
                        value={payrollSettings.effectiveDate}
                        onChange={handlePayrollSettingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors w-3/4">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        Sunday Working Type
                      </span>
                    </div>
                    <div className="w-40">
                      <select
                        name="sunday"
                        value={payrollSettings.sunday}
                        onChange={handlePayrollSettingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
                      >
                        <option value="Full">Full Day</option>
                        <option value="Half">Half Day</option>
                        <option value="Leave">Weekend Off</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors w-3/4">
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        Saturday Working Type
                      </span>
                    </div>
                    <div className="w-40">
                      <select
                        name="saturday"
                        value={payrollSettings.saturday}
                        onChange={handlePayrollSettingChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
                      >
                        <option value="Full">Full Day</option>
                        <option value="Half">Half Day</option>
                        <option value="Leave">Weekend Off</option>
                      </select>
                    </div>
                  </div>

                  <div className="py-4 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Save Attendance Rules'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <CustomTable
                    columns={historyColumns}
                    data={payrollHistory}
                    actions={historyActions}
                    actionsHeader="Actions"
                    actionsAlign="right"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 text-left">
                    Leave Configuration
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block text-left">
                      Employee Reporting Role
                    </label>
                    <select
                      name="employeeReportingRole"
                      value={leaveSettings.employeeReportingRole}
                      onChange={handleLeaveSettingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer bg-white"
                    >
                      <option value="HR Admin">HR Admin</option>
                      <option value="HR Executive">HR Executive</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block text-left">
                      HR Reporting Role
                    </label>
                    <select
                      name="hrReportingRole"
                      value={leaveSettings.hrReportingRole}
                      onChange={handleLeaveSettingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer bg-white"
                    >
                      <option value="Admin">Admin</option>
                      <option value="HR Admin">HR Admin</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 text-left">
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name="sendEmailOnRequest"
                        checked={leaveSettings.sendEmailOnRequest}
                        onChange={handleLeaveSettingChange}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-slate-900 transition-colors">
                        Notify the reporting manager via email when a leave
                        request is submitted.
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <input
                        type="checkbox"
                        name="sendEmailOnApproval"
                        checked={leaveSettings.sendEmailOnApproval}
                        onChange={handleLeaveSettingChange}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-slate-900 transition-colors">
                        Notify the employee via email once the leave request is
                        approved or rejected.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Save Leave Settings'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {isViewOnly
                  ? 'View Attendance Setting'
                  : 'Edit Attendance Setting'}
              </h3>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setIsViewOnly(false);
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <AlertCircle size={20} className="rotate-45" />
              </button>
            </div>
            <form
              onSubmit={handleUpdatePayrollSetting}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={editingRecord.effectiveDate}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      effectiveDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  required
                  disabled={isViewOnly}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sunday Working Type
                </label>
                <select
                  value={editingRecord.sunday}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      sunday: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={isViewOnly}
                >
                  <option value="Full">Full Day</option>
                  <option value="Half">Half Day</option>
                  <option value="Leave">Weekend Off</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Saturday Working Type
                </label>
                <select
                  value={editingRecord.saturday}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      saturday: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  disabled={isViewOnly}
                >
                  <option value="Full">Full Day</option>
                  <option value="Half">Half Day</option>
                  <option value="Leave">Weekend Off</option>
                </select>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="edit-holiday"
                  checked={editingRecord.companyHoliday}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      companyHoliday: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isViewOnly}
                />
                <label
                  htmlFor="edit-holiday"
                  className="text-sm font-medium text-gray-700"
                >
                  Company Holiday enabled
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setIsViewOnly(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isViewOnly ? 'Close' : 'Cancel'}
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-[#004475] text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Record'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
