'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';

/**
 * Standard IconButton for actions like Print, Download, Mail, etc.
 * Uses text-[#004475] by default but preserves parent-provided background colors.
 * Automatically disables delete buttons for non-SUPER_ADMIN users.
 */
export default function IconButton({
  children,
  onClick,
  title,
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}) {
  const user = useSelector(selectAuthUser);
  const userRole = (
    user?.role?.roleName ||
    user?.role?.name ||
    ''
  ).toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const isDeleteButton = typeof title === 'string' && /delete/i.test(title);
  const isDisabled = disabled || (isDeleteButton && !isSuperAdmin);

  const displayTitle =
    isDeleteButton && !isSuperAdmin
      ? 'Delete access restricted (Super Admin only)'
      : title;

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      title={displayTitle}
      type={type}
      disabled={isDisabled}
      className={`w-8.5 h-8.5 p-0 transition-all duration-200 flex items-center justify-center focus:outline-none 
        ${
          isDisabled
            ? 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed shadow-none'
            : 'text-[#004475] hover:scale-110 hover:text-red-500 cursor-pointer'
        } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
