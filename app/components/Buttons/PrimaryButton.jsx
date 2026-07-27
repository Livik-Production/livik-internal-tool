'use client';

import React from 'react';
import Button from './Button';

/**
 * Primary action button used across the application.
 * Retains standard style across entire module (e.g. Add Employee, Approve All)
 */
export default function PrimaryButton({ children, className = '', ...rest }) {
  // We use standard blue theme for primary actions, but allow overrides.
  // The default styles are derived from the "Add Employee" button snapshot.
  const defaultStyles =
    'inline-flex items-center justify-center gap-2 cursor-pointer bg-[#004475] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl transition-all active:scale-95';

  return (
    <Button className={`${defaultStyles} ${className}`} {...rest}>
      {children}
    </Button>
  );
}
