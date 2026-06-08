// app/dashboard/payroll/page.jsx
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PayrollTab from '../../components/PayrollModule/Payroll Data/PayrollTab';
import Overview from '../../components/PayrollModule/Overview/Overview';
import SalarySetupTab from '../../components/PayrollModule/SalarySetup/SalarySetup';
import CustomAlertForm from '../../components/CustomAlertForm';
import Loader from '../../components/Loader';
import TabButton from '../../components/Buttons/TabButton';
import { CreditCardIcon, WalletCards } from 'lucide-react';

// Tab definitions
const TAB_CONFIG = [
  {
    id: 'current',
    label: 'Dashboard',
    right: 'payroll_view_dashboard',
    controlRight: 'payroll_control_dashboard',
  },
  {
    id: 'previous',
    label: 'Payroll Data',
    right: 'payroll_view_payrolldata',
    controlRight: 'payroll_control_payrolldata',
  },
  {
    id: 'setup',
    label: 'Salary Setup',
    right: 'payroll_view_salarysetup',
    controlRight: 'payroll_control_salarysetup',
  },
];

function PayrollContent() {
  const authUser = useSelector((state) => state.auth.user);

  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);
  const searchParams = useSearchParams();
  const [alertConfig, setAlertConfig] = useState({
    type: 'info',
  });

  // ... (rest of the logic remains the same)

  // ── Rights computation ──────────────────────────────────────────────────────
  const { visibleTabs, isViewOnly, isAdmin } = useMemo(() => {
    if (!authUser) return { visibleTabs: [], isViewOnly: true };

    const { role } = authUser;
    const rawRights = authUser.rights || [];
    const normalizedRights = rawRights.map((r) => String(r).toLowerCase());

    const roleName = (role?.name || role?.roleName || '').toUpperCase();
    const isSuperAdmin =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      normalizedRights.includes('all_access');

    const checkRight = (r) => normalizedRights.includes(r.toLowerCase());

    // Backward compatibility for generic payroll rights
    const hasGlobalPayrollControl =
      isSuperAdmin || checkRight('payroll_control');
    const hasGlobalPayrollView =
      hasGlobalPayrollControl || checkRight('payroll_view');

    // Filter tabs based on granular or global rights
    const tabs = TAB_CONFIG.filter((tab) => {
      if (hasGlobalPayrollControl) return true;
      if (tab.id === 'previous' && hasGlobalPayrollView) return true;
      return checkRight(tab.right) || checkRight(tab.controlRight);
    });

    // Determine if active tab is view only
    const currentTabConfig =
      TAB_CONFIG.find((t) => t.id === activeTab) || tabs[0];
    let activeIsViewOnly = true;

    if (currentTabConfig) {
      if (hasGlobalPayrollControl) {
        activeIsViewOnly = false;
      } else if (hasGlobalPayrollView && currentTabConfig.id === 'previous') {
        activeIsViewOnly = !checkRight('payroll_control_payrolldata');
      } else {
        const hasControl = checkRight(currentTabConfig.controlRight);
        const hasView = checkRight(currentTabConfig.right);
        activeIsViewOnly = hasView && !hasControl;
      }
    }

    return {
      visibleTabs: tabs,
      isViewOnly: activeIsViewOnly,
      isAdmin: isSuperAdmin,
    };
  }, [authUser, activeTab]);

  // Set initial active tab
  useEffect(() => {
    if (visibleTabs.length > 0) {
      const urlTab = searchParams.get('tab');
      if (
        urlTab &&
        visibleTabs.some((t) => t.id === urlTab) &&
        activeTab !== urlTab
      ) {
        setActiveTab(urlTab);
      } else if (!activeTab || !visibleTabs.find((t) => t.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
      }
    }
  }, [visibleTabs, activeTab, searchParams]);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 200);
  };

  // Current month label
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/payroll/salary-setup');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // ── Guard: no access ─────────────────────────────────────────────────────────
  if (!authUser) return null;

  if (visibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        You do not have access to the Payroll module.
      </div>
    );
  }

  return (
    <div className="text-left h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-3 m-0.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
              <CreditCardIcon size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage employee salaries, disbursements, and history.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 font-medium">Period:</div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                {currentMonth || '---'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 font-medium">
                Employees:
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
                {employees.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm p-2.5 m-0.5 mt-1.5 min-h-0">
        <div className="flex items-center justify-between border-b border-gray-300 mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scroll">
            {visibleTabs.map((tab) => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                disabled={isTabLoading}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isTabLoading || !activeTab ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20 h-full"
            >
              <Loader label="Loading content..." size="md" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                duration: 0.25,
                ease: 'easeInOut',
              }}
            >
              {activeTab === 'current' && (
                <Overview
                  isViewOnly={isViewOnly}
                  onNavigateToData={() => handleTabChange('previous')}
                />
              )}
              {activeTab === 'previous' && (
                <PayrollTab
                  employees={employees}
                  isViewOnly={isViewOnly}
                  isAdmin={isAdmin}
                />
              )}
              {activeTab === 'setup' && (
                <SalarySetupTab isViewOnly={isViewOnly} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CustomAlertForm
        isOpen={showProcessConfirm}
        onClose={() => setShowProcessConfirm(false)}
        onConfirm={() => setShowProcessConfirm(false)}
        title="Confirm Payroll Processing"
        message={`Process payroll for ${currentMonth} for all ${employees.length} employees?`}
        type="info"
        confirmText="Process"
        cancelText="Cancel"
        isSubmitting={processing}
      />

      <CustomAlertForm
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="OK"
        cancelText="Close"
      />
    </div>
  );
}

export default function PayrollPage() {
  return (
    <Suspense fallback={<Loader label="Loading Payroll..." size="md" />}>
      <PayrollContent />
    </Suspense>
  );
}
