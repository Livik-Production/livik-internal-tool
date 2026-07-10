'use client';

import { useState, useEffect, Suspense } from 'react';
import Sidebar from './Sidebar';
import { MenuIcon, XIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../store/slices/authSlice';
import ProfileSetupWizard from '../components/EmployeePortal/ProfileSetupWizard';
import ProfileSetupWizardContract from '../components/EmployeePortal/ProfileSetupWizardContract';

export default function DashboardLayoutContent({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleBellChange = (e) => {
      setIsBellOpen(e.detail.open);
    };
    window.addEventListener('bell-state-change', handleBellChange);
    return () => window.removeEventListener('bell-state-change', handleBellChange);
  }, []);

  const authUser = useSelector(selectAuthUser);
  
  // Check if this is a new employee who needs to complete their profile.
  // Only show wizard for PENDING employees who haven't filled their details.
  // Active / PENDING_ADMIN employees must never be redirected to the wizard.
  const statusUpper = authUser?.status?.toUpperCase();
  const isPending = statusUpper === 'PENDING';
  const isActive = statusUpper === 'ACTIVE' || statusUpper === 'PENDING_ADMIN';
  const isContract = (authUser?.workType || '').toString().toUpperCase() === 'CONTRACT';
  const hasCompletedSetup = isContract
    ? !!(authUser?.name && authUser?.mobile && authUser?.bondRemarks)
    : !!(authUser?.aadhaarNumber && authUser?.panNumber && authUser?.dateOfBirth && authUser?.presentAddress);

  // Show setup wizard only for truly pending+incomplete employees
  // Active / PENDING_ADMIN employees must never be redirected to the wizard.
  if (authUser && isPending && !isActive) {
    const wt = (authUser.workType || '').toString().toUpperCase();
    if (wt === 'CONTRACT') return <ProfileSetupWizardContract rawEmployeeData={authUser} />;
    return <ProfileSetupWizard rawEmployeeData={authUser} />;
  }

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
        <div className="font-semibold text-lg text-gray-800">Dashboard</div>
        <div className="w-10" />{' '}
        {/* Spacer for centering if needed, matches button width */}
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out md:translate-x-0 md:bg-white md:static md:h-screen md:sticky md:top-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isBellOpen ? 'blur-[6px] pointer-events-none' : ''}`}
      >
        <div className="h-full overflow-y-auto relative">
          <Suspense fallback={null}>
            <Sidebar onLinkClick={closeSidebar} />
          </Suspense>
          {isBellOpen && (
            <div className="absolute inset-0 bg-black/20 z-50 pointer-events-none" />
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto p-1.5 relative bg-linear-to-br from-[#1a3a4a] to-[#2d5266] ">
        <div className="max-w-full mx-auto h-full flex flex-col min-h-0">
          <div className="bg-transparent h-full flex flex-col min-h-0">
            <div
              key={pathname}
              className="bg-white rounded-2xl shadow-md p-1 h-full flex flex-col min-h-0 animate-dashboard-reveal overflow-y-auto"
            >
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
