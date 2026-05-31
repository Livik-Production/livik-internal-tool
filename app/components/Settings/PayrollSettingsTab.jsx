'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { showSuccessToast } from '../Toast';

export default function PayrollSettingsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [newPayrollSettings, setNewPayrollSettings] = useState({
    sendPayslipEmail: false,
  });

  const handleNewPayrollSettingChange = (e) => {
    const { name, checked } = e.target;
    setNewPayrollSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccessToast('Payroll settings saved successfully (Mock)!');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 text-left">
                Payroll Configuration
              </h2>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            {/* Payslip Section */}
            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-800 mb-4 text-left">
                Payslip Distribution
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    name="sendPayslipEmail"
                    checked={newPayrollSettings.sendPayslipEmail}
                    onChange={handleNewPayrollSettingChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800 group-hover:text-slate-900 transition-colors">
                      Notify employees via email when payroll is
                      processed and their payslip is available to view
                      or download
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Section */}
            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl  shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Save Payroll Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
