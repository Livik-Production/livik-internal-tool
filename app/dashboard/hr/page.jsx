'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/Buttons/Button';
import TabButton from '../../components/Buttons/TabButton';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import CustomTable from '../../components/CustomTable';
import CustomModalForm from '../../components/CustomModalForm';
import EmployeeForm from '../../components/EmployeeForm/EmployeeForm';
import EmployeeView from '../../components/EmployeeForm/EmployeeView';
import Loader from '../../components/Loader';
import Header from '../../components/Header';
import ConfirmDialog from '../../components/ConfirmDialog';
import Payroll from '../../components/EmployeeForm/Payroll';
import EmployeePayrollView from '../../components/EmployeePortal/Payroll/EmployeePayrollView';
import LeaveRequestForm from '../../components/EmployeePortal/LeaveRequestForm';
import PermissionRequestForm from '../../components/EmployeePortal/PermissionRequestForm';
import HistoryTab from '../../components/EmployeePortal/LeaveRequestTab/HistoryTab';
import EmployeeAssetView from '../../components/EmployeePortal/EmployeeAssetView';
import OfferLetter from '../../components/HrModule/OfferLetterTab/OfferLetterTab';
import {
  SquarePen,
  Trash,
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  Monitor,
  IndianRupee,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import '../../globals.css';
import HrDashboardTab from '../../components/HrModule/HrDashboardTab';
import LeaveMainTab from '../../components/HrModule/LeaveTab/LeaveMainTab';
import PendingMainTab from '../../components/HrModule/PendingEmployees/PendingMainTab';
import SkillsDirectory from '../../components/HrModule/SkillsDirectory';
import Pagination from '../../components/Pagination';
import { X } from 'lucide-react';

import {
  fetchEmployees,
  addEmployee,
  updateEmployee as updateEmployeeAction,
  deleteEmployee as deleteEmployeeAction,
  selectEmployeesItems,
  selectEmployeesStatus,
} from '../../../store/slices/employeesSlice';
import IconButton from '../../components/Buttons/IconButton';
import CloseButton from '../../components/Buttons/CloseButton';
import HyperlinkButton from '../../components/Buttons/HyperlinkButton';

const TAB_CONFIG = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    right: 'hr_module_view_all_employees',
    controlRight: 'hr_module_control_all_employees',
  },
  {
    id: 'all',
    label: 'All Employees',
    right: 'hr_module_view_all_employees',
    controlRight: 'hr_module_control_all_employees',
  },
  {
    id: 'leave',
    label: 'Leave',
    right: 'hr_module_view_leave_requests',
    controlRight: 'hr_module_approve_leave',
  },
  {
    id: 'offerLetter',
    label: 'Letter',
    right: 'hr_module_view_letter',
    controlRight: 'hr_module_view_letter',
  },
  {
    id: 'pendingEmployees',
    label: 'Pending Employees',
    right: 'hr_module_view_pending_employees',
    controlRight: 'hr_module_control_all_employees',
  },
  {
    id: 'skills',
    label: 'Professional Skills',
    right: 'professional_skills_view',
    controlRight: 'professional_skills_control',
  },
];
import { useSearchParams } from 'next/navigation';

function EmployeeLeaveHistoryTab({ initialData }) {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);

  useEffect(() => {
    if (leaveHistory.length === 0) {
      const fetchLeavesAndPermissions = async () => {
        setIsLoadingLeaves(true);
        try {
          const targetId =
            initialData.id || initialData.__raw?.id || initialData.employeeId;
          if (targetId) {
            const [leaveRes, permRes] = await Promise.all([
              fetch(`/api/leave?employeeId=${targetId}`),
              fetch(`/api/permission?employeeId=${targetId}`),
            ]);

            const leaveData = leaveRes.ok ? await leaveRes.json() : [];
            const permData = permRes.ok ? await permRes.json() : [];

            const combined = [
              ...(Array.isArray(leaveData) ? leaveData : []),
              ...(Array.isArray(permData)
                ? permData.map((p) => ({ ...p, isPermission: true }))
                : []),
            ];

            // Sort by creation date or start date
            combined.sort(
              (a, b) =>
                new Date(b.createdAt || b.startDate) -
                new Date(a.createdAt || a.startDate)
            );

            setLeaveHistory(combined);
          }
        } catch (error) {
          console.error('Failed to fetch leaves and permissions:', error);
        } finally {
          setIsLoadingLeaves(false);
        }
      };
      fetchLeavesAndPermissions();
    }
  }, [initialData]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={20} /> Leave & Permission History
        </h4>
      </div>
      <HistoryTab
        data={leaveHistory}
        isLoading={isLoadingLeaves}
        isViewMode={true}
        onOpenLeaveForm={() => {}}
      />
    </div>
  );
}

function HRPageContent() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ... (rest of the logic remains the same)

  // tabs + animation
  const [activeMainTab, setActiveMainTab] = useState('');
  const [animating, setAnimating] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState(null);

  // Full page view control
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingEmployeeTab, setViewingEmployeeTab] = useState('info');

  // modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState(null);

  // Leave Request Form Modal control
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [selectedLeaveData, setSelectedLeaveData] = useState(null);

  // Leave History Modal control
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStatsData, setSelectedStatsData] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Quick Info Modal control
  const [quickInfoOpen, setQuickInfoOpen] = useState(false);
  const [selectedQuickInfo, setSelectedQuickInfo] = useState(null);
  const [isQuickInfoLoading, setIsQuickInfoLoading] = useState(false);

  // confirm dialog control
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // employees from redux
  const employees = useSelector(selectEmployeesItems);
  const employeesStatus = useSelector(selectEmployeesStatus);

  const authUser = useSelector((state) => state.auth.user);

  // ── Rights computation ──────────────────────────────────────────────────────
  const { visibleTabs, isViewOnly, isAdmin, canApprove } = useMemo(() => {
    if (!authUser)
      return {
        visibleTabs: [],
        isViewOnly: true,
        isAdmin: false,
        canApprove: false,
      };

    const { role } = authUser;
    const rawRights = authUser.rights || [];
    const normalizedRights = rawRights.map((r) => String(r).toLowerCase());

    const roleName = (role?.name || role?.roleName || '').toUpperCase();
    const isSuperAdmin =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      normalizedRights.includes('all_access');

    const checkRight = (r) => normalizedRights.includes(r.toLowerCase());

    const hasGlobalControl =
      isSuperAdmin || checkRight('hr_module_control_all_employees');

    // Filter tabs based on granular or global rights
    const tabs = TAB_CONFIG.filter((tab) => {
      if (isSuperAdmin) return true;
      return checkRight(tab.right) || checkRight(tab.controlRight);
    });

    // Determine if active tab is view only
    const currentTabConfig =
      TAB_CONFIG.find((t) => t.id === activeMainTab) || tabs[0];
    let activeIsViewOnly = true;

    if (currentTabConfig) {
      if (isSuperAdmin) {
        activeIsViewOnly = false;
      } else {
        const hasControl = checkRight(currentTabConfig.controlRight);
        const hasView = checkRight(currentTabConfig.right);
        activeIsViewOnly = hasView && !hasControl;
      }
    }

    const canApprove = isSuperAdmin || checkRight('hr_module_approve_leave');

    return {
      visibleTabs: tabs,
      isViewOnly: activeIsViewOnly,
      isAdmin: isSuperAdmin,
      canApprove,
    };
  }, [authUser, activeMainTab]);

  const isHrRole = !isAdmin;
  const canViewAllEmployees =
    !isViewOnly || visibleTabs.find((t) => t.id === 'all');
  const canControlAllEmployees =
    !isViewOnly &&
    (activeMainTab === 'all' ||
      activeMainTab === 'dashboard' ||
      activeMainTab === 'leave' ||
      activeMainTab === 'pendingEmployees');

  // Tab-independent permission check for adding employees (used by header button)
  const canAddEmployee =
    isAdmin ||
    (authUser?.rights || [])
      .map((r) => r.toLowerCase())
      .includes('hr_module_control_all_employees');

  const hasRight = (right) => {
    if (isAdmin) return true;
    const lowerRights = (authUser?.rights || []).map((r) => r.toLowerCase());
    return lowerRights.includes(right.toLowerCase());
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (activeMainTab === 'all') {
        setFilteredEmployees(employees.filter((e) => e.status === 'Active'));
      } else {
        setFilteredEmployees(employees);
      }
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter((employee) => {
        const matchesQuery =
          employee.name?.toLowerCase().includes(query) ||
          employee.email?.toLowerCase().includes(query) ||
          employee.designation?.toLowerCase().includes(query) ||
          employee.id?.toLowerCase().includes(query) ||
          employee.__raw?.firstName?.toLowerCase().includes(query) ||
          employee.__raw?.lastName?.toLowerCase().includes(query);

        // Filter by active status in the "all" tab
        if (activeMainTab === 'all') {
          return matchesQuery && employee.status === 'Active';
        }
        return matchesQuery;
      });
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees, activeMainTab]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Reset pagination when search query or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeMainTab]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    const subTabParam = searchParams?.get('subtab');

    if (tabParam && visibleTabs.find((t) => t.id === tabParam)) {
      if (activeMainTab !== tabParam) {
        setActiveMainTab(tabParam);
      }
      // If a subtab is provided in the URL, set it
      if (subTabParam) {
        setActiveSubTab(subTabParam);
      }
    } else if (
      visibleTabs.length > 0 &&
      (!activeMainTab || !visibleTabs.find((t) => t.id === activeMainTab))
    ) {
      setActiveMainTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeMainTab, searchParams]);

  useEffect(() => {
    if (canViewAllEmployees && employeesStatus === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employeesStatus, canViewAllEmployees]);

  // modal handlers with permission check
  const openAdd = () => {
    if (!canAddEmployee) return; // Only users with add rights can add
    setModalMode('add');
    setModalData(null);
    setModalOpen(true);
  };
  //commment

  const openView = (raw) => {
    setViewingEmployee(raw);
    setViewingEmployeeTab('info');
  };

  const openEdit = (raw) => {
    if (!canControlAllEmployees) return; // HR Executive cannot edit
    setModalMode('edit');
    setModalData(raw);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData(null);
  };

  // Holiday modal handlers with permission check
  const openHolidayModal = () => {
    if (!canControlAllEmployees) return; // HR Executive cannot add holidays
    setHolidayModalOpen(true);
  };

  const closeHolidayModal = () => {
    setHolidayModalOpen(false);
  };

  // ADD THESE LEAVE FORM HANDLERS
  const handleViewLeaveDetails = async (leaveData) => {
    // Show initially while loading fresh info
    setSelectedLeaveData(leaveData);
    setLeaveFormOpen(true);

    try {
      const employeeId = leaveData.employeeId;
      const requestId = leaveData.id;
      if (!employeeId || !requestId) return;

      const isPermission = leaveData.category === 'permission';
      const requestUrl = isPermission
        ? `/api/permission/${requestId}`
        : `/api/leave/${requestId}`;

      // Concurrent fetch for absolute accuracy
      const [empRes, reqRes] = await Promise.all([
        fetch(`/api/employees/quick-profile/${employeeId}`),
        fetch(requestUrl),
      ]);

      if (!empRes.ok || !reqRes.ok) return;

      const [freshEmp, freshReq] = await Promise.all([
        empRes.json(),
        reqRes.json(),
      ]);

      // Merge EVERYTHING latest into the state
      setSelectedLeaveData((prev) => ({
        ...prev,
        ...freshReq, // Latest hours, status, remarks, dates
        employee: `${freshEmp.firstName} ${freshEmp.lastName}`,
        employeePhoto: freshEmp.photo,
        empId: freshEmp.empId,
        employeeDesignation: freshEmp.designation,
        employeeDepartment: freshEmp.department,
        appliedDate: freshReq.createdAt,
        from: freshReq.startDate || freshReq.date,
        to: freshReq.endDate || freshReq.date,
        empData: freshEmp,
      }));
    } catch (err) {
      console.error('Failed to fetch fresh details for modal:', err);
    }
  };

  const handleCloseLeaveForm = () => {
    setLeaveFormOpen(false);
    setSelectedLeaveData(null);
  };

  const handleOpenStats = async (data) => {
    setSelectedStatsData(data);
    setStatsModalOpen(true);
    setIsHistoryLoading(true);

    try {
      const targetId = data.employeeId;
      if (!targetId) throw new Error('Missing employee ID for history');

      const res = await fetch(`/api/leave?employeeId=${targetId}`);
      if (!res.ok) throw new Error('Failed to fetch leave history');

      const history = await res.json();
      const historyArr = Array.isArray(history) ? history : [];
      setLeaveHistory(historyArr);

      // --- Calculate monthly stats from history ---
      // Use the leave duration's start date as reference, falling back to appliedDate or current date
      const referenceDate = data.startDate
        ? new Date(data.startDate)
        : data.appliedDate
          ? new Date(data.appliedDate)
          : new Date();
      const refMonth = referenceDate.getMonth();
      const refYear = referenceDate.getFullYear();

      // Prepare target months: ref, ref-1, ref-2, ref-3
      const targetMonths = [0, -1, -2, -3].map((offset) => {
        const d = new Date(refYear, refMonth + offset, 1);
        return {
          month: d.getMonth(),
          year: d.getFullYear(),
          name: d.toLocaleString('default', { month: 'short' }),
          fullName: d.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
          days: 0,
        };
      });

      historyArr.forEach((leave) => {
        if (leave.status !== 'APPROVED') return;
        const start = new Date(leave.startDate);
        const lMonth = start.getMonth();
        const lYear = start.getFullYear();

        targetMonths.forEach((target) => {
          if (lMonth === target.month && lYear === target.year) {
            target.days += leave.totalDays || 0;
          }
        });
      });

      setSelectedStatsData((prev) => ({
        ...prev,
        monthlyStats: targetMonths,
      }));
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleCloseStats = () => {
    setStatsModalOpen(false);
    setSelectedStatsData(null);
    setLeaveHistory([]);
  };

  const handleOpenQuickInfo = async (data) => {
    // Show what we have initially + set loading
    setSelectedQuickInfo(data);
    setQuickInfoOpen(true);
    setIsQuickInfoLoading(true);

    try {
      // Fetch exact details using the database ID
      const targetId = data.employeeId || data.__raw?.employeeId || data.id;
      if (!targetId) throw new Error('Missing employee ID');

      const res = await fetch(`/api/employees/quick-profile/${targetId}`);
      if (!res.ok) throw new Error('Failed to fetch employee details');

      const fullData = await res.json();
      setSelectedQuickInfo(fullData);
    } catch (error) {
      console.error('Error fetching quick info:', error);
    } finally {
      setIsQuickInfoLoading(false);
    }
  };

  const handleCloseQuickInfo = () => {
    setQuickInfoOpen(false);
    setSelectedQuickInfo(null);
  };

  const handleLeaveFormSubmit = async (data) => {
    showSuccessToast(`Leave request ${data.leave_id} has been processed!`);
    handleCloseLeaveForm();
  };

  const handleCreate = async (payload) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch (e) {}
        throw new Error(errData?.error || 'Failed to create employee');
      }

      const created = await res.json();
      const id = created.empId ?? created.id;
      const name = `${created.firstName ?? ''} ${
        created.lastName ?? ''
      }`.trim();

      const uiRow = {
        id,
        name,
        email: created.email ?? '',
        designation: created.designation ?? '',
        mobile: created.phoneNumber ?? '',
        status: created.status ?? 'PENDING',
        bondDuration: created.bondDuration ?? '',
        documentsCollected: [
          created.docSSLCCollected ? 'sslc' : null,
          created.docHSCCollected ? 'hsc' : null,
          created.docDegreeCollected ? 'degree' : null,
        ].filter(Boolean),
        bondRemarks: created.bondRemarks ?? '',
        __raw: created,
      };

      dispatch(addEmployee(uiRow));
      showSuccessToast('Employee created successfully!');
      closeModal();
    } catch (err) {
      showErrorToast('Create failed: ' + (err?.message || err));
      throw err;
    }
  };

  // handle edit
  const handleEditSubmit = async (payload) => {
    try {
      const targetId = modalData?.__raw?.id ?? modalData?.id;
      if (!targetId) throw new Error('Missing employee id for update');

      const res = await fetch(`/api/employees/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || 'Failed to update employee');
      }

      const updated = await res.json();
      const id = updated.empId ?? updated.id;
      const name = `${updated.firstName ?? ''} ${
        updated.lastName ?? ''
      }`.trim();

      const calculatedDocs = [
        updated.docSSLCCollected ? 'sslc' : null,
        updated.docHSCCollected ? 'hsc' : null,
        updated.docDegreeCollected ? 'degree' : null,
      ].filter(Boolean);

      const uiRow = {
        id,
        name,
        email: updated.email ?? '',
        designation: updated.designation ?? '',
        mobile: updated.phoneNumber ?? '',
        status: updated.status ?? 'Active',
        bondDuration: updated.bondDuration ?? '',
        documentsCollected: calculatedDocs,
        bondRemarks: updated.bondRemarks ?? '',
        __raw: { ...(modalData?.__raw ?? {}), ...updated },
      };

      dispatch(updateEmployeeAction(uiRow));
      showSuccessToast('Employee updated successfully!');
      closeModal();
    } catch (err) {
      showErrorToast('Update failed: ' + (err?.message || err));
      throw err;
    }
  };

  // button handlers with permission check
  const handleDeleteEmployee = (id) => {
    if (!canControlAllEmployees) return; // HR Executive cannot delete
    const row = employees.find((r) => r.id === id);
    const displayName =
      (row?.name ??
        `${row?.__raw?.firstName ?? ''} ${
          row?.__raw?.lastName ?? ''
        }`.trim()) ||
      id;

    setConfirmMessage(
      `Delete employee ${displayName} (${id})? This action cannot be undone.`
    );
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const performDeleteEmployee = async () => {
    const id = confirmTargetId;
    setConfirmOpen(false);

    if (!id) {
      setConfirmTargetId(null);
      return;
    }

    try {
      const row = employees.find((r) => r.id === id);
      const serverId = row?.__raw?.id ?? id;
      const res = await fetch(`/api/employees/${serverId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        console.warn('Server delete returned non-OK:', txt);
        throw new Error(txt || 'Server delete failed');
      }

      dispatch(deleteEmployeeAction(id));
    } catch (err) {
      console.error('Delete failed:', err);
      showErrorToast(`Failed to delete employee: ${err.message}`);
    } finally {
      setConfirmTargetId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!canApprove) return;
    try {
      const res = await fetch(`/api/leave/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: authUser.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve leave');
      }
      window.dispatchEvent(new Event('refresh-leave-requests'));
      showSuccessToast('Leave approved successfully!');
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleReject = async (id) => {
    if (!canApprove) return;
    try {
      const res = await fetch(`/api/leave/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: authUser.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject leave');
      }
      window.dispatchEvent(new Event('refresh-leave-requests'));
      showSuccessToast('Leave rejected successfully!');
    } catch (error) {
      showErrorToast(error.message);
    }
  };
  const handleApproveEmployee = async (employee) => {
    if (!isAdmin) return;
    const serverId = employee.__raw?.id || employee.id;
    try {
      const res = await fetch(`/api/employees/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Active' }),
      });

      if (!res.ok) throw new Error('Failed to approve employee');

      const updatedData = await res.json();
      const id = updatedData.empId ?? updatedData.id;
      const name =
        `${updatedData.firstName ?? ''} ${updatedData.lastName ?? ''}`.trim();

      const uiRow = {
        ...employee,
        id,
        name,
        status: updatedData.status,
        __raw: { ...employee.__raw, ...updatedData },
      };

      dispatch(updateEmployeeAction(uiRow));
      showSuccessToast(`${name} has been approved and activated!`);
      closeModal();
    } catch (error) {
      console.error('Error approving employee:', error);
      showErrorToast('Failed to approve. Please try again.');
    }
  };

  // counts
  const employeeCount = employees.filter((e) => e.status === 'Active').length;

  // main tab switch
  const handleTabSwitch = (tabId) => {
    if (tabId === activeMainTab) return;
    setAnimating(true);
    setPendingTab(tabId);
    setTimeout(() => {
      setActiveMainTab(tabId);
      setAnimating(false);
      // Reset sub-tab when switching main tabs manually
      setActiveSubTab(null);
    }, 400);
  };

  const navigateToTab = (mainTabId, subTabId = null) => {
    setActiveMainTab(mainTabId);
    if (subTabId) {
      setActiveSubTab(subTabId);
    } else {
      setActiveSubTab(null);
    }
  };

  // sub tab switch
  const handleSubTabSwitch = (tabId) => {
    if (tabId === activeLeaveTab) return;
    setAnimatingSubTab(true);
    setPendingSubTab(tabId);
    setTimeout(() => {
      setActiveLeaveTab(tabId);
      setAnimatingSubTab(false);
    }, 400);
  };

  // columns
  const employeeColumns = [
    {
      key: 'id',
      label: 'EmpID',
      render: (row) => {
        const empId =
          (row && (row.id ?? row.empId)) ??
          (row && row.__raw ? (row.__raw.empId ?? row.__raw.id) : '') ??
          '';

        return (
          <HyperlinkButton
            type="button"
            onClick={() => openView(row)} // Pass FULL row so we get computed props like bondDuration
            className="text-[#33a8d9] hover:underline text-sm font-medium text-lef  t"
            title="View employee details"
          >
            {empId}
          </HyperlinkButton>
        );
      },
    },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'dateOfJoining',
      label: 'Date of Joining',
      render: (row) => {
        const doj = row?.__raw?.dateOfJoining;
        return doj ? new Date(doj).toLocaleDateString('en-GB') : '-';
      },
    },
  ];

  // map modalMode to EmployeeForm's expected mode
  const mapToFormMode = (m) => {
    if (m === 'add') return 'create';
    if (m === 'edit') return 'edit';
    if (m === 'view') return 'view';
    return m;
  };

  // Custom action buttons component for table
  const ActionButtons = ({ row }) => {
    // Basic control check
    const canControl = canControlAllEmployees;

    // Explicitly check for HR Admin (Role Name) to restrict DELETE
    // Normalize role name check
    const userRoleName = authUser?.role?.roleName || authUser?.role?.name || '';
    // Check if user is HR Admin
    const isHrAdmin =
      userRoleName.toUpperCase().replace('_', ' ') === 'HR ADMIN';

    // Edit allowed for anyone with control rights
    const canEdit = canControl;

    // Delete allowed for anyone with control rights
    const canDelete = canControl;

    return (
      <div className="flex gap-4 justify-center">
        <IconButton
          onClick={() => openEdit(row)}
          // className="text-[#002e5b] hover:scale-110 transition-transform"
          title="Edit Employee"
          disabled={!canEdit}
        >
          <SquarePen size={16} />
        </IconButton>
        <IconButton
          onClick={() => handleDeleteEmployee(row.id)}
          // className={`transition-transform hover:scale-110 ${
          //   !canDelete ? "text-gray-400 cursor-not-allowed" : "text-[#002e5b]"
          // }`}
          disabled={!canDelete}
          title={!canDelete ? 'Delete access restricted' : 'Delete Employee'}
        >
          <Trash size={16} />
        </IconButton>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0 min-h-0">
      {/* Header with Add Employee button */}
      <Header
        onAdd={openAdd}
        addButtonLabel="Add Employee"
        isAddDisabled={!canControlAllEmployees}
        employeeCount={employeeCount}
      />

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 p-2 mt-1.5 m-0.5 min-h-0">
        {viewingEmployee ? (
          <div className="bg-white h-full rounded-xl flex flex-col min-h-0">
            <div className=" relative flex items-center justify-center py-3 px-2">
              <PrimaryButton
                onClick={() => setViewingEmployee(null)}
                className="absolute left-0 top-1 py-1 text-gray-800 sm-px-1 md-px-2"
              >
                <ArrowLeft size={16} />
                Back
              </PrimaryButton>
              <h2 className="text-2xl sm:text-base md:text-3xl font-extrabold text-[#173469] ">
                Employee Profile
              </h2>
            </div>

            <nav className="flex shrink-0 space-x-1 mb-1 border-b border-gray-300 bg-transparent overflow-x-auto no-scroll px-2 mt-2">
              <TabButton
                isActive={viewingEmployeeTab === 'info'}
                onClick={() => setViewingEmployeeTab('info')}
              >
                Employee Information
              </TabButton>
              <TabButton
                isActive={viewingEmployeeTab === 'assets'}
                onClick={() => setViewingEmployeeTab('assets')}
              >
                Asset Assigned
              </TabButton>
              <TabButton
                isActive={viewingEmployeeTab === 'salary'}
                onClick={() => setViewingEmployeeTab('salary')}
              >
                Salary Details
              </TabButton>
              <TabButton
                isActive={viewingEmployeeTab === 'leave'}
                onClick={() => setViewingEmployeeTab('leave')}
              >
                Leave/Permission History
              </TabButton>
            </nav>

            <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative">
              {viewingEmployeeTab === 'info' && (
                <div className="flex-1 min-h-0 h-full overflow-hidden">
                  <EmployeeView
                    initialData={{
                      ...(viewingEmployee.__raw ?? {}),
                      ...viewingEmployee,
                    }}
                    onEdit={() => openEdit(viewingEmployee)}
                  />
                </div>
              )}
              {viewingEmployeeTab === 'assets' && (
                <div className="flex flex-col h-full overflow-y-auto no-scroll">
                  <div className="h-full">
                    <EmployeeAssetView
                      employeeId={
                        viewingEmployee.id ||
                        viewingEmployee.__raw?.id ||
                        viewingEmployee.employeeId
                      }
                      initialAssignments={
                        viewingEmployee.assetAssignments ||
                        viewingEmployee.__raw?.assetAssignments ||
                        []
                      }
                    />
                  </div>
                </div>
              )}
              {viewingEmployeeTab === 'salary' && (
                <div className="flex flex-col h-full overflow-y-auto no-scroll">
                  <div className="">
                    <EmployeePayrollView
                      employee={{
                        ...(viewingEmployee.__raw ?? {}),
                        ...viewingEmployee,
                      }}
                    />
                  </div>
                </div>
              )}
              {viewingEmployeeTab === 'leave' && (
                <div className="flex flex-col h-full overflow-y-auto no-scroll">
                  <EmployeeLeaveHistoryTab
                    initialData={{
                      ...(viewingEmployee.__raw ?? {}),
                      ...viewingEmployee,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* MAIN TABS */}
            <nav
              role="tablist"
              aria-label="HR tabs"
              className="flex shrink-0 space-x-1 border-b border-gray-300 mb-3.5 bg-transparent overflow-x-auto no-scroll"
            >
              {visibleTabs.map((t) => {
                const active = activeMainTab === t.id && !animating;
                return (
                  <TabButton
                    key={t.id}
                    isActive={active}
                    onClick={() => handleTabSwitch(t.id)}
                    disabled={animating}
                  >
                    {t.label}
                  </TabButton>
                );
              })}
            </nav>

            {/* Define Shared Search Bar so it isn't recreated */}
            {(() => {
              const SharedSearchBar = (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={
                      activeMainTab === 'all'
                        ? 'Search employees...'
                        : 'Search...'
                    }
                    className="px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              );

              return (
                <>
                  {/* SEARCH BAR & Add Button for "All Employees" tab */}
                  {activeMainTab === 'all' && (
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex-1"></div>
                      <div className="flex items-center gap-3">
                        {SharedSearchBar}
                        {canViewAllEmployees && (
                          <PrimaryButton
                            onClick={openAdd}
                            className={`px-4 py-2 text-sm ${
                              !canControlAllEmployees
                                ? 'opacity-60 cursor-not-allowed'
                                : ''
                            }`}
                            disabled={!canControlAllEmployees}
                            title={
                              canControlAllEmployees
                                ? 'Add new employee'
                                : 'Add employee access required'
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Add Employee
                          </PrimaryButton>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    key={activeMainTab}
                    className={`flex-1 overflow-y-auto no-scrollbar transition-all duration-400 min-h-0 ${
                      animating
                        ? 'opacity-0 translate-y-4'
                        : 'animate-dashboard-reveal'
                    }`}
                  >
                    {/* DASHBOARD TAB */}
                    {activeMainTab === 'dashboard' && (
                      <HrDashboardTab
                        onNavigate={navigateToTab}
                        isViewOnly={isViewOnly}
                      />
                    )}

                    {/* OFFER LETTER TAB */}
                    {activeMainTab === 'offerLetter' && (
                      <OfferLetter isViewOnly={isViewOnly} />
                    )}

                    {/* ALL EMPLOYEES TAB - Combined for both HR Executive and Admin */}
                    {activeMainTab === 'all' && canViewAllEmployees && (
                      <div className="flex flex-col gap-4">
                        <section className="overflow-hidden rounded-xl border border-gray-200 shadow-inner text-gray-900">
                          <div className="overflow-y-auto">
                            <CustomTable
                              columns={[...employeeColumns]}
                              data={paginatedEmployees}
                              rowKey="id"
                              actions={(row) => <ActionButtons row={row} />}
                              actionsHeader="Actions"
                              actionsAlign="center"
                            />
                          </div>
                        </section>
                        <Pagination
                          currentPage={currentPage}
                          totalItems={filteredEmployees.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                          onItemsPerPageChange={handleItemsPerPageChange}
                          rowsPerPageOptions={[5, 10, 20, 50, 100]}
                        />
                      </div>
                    )}

                    {/* LEAVE TAB */}
                    {activeMainTab === 'leave' && (
                      <LeaveMainTab
                        canControlAllEmployees={canControlAllEmployees}
                        canApprove={canApprove}
                        employees={employees}
                        authUser={authUser}
                        isAdmin={isAdmin}
                        onViewLeaveDetails={handleViewLeaveDetails}
                        onViewLeaveHistory={handleOpenStats}
                        onViewEmployeeProfile={openView}
                        onViewQuickInfo={handleOpenQuickInfo}
                        onDeleteEmployee={handleDeleteEmployee}
                        initialSubTab={activeSubTab}
                        isViewOnly={isViewOnly}
                      />
                    )}

                    {/* PENDING EMPLOYEES TAB - Sub-tabs for Onboarding and Docs */}
                    {activeMainTab === 'pendingEmployees' && (
                      <PendingMainTab
                        searchElement={SharedSearchBar}
                        searchQuery={searchQuery}
                        canEdit={canControlAllEmployees && !isViewOnly}
                        canApprove={isAdmin && !isViewOnly}
                        canDelete={
                          !isHrRole &&
                          (isAdmin || canControlAllEmployees) &&
                          !isViewOnly
                        }
                        onView={(emp) => openView(emp)}
                        onEdit={(emp) => openEdit(emp)}
                        onDelete={(id) => handleDeleteEmployee(id)}
                        isViewOnly={isViewOnly}
                      />
                    )}

                    {/* PROFESSIONAL SKILLS TAB */}
                    {activeMainTab === 'skills' && (
                      <SkillsDirectory isTab={true} isViewOnly={isViewOnly} />
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Employee Modal */}
      <CustomModalForm
        open={modalOpen}
        onCancel={closeModal}
        title={
          modalMode === 'add'
            ? 'Add Employee'
            : modalMode === 'edit'
              ? 'Edit Employee'
              : 'View Employee'
        }
        widthClass="max-w-4xl"
      >
        <EmployeeForm
          mode={mapToFormMode(modalMode)}
          // Pass MERGED data so EmployeeForm sees both __raw DB fields AND computed wrapper fields (bondDuration)
          initialData={
            modalData ? { ...(modalData.__raw ?? {}), ...modalData } : {}
          }
          onCancel={closeModal}
          onSubmit={async (payload) => {
            if (modalMode === 'add') {
              await handleCreate(payload);
            } else if (modalMode === 'edit') {
              await handleEditSubmit(payload);
            } else {
              closeModal();
            }
          }}
          onApprove={() => handleApproveEmployee(modalData)}
          showApprove={
            isAdmin &&
            modalData?.status?.toUpperCase() === 'PENDING' &&
            modalMode !== 'add'
          }
          canControlAllEmployees={canControlAllEmployees} // Pass permission prop
          isHrRole={isHrRole}
        />
      </CustomModalForm>

      {leaveFormOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          {selectedLeaveData?.category === 'permission' ? (
            <PermissionRequestForm
              mode="view"
              initialData={selectedLeaveData}
              onClose={handleCloseLeaveForm}
              onApprove={async (id) => {
                await handleApprove(id);
                handleCloseLeaveForm();
              }}
              onReject={async (id) => {
                await handleReject(id);
                handleCloseLeaveForm();
              }}
            />
          ) : (
            <LeaveRequestForm
              mode="view"
              initialData={selectedLeaveData}
              onClose={handleCloseLeaveForm}
              onSubmit={handleLeaveFormSubmit}
              onApprove={async (id) => {
                await handleApprove(id);
                handleCloseLeaveForm();
              }}
              onReject={async (id) => {
                await handleReject(id);
                handleCloseLeaveForm();
              }}
            />
          )}
        </div>
      )}

      {/* Leave History Stats Modal */}
      {statsModalOpen && selectedStatsData && (
        <div className="fixed inset-0 z-[10000] backdrop-blur-md bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedStatsData.name}'s Leave History
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Comprehensive leave details and statistics
                </p>
              </div>
              <CloseButton
                onClick={handleCloseStats}
                className="p-1 hover:bg-red-200 rounded-full transition text-red-500 mb-5 "
                aria-label="Close modal"
              >
                <X size={17} />
              </CloseButton>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-8 no-scroll">
              {/* Monthly Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(selectedStatsData.monthlyStats || []).map((m, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${
                      idx === 0
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className="font-bold text-gray-900 text-sm truncate"
                          title={m.fullName}
                        >
                          {m.fullName}
                        </h4>
                        <Calendar
                          className={`h-3 w-3 ${idx === 0 ? 'text-blue-400' : 'text-gray-300'}`}
                        />
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span
                          className={`text-2xl font-black ${idx === 0 ? 'text-blue-700' : 'text-gray-800'}`}
                        >
                          {m.days}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Days
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* History Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-600 rounded-lg"></span>
                    Detailed History
                  </h4>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {leaveHistory.length} Record
                    {leaveHistory.length !== 1 ? 's' : ''} Found
                  </span>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  {isHistoryLoading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500 font-medium tracking-tight">
                        Fetching complete history...
                      </p>
                    </div>
                  ) : leaveHistory.length > 0 ? (
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto no-scrollbar">
                      <table className="w-full text-left text-sm relative">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                          <tr>
                            <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                              Dates
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                              Type
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                              Days
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                              Reason
                            </th>
                            <th className="px-6 py-4 font-bold text-gray-700 bg-gray-50">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {leaveHistory.map((leave) => (
                            <tr
                              key={leave.id}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {new Date(leave.startDate).toLocaleDateString(
                                    'en-GB',
                                    { day: '2-digit', month: 'short' }
                                  )}{' '}
                                  -
                                  {new Date(leave.endDate).toLocaleDateString(
                                    'en-GB',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  Applied on{' '}
                                  {new Date(
                                    leave.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-bold text-[10px] uppercase">
                                  {leave.leaveType}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700 font-bold">
                                {leave.totalDays}d
                              </td>
                              <td className="px-6 py-4">
                                <div
                                  className="max-w-xs truncate text-gray-600"
                                  title={leave.reason}
                                >
                                  {leave.reason || '---'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                                  ${
                                    leave.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                                      : leave.status === 'REJECTED'
                                        ? 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                                        : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20'
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                        <Calendar className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No leave history records found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200  flex justify-end rounded-b-xl">
              <PrimaryButton
                onClick={handleCloseStats}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold shadow-sm active:scale-[0.98]"
              >
                Close History
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info Modal */}
      <CustomModalForm
        open={quickInfoOpen}
        onCancel={handleCloseQuickInfo}
        widthClass="max-w-2xl"
        title={
          selectedQuickInfo && (
            <h3 className="text-lg md:text-xl font-bold text-gray-700">
              {selectedQuickInfo.name || selectedQuickInfo.firstName
                ? `${selectedQuickInfo.firstName} ${selectedQuickInfo.lastName || ''}`.trim()
                : 'Employee'}
              's Quick Info
            </h3>
          )
        }
        footer={
          <PrimaryButton
            onClick={handleCloseQuickInfo}
            className="px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base"
          >
            Close
          </PrimaryButton>
        }
      >
        {selectedQuickInfo && (
          <div className="bg-white p-4 sm:p-3">
            <div className="relative">
              {isQuickInfoLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600 font-medium tracking-wide">
                      Fetching details...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Uploads Section */}
                <div className="shrink-0">
                  {selectedQuickInfo.photo ? (
                    <img
                      src={selectedQuickInfo.photo}
                      alt={selectedQuickInfo.firstName}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-lg ring-1 ring-gray-200">
                      <span className="text-2xl md:text-4xl font-black text-blue-600 uppercase">
                        {(selectedQuickInfo.firstName?.[0] || '') +
                          (selectedQuickInfo.lastName?.[0] || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 w-full">
                  {[
                    {
                      label: 'Name',
                      value:
                        selectedQuickInfo.name ||
                        `${selectedQuickInfo.firstName || ''} ${selectedQuickInfo.lastName || ''}`.trim(),
                    },
                    {
                      label: 'Employee ID',
                      value: selectedQuickInfo.empId || selectedQuickInfo.id,
                    },
                    {
                      label: 'Designation',
                      value: selectedQuickInfo.designation,
                    },
                    {
                      label: 'Department',
                      value: selectedQuickInfo.department || 'N/A',
                    },
                    { label: 'Email', value: selectedQuickInfo.email },
                    {
                      label: 'DOB',
                      value: selectedQuickInfo.dateOfBirth
                        ? new Date(
                            selectedQuickInfo.dateOfBirth
                          ).toLocaleDateString('en-GB')
                        : 'N/A',
                    },
                    {
                      label: 'Phone Number',
                      value: selectedQuickInfo.phoneNumber || 'N/A',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        {item.label}
                      </span>
                      <span className="text-gray-900 font-medium text-sm md:text-base break-words">
                        {item.value || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CustomModalForm>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete employee"
        description={<span className="block">{confirmMessage}</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={performDeleteEmployee}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTargetId(null);
        }}
      />
    </div>
  );
}

export default function HRPage() {
  return (
    <Suspense fallback={<Loader label="Loading HR Module..." size="md" />}>
      <HRPageContent />
    </Suspense>
  );
}
