'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * HeaderUser
 * - Displays avatar, name, role
 * - Accessible dropdown with Profile / Settings / Logout
 * - Usage: place in top-right header area
 *
 * IMPORTANT: update `getUser()` to read your real user store / API.
 */

const AVATAR_SRC = '/asset/avatar.png'; // change if needed

// Mock getUser (replace with your auth store / API call)
function getUser() {
  // Example shape — adapt to your app's user object
  return {
    name: localStorage.getItem('user_name') || 'Kiran Das',
    role: localStorage.getItem('user_role') || 'Admin',
    empId: localStorage.getItem('user_empId') || 'E010',
    avatar: AVATAR_SRC,
  };
}

export default function HeaderUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [user, setUser] = useState(getUser());
  const ref = useRef(null);

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
        <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
          {!avatarError ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={36}
              height={36}
              className="object-cover"
              onError={() => setAvatarError(true)}
              priority
            />
          ) : (
            <div className="w-9 h-9 flex items-center justify-center bg-gray-200 text-gray-700 font-semibold">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
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
