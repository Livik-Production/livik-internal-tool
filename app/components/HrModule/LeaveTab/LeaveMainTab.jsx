'use client';
import { showSuccessToast, showErrorToast } from '../../Toast';

import { useState, useEffect } from 'react';
import LeaveRequestsTab from './PendingRequestsTab';
import ApprovalsTab from './ApprovalsTab';
import HolidayListTab from './HolidayListTab';
import AddHolidayList from './AddHolidayList';
import UpdateLeaveRequestTab from './UpdateLeaveRequestTab';
import AttendanceTab from '../AttendanceTab/AttendanceTab';
import CustomModalForm from '../../CustomModalForm';
import TabButton from '../../Buttons/TabButton';

const leaveSubTabs = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'leaveRequests', label: 'Pending Requests' },
  { id: 'approvals', label: 'Request Approval' },
  { id: 'updateLeaveRequest', label: 'Update Leave Balance' },
  { id: 'holidayList', label: 'Holiday Calendar' },
];

export default function LeaveMainTab({
  canControlAllEmployees,
  canApprove,
  employees,
  authUser,
  isAdmin = false,
  onViewLeaveDetails,
  onViewLeaveHistory,
  onViewEmployeeProfile,
  onViewQuickInfo,
  onDeleteEmployee,
  initialSubTab = null,
  isViewOnly = false,
}) {
  const [activeLeaveTab, setActiveLeaveTab] = useState(
    initialSubTab || 'attendance'
  );
  const [animatingSubTab, setAnimatingSubTab] = useState(false);

  // Data state
  const [approvals, setApprovals] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [companyHolidays, setCompanyHolidays] = useState([]);

  // Modal state
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveLeaveTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchHolidays();

    // Listen for cross-component triggers to refresh leave requests
    const refreshHandler = () => fetchLeaveRequests();
    window.addEventListener('refresh-leave-requests', refreshHandler);

    return () => {
      window.removeEventListener('refresh-leave-requests', refreshHandler);
    };
  }, []);

  useEffect(() => {
    if (activeLeaveTab === 'leaveRequests') {
      fetchLeaveRequests();
    }
  }, [activeLeaveTab]);

  const fetchHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const res = await fetch(`/api/hr/holidays?year=${currentYear}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setCompanyHolidays(data);
      }
    } catch (err) {
      console.error('Failed to fetch company holidays:', err);
    }
  };

  const calculateEffectiveDays = (
    startDate,
    endDate,
    isHalfDay,
    halfDayPeriod
  ) => {
    if (isHalfDay) return 0.5;
    if (!startDate || !endDate) return 0;

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return 0;

    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    let count = 0;
    for (
      let dt = new Date(s.getTime());
      dt <= e;
      dt.setDate(dt.getDate() + 1)
    ) {
      const isSunday = dt.getDay() === 0;
      const isHoliday = companyHolidays.some((h) => {
        const hDate = new Date(h.holidayDate);
        return (
          hDate.getDate() === dt.getDate() &&
          hDate.getMonth() === dt.getMonth() &&
          hDate.getFullYear() === dt.getFullYear()
        );
      });

      if (!isSunday && !isHoliday) {
        count++;
      }
    }
    return count;
  };

  const fetchLeaveRequests = async () => {
    setIsLoadingRequests(true);
    try {
      // Base filters
      let leaveUrl = '/api/leave?status=PENDING';
      let permissionUrl = '/api/permission';

      if (!isAdmin && authUser?.id) {
        leaveUrl += `&excludeEmployeeId=${authUser.id}`;
        permissionUrl += `?excludeEmployeeId=${authUser.id}`;
      }

      // Fetch both concurrently
      const [leaveRes, permRes] = await Promise.all([
        fetch(leaveUrl),
        fetch(permissionUrl),
      ]);

      if (!leaveRes.ok || !permRes.ok) {
        throw new Error('Failed to fetch one or more request sources');
      }

      const [leaveData, permData] = await Promise.all([
        leaveRes.json(),
        permRes.json(),
      ]);

      // Map Leave Requests
      const mappedLeaves = leaveData.map((req) => ({
        id: req.id,
        leaveId: req.id.slice(-4).toUpperCase(),
        type: req.leaveType,
        employee: `${req.employee?.firstName} ${req.employee?.lastName}`,
        employeeId: req.employee?.id,
        empId: req.employee?.empId,
        employeePhoto: req.employee?.photo,
        employeeDesignation: req.employee?.designation,
        employeeDepartment: req.employee?.department,
        empData: req.employee,
        details: req.reason || 'No reason provided',
        days: calculateEffectiveDays(
          req.startDate,
          req.endDate,
          req.isHalfDay,
          req.halfDayPeriod
        ),
        totalDays: calculateEffectiveDays(
          req.startDate,
          req.endDate,
          req.isHalfDay,
          req.halfDayPeriod
        ),
        status:
          req.status.charAt(0).toUpperCase() +
          req.status.slice(1).toLowerCase(),
        category: 'leave',
        startDate: req.startDate,
        endDate: req.endDate,
        appliedDate: req.createdAt,
        document: req.attachment,
        isHalfDay: req.isHalfDay || false,
        halfDayPeriod: req.halfDayPeriod || '',
      }));

      // Map Permission Requests
      const mappedPermissions = permData
        .filter(
          (req) =>
            req.status === 'PENDING' ||
            (req.status === 'APPROVED' && !req.isConfirmed)
        )
        .map((req) => ({
          id: req.id,
          leaveId: req.id.slice(-4).toUpperCase(),
          type: 'Permission',
          employee: `${req.employee?.firstName} ${req.employee?.lastName}`,
          employeeId: req.employee?.id,
          empId: req.employee?.empId,
          employeePhoto: req.employee?.photo,
          employeeDesignation: req.employee?.designation,
          employeeDepartment: req.employee?.department,
          empData: req.employee,
          details: req.reason || 'No reason provided',
          durationHours: req.durationHours,
          startTime: req.startTime,
          endTime: req.endTime,
          status:
            req.status.charAt(0).toUpperCase() +
            req.status.slice(1).toLowerCase(),
          isConfirmed: req.isConfirmed,
          actualHours: req.actualHours,
          remarks: req.remarks || '',
          category: 'permission',
          startDate: req.date, // Used for sorting consistency
          date: req.date,
          appliedDate: req.createdAt,
        }));

      // Combine and sort by date (newest first)
      const combined = [...mappedLeaves, ...mappedPermissions].sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );

      setApprovals(combined);
    } catch (error) {
      console.error('Fetch errors:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApprove = async (id) => {
    if (!canApprove) return;
    const request = approvals.find((a) => a.id === id);
    const category = request?.category || 'leave';

    try {
      const res = await fetch(`/api/${category}/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: authUser.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve request');
      }
      fetchLeaveRequests();
      window.dispatchEvent(new CustomEvent('refresh-attendance-data'));
      showSuccessToast(
        `${category === 'leave' ? 'Leave' : 'Permission'} approved successfully ✅`
      );
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleReject = async (id) => {
    if (!canApprove) return;
    const request = approvals.find((a) => a.id === id);
    const category = request?.category || 'leave';

    try {
      const res = await fetch(`/api/${category}/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: authUser.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject request');
      }
      fetchLeaveRequests();
      window.dispatchEvent(new CustomEvent('refresh-attendance-data'));
      showSuccessToast(
        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
          {`${category === 'leave' ? 'Leave' : 'Permission'} rejected ❌`}
        </span>
      );
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleSubTabSwitch = (tabId) => {
    if (tabId === activeLeaveTab) return;
    setAnimatingSubTab(true);
    setTimeout(() => {
      setActiveLeaveTab(tabId);
      setAnimatingSubTab(false);
    }, 400); // Matching the Page.jsx duration
  };

  // Handlers for Holiday Modal
  const openHolidayModal = () => {
    if (!canControlAllEmployees) return;
    setHolidayModalOpen(true);
  };

  const closeHolidayModal = () => {
    setHolidayModalOpen(false);
  };

  return (
    <div>
      <nav
        role="tablist"
        aria-label="Leave sub-tabs"
        className="flex space-x-1 border-b border-gray-300 mb-3 bg-white sticky top-0 z-20 overflow-x-auto no-scroll"
      >
        {leaveSubTabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeLeaveTab === tab.id && !animatingSubTab}
            onClick={() => handleSubTabSwitch(tab.id)}
            disabled={animatingSubTab}
          >
            {tab.label}
            {tab.id === 'leaveRequests' && approvals.length > 0 && (
              <span className="ml-1.5 bg-blue-900 text-white text-[10px] font-bold px-2 py-1 rounded-full leading-none min-w-[18px] text-center">
                {approvals.length}
              </span>
            )}
          </TabButton>
        ))}
      </nav>

      {/* TAB CONTENT */}
      <div
        key={activeLeaveTab}
        className={`transition-all duration-400 ${animatingSubTab ? 'opacity-0 translate-y-4' : 'animate-dashboard-reveal'
          }`}
      >
        {activeLeaveTab === 'attendance' && (
          <AttendanceTab
            // Force show mark attendance controls in Leave tab
            canControlAllEmployees={true}
            employees={employees}
            isAdmin={isAdmin}
          />
        )}

        {activeLeaveTab === 'leaveRequests' && (
          <LeaveRequestsTab
            approvals={approvals}
            onApprove={handleApprove}
            onReject={handleReject}
            canControlAllEmployees={canControlAllEmployees}
            canApprove={canApprove}
            isLoading={isLoadingRequests}
            onViewLeaveDetails={onViewLeaveDetails}
            onViewLeaveHistory={onViewLeaveHistory}
            onViewEmployeeProfile={onViewEmployeeProfile}
            onViewQuickInfo={onViewQuickInfo}
          />
        )}

        {activeLeaveTab === 'approvals' && (
          <ApprovalsTab
            onViewLeaveDetails={onViewLeaveDetails}
            canControlAllEmployees={canControlAllEmployees}
          />
        )}

        {activeLeaveTab === 'updateLeaveRequest' && (
          <UpdateLeaveRequestTab
            onViewLeaveDetails={onViewLeaveDetails}
            onDelete={onDeleteEmployee}
            canControlAllEmployees={canControlAllEmployees}
            isAdmin={isAdmin}
          />
        )}

        {activeLeaveTab === 'holidayList' && (
          <HolidayListTab
            onAddHoliday={openHolidayModal}
            canControlAllEmployees={isAdmin || canControlAllEmployees}
          />
        )}
      </div>

      {/* Holiday Modal */}
      <CustomModalForm
        open={holidayModalOpen}
        onCancel={closeHolidayModal}
        title="Add Holiday List"
        widthClass="max-w-2xl"
      >
        <AddHolidayList
          onCancel={closeHolidayModal}
          canControlAllEmployees={canControlAllEmployees}
        />
      </CustomModalForm>
    </div>
  );
}
