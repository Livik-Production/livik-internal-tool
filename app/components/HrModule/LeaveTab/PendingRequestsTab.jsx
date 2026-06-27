'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import { useState, useEffect, useMemo } from 'react';
import ApprovalCard from '../../ApprovalCard';
import PermissionCard from '../../PermissionCard';
import PermissionConfirmModal from '../../PermissionConfirmModal';
import Loader from '../../Loader';
import { showSuccessToast, showErrorToast } from '../../Toast';
import Pagination from '../../Pagination';
import {
  Search,
  Calendar,
  Clock,
  ChevronRight,
  X,
  ArrowUpDown,
} from 'lucide-react';

const LeaveRequestsTab = ({
  approvals = [],
  onApprove,
  onReject,
  isLoading = false,
  canApprove = false,
  onViewLeaveDetails,
  onViewLeaveHistory,
  onViewEmployeeProfile,
  onViewQuickInfo,
}) => {
  // State to store leave history per employee
  const [employeeHistoryMap, setEmployeeHistoryMap] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [requestType, setRequestType] = useState('leave'); // 'leave' | 'permission'
  const [confirmingPermission, setConfirmingPermission] = useState(null); // permission object for confirm modal

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // 6 is recommended for 2-column card layouts

  // Fetch history for all unique employees in the list
  useEffect(() => {
    const fetchEmployeeHistory = async () => {
      if (!approvals.length) return;

      const uniqueEmployeeIds = [
        ...new Set(approvals.map((a) => a.employeeId).filter(Boolean)),
      ];
      if (uniqueEmployeeIds.length === 0) return;

      setLoadingHistory(true);
      const historyMap = {};

      await Promise.all(
        uniqueEmployeeIds.map(async (empId) => {
          try {
            const res = await fetch(`/api/leave?employeeId=${empId}`);
            if (!res.ok) return;
            const history = await res.json();
            historyMap[empId] = history;
          } catch (err) {
            console.error(`Failed to fetch history for emp ${empId}`, err);
          }
        })
      );

      setEmployeeHistoryMap((prev) => ({ ...prev, ...historyMap }));
      setLoadingHistory(false);
    };

    fetchEmployeeHistory();
  }, [approvals]);

  // Helper to calculate relative stats
  const calculateRelativeStats = (employeeId, referenceDateStr) => {
    const history = employeeHistoryMap[employeeId] || [];
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

    let thisMonth = 0;
    let last3MonthsTotal = 0;
    const last3MonthsBreakdown = [];

    // Helper to check if date is in specific month relative to refDate
    const isSameMonthRelative = (d, monthOffset = 0) => {
      const target = new Date(
        refDate.getFullYear(),
        refDate.getMonth() - monthOffset,
        1
      );
      return (
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear()
      );
    };

    history.forEach((req) => {
      if (req.status === 'APPROVED') {
        const d = new Date(req.startDate);
        // This Month (Relative to refDate)
        if (isSameMonthRelative(d, 0)) {
          thisMonth += req.totalDays || 0;
        }
        // Last 3 Months (Relative to refDate)
        if (
          isSameMonthRelative(d, 1) ||
          isSameMonthRelative(d, 2) ||
          isSameMonthRelative(d, 3)
        ) {
          last3MonthsTotal += req.totalDays || 0;
        }
      }
    });

    // Populate Breakdown for Last 3 Months
    for (let i = 1; i <= 3; i++) {
      const targetDate = new Date(
        refDate.getFullYear(),
        refDate.getMonth() - i,
        1
      );
      const monthName = targetDate.toLocaleString('default', {
        month: 'short',
      });
      const days = history
        .filter(
          (req) =>
            req.status === 'APPROVED' &&
            isSameMonthRelative(new Date(req.startDate), i)
        )
        .reduce((sum, req) => sum + (req.totalDays || 0), 0);

      last3MonthsBreakdown.push({ name: monthName, days });
    }

    return {
      presentMonthLeaves: thisMonth,
      lastThreeMonthsTotal: last3MonthsTotal,
      lastThreeMonthsBreakdown: last3MonthsBreakdown,
    };
  };

  // Filter and Sort approvals
  const filteredApprovals = approvals
    .filter((a) => {
      // 1. Filter by Request Type (Leave vs Permission)
      const isPermission =
        a.type?.toLowerCase().includes('permission') ||
        a.category?.toLowerCase() === 'permission';

      if (requestType === 'leave' && isPermission) return false;
      if (requestType === 'permission' && !isPermission) return false;

      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      return (
        a.employee?.toLowerCase().includes(lowerQ) ||
        a.empId?.toLowerCase().includes(lowerQ) ||
        a.leaveId?.toLowerCase().includes(lowerQ) ||
        a.type?.toLowerCase().includes(lowerQ) ||
        a.details?.toLowerCase().includes(lowerQ) ||
        a.category?.toLowerCase().includes(lowerQ) ||
        a.employeeDepartment?.toLowerCase().includes(lowerQ) ||
        a.status?.toLowerCase().includes(lowerQ)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDate || 0);
      const dateB = new Date(b.startDate || 0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  // Reset pagination when search query or request type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, requestType]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedApprovals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApprovals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApprovals, currentPage, itemsPerPage]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Loader
          label="Loading leave requests..."
          size="md"
          fullScreen={false}
        />
      </section>
    );
  }

  return (
    <>
      {/* LOCAL SEARCH & SORT */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1"></div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending requests..."
              className="px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
            <Search className="absolute left-5 top-2.5 h-4 w-4 text-gray-400" />

            {searchQuery && (
              <IconButton
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-0.5 text-gray-400 hover:text-[#004475] shadow-none bg-transparent hover:bg-transparent"
                title="Clear search"
              >
                <X size={16} />
              </IconButton>
            )}
          </div>

          <PrimaryButton
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700   transition-all shadow-sm "
            title={`Sort by Date: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown size={16} className="text-white" />
            <span className="hidden sm:inline">
              Date: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </span>
          </PrimaryButton>

          {/* TOGGLE BUTTON (Segmented Control) */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner relative overflow-hidden h-10 w-64 self-center">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out z-0 ${requestType === 'permission'
                ? 'translate-x-full'
                : 'translate-x-0'
                }`}
            />

            <Button
              onClick={() => setRequestType('leave')}
              className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 relative z-10 ${requestType === 'leave'
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Leave
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${requestType === 'leave'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {
                  approvals.filter(
                    (a) =>
                      !a.type?.toLowerCase().includes('permission') &&
                      a.category?.toLowerCase() !== 'permission'
                  ).length
                }
              </span>
            </Button>

            <Button
              onClick={() => setRequestType('permission')}
              className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors duration-300 relative z-10 ${requestType === 'permission'
                ? 'text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Permission
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${requestType === 'permission'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {
                  approvals.filter(
                    (a) =>
                      a.type?.toLowerCase().includes('permission') ||
                      a.category?.toLowerCase() === 'permission'
                  ).length
                }
              </span>
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        {paginatedApprovals.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-10 select-none bg-gray-50 rounded-xl border border-dashed border-gray-300">
            {searchQuery
              ? 'No matching requests found.'
              : 'No pending leave requests found.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedApprovals.map((a) => {
                const stats = calculateRelativeStats(
                  a.employeeId || a.id,
                  a.startDate
                );

                const isPermission =
                  a.type?.toLowerCase().includes('permission') ||
                  a.category?.toLowerCase() === 'permission';

                return (
                  <div key={a.id} className="flex flex-col group h-full">
                    <div className="border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
                      {isPermission ? (
                        <div className="flex-grow">
                          <PermissionCard
                            approval={a}
                            onApprove={onApprove}
                            onReject={onReject}
                            onConfirm={(perm) => setConfirmingPermission(perm)}
                            isDisabled={!canApprove}
                            onViewDetails={onViewLeaveDetails}
                            onViewQuickInfo={onViewQuickInfo}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex-grow">
                            <ApprovalCard
                              approval={a}
                              onApprove={onApprove}
                              onReject={onReject}
                              isDisabled={!canApprove}
                              onViewDetails={onViewLeaveDetails}
                              onViewStats={() =>
                                onViewLeaveHistory?.({
                                  name: a.employee,
                                  stats: stats,
                                  employeeId: a.employeeId,
                                  appliedDate: a.appliedDate,
                                  startDate: a.startDate,
                                })
                              }
                              onViewEmployeeProfile={onViewEmployeeProfile}
                              onViewQuickInfo={onViewQuickInfo}
                            />
                          </div>

                          {/* History Section - Redesigned */}
                          <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border border-gray-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-blue-100 text-blue-600">
                                  <Clock size={14} />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                  Recent History
                                </span>
                              </div>
                              <HyperlinkButton
                                onClick={() =>
                                  onViewLeaveHistory?.({
                                    name: a.employee,
                                    stats: stats,
                                    employeeId: a.employeeId,
                                    appliedDate: a.appliedDate,
                                    startDate: a.startDate,
                                  })
                                }
                                className="text-xs flex items-center gap-1"
                                title="click to view history"
                              >
                                View History <ChevronRight size={12} />
                              </HyperlinkButton>
                            </div>

                            <div className="bg-blue-100 p-2.5 rounded-lg border border-blue-200 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-17 flex-grow overflow-hidden">
                                {/* This Month */}
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                    This Month :
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${stats.presentMonthLeaves > 0 ? 'text-orange-600' : 'text-gray-700'}`}
                                  >
                                    {stats.presentMonthLeaves}d
                                  </span>
                                </div>

                                <div className="w-px h-3 bg-blue-200 shrink-0"></div>

                                {/* Last 3 Months Total */}
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                    Last 3M :
                                  </span>
                                  <span className="text-xs font-bold text-gray-700">
                                    {stats.lastThreeMonthsTotal}d
                                  </span>
                                </div>

                                <div className="w-px h-3 bg-blue-200 shrink-0"></div>

                                {/* Breakdown */}
                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
                                  {stats.lastThreeMonthsBreakdown.map(
                                    (m, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1 whitespace-nowrap"
                                      >
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                          {m.name} :
                                        </span>
                                        <span
                                          className={`text-[11px] font-semibold ${m.days > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                                        >
                                          {m.days}d
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredApprovals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              rowsPerPageOptions={[4, 6, 10, 20, 50, 100]}
            />
          </>
        )}
      </section>

      {/* Permission Confirm Modal */}
      <PermissionConfirmModal
        open={!!confirmingPermission}
        permission={confirmingPermission}
        onCancel={() => setConfirmingPermission(null)}
        onConfirm={async ({ actualHours }) => {
          try {
            const res = await fetch(
              `/api/permission/${confirmingPermission.id}/confirm`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actualHours }),
              }
            );
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Failed to confirm');
            }
            const result = await res.json();
            showSuccessToast(
              `Confirmed ${actualHours} hrs. ${result.deductionApplied > 0 ? `${result.deductionApplied} day(s) CL deducted.` : 'No leave deduction.'}`
            );
            setConfirmingPermission(null);
            // Trigger a refresh by dispatching the event instead of reload
            window.dispatchEvent(new CustomEvent('refresh-leave-requests'));
          } catch (err) {
            showErrorToast(err.message || 'Failed to confirm permission');
            throw err;
          }
        }}
      />

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default LeaveRequestsTab;
