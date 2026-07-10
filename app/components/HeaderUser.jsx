'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

/**
 * HeaderUser
 * - Displays avatar, name, role
 * - Accessible dropdown with Profile / Settings / Logout
 * - Usage: place in top-right header area
 */

// Removed AVATAR_SRC constant

export default function HeaderUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const ref = useRef(null);
  
  const authUser = useSelector((state) => state.auth?.user);

  // Derive user info from Redux or localStorage fallback
  const avatarSrc = authUser?.photo || AVATAR_SRC;

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

  // Derive user info from Redux or localStorage fallback
  const user = {
    name: authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}`.trim() : (typeof window !== 'undefined' ? localStorage.getItem('user_name') : null) || 'Kiran Das',
    role: authUser?.role?.name || authUser?.role?.roleName || (typeof window !== 'undefined' ? localStorage.getItem('user_role') : null) || 'Admin',
    empId: authUser?.empId || (typeof window !== 'undefined' ? localStorage.getItem('user_empId') : null) || 'E010',
    avatar: authUser?.photo || AVATAR_SRC,
  };

  // click outside to close dropdown
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  // keyboard support: Esc closes menu
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    // optionally clear other user info
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_empId');
    router.push('/login');
  }, [router]);

  const handleProfile = useCallback(() => {
    // change to actual profile route if available
    router.push('/dashboard/employee_portal');
  }, [router]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-3 px-3 py-1 rounded-md hover:bg-gray-100 transition"
      >
        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden relative cursor-pointer group flex items-center justify-center bg-[#004475] text-white">
          {user?.photo && !avatarError ? (
            <Image
              src={user.photo}
              alt="User"
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              onError={() => setAvatarError(true)}
              unoptimized
            />
          ) : (
            <span className="text-sm font-bold uppercase">
              {user?.name ? user.name.charAt(0) : '?'}
            </span>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-gray-800">{user.name}</span>
          <span className="text-xs text-gray-500">{user.role}</span>
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="p-3 border-b">
            <div className="text-sm font-medium text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-500">
              {user.empId ?? user.role}
            </div>
          </div>

          <div className="flex flex-col py-1">
            <button
              onClick={handleProfile}
              className="text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              Profile
            </button>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              Settings
            </button>
            <div className="border-t" />
            <button
              onClick={handleLogout}
              className="text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
