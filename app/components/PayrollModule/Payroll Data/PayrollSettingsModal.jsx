'use client';

import React, { useState } from 'react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CustomModalForm from '../../CustomModalForm';

const PayrollSettingsModal = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState(
    initialSettings || {
      sunday: 'Leave',
      saturday: 'Leave',
      effectiveDate: new Date().toISOString().split('T')[0],
    }
  );

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  return (
    <CustomModalForm
      open={isOpen}
      onClose={onClose}
      widthClass="max-w-md"
      title="Payroll Settings"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" onClick={onClose} className="px-4 py-2">
            Cancel
          </Button>
          <PrimaryButton onClick={handleSubmit} className="px-4 py-2">
            Save Settings
          </PrimaryButton>
        </div>
      }
    >
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-2">
          Configure how working days are calculated for payroll cycles.
        </p>

        <div className="space-y-4">
          {/* Effective Date Setting */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Effective Date
              </span>
              <span className="text-xs text-gray-500">
                When these settings take effect
              </span>
            </div>
            <div className="w-32">
              <input
                type="date"
                name="effectiveDate"
                value={settings.effectiveDate}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Sunday Setting */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Sunday
              </span>
              <span className="text-xs text-gray-500">
                Select working day type for Sundays
              </span>
            </div>
            <div className="w-32">
              <select
                name="sunday"
                value={settings.sunday}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
              >
                <option value="Full">Full</option>
                <option value="Half">Half</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          {/* Saturday Setting */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Saturday
              </span>
              <span className="text-xs text-gray-500">
                Select working day type for Saturdays
              </span>
            </div>
            <div className="w-32">
              <select
                name="saturday"
                value={settings.saturday}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
              >
                <option value="Full">Full</option>
                <option value="Half">Half</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </CustomModalForm>
  );
};

export default PayrollSettingsModal;
