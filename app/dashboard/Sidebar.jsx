'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccess } from '../../store/slices/authSlice';
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  SettingsIcon,
  UserCircle2Icon,
  LogOutIcon,
  Shield,
  ChartNoAxesCombined,
  Package,
  ChevronDown,
  Layers,
  UserCheck,
  Globe,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

/* ===== SIDEBAR LOADER ===== */
function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full p-3 bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
      <div className="mb-8 flex justify-center">
        <div className="w-[220px] h-[80px] bg-gray-200 rounded-md" />
      </div>
      <div className="flex-1 flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-3xl" />
        ))}
      </div>
      <div className="mt-8 h-12 bg-gray-200 rounded-3xl" />
    </div>
  );
}

/* ===== ALL NAV ITEMS ===== */
const navItems = [
  {
    id: 'index',
    title: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon size={20} />,
  },
  {
    id: 'hr',
    title: 'HR Operations',
    href: '/dashboard/hr',
    icon: <UsersIcon size={20} />,
    dropdown: [
      {
        id: 'hr-module',
        title: 'HR Module',
        href: '/dashboard/hr',
        icon: <UserCheck size={16} />,
      },
      {
        id: 'staffing',
        title: 'Staffing & Resourcing',
        href: '/dashboard/staffing',
        icon: <Layers size={16} />,
      },
    ],
  },
  {
    id: 'payroll',
    title: 'Payroll',
    href: '/dashboard/payroll',
    icon: <CreditCardIcon size={20} />,
  },
  {
    id: 'Finance',
    title: 'Finance',
    href: '/dashboard/finance',
    icon: <ChartNoAxesCombined size={20} />,
  },
  {
    id: 'asset',
    title: 'Asset Tracking',
    href: '/dashboard/asset',
    icon: <Package size={20} />,
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    href: '/dashboard/admin',
    icon: <Shield size={20} />,
    dropdown: [
      {
        id: 'admin-panel',
        title: 'Admin Panel',
        href: '/dashboard/admin',
        icon: <Shield size={16} />,
      },
      {
        id: 'livik site operations',
        title: 'Website Operations',
        href: '/dashboard/admin/livik-site-operations',
        icon: <Globe size={16} />,
      },
    ],
  },
  {
    id: 'employee-portal',
    title: 'Employee Portal',
    href: '/dashboard/employee_portal',
    icon: <UserCircle2Icon size={20} />,
  },
];

/* ===== SETTINGS TAB ===== */
const settingsTab = {
  id: 'settings',
  title: 'Settings',
  href: '/dashboard/settings',
  icon: <SettingsIcon size={20} />,
};

export default function Sidebar({ onLinkClick }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const dispatch = useDispatch();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const dropdownRef = useRef(null);

  const authUser = useSelector((state) => state.auth.user);
  const authStatus = useSelector((state) => state.auth.status);

  const roleName = authUser?.role?.name?.toUpperCase() ?? null;
  const isAdminUser = roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';

  const visibleNavItems = useMemo(() => {
    if (isAdminUser) return navItems;
    if (!authUser) return [];

    const rights = authUser.rights || [];
    if (rights.includes('ALL_ACCESS')) return navItems;

    return navItems.filter((item) => {
      if (item.id === 'index' || item.id === 'employee-portal') return true;
      return rights.some((r) =>
        r.toLowerCase().includes(item.id.toLowerCase())
      );
    });
  }, [authUser, isAdminUser]);

  // Auto-open dropdowns when current path matches a sub-item
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.dropdown) {
        const isUnderDropdown = item.dropdown.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
        );
        if (isUnderDropdown) {
          setOpenDropdown(item.id);
        }
      }
    });
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      dispatch(logoutSuccess());
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.replace('/login');
    }
  }, [router, dispatch]);

  if (authStatus === 'loading') return <SidebarSkeleton />;
  if (!authUser) return null;

  /* ===== NAV ITEM RENDER ===== */
  const renderNavItem = (item) => {
    const isActive =
      item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname === item.href || pathname.startsWith(item.href + '/');

    // Item WITH dropdown
    if (item.dropdown) {
      const isDropdownActive = item.dropdown.some(
        (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
      );
      const isOpen = openDropdown === item.id;

      const matchingSubs = item.dropdown.filter(
        (s) => pathname === s.href || pathname.startsWith(s.href + '/')
      );
      const activeSubHref =
        matchingSubs.length > 0
          ? matchingSubs.reduce((prev, curr) =>
              prev.href.length > curr.href.length ? prev : curr
            ).href
          : null;

      return (
        <div key={item.id}>
          {/* Trigger button */}
          <button
            onClick={() => setOpenDropdown(isOpen ? null : item.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-base transition-colors duration-200 text-gray-700 hover:text-[#004475] hover:bg-blue-50"
          >
            <span className="flex items-center justify-center">
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>

          {/* Dropdown sub-items */}
          {isOpen && (
            <div className="ml-3 mt-1 flex flex-col gap-1 border-l-2 border-blue-100 pl-3">
              {item.dropdown.map((sub) => {
                const isSubActive = sub.href === activeSubHref;
                return (
                  <Link
                    key={sub.id}
                    href={sub.href}
                    onClick={() => {
                      onLinkClick?.();
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                      isSubActive
                        ? 'bg-[#004475] text-white shadow-sm'
                        : 'text-gray-600 hover:text-[#004475] hover:bg-blue-50'
                    }`}
                  >
                    <span className="flex items-center justify-center">
                      {sub.icon}
                    </span>
                    <span>{sub.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular nav item
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onLinkClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl font-semibold text-base transition-colors duration-200 ${
          isActive
            ? 'bg-[#004475] text-white shadow-md shadow-blue-400/40'
            : 'text-gray-700 hover:text-[#004475] hover:bg-blue-50'
        }`}
      >
        <span className="flex items-center justify-center">{item.icon}</span>
        <span>{item.title}</span>
      </Link>
    );
  };

  const isSettingsActive =
    pathname === '/dashboard/settings' ||
    pathname.startsWith('/dashboard/settings/');

  return (
    <div
      className="flex flex-col h-full p-1 bg-white rounded-lg shadow-md border border-gray-200"
      ref={dropdownRef}
    >
      <div className="flex justify-center py-4">
        <Link
          href="/dashboard"
          className="flex items-center"
          onClick={onLinkClick}
        >
          <div className="flex gap-x-2  items-center transition-all">
            <div className="flex items-center">
              <div className="w-12 sm:w-12 md:w-13 lg:w-15">
                <Image
                  src="/asset/logo.png"
                  alt="Livik"
                  width={76}
                  height={76}
                  priority
                  className="w-full h-auto object-contain"
                  sizes="(max-width: 768px) 48px, 56px"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <Image
                src="/asset/Livik_Text.png"
                alt="Livik"
                width={150}
                height={50}
                className="h-8 sm:h-9 md:h-9 lg:h-9 w-auto object-contain"
                priority
              />
              <div className="text-[8px] md:text-[10px] pl-0.5 font-extrabold text-[#003366]/80 uppercase whitespace-nowrap">
                Software Solutions
              </div>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-auto">
        <ul className="flex flex-col gap-2">
          {visibleNavItems.map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* Settings Tab - Only for Admin Users */}
      {isAdminUser && (
        <div className="mt-6 ml-1">
          <Link
            href={settingsTab.href}
            onClick={onLinkClick}
            className={`flex items-center justify-between gap-3 px-3 py-3 rounded-xl font-semibold text-base transition-colors duration-200 ${
              isSettingsActive
                ? 'bg-[#004475] text-white shadow-md shadow-blue-400/40'
                : 'text-gray-700 hover:text-[#004475] hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center">
                {settingsTab.icon}
              </span>
              <span>{settingsTab.title}</span>
            </div>
          </Link>
        </div>
      )}

      {/* User Info and Logout */}
      <div className="mt-auto pt-2">
        <div className="flex items-center gap-3 bg-blue-100 p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-sky-950 truncate leading-tight">
                {authUser?.name || 'User'}
              </span>
              <span className="text-xs font-semibold text-gray-500 tracking-wider leading-tight mt-0.5">
                {authUser?.role?.displayName || 'Employee'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 hover:text-red-700 transition-all duration-200 border border-red-200 group"
            title="Logout"
            aria-label="Logout"
          >
            <LogOutIcon
              size={16}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
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
