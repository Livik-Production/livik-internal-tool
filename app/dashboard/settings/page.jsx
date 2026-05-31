'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Settings, ShieldCheck, HelpCircle } from 'lucide-react';
import Loader from '../../components/Loader';

// Tab Components
import CompanyDetailsTab from '../../components/Settings/CompanyDetailsTab';
import SystemSettingsTab from '../../components/Settings/SystemSettingsTab';
import HrModuleSettingsTab from '../../components/Settings/HrModuleSettingsTab';
import LookupDataTab from '../../components/Settings/LookupDataTab';
import PayrollSettingsTab from '../../components/Settings/PayrollSettingsTab';
import TabButton from '../../components/Buttons/TabButton';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('companyDetails'); // 'companyDetails', 'system', 'hr_module', 'lookup', 'payroll_new'
  const authUser = useSelector((state) => state.auth.user);

  // Check if user is admin
  const roleName =
    authUser?.role?.roleName?.toUpperCase() ??
    authUser?.role?.name?.toUpperCase() ??
    '';
  const isAdminUser = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';

  useEffect(() => {
    // Redirect non-admin users
    if (authUser && !isAdminUser) {
      router.push('/dashboard');
    }
  }, [authUser, isAdminUser, router]);

  if (!authUser) {
    return <Loader label="Validating access..." fullScreen />;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="bg-white rounded-2xl shadow-sm p-3 mb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
              <Settings size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Settings
              </h1>
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            <ShieldCheck size={14} />
            <span>Administrator Access Only</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white md:p-3 rounded-xl min-h-0">
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <div className="flex items-center space-x-1 mb-3 overflow-x-auto hide-scrollbar border-b border-gray-300">
            <TabButton
              isActive={activeTab === 'companyDetails'}
              onClick={() => setActiveTab('companyDetails')}
            >
              Company Details
            </TabButton>
            <TabButton
              isActive={activeTab === 'system'}
              onClick={() => setActiveTab('system')}
            >
              System Settings
            </TabButton>
            <TabButton
              isActive={activeTab === 'hr_module'}
              onClick={() => setActiveTab('hr_module')}
            >
              HR Module Settings
            </TabButton>
            <TabButton
              isActive={activeTab === 'lookup'}
              onClick={() => setActiveTab('lookup')}
            >
              Lookup Data
            </TabButton>
            <TabButton
              isActive={activeTab === 'payroll_new'}
              onClick={() => setActiveTab('payroll_new')}
            >
              Payroll Settings
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1">
            {activeTab === 'companyDetails' && <CompanyDetailsTab />}
            {activeTab === 'system' && <SystemSettingsTab />}
            {activeTab === 'hr_module' && <HrModuleSettingsTab />}
            {activeTab === 'lookup' && <LookupDataTab />}
            {activeTab === 'payroll_new' && <PayrollSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
