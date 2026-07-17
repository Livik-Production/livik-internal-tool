'use client';

import React, { useState, useEffect, useRef } from 'react';
import CustomTable from '../../../components/CustomTable';
import { HOLIDAYS } from '../../HrModule/LeaveTab/HolidayListTab';
import { SquarePen, Trash, ChevronDown } from 'lucide-react';
import CustomAlertForm from '../../../components/CustomAlertForm';
import Button from '../../Buttons/Button';
import Loader from '../../../components/Loader';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import IconButton from '../../Buttons/IconButton';
import { formatDuration } from '../../../../utils/formatters';

export default function PendingTab({
  data = [],
  isLoading,
  onView,
  onEdit,
  onDeleteSuccess,
  onApplyLeave,
  onApplyPermission,
}) {
  const [alertConfig, setAlertConfig] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => { },
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const event = new CustomEvent('dropdown-state-change', { detail: { open: isDropdownOpen } });
    window.dispatchEvent(event);
  }, [isDropdownOpen]);

  const handleDeleteLeave = async (row) => {
    const isPermission = row.isPermission;
    const typeLabel = isPermission ? 'permission' : 'leave';
    const apiEndpoint = isPermission
      ? `/api/permission/${row.id}`
      : `/api/leave/${row.id}`;

    setAlertConfig({
      isOpen: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete this ${typeLabel} request?`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, isSubmitting: true }));
        try {
          const res = await fetch(apiEndpoint, {
            method: 'DELETE',
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(
              err.error || `Failed to delete ${typeLabel} request`
            );
          }

          onDeleteSuccess?.();
          setAlertConfig({ isOpen: false });
        } catch (error) {
          console.error(`Delete ${typeLabel} failed:`, error);
          setAlertConfig({
            isOpen: true,
            title: 'Error',
            message: error.message || `Unable to delete ${typeLabel} request`,
            type: 'danger',
            confirmText: 'OK',
            onConfirm: () => setAlertConfig({ isOpen: false }),
          });
        }
      },
    });
  };

  const columns = [
    {
      key: 'leave_id',
      label: 'Leave ID',
      render: (row) => (
        <HyperlinkButton
          onClick={() => onView(row)}
          title="click to view pending leaves"
        >
          {row.id.slice(-6).toUpperCase()}
        </HyperlinkButton>
      ),
    },

    {
      key: 'from',
      label: 'From Date',
      render: (row) =>
        new Date(
          row.isPermission ? row.date : row.startDate
        ).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'to',
      label: 'To Date / Time',
      render: (row) =>
        new Date(row.isPermission ? row.date : row.endDate).toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
        ),
    },
    {
      key: 'totalDays',
      label: 'No. of Days / Hrs',
      className: 'text-center',
      render: (row) => {
        if (row.isPermission) {
          return <span className="">{formatDuration(row.durationHours)}</span>;
        }
        // For half-day leaves, use the database value directly (0.5)
        if (row.isHalfDay) {
          return <span className="block">{row.totalDays}</span>;
        }

        const parseToDate = (v) => {
          if (!v) return null;
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            const [y, m, d] = v.split('-').map(Number);
            return new Date(y, m - 1, d);
          }
          const d = new Date(v);
          if (isNaN(d)) return null;
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        };

        const start = parseToDate(row.startDate);
        const end = parseToDate(row.endDate);
        if (!start || !end) return row.totalDays ?? '-';

        const holidaySet = new Set(HOLIDAYS.map((h) => h.date));
        let count = 0;
        for (
          let dt = new Date(start);
          dt <= end;
          dt.setDate(dt.getDate() + 1)
        ) {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const d = String(dt.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${d}`;
          if (!holidaySet.has(key) && dt.getDay() !== 0) count++;
        }

        return <span className="block">{count} Days</span>;
      },
    },
    {
      key: 'leaveType',
      label: 'Type',
      className: 'text-center',
      render: (row) => (
        <span className="font-semibold text-gray-700 uppercase">
          {row.leaveType || '-'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      className: 'max-w-xs truncate',
      render: (row) => (
        <span title={row.reason} className="truncate block">
          {row.reason}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Applied On',
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200`}
        >
          {row.isPermission ? 'Permission' : 'Leave'}
        </span>
      ),
    },

    {
      key: 'status',
      label: 'Status',
      render: () => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <IconButton
            onClick={() => onEdit(row)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50
            rounded-full transition-colors"
            title="Edit"
          >
            <SquarePen size={16} />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteLeave(row)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete"
          >
            <Trash size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <Loader label="Fetching pending leaves…" size="md" />
      </div>
    );
  }

  return (
    <div className="p-0.5">
      <div className="flex items-center justify-end mb-3">
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/20 transition-all duration-300"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
        <div className={`relative ${isDropdownOpen ? 'z-50' : 'z-30'}`} ref={dropdownRef}>
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-[#004475] text-white font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            Create Request <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-90' : ''}`} />
          </Button>

          {isDropdownOpen && (
            <div className="absolute right-full top-0 mr-1 w-48 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-gray-400 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onApplyLeave?.();
                }}
                className="block w-full text-left px-4 py-2.5 border-b border-gray-300 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Leave Request
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onApplyPermission?.();
                }}
                className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Permission Request
              </button>
            </div>
          )}
        </div>
      </div>

      {!data.length ? (
        <div className="text-center py-12 text-gray-600 border-t border-gray-100">
          You don’t have any pending requests.
        </div>
      ) : (
        <CustomTable
          columns={columns}
          data={data}
          rowKey="id"
          maxHeight="50vh"
          showScrollbar={true}
        />
      )}

      <CustomAlertForm
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false })}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        isSubmitting={alertConfig.isSubmitting}
      />
    </div>
  );
}
