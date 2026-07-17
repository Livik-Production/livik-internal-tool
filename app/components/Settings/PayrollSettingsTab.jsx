'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Percent, Coins, ShieldAlert } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';

export default function PayrollSettingsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [newPayrollSettings, setNewPayrollSettings] = useState({
    sendPayslipEmail: false,
  });

  const [settingsRecord, setSettingsRecord] = useState(null);
  const [basicPayPercent, setBasicPayPercent] = useState(40.0);
  const [hraPercent, setHraPercent] = useState(50.0);
  const [validationError, setValidationError] = useState('');

  // Derived CTC breakdown
  const hraCstPercent = basicPayPercent * (hraPercent / 100);
  const otherAllowancePercent = 100 - basicPayPercent - hraCstPercent;

  useEffect(() => {
    // 1. Fetch settings from the backend API first
    const fetchBackendSettings = async () => {
      try {
        const response = await fetch('/api/payroll/settings');
        if (response.ok) {
          const data = await response.json();
          setSettingsRecord(data);
          if (data.basicPayPercent !== undefined) {
            setBasicPayPercent(Number(data.basicPayPercent));
          }
          if (data.hraPercent !== undefined) {
            setHraPercent(Number(data.hraPercent));
          }
        }
      } catch (error) {
        console.error('Error fetching payroll settings from backend:', error);
      }
    };

    // 2. Load from localStorage as fallback
    const saved = localStorage.getItem('payroll_salary_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNewPayrollSettings({
          sendPayslipEmail: parsed.sendPayslipEmail || false,
        });
        if (parsed.basicPayPercent !== undefined) {
          setBasicPayPercent(Number(parsed.basicPayPercent));
        }
        if (parsed.hraPercent !== undefined) {
          setHraPercent(Number(parsed.hraPercent));
        }
      } catch (e) {
        console.error('Error parsing payroll rules from localStorage:', e);
      }
    }

    fetchBackendSettings();
  }, []);

  // Handle validation in real time
  useEffect(() => {
    if (basicPayPercent < 0 || hraPercent < 0) {
      setValidationError('Percentages cannot be negative.');
    } else if (basicPayPercent > 100) {
      setValidationError('Basic Pay percentage cannot exceed 100% of CTC.');
    } else if (hraPercent > 100) {
      setValidationError('HRA percentage cannot exceed 100% of Basic Pay.');
    } else if (basicPayPercent + hraCstPercent > 100) {
      setValidationError(
        `Total allocation (Basic Pay + HRA = ${(basicPayPercent + hraCstPercent).toFixed(1)}%) cannot exceed 100% of CTC.`
      );
    } else {
      setValidationError('');
    }
  }, [basicPayPercent, hraPercent, hraCstPercent]);

  const handleNewPayrollSettingChange = (e) => {
    const { name, checked } = e.target;
    setNewPayrollSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSaveSettings = async () => {
    if (validationError) {
      showErrorToast(validationError);
      return;
    }

    setIsLoading(true);
    try {
      // Build payload combining database settings with UI inputs
      const payload = {
        sunday: settingsRecord?.sunday || 'Leave',
        saturday: settingsRecord?.saturday || 'Leave',
        effectiveDate:
          settingsRecord?.effectiveDate ||
          new Date().toISOString().split('T')[0],
        companyHoliday: settingsRecord?.companyHoliday ?? true,
        basicPayPercent,
        hraPercent,
      };

      const response = await fetch('/api/payroll/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save payroll settings');
      }

      const savedData = await response.json();
      setSettingsRecord(savedData);

      // Save to localStorage as secondary fallback / mirror
      const localStorageObj = {
        sendPayslipEmail: newPayrollSettings.sendPayslipEmail,
        basicPayPercent,
        hraPercent,
      };
      localStorage.setItem(
        'payroll_salary_rules',
        JSON.stringify(localStorageObj)
      );

      showSuccessToast('Payroll settings saved successfully to backend!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast(error.message || 'Failed to save payroll settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-4 border-b border-slate-100">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Coins size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 text-left">
                Payroll Configuration
              </h2>
            </div>
          </div>

          <div className="space-y-8 max-w-2xl">
            {/* Salary Components Section */}
            <div className="pt-2 border-b border-slate-100 pb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-2 text-left flex items-center gap-2">
                <Percent size={16} className="text-blue-500" />
                Salary Component Percentages (CTC Breakdown)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 text-left">
                    Basic Pay (% of CTC)
                  </label>
                  <input
                    type="number"
                    value={basicPayPercent}
                    onChange={(e) => setBasicPayPercent(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 text-left">
                    HRA (% of Basic Pay)
                  </label>
                  <input
                    type="number"
                    value={hraPercent}
                    onChange={(e) => setHraPercent(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {validationError && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span className="font-medium">{validationError}</span>
                </div>
              )}

              {/* Dynamic Preview Breakdown */}
              <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                <h4 className="text-xs font-bold text-blue-900 mb-2 text-left uppercase tracking-wider">
                  Live CTC Allocation Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-50">
                    <span className="block text-[10px] text-gray-500 font-bold uppercase">
                      Basic Pay
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {basicPayPercent}% of CTC
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-50">
                    <span className="block text-[10px] text-gray-500 font-bold uppercase">
                      HRA (House Rent)
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {hraCstPercent.toFixed(1)}% of CTC
                    </span>
                    <span className="block text-[9px] text-gray-400 italic">
                      ({hraPercent}% of Basic)
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-50">
                    <span className="block text-[10px] text-gray-500 font-bold uppercase">
                      Other Allowance
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {validationError
                        ? '-'
                        : `${otherAllowancePercent.toFixed(1)}%`}
                    </span>
                    <span className="block text-[9px] text-gray-400 italic">
                      (Remaining Balance)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payslip Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 text-left flex items-center gap-2">
                <Mail size={16} className="text-blue-500" />
                Payslip Distribution
              </h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    name="sendPayslipEmail"
                    checked={newPayrollSettings.sendPayslipEmail}
                    onChange={handleNewPayrollSettingChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-gray-800 group-hover:text-slate-900 transition-colors">
                      Email payslip notification
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      Notify employees via email when payroll is processed and
                      their payslip is available to view or download.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Section */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading || !!validationError}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
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
