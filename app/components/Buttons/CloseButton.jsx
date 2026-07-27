'use client';

import React from 'react';
import { X } from 'lucide-react';

/**
 * Dedicated CloseButton (X icon) with specific red styling.
 */
export default function CloseButton({
  onClick,
  title = 'Close',
  size = 17,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type={type}
      className={`p-1 bg-red-600 text-white border border-red-500 hover:bg-red-600 rounded-md transition flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 ${className}`}
      aria-label={title}
      {...rest}
    >
      <X size={size} />
    </button>
  );
}
