'use client';

import React from 'react';

/**
 * Standard IconButton for actions like Print, Download, Mail, etc.
 * Uses text-[#004475] by default but preserves parent-provided background colors.
 */
export default function IconButton({
  children,
  onClick,
  title,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type={type}
      className={`w-8 h-8 p-0 text-[#004475] rounded-full hover:bg-blue-100 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
