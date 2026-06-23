'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Users,
  Package,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';

export default function NumberFormatsTab() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for Invoice formats
  const [invoiceConfig, setInvoiceConfig] = useState({
    prefix: 'INV-',
    nextNumber: '1001',
    padding: 4,
    suffix: '-2026',
  });

  // State for Employee ID formats
  const [employeeConfig, setEmployeeConfig] = useState({
    prefix: 'LK',
    nextNumber: '101',
    padding: 3,
    suffix: '',
  });

  // State for Contract Employee ID formats
  const [contractEmployeeConfig, setContractEmployeeConfig] = useState({
    prefix: 'LKC',
    nextNumber: '101',
    padding: 3,
    suffix: '',
  });

  // Fetch saved configurations from DB
  useEffect(() => {
    const fetchFormats = async () => {
      try {
        const res = await fetch('/api/number-formats');
        if (res.ok) {
          const data = await res.json();
          if (data.invoice) {
            setInvoiceConfig(data.invoice);
          }
          if (data.employee) {
            setEmployeeConfig(data.employee);
          }
          if (data.contract_employee) {
            setContractEmployeeConfig(data.contract_employee);
          }
        }
      } catch (error) {
        console.error('Failed to load number formats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormats();
  }, []);

  // Generate live preview helper
  const getFormattedNumber = (config) => {
    const num = parseInt(config.nextNumber, 10) || 0;
    const paddedNum = String(num).padStart(config.padding, '0');
    return `${config.prefix}${paddedNum}${config.suffix}`;
  };

  const handleInvoiceChange = (field, value) => {
    setInvoiceConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmployeeChange = (field, value) => {
    setEmployeeConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContractEmployeeChange = (field, value) => {
    setContractEmployeeConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/number-formats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: invoiceConfig,
          employee: employeeConfig,
          contract_employee: contractEmployeeConfig,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update number formats');
      }

      showSuccessToast('Number formats updated successfully!');
    } catch (error) {
      console.error(error);
      showErrorToast('Failed to save number formats.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-2 p-1">
      {/* Tab Header Description */}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================= INVOICE FORMAT CARD ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Invoice Number Format
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={invoiceConfig.prefix}
                    onChange={(e) =>
                      handleInvoiceChange('prefix', e.target.value)
                    }
                    placeholder="e.g. INV-"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Next Sequence Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Next Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={invoiceConfig.nextNumber}
                      onChange={(e) =>
                        handleInvoiceChange('nextNumber', e.target.value)
                      }
                      placeholder="e.g. 1001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Number Padding
                    </label>
                    <select
                      value={invoiceConfig.padding}
                      onChange={(e) =>
                        handleInvoiceChange(
                          'padding',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all bg-white font-mono"
                    >
                      <option value={2}>2 Digits (e.g. 01)</option>
                      <option value={3}>3 Digits (e.g. 001)</option>
                      <option value={4}>4 Digits (e.g. 0001)</option>
                      <option value={5}>5 Digits (e.g. 00001)</option>
                      <option value={6}>6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={invoiceConfig.suffix}
                    onChange={(e) =>
                      handleInvoiceChange('suffix', e.target.value)
                    }
                    placeholder="e.g. -2026"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Block */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                Live Format Preview
              </span>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800">
                  Generated Invoice ID:
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                  {getFormattedNumber(invoiceConfig)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= EMPLOYEE ID FORMAT CARD ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Employee ID Format
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={employeeConfig.prefix}
                    onChange={(e) =>
                      handleEmployeeChange('prefix', e.target.value)
                    }
                    placeholder="e.g. LK"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Next Sequence Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Next Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={employeeConfig.nextNumber}
                      onChange={(e) =>
                        handleEmployeeChange('nextNumber', e.target.value)
                      }
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Number Padding
                    </label>
                    <select
                      value={employeeConfig.padding}
                      onChange={(e) =>
                        handleEmployeeChange(
                          'padding',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all bg-white font-mono"
                    >
                      <option value={2}>2 Digits (e.g. 01)</option>
                      <option value={3}>3 Digits (e.g. 001)</option>
                      <option value={4}>4 Digits (e.g. 0001)</option>
                      <option value={5}>5 Digits (e.g. 00001)</option>
                      <option value={6}>6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={employeeConfig.suffix}
                    onChange={(e) =>
                      handleEmployeeChange('suffix', e.target.value)
                    }
                    placeholder="e.g. -T"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Block */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                Live Format Preview
              </span>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-800">
                  Generated Employee ID:
                </span>
                <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">
                  {getFormattedNumber(employeeConfig)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= CONTRACT EMPLOYEE ID FORMAT CARD ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Contract Employee ID Format
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={contractEmployeeConfig.prefix}
                    onChange={(e) =>
                      handleContractEmployeeChange('prefix', e.target.value)
                    }
                    placeholder="e.g. LKC"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Next Sequence Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Next Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={contractEmployeeConfig.nextNumber}
                      onChange={(e) =>
                        handleContractEmployeeChange('nextNumber', e.target.value)
                      }
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Number Padding
                    </label>
                    <select
                      value={contractEmployeeConfig.padding}
                      onChange={(e) =>
                        handleContractEmployeeChange(
                          'padding',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all bg-white font-mono"
                    >
                      <option value={2}>2 Digits (e.g. 01)</option>
                      <option value={3}>3 Digits (e.g. 001)</option>
                      <option value={4}>4 Digits (e.g. 0001)</option>
                      <option value={5}>5 Digits (e.g. 00001)</option>
                      <option value={6}>6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={contractEmployeeConfig.suffix}
                    onChange={(e) =>
                      handleContractEmployeeChange('suffix', e.target.value)
                    }
                    placeholder="e.g. -C"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Block */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                Live Format Preview
              </span>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800">
                  Generated Contract Employee ID:
                </span>
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                  {getFormattedNumber(contractEmployeeConfig)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setInvoiceConfig({
                prefix: 'INV-',
                nextNumber: '1001',
                padding: 4,
                suffix: '-2026',
              });
              setEmployeeConfig({
                prefix: 'LK',
                nextNumber: '101',
                padding: 3,
                suffix: '',
              });
              setContractEmployeeConfig({
                prefix: 'LKC',
                nextNumber: '101',
                padding: 3,
                suffix: '',
              });
              showSuccessToast('Reset configurations to default.');
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-[#004475] text-white font-semibold text-sm rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Formats'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
