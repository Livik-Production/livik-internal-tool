'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutSuccess } from '../../store/slices/authSlice';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import Loader from './Loader';
import NotificationDropdown from './NotificationDropdown';
import ConfirmDialog from './ConfirmDialog';
import { createPortal } from 'react-dom';

export default function DashboardModuleHeader({ quickActions }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const [dateTime, setDateTime] = useState({ date: '', day: '' });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedDay = now.toLocaleDateString('en-GB', { weekday: 'long' });
    setDateTime({ date: formattedDate, day: formattedDay });
  }, []);

  useEffect(() => {
    if (showNotifications && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
        btnTop: rect.top,
        btnLeft: rect.left,
        btnWidth: rect.width,
        btnHeight: rect.height,
      });
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleResize = () => setShowNotifications(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      dispatch(logoutSuccess());

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch { }

      router.replace('/login');
    } catch (error) {
      setIsLoggingOut(false);
      console.error('Logout failed:', error);
      router.replace('/login');
    }
  }, [router, dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour <= 16) return 'Good Afternoon';
    if (hour >= 17 && hour <= 20) return 'Good Evening';
    if (hour >= 21 || hour === 0) return 'Good Night';
    return 'Good Midnight';
  };

  const name =
    authUser?.name ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('user_name')
      : null) ||
    'User';

  const getDesignation = () => {
    if (authUser) {
      return (
        authUser.designation ||
        (authUser.role && (authUser.role.name || authUser.role.roleName)) ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('user_role')
          : null) ||
        'Employee'
      );
    }
    return typeof window !== 'undefined'
      ? localStorage.getItem('user_role') || 'Employee'
      : 'Employee';
  };
  const designation = getDesignation();

  return (
    <div className="text-gray-600 animate-dashboard-reveal relative z-[48]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pl-4 bg-[#f8fafc]">
        <div className="flex flex-col [animation-delay:100ms] animate-dashboard-reveal fill-mode-forwards opacity-0">
          <div className="text-xl md:text-3xl font-semibold mt-2 text-black">
            <span>Welcome</span>{' '}
            <span className="text-[#29a2d6]">{name}, </span>
            {getGreeting()}
          </div>
          <div className="text-[10px] font-bold text-gray-400 mt-1 mb-3 uppercase tracking-widest">
            {designation}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center relative hover:scale-110 active:scale-95 ${showNotifications
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
                : 'hover:bg-gray-100 text-gray-500'
                }`}
              title="Notifications & Settings"
            >
              <Bell
                size={20}
                className={`transition-all duration-300 ${showNotifications ? 'fill-blue-600 scale-110' : ''}`}
              />
              {/* Notification Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
            </button>

            {showNotifications && typeof document !== 'undefined' && dropdownPos && createPortal(
              <div className="fixed inset-0 z-[9999]">
                {/* Backdrop with Blur */}
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Cloned Button to appear above backdrop */}
                <div 
                  className="fixed z-[10000]"
                  style={{
                    top: dropdownPos.btnTop,
                    left: dropdownPos.btnLeft,
                    width: dropdownPos.btnWidth,
                    height: dropdownPos.btnHeight,
                  }}
                >
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 rounded-full transition-all duration-300 flex items-center justify-center relative bg-blue-50 text-blue-600 ring-2 ring-blue-100 w-full h-full"
                  >
                    <Bell size={20} className="fill-blue-600 scale-110" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  </button>
                </div>

                {/* Dropdown Container */}
                <div 
                  className="fixed z-[10000]"
                  style={{
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                  }}
                >
                  <NotificationDropdown
                    user={authUser}
                    onLogout={() => {
                      setShowNotifications(false);
                      setLogoutConfirmOpen(true);
                    }}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              </div>,
              document.body
            )}
          </div>

          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 hover:text-red-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center gap-2 text-xs text-black font-medium whitespace-nowrap"
          >
            <LogOut size={17} className="transition-transform group-hover:rotate-12" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Confirm Logout"
        description="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
