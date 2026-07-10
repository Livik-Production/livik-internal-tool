'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Monitor, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setFontSize } from '../../../store/slices/uiSlice';
import CustomTable from '../CustomTable';
import { showSuccessToast } from '../Toast';
import CustomAlertForm from '../CustomAlertForm';
import PrimaryButton from '../Buttons/PrimaryButton';

export default function SystemSettingsTab() {
  const dispatch = useDispatch();
  const fontSize = useSelector((state) => state.ui.fontSize);

  const [activeSystemSubTab, setActiveSystemSubTab] = useState('configuration');
  const [tempFontSize, setTempFontSize] = useState(14);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [fromEmail, setFromEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isApplyingFont, setIsApplyingFont] = useState(false);
  const [emailHistory, setEmailHistory] = useState([
    {
      id: 1,
      email: 'notifications@company.com',
      updatedDate: '2026-03-01',
      updatedBy: 'Admin',
    },
    {
      id: 2,
      email: 'noreply@company.com',
      updatedDate: '2025-11-15',
      updatedBy: 'Admin',
    },
  ]);

  useEffect(() => {
    if (fontSize) {
      setTempFontSize(fontSize);
    }
  }, [fontSize]);

  const handleFontSizeChange = (e) => {
    setTempFontSize(parseInt(e.target.value, 10));
  };

  const handleApplyFontSize = () => {
    setIsApplyingFont(true);
    setIsFontModalOpen(false);
    setTimeout(() => {
      dispatch(setFontSize(tempFontSize));
      setIsApplyingFont(false);
      showSuccessToast(`Font size updated to ${tempFontSize}px!`);
    }, 1500);
  };

  const handleSaveEmailSettings = () => {
    setIsSavingEmail(true);
    setTimeout(() => {
      setIsSavingEmail(false);
      showSuccessToast(
        'System Email Configuration saved successfully (Mock)!'
      );
      setEmailHistory((prev) => [
        {
          id: Date.now(),
          email: fromEmail || 'notifications@company.com',
          updatedDate: new Date().toISOString().split('T')[0],
          updatedBy: 'Admin',
        },
        ...prev,
      ]);
    }, 1500);
  };

  const handleCancelFontSize = () => {
    setTempFontSize(fontSize);
    setIsFontModalOpen(false);
  };

  const emailHistoryColumns = [
    {
      key: 'email',
      label: 'System Email',
      className: 'font-medium text-slate-800',
      render: (row) => <span>{row.email}</span>,
    },
    {
      key: 'updatedDate',
      label: 'Updated On',
      render: (row) => <span>{row.updatedDate}</span>,
    },
    {
      key: 'updatedBy',
      label: 'Updated By',
      render: (row) => <span>{row.updatedBy}</span>,
    },
  ];

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Email Configuration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 mb-6 border-b border-gray-100">
            <button
              onClick={() => setActiveSystemSubTab('configuration')}
              className={`relative flex items-center px-5 py-2 font-semibold text-md transition-all duration-300 rounded-t-xl ${
                activeSystemSubTab === 'configuration'
                  ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                  : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
              }`}
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              Email Configuration
            </button>
            <button
              onClick={() => setActiveSystemSubTab('history')}
              className={`relative flex items-center px-5 py-2 font-semibold text-md transition-all duration-300 rounded-t-xl ${
                activeSystemSubTab === 'history'
                  ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                  : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
              }`}
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              Email History
            </button>
          </div>

          {activeSystemSubTab === 'configuration' ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-[#004475] rounded-lg">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Email Configuration
                  </h2>
                </div>
              </div>

              <div className="max-w-md">
                <label
                  htmlFor="fromEmail"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  System "From" Email Address
                </label>
                <input
                  type="email"
                  id="fromEmail"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="e.g. notifications@yourcompany.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all duration-200"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
                <button
                  onClick={handleSaveEmailSettings}
                  disabled={isSavingEmail}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSavingEmail && <Loader2 className="animate-spin mr-2" size={16} />}
                  {isSavingEmail ? 'Saving...' : 'Save Email Settings'}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-slate-800 mb-4 text-left">
                Email Configuration History
              </h2>
              <CustomTable columns={emailHistoryColumns} data={emailHistory} />
            </div>
          )}
        </div>
      </div>

      {/* Display Settings Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-2 md:p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-[#004475] rounded-lg">
              <Monitor size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Display Settings
              </h2>
              <p className="text-slate-500 text-xs">
                Adjust the visual appearance of the application
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <label
              htmlFor="fontSize"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Global Font Size:{' '}
              <span className="font-bold text-[#004475] ">{fontSize}px</span>
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Smaller</span>
              <input
                type="range"
                id="fontSize"
                min="12"
                max="24"
                value={tempFontSize}
                onChange={handleFontSizeChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004475]"
              />
              <span className="text-xs text-slate-400">Larger</span>
            </div>
            {(tempFontSize !== fontSize || isApplyingFont) && (
              <div className="mt-4 flex justify-end">
                <PrimaryButton 
                  onClick={() => setIsFontModalOpen(true)}
                  disabled={isApplyingFont}
                >
                  {isApplyingFont && <Loader2 className="animate-spin mr-2" size={16} />}
                  {isApplyingFont ? 'Applying...' : 'Apply Changes'}
                </PrimaryButton>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Drag the slider to adjust the text size. Click "Apply Changes" to
              save.
            </p>
          </div>
        </div>
      </div>

      {/* Font Size Confirmation Modal */}
      <CustomAlertForm
        isOpen={isFontModalOpen}
        onClose={handleCancelFontSize}
        onConfirm={handleApplyFontSize}
        title="Confirm Font Size Change"
        message={`Are you sure you want to change the global font size to ${tempFontSize}px? This will update the layout across all modules.`}
        type="info"
        confirmText="Apply"
        cancelText="Cancel"
      />
    </div>
  );
}
