// components/HistoryTab.jsx
'use client';

import React, { useState, useMemo } from 'react';
import Button from '../../Buttons/Button';
import CustomTable from '../../CustomTable';
import LeaveRequestForm from '../LeaveRequestForm';
import PermissionRequestForm from '../PermissionRequestForm';
import Loader from '../../../components/Loader';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import FilterDropdown from '../../Buttons/FilterDropdown';
import PrimaryButton from '../../Buttons/PrimaryButton';
import { formatDuration } from '../../../../utils/formatters';

export default function HistoryTab({
  data = [],
  isLoading = false,
  onOpenLeaveForm,
  isViewMode = false,
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormMode, setLeaveFormMode] = useState('view');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [permissionFormMode, setPermissionFormMode] = useState('view');
  const [selectedPermission, setSelectedPermission] = useState(null);

  const filteredHistory = useMemo(() => {
    let result = [...data];

    if (filterStatus !== 'all') {
      result = result.filter((l) => l.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      result = result.filter((l) =>
        filterCategory === 'permission' ? l.isPermission : !l.isPermission
      );
    }

    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      result = result.filter((l) => {
        const start = new Date(l.date || l.startDate);
        return start >= fromDate && start <= toDate;
      });
    }

    return result.sort(
      (a, b) =>
        new Date(b.date || b.startDate) - new Date(a.date || a.startDate)
    );
  }, [data, filterStatus, filterCategory, dateRange]);

  const handleStatusFilterChange = (status) => {
    setFilterStatus(status);
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterCategory('all');
    setDateRange({ from: '', to: '' });
  };

  const handleLeaveRequest = () => {
    if (onOpenLeaveForm) {
      onOpenLeaveForm('add');
    }
  };

  const handleIdClick = (row) => {
    if (row.isPermission) {
      setPermissionFormMode('view');
      setSelectedPermission({
        id: row.id,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
        remarks: row.remarks,
        status: row.status,
        appliedDate: row.createdAt,
      });
      setShowPermissionForm(true);
    } else {
      setLeaveFormMode('view');
      setSelectedLeave({
        id: row.id,
        type: row.leaveType.toLowerCase().replace(/-lop$/, ''),
        from: row.startDate,
        to: row.endDate,
        reason: row.reason,
        document: row.attachment || null,
        status: row.status,
      });
      setShowLeaveForm(true);
    }
  };

  const handleSubmitLeave = async (leaveData) => {
    setShowLeaveForm(false);
    return true;
  };

  const stats = useMemo(() => {
    const totalLeaves = data.length;
    const approvedLeaves = data.filter((l) => l.status === 'APPROVED').length;
    const rejectedLeaves = data.filter((l) => l.status === 'REJECTED').length;
    const pendingLeaves = data.filter((l) => l.status === 'PENDING').length;
    const totalDays = data
      .filter((l) => l.status === 'APPROVED')
      .reduce((sum, leave) => sum + (leave.totalDays || 0), 0);

    return {
      totalLeaves,
      approvedLeaves,
      rejectedLeaves,
      pendingLeaves,
      totalDays,
    };
  }, [data]);

  const columns = [
    {
      key: 'leave_id',
      label: 'Leave ID',
      className: 'font-medium text-gray-900',
      render: (row) => (
        <HyperlinkButton
          onClick={() => handleIdClick(row)}
          title="Click to view leave details"
        >
          {row.id.slice(-6).toUpperCase()}
        </HyperlinkButton>
      ),
    },
    {
      key: 'from',
      label: 'From',
      render: (row) => (
        <span className="text-gray-700">
          {new Date(
            row.isPermission ? row.date : row.startDate
          ).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'to',
      label: 'To',
      render: (row) => (
        <span className="text-gray-700">
          {new Date(
            row.isPermission ? row.date : row.endDate
          ).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'totalDays',
      label: 'No. of Days',
      render: (row) =>
        row.isPermission ? (
          <span className="">
            {row.durationHours ? formatDuration(row.durationHours) : 'N/A'}
          </span>
        ) : (
          row.totalDays
        ),
    },
    {
      key: 'leaveType',
      label: 'Type',
      className: 'text-center',
      render: (row) => (
        <span className="font-semibold text-gray-700 uppercase line-clamp-1">
          {row.leaveType || '-'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      className: 'max-w-xs truncate',
      render: (row) => (
        <span className="truncate block" title={row.reason}>
          {row.reason}
        </span>
      ),
    },
    {
      key: 'applied_date',
      label: 'Applied On',
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
            row.isPermission
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {row.isPermission ? 'Permission' : 'Leave'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${
            row.status === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800'
              : row.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status.charAt(0).toUpperCase() +
            row.status.slice(1).toLowerCase()}
        </span>
      ),
    },
  ];

  return (
    <>
      <div>
        {/* Compact stats strip + Filters combined */}
        <div className="bg-white rounded-lg border border-gray-300 p-3 mb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
            {/* Inline Stats Strip */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
                Summary
              </span> */}
              <div className="h-5 w-px bg-gray-200 hidden md:block" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                <span className="text-[11px] font-semibold text-slate-700">
                  Total
                </span>
                <span className="text-xs font-black text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {stats.totalLeaves}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <span className="text-[11px] font-semibold text-slate-700">
                  Approved
                </span>
                <span className="text-xs font-black text-green-800 bg-green-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {stats.approvedLeaves}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
                <span className="text-[11px] font-semibold text-slate-700">
                  Rejected
                </span>
                <span className="text-xs font-black text-red-800 bg-red-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {stats.rejectedLeaves}
                </span>
              </div>
              {!isViewMode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Days Taken
                  </span>
                  <span className="text-xs font-black text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {stats.totalDays}
                  </span>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <FilterDropdown
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { label: 'All Categories', value: 'all' },
                  { label: 'Leaves', value: 'leave' },
                  { label: 'Permissions', value: 'permission' },
                ]}
                placeholder="Category"
                className="min-w-[150px]"
              />

              <FilterDropdown
                value={filterStatus}
                onChange={handleStatusFilterChange}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Approved', value: 'APPROVED' },
                  { label: 'Rejected', value: 'REJECTED' },
                  { label: 'Pending', value: 'PENDING' },
                ]}
                placeholder="Status"
                className="min-w-[140px]"
              />

              {/* <Button
                onClick={clearFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-4 rounded-lg transition-colors"
              >
                Clear Filters
              </Button> */}
            </div>
          </div>
        </div>

        <div className="">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <Loader label="Loading leave history..." size="md" />
            </div>
          ) : filteredHistory.length > 0 ? (
            <CustomTable
              columns={columns}
              data={filteredHistory}
              rowKey="id"
              maxHeight="50vh"
              showScrollbar={true}
              className="border border-gray-300 rounded-lg"
              theadClassName="bg-gray-50"
            />
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No Leave History Found
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus !== 'all' || dateRange.from || dateRange.to
                  ? 'No leaves match your current filters. Try adjusting your filters.'
                  : "You haven't applied for any leaves yet."}
              </p>
              {!isViewMode && (
                <PrimaryButton onClick={handleLeaveRequest}>
                  Apply for Leave
                </PrimaryButton>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800 ">
                <span className="font-semibold"> Note : </span>This table shows
                all {isViewMode ? 'the employee\'s' : 'your'} past leave applications{' '}
                <span className="font-semibold"> . </span> Click on Leave ID to
                view detailed information
                {isViewMode ? '' : <><span className="font-semibold"> . </span>Approved/Rejected leaves are read-only</>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showLeaveForm && (
        <LeaveRequestForm
          mode={leaveFormMode}
          initialData={selectedLeave}
          onClose={() => setShowLeaveForm(false)}
          onSubmit={handleSubmitLeave}
        />
      )}

      {showPermissionForm && (
        <PermissionRequestForm
          mode={permissionFormMode}
          initialData={selectedPermission}
          onClose={() => setShowPermissionForm(false)}
        />
      )}
    </>
  );
}
