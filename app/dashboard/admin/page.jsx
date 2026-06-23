'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { selectAuthUser } from '../../../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../../components/Loader'; // Adjust the path as needed
import Dashboard from './tabs/Dashboard';
import Customers from './tabs/Customers';
import Roles from './tabs/Roles';
import { Shield, Bell, UserPlus } from 'lucide-react';
import TabButton from '../../components/Buttons/TabButton';
import NotificationBell from '../../components/NotificationBell';


/* ================= TABS CONFIG ================= */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', component: Dashboard },
  { id: 'customers', label: 'Customers', component: Customers },
  { id: 'roles', label: 'Roles', component: Roles },
];

/* ================= TAB CONTENT WRAPPER ================= */
function TabContent({ activeTab, canControlCustomers, canControlRoles }) {
  const tab = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = tab?.component || Dashboard;

  return (
    <Suspense fallback={<Loader label="Loading module..." size="md" />}>
      <ActiveComponent
        canControlCustomers={canControlCustomers}
        canControlRoles={canControlRoles}
      />
    </Suspense>
  );
}

/* ================= PAGE ================= */
function AdminContent() {
  const user = useSelector(selectAuthUser);
  const searchParams = useSearchParams();
  const rights = user?.rights || [];

  // Resilient role check
  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.roleName || user?.role?.name || '';

  const roleUpper = roleName.toUpperCase();
  const isSuperAdmin =
    roleUpper === 'SUPER_ADMIN' ||
    roleUpper === 'SUPER ADMIN' ||
    roleUpper === 'SUPERADMIN' ||
    roleUpper === 'ADMIN' ||
    rights.some((r) => r.toUpperCase() === 'ALL_ACCESS');

  // RBAC helpers
  const hasRight = (right) => {
    if (isSuperAdmin) return true;
    const lowerRights = rights.map((r) => r.toLowerCase());
    return lowerRights.includes(right.toLowerCase());
  };

  const canViewModule = hasRight('admin_module');

  // Determine visible tabs based on rights
  const visibleTabs = TABS.filter((tab) => {
    if (canViewModule) return true;

    // Specific rights for each tab
    const tabRightsMap = {
      dashboard: ['admin_view_dashboard', 'admin_control_dashboard'],
      customers: ['admin_view_customers', 'admin_control_customers'],
      roles: ['admin_view_roles', 'admin_control_roles'],
    };

    const requiredRights = tabRightsMap[tab.id] || [];
    return requiredRights.some((r) => hasRight(r));
  });

  // Control flags to pass to tabs
  const canControlCustomers = hasRight('admin_control_customers');
  const canControlRoles = hasRight('admin_control_roles');

  const [activeTab, setActiveTab] = useState('');
  const [isTabLoading, setIsTabLoading] = useState(false);

  // set initial active tab based on visible tabs
  useEffect(() => {
    if (visibleTabs.length > 0 && !activeTab) {
      const urlTab = searchParams.get('tab');
      if (
        urlTab &&
        visibleTabs.some((t) => t.id === urlTab)
      ) {
        setActiveTab(urlTab);
      } else {
        const preferred =
          visibleTabs.find((t) => t.id === 'dashboard') || visibleTabs[0];
        setActiveTab(preferred.id);
      }
    }
  }, [visibleTabs, activeTab, searchParams]);

  // Handle tab change with loading state
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    setIsTabLoading(true);
    setActiveTab(tabId);

    // Simulate a small delay for tab switching
    setTimeout(() => {
      setIsTabLoading(false);
    }, 200);
  };



  if (!canViewModule && visibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 font-medium">Loading Admin Panel.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-1.5 min-h-0">
      {/* ===== HEADER CARD ===== */}
      <div className="bg-white shadow-sm rounded-2xl px-4 py-3 m-0.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
            <Shield size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage system roles, permissions, customers and general
              administrative settings.
            </p>
          </div>
        </div>

        {/* ===== NOTIFICATIONS ===== */}
        <NotificationBell />
      </div>

      {/* ===== CONTENT CARD (TABS + CONTENT) ===== */}
      <div className="flex-1 flex flex-col bg-white shadow-sm rounded-2xl mt-1.5 m-0.5 min-h-0">
        {/* ===== TABS NAVIGATION ===== */}
        <div className="flex shrink-0 items-end border-b border-gray-200 gap-1 overflow-x-auto no-scroll m-2">
          {visibleTabs.map((tab) => (
            <TabButton
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={isTabLoading}
              className="whitespace-nowrap"
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="flex-1 overflow-y-auto no-scrollbar pt-0 min-h-0">
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
                className="h-full"
              >
                <TabContent
                  activeTab={activeTab}
                  canControlCustomers={canControlCustomers}
                  canControlRoles={canControlRoles}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loader label="Loading Admin Panel..." size="md" />}>
      <AdminContent />
    </Suspense>
  );
}
