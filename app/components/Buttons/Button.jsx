// components/Button.jsx
'use client';

import React from 'react';

/**
 * Minimal reusable Button component.
 * - Accepts native button props and forwards them.
 * - Use className to pass Tailwind classes from parent.
 *
 * Props:
 * - type (button|submit|reset) - default "button"
 * - name
 * - onClick
 * - className - tailwind classes from parent
 * - disabled
 * - children
 * - ...rest (aria, data-*, events etc.)
 */
export default function Button({
  type = 'button',
  name,
  onClick,
  className = '',
  children,
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      name={name}
      onClick={onClick}
      className={className}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
