// components/CustomModalForm.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleUser } from 'lucide-react';
import CloseButton from './Buttons/CloseButton';

/**
 * Generic modal wrapper.
 *
 * Props:
 * - open: boolean
 * - onCancel: fn
 * - title: string
 * - children: React nodes (modal content)
 * - footer: React nodes (optional footer actions)
 * - widthClass: tailwind width class (default max-w-3xl)
 */
export default function CustomModalForm({
  open,
  onCancel,
  onClose,
  title = 'Form',
  children,
  footer = null,
  widthClass = 'max-w-3xl',
  icon,
  headerActions = null,
  disableOutsideClick = false,
}) {
  const [mounted, setMounted] = useState(false);
  const handleClose = onCancel || onClose;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0"
        onClick={disableOutsideClick ? undefined : handleClose}
      />

      <div
        className={`relative z-10 w-full ${widthClass} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border border-gray-300 bg-white shrink-0">
          <div className="flex items-center gap-3">
            {icon && <span className="text-blue-600">{icon}</span>}
            <div className="text-lg font-bold text-black leading-tight">
              {title}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {headerActions}
            <CloseButton onClick={handleClose} className="cursor-pointer" />
          </div>
        </div>

        {/* Body (children) */}
        <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>

        {/* Footer */}
        {footer ? (
          <div className="px-4 py-3 border-t bg-white flex justify-end gap-3 border-gray-100 shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body);
}
