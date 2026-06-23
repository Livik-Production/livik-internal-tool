'use client';

import React, { useState } from 'react';
import { Bell, UserPlus, MessageSquare, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import AdminNotificationDropdown from './AdminNotificationDropdown';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function NotificationBell({ placement = 'bottom' }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  // For dismissing UI-generated notifications
  const [hiddenEnquiries, setHiddenEnquiries] = useState([]);
  const [hiddenExpenseReport, setHiddenExpenseReport] = useState(false);
  const [readPendingIds, setReadPendingIds] = useState([]);
  const [readLeaveIds, setReadLeaveIds] = useState([]);

  React.useEffect(() => {
    try {
      setHiddenEnquiries(JSON.parse(localStorage.getItem('hiddenEnquiries') || '[]'));
      setHiddenExpenseReport(JSON.parse(localStorage.getItem('hiddenExpenseReport') || 'false'));
      setReadPendingIds(JSON.parse(localStorage.getItem('readPendingIds') || '[]'));
      setReadLeaveIds(JSON.parse(localStorage.getItem('readLeaveIds') || '[]'));
    } catch(e) {}
  }, []);

  React.useEffect(() => {
    localStorage.setItem('hiddenEnquiries', JSON.stringify(hiddenEnquiries));
    localStorage.setItem('hiddenExpenseReport', JSON.stringify(hiddenExpenseReport));
    localStorage.setItem('readPendingIds', JSON.stringify(readPendingIds));
    localStorage.setItem('readLeaveIds', JSON.stringify(readLeaveIds));
  }, [hiddenEnquiries, hiddenExpenseReport, readPendingIds, readLeaveIds]);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Get Auth Status and Roles
  const authUser = useSelector((state) => state.auth?.user);
  const roleName = authUser?.role?.name?.toUpperCase() ?? authUser?.roleName?.toUpperCase() ?? null;
  
  // Normalize rights from different possible redux states
  const rawRights = authUser?.rights || [];
  const normalizedRights = rawRights.map((r) => String(r).toLowerCase());
  const roleRights = authUser?.role?.rights?.map((r) => r.right?.rightName?.toLowerCase()) || [];
  const rights = [...new Set([...normalizedRights, ...roleRights])];

  const isSuperAdmin =
    roleName === 'ADMIN' ||
    roleName === 'SUPER_ADMIN' ||
    roleName === 'SUPER ADMIN' ||
    roleName === 'SUPERADMIN' ||
    rights.includes('all_access');

  const hasRight = (right) => {
    if (isSuperAdmin) return true;
    return rights.includes(right.toLowerCase());
  };

  // 2. Smart Polling for DB Notifications every 30 seconds
  const { data: dbNotificationsData, mutate } = useSWR(
    authUser?.id ? `/api/notifications?userId=${authUser.id}` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const dbNotifications = Array.isArray(dbNotificationsData) ? dbNotificationsData : [];

  // Fetch Website Operations - Client Enquiries (Requires admin or website operations module)
  const canViewWebsiteOps = hasRight('admin_module') || hasRight('website_operations_module');
  const { data: contactSubmissionsData } = useSWR(
    canViewWebsiteOps ? '/api/contact-submissions' : null,
    fetcher,
    { refreshInterval: 60000 }
  );
  const contactSubmissions = contactSubmissionsData?.data || [];

  // Fetch Expenses (Requires admin or finance module)
  const canViewFinance = hasRight('finance_module') || hasRight('admin_module');
  const { data: expensesData } = useSWR(
    canViewFinance ? '/api/expense' : null,
    fetcher,
    { refreshInterval: 60000 }
  );
  const expenses = Array.isArray(expensesData) ? expensesData : [];

  // Fetch Leaves & Permissions (Requires approve_leave right)
  const canApproveLeave = isSuperAdmin || hasRight('hr_module_approve_leave');
  
  const leaveSWRKey = canApproveLeave ? `/api/leave?status=PENDING${!isSuperAdmin && authUser?.id ? `&excludeEmployeeId=${authUser.id}` : ''}` : null;
  const { data: pendingLeavesData } = useSWR(leaveSWRKey, fetcher, { refreshInterval: 60000 });
  const pendingLeaves = Array.isArray(pendingLeavesData) ? pendingLeavesData : [];

  const permSWRKey = canApproveLeave ? `/api/permission${!isSuperAdmin && authUser?.id ? `?excludeEmployeeId=${authUser.id}` : ''}` : null;
  const { data: pendingPermissionsData } = useSWR(permSWRKey, fetcher, { refreshInterval: 60000 });
  const pendingPermissions = (Array.isArray(pendingPermissionsData) ? pendingPermissionsData : []).filter(p => p.status === 'PENDING' || (p.status === 'APPROVED' && !p.isConfirmed));

  // 3. Pending Employees Routing Logic
  const pendingEmployees = useSelector((state) => {
    const items = state.employees?.items || [];
    
    return items.filter((emp) => {
      // Must have completed profile setup to trigger notification
      const isContract = emp.workType === 'CONTRACT';
      const isProfileComplete = isContract 
        ? !!(emp.firstName && emp.lastName && emp.phoneNumber && emp.bondRemarks)
        : !!(emp.aadhaarNumber && emp.panNumber && emp.dateOfBirth && emp.presentAddress);

      if (!isProfileComplete) return false;

      const isPending = emp.status?.toUpperCase() === 'PENDING';
      const isPendingAdmin = emp.status?.toUpperCase() === 'PENDING_ADMIN';
      const createdByAdmin = emp.createdByRole === 'SUPER_ADMIN';
      
      // If employee lacks createdByRole (legacy data), we default to Super Admin seeing them
      const isLegacy = !emp.createdByRole;

      if (isSuperAdmin) {
        // Super Admin sees:
        // 1. Employees they created that are still PENDING (and profile filled)
        // 2. Employees anyone else approved (PENDING_ADMIN)
        // 3. Legacy employees (and profile filled)
        return (isPending && createdByAdmin) || isPendingAdmin || isLegacy;
      } else {
        // Other roles (HR, HR_ADMIN, etc) see all PENDING employees
        return isPending;
      }
    });
  });

  // 4. Combine Notifications
  const mappedDbNotifs = dbNotifications
    .filter((notif) => {
      if (notif.type === 'INVOICE_CYCLE') {
        return hasRight('admin_view_customers') || hasRight('admin_control_customers') || hasRight('finance_module');
      }
      return true;
    })
    .map((notif) => {
      let tag = 'System';
      if (notif.type === 'INVOICE_CYCLE') tag = 'Invoice';
      if (notif.type === 'LEAVE') tag = 'Leave';
      if (notif.type === 'HOLIDAY') tag = 'Holiday';
      if (notif.type === 'PAYROLL') tag = 'Payroll';
      if (notif.type === 'ASSET') tag = 'Asset';

      return {
        id: notif.id,
        title: notif.title,
        description: notif.message,
        time: new Date(notif.createdAt).toLocaleDateString(),
        tag,
        icon: <Bell size={18} />,
        isRead: notif.isRead,
        raw: notif,
      };
    });

  const pendingNotifs = pendingEmployees.map((emp) => ({
    id: `pending-${emp.id}`,
    title: 'Pending Employee Approval',
    description: `${emp.workType === 'CONTRACT' ? 'Contract Employee' : 'Employee'} ${emp.firstName} ${emp.lastName} is waiting for approval.`,
    time: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Pending',
    tag: emp.workType === 'CONTRACT' ? 'HR - Contract' : 'HR - Employee',
    icon: <UserPlus size={18} />,
    isRead: readPendingIds.includes(emp.id),
    rawEmp: emp
  }));

  const pendingLeaveNotifs = [
    ...pendingLeaves.map(leave => ({
      id: `leave-${leave.id}`,
      title: 'Pending Leave Request',
      description: `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''} requested ${leave.leaveType || 'leave'}.`,
      time: new Date(leave.createdAt).toLocaleDateString(),
      tag: 'HR - Leave',
      icon: <UserPlus size={18} />,
      isRead: readLeaveIds.includes(`leave-${leave.id}`),
      raw: leave
    })),
    ...pendingPermissions.map(perm => ({
      id: `perm-${perm.id}`,
      title: 'Pending Permission Request',
      description: `${perm.employee?.firstName || ''} ${perm.employee?.lastName || ''} requested permission.`,
      time: new Date(perm.createdAt).toLocaleDateString(),
      tag: 'HR - Permission',
      icon: <UserPlus size={18} />,
      isRead: readLeaveIds.includes(`perm-${perm.id}`),
      raw: perm
    }))
  ];

  // Client Enquiries Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newEnquiries = contactSubmissions.filter(
    (enq) => new Date(enq.createdAt) >= todayStart
  );

  const enquiryNotifs = newEnquiries.map(enq => ({
    id: `enquiry-${enq.id}`,
    title: 'New Client Enquiry',
    description: `From: ${enq.name} - ${enq.service}`,
    time: new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tag: 'Website Operations',
    icon: <MessageSquare size={18} />,
    isRead: hiddenEnquiries.includes(enq.id),
    raw: enq
  }));

  // Weekly Expenses Report (Mondays)
  const now = new Date();
  const isMonday = now.getDay() === 1;
  const expenseNotifs = [];

  if (isMonday && !hiddenExpenseReport && isSuperAdmin) {
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - (now.getDay() === 1 ? 7 : (now.getDay() + 6) % 7)); // previous Monday
    lastMonday.setHours(0, 0, 0, 0);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const lastWeekExpenses = expenses.filter(e => {
      const d = new Date(e.expenseDate || e.createdAt);
      return d >= lastMonday && d <= yesterday;
    });

    if (lastWeekExpenses.length > 0) {
      const total = lastWeekExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      expenseNotifs.push({
        id: 'weekly-expense-report',
        title: 'Weekly Expenses Report',
        description: `Total expenses from last week: ₹${total.toLocaleString('en-IN')}`,
        time: 'Today',
        tag: 'Expenses',
        icon: <TrendingUp size={18} />,
        isRead: hiddenExpenseReport,
      });
    }
  }

  const notifications = [...mappedDbNotifs, ...pendingNotifs, ...pendingLeaveNotifs, ...enquiryNotifs, ...expenseNotifs].filter((n) => !n.isRead);
  const unreadCount = notifications.length;



  // Auto‑mark notifications of the current tab as read when the tab is visited
  React.useEffect(() => {
    // Determine which tag corresponds to the current tab
    const tab = searchParams?.get('tab');
    let targetTag = '';
    if (pathname?.includes('/dashboard/admin')) {
      if (tab === 'customers') targetTag = 'Invoice';
      else if (tab === 'assets') targetTag = 'Asset';
    } else if (pathname?.includes('/dashboard/hr')) {
      if (tab === 'leave' || searchParams?.get('mainTab') === 'leave') targetTag = 'Leave';
    }
    // Add more mappings as needed for other modules

    if (!targetTag) return;

    // Find unread DB notifications for this tag (exclude UI‑generated IDs)
    const unreadIds = notifications
      .filter(
        (n) =>
          n.tag === targetTag &&
          !n.isRead &&
          !(n.id?.toString().startsWith('pending-')) &&
          !(n.id?.toString().startsWith('enquiry-')) &&
          !(n.id?.toString().startsWith('weekly-expense-report'))
      )
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Fire a PATCH for each unread notification
    Promise.all(
      unreadIds.map((id) =>
        fetch(`/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 'x-user-id': authUser?.id },
        })
      )
    )
      .then(() => mutate())
      .catch((err) => console.error('Failed to auto‑mark tab notifications as read:', err));
  }, [pathname, searchParams, authUser?.id, mutate, notifications]);

  // 5. Handlers
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { 
        method: 'PATCH',
        headers: { 'x-user-id': authUser?.id }
      });
      mutate(); // Re-fetch from DB

      // Also clear UI generated ones
      setHiddenEnquiries(newEnquiries.map(e => e.id));
      setHiddenExpenseReport(true);

      setShowNotifications(false);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read in DB if it's a real DB notification
    if (notif.id && !notif.id.toString().startsWith('pending-') && !notif.id.toString().startsWith('enquiry-') && notif.id !== 'weekly-expense-report') {
      if (!notif.isRead) {
        try {
          await fetch(`/api/notifications/${notif.id}/read`, { 
            method: 'PATCH',
            headers: { 'x-user-id': authUser?.id }
          });
          mutate(); // Re-fetch
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
    }

    setShowNotifications(false);

    // Global Routing based on notification type
    if (notif.tag === 'Invoice') {
      router.push('/dashboard/admin?tab=customers');
    } else if (notif.raw?.type === 'LEAVE') {
      router.push('/dashboard/employee_portal?tab=leave&subtab=history');
    } else if (notif.raw?.type === 'HOLIDAY') {
      router.push('/dashboard/employee_portal?tab=leave&subtab=holiday');
    } else if (notif.raw?.type === 'PAYROLL') {
      router.push('/dashboard/employee_portal?tab=payroll&subtab=payslips');
    } else if (notif.raw?.type === 'ASSET') {
      router.push('/dashboard/employee_portal?tab=assets');
    } else if (notif.id.toString().startsWith('pending-')) {
      setReadPendingIds(prev => [...new Set([...prev, notif.rawEmp.id])]);
      router.push(`/dashboard/hr?tab=pendingEmployees`);
    } else if (notif.id.toString().startsWith('leave-') || notif.id.toString().startsWith('perm-')) {
      setReadLeaveIds(prev => [...new Set([...prev, notif.id])]);
      router.push(`/dashboard/hr?tab=leave&subtab=leaveRequests`);
    } else if (notif.id.toString().startsWith('enquiry-')) {
      setHiddenEnquiries(prev => [...new Set([...prev, notif.raw.id])]);
      router.push('/dashboard/admin/livik-site-operations?tab=Client%20Enquiries');
    } else if (notif.id === 'weekly-expense-report') {
      setHiddenExpenseReport(true);
      router.push('/dashboard/finance?tab=Expenses');
    }
  };

  let hideTimeout;
  const handleMouseEnter = () => {
    clearTimeout(hideTimeout);
    setShowNotifications(true);
  };
  const handleMouseLeave = () => {
    hideTimeout = setTimeout(() => {
      setShowNotifications(false);
    }, 200);
  };

  if (!authUser) return null;

  return (
    <div
      className="relative mr-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => {
          clearTimeout(hideTimeout);
          setShowNotifications(!showNotifications);
        }}
        className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center relative hover:scale-110 active:scale-95 bg-blue-50 text-[#33a8d9] ring-2 ring-blue-100 cursor-pointer ${showNotifications ? 'z-50' : ''
          }`}
        title="Pending Actions"
      >
        <Bell size={17} className="fill-[#33a8d9] scale-110" />
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border border-white text-[10px] font-bold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          {/* Backdrop for closing */}
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/20 transition-all duration-300"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div
            className={`absolute z-50 ${placement === 'top' ? 'bottom-full mb-2 left-0 origin-bottom-left' : 'top-full mt-2 right-0 origin-top-right'
              }`}
          >
            <AdminNotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={handleMarkAllRead}
              onViewAll={() => setShowNotifications(false)}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </>
      )}
    </div>
  );
}
