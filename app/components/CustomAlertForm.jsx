'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

const CustomAlertForm = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  type = 'warning', // warning, danger, success, info
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  details = null, // Optional component or JSX for extra info
  isSubmitting = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          iconBg: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
          iconBg: 'bg-green-100',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          iconBg: 'bg-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
      default: // warning
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        };
    }
  };

  const styles = getTypeStyles();

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4 uppercase`}
          >
            {styles.icon}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

          <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">
            {message}
          </p>

          {details && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left border border-gray-100">
              {details}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center ${styles.button}`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CustomAlertForm;
