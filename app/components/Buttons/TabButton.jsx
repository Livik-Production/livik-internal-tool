'use client';

import React from 'react';
import Button from './Button';

/**
 * Tab changing button, specifically used in top-level navigational areas.
 * Highlights the active state clearly.
 */
export default function TabButton({
  children,
  isActive,
  className = '',
  ...rest
}) {
  const baseStyles =
    'relative flex items-center gap-0.5 px-3 py-2 font-semibold text-base transition rounded-t-xl whitespace-nowrap outline-none shadow-none';
  const activeStyles = isActive
    ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
    : 'bg-transparent text-gray-900 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]';

  return (
    <Button
      className={`${baseStyles} ${activeStyles} ${className}`}
      aria-selected={isActive}
      role="tab"
      style={{ outline: 'none', ...rest.style }}
      {...rest}
    >
      {children}
    </Button>
  );
}
