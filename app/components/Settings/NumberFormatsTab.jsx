'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  Users,
  Package,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';

export default function NumberFormatsTab() {
  const [isSaving, setIsSaving] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Invoice formats
  const [invoiceConfig, setInvoiceConfig] = useState({
    prefix: 'INV-',
    nextNumber: '1001',
    padding: 4,
    suffix: '-2026',
  });

  // State for Quotation formats
  const [quotationConfig, setQuotationConfig] = useState({
    prefix: 'QTN-',
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

  // Asset category and format mapping states
  const [assetCategories, setAssetCategories] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState('Other');
  const [assetConfigs, setAssetConfigs] = useState({});

  // Fetch saved configurations from DB
  useEffect(() => {
    const fetchFormatsAndCategories = async () => {
      try {
        const [resFormats, resCategories] = await Promise.all([
          fetch('/api/number-formats'),
          fetch('/api/asset-categories')
        ]);
        
        let categories = [];
        if (resCategories.ok) {
          categories = await resCategories.json();
          setAssetCategories(categories);
          if (categories.length > 0) {
            setSelectedAssetType(categories[0].name);
          }
        }

        if (resFormats.ok) {
          const data = await resFormats.json();
          if (data.invoice) setInvoiceConfig(data.invoice);
          if (data.quotation) setQuotationConfig(data.quotation);
          if (data.employee) setEmployeeConfig(data.employee);
          if (data.contract_employee) setContractEmployeeConfig(data.contract_employee);
          
          const newAssetConfigs = {};
          Object.keys(data).forEach(key => {
            if (key.startsWith('asset_')) {
              const type = key.slice(6);
              newAssetConfigs[type] = data[key];
            }
          });
          if (data.asset && !newAssetConfigs['Other']) {
             newAssetConfigs['Other'] = data.asset;
          }
          setAssetConfigs(newAssetConfigs);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormatsAndCategories();
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

  const handleQuotationChange = (field, value) => {
    setQuotationConfig((prev) => ({
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

  const handleAssetChange = (field, value) => {
    setAssetConfigs((prev) => ({
      ...prev,
      [selectedAssetType]: {
        ...(prev[selectedAssetType] || getAssetDefaultConfig(selectedAssetType)),
        [field]: value,
      }
    }));
  };

  const handleSaveSection = async (section) => {
    setIsSaving(section);

    try {
      let payload = {};
      if (section === 'invoice') {
        payload.invoice = invoiceConfig;
      } else if (section === 'quotation') {
        payload.quotation = quotationConfig;
      } else if (section === 'employee') {
        payload.employee = employeeConfig;
      } else if (section === 'contract') {
        payload.contract_employee = contractEmployeeConfig;
      } else if (section === 'asset') {
        payload[`asset_${selectedAssetType}`] = assetConfigs[selectedAssetType] || getAssetDefaultConfig(selectedAssetType);
      }

      const res = await fetch('/api/number-formats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update number formats');
      }

      const sectionName = section === 'contract' ? 'Contract Employee' : section === 'asset' ? 'Asset Tag' : section.charAt(0).toUpperCase() + section.slice(1);
      showSuccessToast(`${sectionName} format updated successfully!`);
    } catch (error) {
      console.error(error);
      showErrorToast('Failed to save number formats.');
    } finally {
      setIsSaving(null);
    }
  };

  const getAssetDefaultConfig = (type) => {
    const defaultKeywords = {
      Laptop: 'LAP',
      Mobile: 'MB',
      TV: 'TV',
      Keyboard: 'KB',
      Monitor: 'MN',
      Mouse: 'MS',
      Printer: 'PR',
      Tablet: 'TB',
      Chair: 'CHR',
      Table: 'TBL',
      Camera: 'CAM',
      Other: 'OTH',
    };
    const keyword = defaultKeywords[type] || 'OTH';
    return {
      prefix: `${keyword}-`,
      nextNumber: '1',
      padding: 3,
      suffix: `-${String(new Date().getFullYear()).slice(-2)}`,
    };
  };

  const currentAssetConfig = assetConfigs[selectedAssetType] || getAssetDefaultConfig(selectedAssetType);

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

      <div className="space-y-6">
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setInvoiceConfig({
                    prefix: 'INV-',
                    nextNumber: '1001',
                    padding: 4,
                    suffix: '-2026',
                  });
                  showSuccessToast('Reset to default.');
                }}
                className="px-3 py-1.5 border border-gray-600 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection('invoice')}
                disabled={isSaving === 'invoice'}
                className="px-4 py-1.5 bg-[#004475] text-white font-semibold text-xs rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
              >
                {isSaving === 'invoice' ? (
                  <>
                    <div className="h-3 w-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>

          {/* ================= QUOTATION FORMAT CARD ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Quotation Number Format
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
                    value={quotationConfig.prefix}
                    onChange={(e) =>
                      handleQuotationChange('prefix', e.target.value)
                    }
                    placeholder="e.g. QTN-"
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
                      value={quotationConfig.nextNumber}
                      onChange={(e) =>
                        handleQuotationChange('nextNumber', e.target.value)
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
                      value={quotationConfig.padding}
                      onChange={(e) =>
                        handleQuotationChange(
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
                    value={quotationConfig.suffix}
                    onChange={(e) =>
                      handleQuotationChange('suffix', e.target.value)
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
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-violet-800">
                  Generated Quotation ID:
                </span>
                <span className="font-mono text-sm font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-lg">
                  {getFormattedNumber(quotationConfig)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setQuotationConfig({
                    prefix: 'QTN-',
                    nextNumber: '1001',
                    padding: 4,
                    suffix: '-2026',
                  });
                  showSuccessToast('Reset to default.');
                }}
                className="px-3 py-1.5 border border-gray-600 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection('quotation')}
                disabled={isSaving === 'quotation'}
                className="px-4 py-1.5 bg-[#004475] text-white font-semibold text-xs rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
              >
                {isSaving === 'quotation' ? (
                  <>
                    <div className="h-3 w-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setEmployeeConfig({
                    prefix: 'LK',
                    nextNumber: '101',
                    padding: 3,
                    suffix: '',
                  });
                  showSuccessToast('Reset to default.');
                }}
                className="px-3 py-1.5 border border-gray-600 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection('employee')}
                disabled={isSaving === 'employee'}
                className="px-4 py-1.5 bg-[#004475] text-white font-semibold text-xs rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
              >
                {isSaving === 'employee' ? (
                  <>
                    <div className="h-3 w-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setContractEmployeeConfig({
                    prefix: 'LKC',
                    nextNumber: '101',
                    padding: 3,
                    suffix: '',
                  });
                  showSuccessToast('Reset to default.');
                }}
                className="px-3 py-1.5 border border-gray-600 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection('contract')}
                disabled={isSaving === 'contract'}
                className="px-4 py-1.5 bg-[#004475] text-white font-semibold text-xs rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
              >
                {isSaving === 'contract' ? (
                  <>
                    <div className="h-3 w-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>

          {/* ================= ASSET TAG FORMAT CARD ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Asset Tag Format
                  </h3>
                </div>
              </div>

              <div className="mb-4 bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                <label className="block text-xs font-semibold text-orange-800 mb-1.5">
                  Select Asset Type
                </label>
                <select
                  value={selectedAssetType}
                  onChange={(e) => setSelectedAssetType(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all bg-white font-medium text-orange-900"
                >
                  {assetCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  {!assetCategories.find(c => c.name === 'Other') && (
                    <option value="Other">Other</option>
                  )}
                </select>
              </div>

              <div className="space-y-4">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={currentAssetConfig.prefix}
                    onChange={(e) =>
                      handleAssetChange('prefix', e.target.value)
                    }
                    placeholder="e.g. AST-"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-50/50 focus:border-orange-400 outline-none transition-all font-mono"
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
                      value={currentAssetConfig.nextNumber}
                      onChange={(e) =>
                        handleAssetChange('nextNumber', e.target.value)
                      }
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-50/50 focus:border-orange-400 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Padding */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Number Padding
                    </label>
                    <select
                      value={currentAssetConfig.padding}
                      onChange={(e) =>
                        handleAssetChange(
                          'padding',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-50/50 focus:border-orange-400 outline-none transition-all bg-white font-mono"
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
                    value={currentAssetConfig.suffix}
                    onChange={(e) =>
                      handleAssetChange('suffix', e.target.value)
                    }
                    placeholder="e.g. -IT"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-50/50 focus:border-orange-400 outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Block */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                Live Format Preview
              </span>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-orange-800">
                  Generated Asset Tag:
                </span>
                <span className="font-mono text-sm font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-lg">
                  {getFormattedNumber(currentAssetConfig)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setAssetConfigs(prev => ({
                    ...prev,
                    [selectedAssetType]: getAssetDefaultConfig(selectedAssetType)
                  }));
                  showSuccessToast('Reset to default.');
                }}
                className="px-3 py-1.5 border border-gray-600 text-gray-600 font-semibold text-xs rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleSaveSection('asset')}
                disabled={isSaving === 'asset'}
                className="px-4 py-1.5 bg-[#004475] text-white font-semibold text-xs rounded-xl hover:bg-[#003358] active:bg-[#00223a] transition-all flex items-center gap-2 shadow-sm"
              >
                {isSaving === 'asset' ? (
                  <>
                    <div className="h-3 w-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
