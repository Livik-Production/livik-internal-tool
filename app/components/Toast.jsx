'use client';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ─── Default config for all toasts ───────────────────────────────────
const DEFAULT_OPTIONS = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// ─── Helper functions (import these wherever you need a toast) ───────
export const showSuccessToast = (message, options = {}) =>
  toast.success(message, { ...DEFAULT_OPTIONS, ...options });

export const showErrorToast = (message, options = {}) =>
  toast.error(message, { ...DEFAULT_OPTIONS, ...options });

export const showInfoToast = (message, options = {}) =>
  toast.info(message, { ...DEFAULT_OPTIONS, ...options });

export const showWarningToast = (message, options = {}) =>
  toast.warn(message, { ...DEFAULT_OPTIONS, ...options });

// ─── Container component (render once in layout) ─────────────────────
export default function ToastProvider() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />
      <style jsx global>{`
        /* ─── Professional Toast Styling ─── */
        .Toastify__toast {
          background: #ffffff !important;
          border-radius: 6px !important;
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.08),
            0 1px 4px rgba(0, 0, 0, 0.06) !important;
          padding: 14px 16px !important;
          min-height: 56px !important;
          border: 1px solid #e5e7eb !important;
          border-top: 3px solid transparent !important;
          font-family:
            'Inter',
            system-ui,
            -apple-system,
            sans-serif !important;
        }

        .Toastify__toast-body {
          color: #1f2937 !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          padding: 0 !important;
          margin: 0 !important;
          align-items: center !important;
        }

        .Toastify__toast-body > div:last-child {
          color: #374151 !important;
          font-weight: 500 !important;
        }

        /* Close button */
        .Toastify__close-button {
          color: #9ca3af !important;
          opacity: 0.7 !important;
          align-self: center !important;
        }
        .Toastify__close-button:hover {
          opacity: 1 !important;
          color: #6b7280 !important;
        }

        /* ─── Success ─── */
        .Toastify__toast--success {
          border-top-color: #22c55e !important;
        }
        .Toastify__toast--success .Toastify__progress-bar {
          background: #22c55e !important;
        }
        .Toastify__toast--success .Toastify__toast-icon svg {
          fill: #22c55e !important;
        }

        /* ─── Error ─── */
        .Toastify__toast--error {
          border-top-color: #ef4444 !important;
        }
        .Toastify__toast--error .Toastify__progress-bar {
          background: #ef4444 !important;
        }
        .Toastify__toast--error .Toastify__toast-icon svg {
          fill: #ef4444 !important;
        }

        /* ─── Warning ─── */
        .Toastify__toast--warning {
          border-top-color: #f59e0b !important;
        }
        .Toastify__toast--warning .Toastify__progress-bar {
          background: #f59e0b !important;
        }
        .Toastify__toast--warning .Toastify__toast-icon svg {
          fill: #f59e0b !important;
        }

        /* ─── Info ─── */
        .Toastify__toast--info {
          border-top-color: #3b82f6 !important;
        }
        .Toastify__toast--info .Toastify__progress-bar {
          background: #3b82f6 !important;
        }
        .Toastify__toast--info .Toastify__toast-icon svg {
          fill: #3b82f6 !important;
        }

        /* Progress bar styling */
        .Toastify__progress-bar {
          height: 3px !important;
          opacity: 0.8 !important;
        }

        /* Smooth entrance */
        .Toastify__toast-container {
          z-index: 99999 !important;
        }
      `}</style>
    </>
  );
}
