'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import IconButton from '../../components/Buttons/IconButton';
import TabButton from '../../components/Buttons/TabButton';
import NotificationBell from '../../components/NotificationBell';
import CustomModalForm from '../../components/CustomModalForm';
import CRMDashboardOverview from '../../components/CRM/CRMDashboardOverview';
import CustomAlertForm from '../../components/CustomAlertForm';
import Loader from '../../components/Loader';
import CRMLeadsTab from '../../components/CRM/CRMLeadsTab';
import CRMLeadDetail from '../../components/CRM/CRMLeadDetail';
import CRMHeader from '../../components/CRM/CRMHeader';
import CRMLeadModal from '../../components/CRM/CRMLeadModal';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import {
  Search,
  Plus,
  Users,
  CheckCircle,
  Handshake,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Mail,
  Phone,
  XCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  ChevronDown,
  AlertCircle,
  SquarePen,
  Trash,
  X,
  ArrowUpDown,
  Building2,
  User,
  LogOut,
  MapPin,
  Globe,
  UsersRound
} from 'lucide-react';

const formatTime24Hours = (timeStr) => {
  if (!timeStr) return '';

  const [hourStr, minStr] = timeStr.split(':');
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
const formatDateTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function CRMDashboard() {
  const authUser = useSelector(selectAuthUser);

  // ── Rights computation ──────────────────────────────────────────────────────
  const { canViewCrm, canControlCrm } = useMemo(() => {
    if (!authUser)
      return {
        canViewCrm: false,
        canControlCrm: false,
      };

    const rawRights = authUser.rights || [];
    const normalizedRights = rawRights.map((r) => String(r).toLowerCase());

    const roleName = (authUser.role?.name || authUser.role?.roleName || '').toUpperCase();
    const isSuperAdmin =
      roleName === 'SUPER_ADMIN' ||
      roleName === 'SUPER ADMIN' ||
      roleName === 'SUPERADMIN' ||
      roleName === 'ADMIN' ||
      normalizedRights.includes('all_access');

    const checkRight = (r) => normalizedRights.includes(r.toLowerCase());

    return {
      canViewCrm: isSuperAdmin || checkRight('crm_module_view'),
      canControlCrm: isSuperAdmin || checkRight('crm_module_control'),
    };
  }, [authUser]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingLeadId, setEditingLeadId] = useState(null);

  // Search input state for Leads tab
  const [searchQuery, setSearchQuery] = useState('');

  // Lead Detail View State
  const [selectedLeadDetail, setSelectedLeadDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('Log Activity');

  // Dynamic states for interactive features
  const [leadsCount, setLeadsCount] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [oppCount, setOppCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);

  // Detailed leads list with job roles, geography, scores and revenues
  const [leadsList, setLeadsList] = useState([]);
  const currentEditingLead = leadsList.find((l) => l.id === editingLeadId);

  // Stage counts for Leads tab stats
  const [counts, setCounts] = useState({
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Won: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);

  const [upcomingTasks, setUpcomingTasks] = useState([]);

  // Form Field States
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSource, setFormSource] = useState('Referral');
  const [formIndustry, setFormIndustry] = useState('SaaS & Technology');
  const [formStatus, setFormStatus] = useState('New');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // New Form Field States for Company details
  const [formCompanyAddress, setFormCompanyAddress] = useState('');
  const [formCompanyEmail, setFormCompanyEmail] = useState('');
  const [formCompanyWebsite, setFormCompanyWebsite] = useState('');

  // New Form Field States for POC details
  const [formPocDepartment, setFormPocDepartment] = useState('');

  // New Form Field States for Lead Date and Time
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  // New Form Field States for Reminder
  const [formReminderName, setFormReminderName] = useState('');
  const [formReminderDate, setFormReminderDate] = useState('');
  const [formReminderTime, setFormReminderTime] = useState('');

  const formatTime24Hours = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const [dbEmployees, setDbEmployees] = useState([]);

  // Filter full-time vs contract employees from db records, with fallback to mocks
  const displayedEmployees = useMemo(() => {
    const filtered = dbEmployees.filter(emp => !emp.workType || String(emp.workType).toUpperCase() !== 'CONTRACT');
    if (filtered.length > 0) {
      return filtered.map(emp => ({
        id: emp.id,
        empId: emp.empId || '',
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'N/A',
        role: emp.designation || 'N/A',
        phone: emp.phoneNumber || 'N/A',
        email: emp.email || 'N/A'
      }));
    }
    return [];
  }, [dbEmployees]);

  const displayedContractEmployees = useMemo(() => {
    const filtered = dbEmployees.filter(emp => emp.workType && String(emp.workType).toUpperCase() === 'CONTRACT');
    if (filtered.length > 0) {
      return filtered.map(emp => ({
        id: emp.id,
        contractEmpId: emp.contractEmpId || '',
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'N/A',
        role: emp.designation || 'N/A',
        phone: emp.phoneNumber || 'N/A',
        email: emp.email || 'N/A'
      }));
    }
    return [];
  }, [dbEmployees]);

  // New Form Field States for Employee / Contract Employee selector
  const [formEmployeeType, setFormEmployeeType] = useState('employee'); // 'employee' | 'contract'
  const [formEmployeeSelectedId, setFormEmployeeSelectedId] = useState(''); // empty by default so it does not display data
  const [formEmployeeDetailsText, setFormEmployeeDetailsText] = useState('');

  // Mutation & Delete Confirmation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState('Processing...');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  // Activities list database / local states
  const [activitiesList, setActivitiesList] = useState([]);

  // Activity Modal and Filtering States
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState('add'); // 'add' | 'edit'
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [formActivityData, setFormActivityData] = useState('');
  const [formActivityDate, setFormActivityDate] = useState('');
  const [formActivityTime, setFormActivityTime] = useState('');
  const [formActivityPocName, setFormActivityPocName] = useState('');
  const [formActivityPocEmail, setFormActivityPocEmail] = useState('');
  const [formActivityPocPhone, setFormActivityPocPhone] = useState('');
  const [formActivityRepName, setFormActivityRepName] = useState('');
  const [formActivityRepType, setFormActivityRepType] = useState('');
  const [formActivityPocDept, setFormActivityPocDept] = useState('');
  const [formActivityRepDept, setFormActivityRepDept] = useState('');
  const [formActivityRepEmail, setFormActivityRepEmail] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [activitySortOrder, setActivitySortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [showActivityDeleteConfirm, setShowActivityDeleteConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // Move Customer / Status promotion Modal states
  const [showMoveCustomerModal, setShowMoveCustomerModal] = useState(false);
  const [formMoveStatus, setFormMoveStatus] = useState('Won');

  // Autocomplete representative search states & ref
  const [representativeSearch, setRepresentativeSearch] = useState('');
  const [isRepresentativeDropdownOpen, setIsRepresentativeDropdownOpen] = useState(false);
  const representativeDropdownRef = useRef(null);

  // POC autocomplete state
  const [pocSearchQuery, setPocSearchQuery] = useState('');
  const [isPocDropdownOpen, setIsPocDropdownOpen] = useState(false);
  const pocDropdownRef = useRef(null);

  // Reminder autocomplete state
  const [isReminderDropdownOpen, setIsReminderDropdownOpen] = useState(false);
  const reminderDropdownRef = useRef(null);

  // Close POC and Reminder suggestions dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pocDropdownRef.current && !pocDropdownRef.current.contains(event.target)) {
        setIsPocDropdownOpen(false);
      }
      if (reminderDropdownRef.current && !reminderDropdownRef.current.contains(event.target)) {
        setIsReminderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract unique POC contacts from leadsList and activitiesList (only stored CRM details)
  const uniquePocs = useMemo(() => {
    const seen = new Set();
    const list = [];
    
    // Add POCs from main leads
    for (const lead of leadsList) {
      if (lead.name && !seen.has(lead.name.toLowerCase().trim())) {
        seen.add(lead.name.toLowerCase().trim());
        list.push({
          name: lead.name,
          firstName: lead.firstName || lead.name.split(' ')[0] || '',
          lastName: lead.lastName || lead.name.split(' ').slice(1).join(' ') || '',
          email: lead.email || '',
          phone: lead.phone || '',
          pocDepartment: lead.pocDepartment || '',
          company: lead.company || '',
          employeeSelectedId: lead.employeeSelectedId || '',
          employeeType: lead.employeeType || 'employee',
        });
      }
    }
    
    // Add POCs from activities (tables)
    for (const act of activitiesList) {
      if (act.pocName && !seen.has(act.pocName.toLowerCase().trim())) {
        seen.add(act.pocName.toLowerCase().trim());
        const parentLead = leadsList.find(l => l.id === act.leadId);
        list.push({
          name: act.pocName,
          firstName: act.pocName.split(' ')[0] || '',
          lastName: act.pocName.split(' ').slice(1).join(' ') || '',
          email: act.pocEmail || '',
          phone: act.pocPhone || '',
          pocDepartment: act.pocDept || '',
          company: parentLead ? parentLead.company : '',
          employeeSelectedId: '',
          employeeType: 'employee',
        });
      }
    }
    
    return list;
  }, [leadsList, activitiesList]);

  // Filter POC suggestions based on selected company and user search text
  const filteredPocSuggestions = useMemo(() => {
    let filtered = uniquePocs;
    if (formCompany) {
      const companyLower = formCompany.toLowerCase().trim();
      filtered = filtered.filter(poc => poc.company.toLowerCase().trim() === companyLower);
    }
    
    const query = pocSearchQuery.toLowerCase().trim();
    if (!query) return filtered;
    return filtered.filter(poc => 
      poc.name.toLowerCase().includes(query) ||
      (poc.email && poc.email.toLowerCase().includes(query)) ||
      (poc.phone && poc.phone.includes(query))
    );
  }, [uniquePocs, pocSearchQuery, formCompany]);

  // Filter Reminder POC suggestions based on selected company and user search text (external POCs)
  const filteredReminderPocSuggestions = useMemo(() => {
    let filtered = uniquePocs;
    if (formCompany) {
      const companyLower = formCompany.toLowerCase().trim();
      filtered = filtered.filter(poc => poc.company.toLowerCase().trim() === companyLower);
    }
    
    const query = formReminderName.toLowerCase().trim();
    if (!query) return filtered;
    return filtered.filter(poc => 
      poc.name.toLowerCase().includes(query) ||
      (poc.email && poc.email.toLowerCase().includes(query)) ||
      (poc.phone && poc.phone.includes(query))
    );
  }, [uniquePocs, formReminderName, formCompany]);

  // Sync search input when selection changes
  useEffect(() => {
    const list = formEmployeeType === 'employee' ? displayedEmployees : displayedContractEmployees;
    const selected = list.find(emp => emp.id === formEmployeeSelectedId);
    if (selected) {
      setRepresentativeSearch(selected.name);
    } else {
      setRepresentativeSearch('');
    }
  }, [formEmployeeSelectedId, formEmployeeType, displayedEmployees, displayedContractEmployees]);

  // Click outside to dismiss the search suggestions list
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (representativeDropdownRef.current && !representativeDropdownRef.current.contains(event.target)) {
        setIsRepresentativeDropdownOpen(false);
        // Restore currently selected name
        const list = formEmployeeType === 'employee' ? displayedEmployees : displayedContractEmployees;
        const selected = list.find(emp => emp.id === formEmployeeSelectedId);
        if (selected) {
          setRepresentativeSearch(selected.name);
        } else {
          setRepresentativeSearch('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [formEmployeeSelectedId, formEmployeeType, displayedEmployees, displayedContractEmployees]);

  // Filter suggestion list based on search text (querying name, id, or empId/contractEmpId)
  const filteredSuggestions = useMemo(() => {
    const list = formEmployeeType === 'employee' ? displayedEmployees : displayedContractEmployees;
    const query = representativeSearch.toLowerCase().trim();
    if (!query) return list;
    return list.filter(emp => {
      const matchName = emp.name.toLowerCase().includes(query);
      const matchId = String(emp.id).toLowerCase().includes(query);
      const matchEmpId = emp.empId && String(emp.empId).toLowerCase().includes(query);
      const matchContractEmpId = emp.contractEmpId && String(emp.contractEmpId).toLowerCase().includes(query);
      return matchName || matchId || matchEmpId || matchContractEmpId;
    });
  }, [representativeSearch, formEmployeeType, displayedEmployees, displayedContractEmployees]);

  // Dynamic update of employee details textarea
  useEffect(() => {
    if (!formEmployeeSelectedId) {
      setFormEmployeeDetailsText('');
      setFormAssignedTo('');
      return;
    }
    const list = formEmployeeType === 'employee' ? displayedEmployees : displayedContractEmployees;
    let selected = list.find(emp => emp.id === formEmployeeSelectedId);
    
    if (selected) {
      const details = `Name: ${selected.name}\nDepartment: ${selected.department}\nRole: ${selected.role}\nPhone: ${selected.phone}\nEmail: ${selected.email}`;
      setFormEmployeeDetailsText(details);
      setFormAssignedTo(selected.name);
    } else {
      setFormEmployeeDetailsText('');
      setFormAssignedTo('');
    }
  }, [formEmployeeType, formEmployeeSelectedId, displayedEmployees, displayedContractEmployees]);

  // Load employees & leads from DB on mount
  // Load employees & leads from DB on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setPageLoading(true);
        let currentDbEmployees = [];
        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          currentDbEmployees = await empRes.json();
          setDbEmployees(currentDbEmployees);
        }

        const res = await fetch('/api/crm');
        if (res.ok) {
          const data = await res.json();
          const dbLeads = data.filter(d => d.companyName !== 'ACTIVITY_LOG');
          const dbActivities = data.filter(d => d.companyName === 'ACTIVITY_LOG');

          const mappedLeads = dbLeads.map((lead) => {
            const dbEmp = lead.assigneeId ? currentDbEmployees.find(e => e.id === lead.assigneeId) : null;
            return {
              id: lead.id,
              firstName: lead.pocName.split(' ')[0] || '',
              lastName: lead.pocName.split(' ').slice(1).join(' ') || '',
              name: lead.pocName,
              company: lead.companyName,
              email: lead.pocEmail || '',
              phone: lead.pocMobile || '',
              source: 'Referral',
              industry: 'SaaS & Technology',
              status: lead.status || 'New',
              assignedTo: dbEmp ? `${dbEmp.firstName} ${dbEmp.lastName}` : 'Unassigned',
              notes: lead.notes || '',
              companyAddress: lead.companyAddress || '',
              companyEmail: lead.companyEmail || '',
              companyWebsite: lead.companyWebsite || '',
              pocDepartment: lead.pocDepartment || '',
              employeeType: lead.assigneeType.toLowerCase() === 'employee' ? 'employee' : 'contract',
              employeeSelectedId: lead.assigneeId || '',
              employeeDetailsText: dbEmp ? 
                `Name: ${dbEmp.firstName} ${dbEmp.lastName}\nDepartment: ${dbEmp.department || 'N/A'}\nRole: ${dbEmp.designation || 'N/A'}\nPhone: ${dbEmp.phoneNumber || 'N/A'}\nEmail: ${dbEmp.email || 'N/A'}` : '',
              title: 'Project Lead',
              location: lead.companyAddress || 'San Francisco, CA',
              leadId: `${String(lead.id).slice(-5)}`,
              leadScore: 75,
              annualRevenue: '$10M - $25M',
              date: lead.date,
              time: lead.time,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt,
              createdBy: lead.createdBy,
              updatedBy: lead.updatedBy,
            };
          });

          const mappedActivities = dbActivities.map((act) => {
            const repEmp = act.assigneeId ? currentDbEmployees.find(e => e.id === act.assigneeId) : null;
            return {
              id: act.id,
              leadId: act.companyAddress, // Parent lead ID stored in companyAddress
              data: act.notes || '',
              date: act.date ? new Date(act.date).toISOString().slice(0, 10) : '',
              time: act.time || '',
              pocName: act.pocName || '',
              pocEmail: act.pocEmail || '',
              pocPhone: act.pocMobile || '',
              pocDept: act.pocDepartment || '',
              repName: repEmp ? `${repEmp.firstName} ${repEmp.lastName}` : 'Unassigned',
              repType: act.assigneeType === 'EMPLOYEE' ? 'Employee' : 'Contract',
              repDept: repEmp?.department || 'N/A',
              repRole: repEmp?.designation || 'N/A',
              repPhone: repEmp?.phoneNumber || 'N/A',
              repEmail: repEmp?.email || 'N/A',
              reminderName: act.reminderName || null,
              reminderDate: act.reminderDate ? new Date(act.reminderDate).toISOString().slice(0, 10) : null,
            };
          });

          setLeadsList(mappedLeads);
          setActivitiesList(mappedActivities);

          // Update metrics dynamically
          setLeadsCount(mappedLeads.length);
          setQualifiedCount(mappedLeads.filter(l => l.status === 'Qualified').length);
          
          setCounts({
            New: mappedLeads.filter(l => l.status === 'New').length,
            Contacted: mappedLeads.filter(l => l.status === 'Contacted').length,
            Qualified: mappedLeads.filter(l => l.status === 'Qualified').length,
            Won: mappedLeads.filter(l => l.status === 'Won').length,
          });
        }
      } catch (err) {
        console.error('Failed to load data on mount:', err);
      } finally {
        setPageLoading(false);
      }
    };
    loadAllData();
  }, []);



  // Add Button Click Handler
  const handleAddLeadClick = () => {
    setModalMode('add');
    setEditingLeadId(null);
    setFormFirstName('');
    setFormLastName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('Referral');
    setFormIndustry('SaaS & Technology');
    setFormStatus('New');
    setFormAssignedTo('');
    setFormNotes('');
    setFormCompanyAddress('');
    setFormCompanyEmail('');
    setFormCompanyWebsite('');
    setFormPocDepartment('');
    setFormEmployeeType('employee');
    setFormEmployeeSelectedId('');
    setFormEmployeeDetailsText('');
    setFormReminderName('');
    setFormReminderDate('');
    
    // Set date and time
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString();
    setFormDate(localISOTime.slice(0, 10));
    setFormTime(localISOTime.slice(11, 16));

    setShowAddLeadModal(true);
  };

  // Edit Button Click Handler
  const handleEditLeadClick = (lead) => {
    setModalMode('edit');
    setEditingLeadId(lead.id);
    setFormFirstName(lead.firstName || lead.name.split(' ')[0] || '');
    setFormLastName(lead.lastName || lead.name.split(' ').slice(1).join(' ') || '');
    setFormCompany(lead.company || '');
    setFormEmail(lead.email || '');
    setFormPhone(lead.phone || '');
    setFormSource(lead.source || 'Referral');
    setFormIndustry(lead.industry || 'SaaS & Technology');
    setFormStatus(lead.status || 'New');
    setFormAssignedTo(lead.assignedTo || '');
    setFormNotes(lead.notes || '');
    setFormCompanyAddress(lead.companyAddress || '');
    setFormCompanyEmail(lead.companyEmail || '');
    setFormCompanyWebsite(lead.companyWebsite || '');
    setFormPocDepartment(lead.pocDepartment || '');
    setFormEmployeeType(lead.employeeType || 'employee');
    setFormEmployeeSelectedId(lead.employeeSelectedId || '');
    setFormReminderName(lead.reminderName || '');
    if (lead.reminderDate) {
      const rd = new Date(lead.reminderDate);
      const tzOffset = rd.getTimezoneOffset() * 60000;
      setFormReminderDate((new Date(rd - tzOffset)).toISOString().slice(0, 10));
    } else {
      setFormReminderDate('');
    }

    // Set date and time from lead.date and lead.time
    if (lead.date) {
      const d = new Date(lead.date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISODate = (new Date(d - tzOffset)).toISOString().slice(0, 10);
      setFormDate(localISODate);
      setFormTime(lead.time || '10:00');
    } else {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - tzOffset)).toISOString();
      setFormDate(localISOTime.slice(0, 10));
      setFormTime(localISOTime.slice(11, 16));
    }

    setShowAddLeadModal(true);
  };

  // View Lead Click Handler
  const handleViewLeadClick = (lead) => {
    setModalMode('view');
    setEditingLeadId(lead.id);
    setFormFirstName(lead.firstName || lead.name.split(' ')[0] || '');
    setFormLastName(lead.lastName || lead.name.split(' ').slice(1).join(' ') || '');
    setFormCompany(lead.company || '');
    setFormEmail(lead.email || '');
    setFormPhone(lead.phone || '');
    setFormSource(lead.source || 'Referral');
    setFormIndustry(lead.industry || 'SaaS & Technology');
    setFormStatus(lead.status || 'New');
    setFormAssignedTo(lead.assignedTo || '');
    setFormNotes(lead.notes || '');
    setFormCompanyAddress(lead.companyAddress || '');
    setFormCompanyEmail(lead.companyEmail || '');
    setFormCompanyWebsite(lead.companyWebsite || '');
    setFormPocDepartment(lead.pocDepartment || '');
    setFormEmployeeType(lead.employeeType || 'employee');
    setFormEmployeeSelectedId(lead.employeeSelectedId || '');
    setFormReminderName(lead.reminderName || '');
    if (lead.reminderDate) {
      const rd = new Date(lead.reminderDate);
      const tzOffset = rd.getTimezoneOffset() * 60000;
      setFormReminderDate((new Date(rd - tzOffset)).toISOString().slice(0, 10));
    } else {
      setFormReminderDate('');
    }

    // Set date and time from lead.date and lead.time
    if (lead.date) {
      const d = new Date(lead.date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISODate = (new Date(d - tzOffset)).toISOString().slice(0, 10);
      setFormDate(localISODate);
      setFormTime(lead.time || '10:00');
    } else {
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - tzOffset)).toISOString();
      setFormDate(localISOTime.slice(0, 10));
      setFormTime(localISOTime.slice(11, 16));
    }

    setShowAddLeadModal(true);
  };

  // Open Lead Form Modal with prefilled company details from lead or selectedLeadDetail
  const handleLogNewActivityLeadClick = (leadOrEvent = null) => {
    // If the function is called directly from onClick, it receives an Event object. Ignore it.
    const lead = (leadOrEvent && typeof leadOrEvent.preventDefault === 'function') ? null : leadOrEvent;
    
    // Reset all form fields
    setEditingLeadId(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('Referral');
    setFormIndustry('SaaS & Technology');
    setFormStatus('New');
    setFormAssignedTo('');
    setFormNotes('');
    setFormPocDepartment('');
    setFormEmployeeType('employee');
    setFormEmployeeSelectedId('');
    setFormEmployeeDetailsText('');
    setFormReminderName('');
    setFormReminderDate('');

    setModalMode('logActivity');
    
    const targetLead = lead || selectedLeadDetail;
    if (targetLead) {
      setEditingLeadId(targetLead.id);
      setFormCompany(targetLead.company || '');
      setFormCompanyAddress(targetLead.companyAddress || '');
      setFormCompanyEmail(targetLead.companyEmail || '');
      setFormCompanyWebsite(targetLead.companyWebsite || '');
    }
    
    // Set date and time
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString();
    setFormDate(localISOTime.slice(0, 10));
    setFormTime(localISOTime.slice(11, 16));
    
    // Reset POC search input
    setPocSearchQuery('');

    setShowAddLeadModal(true);
  };

  // Delete Lead Handler - Trigger Confirmation Modal
  const handleDeleteLead = (id) => {
    const lead = leadsList.find((l) => l.id === id);
    if (lead) {
      setLeadToDelete(lead);
      setShowDeleteConfirm(true);
    }
  };

  // Actual Deletion Execution
  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    setIsSubmitting(true);
    setSubmitLabel('Deleting lead...');
    try {
      const res = await fetch(`/api/crm/${leadToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Decrease total leads count
        setLeadsCount((prev) => Math.max(0, prev - 1));
        const id = leadToDelete.id;
        const statusKey = leadToDelete.status === 'Lead' ? 'New' : leadToDelete.status;
        setCounts((prev) => ({
          ...prev,
          [statusKey]: Math.max(0, (prev[statusKey] || 1) - 1),
        }));
        if (leadToDelete.status === 'Qualified') setQualifiedCount((prev) => Math.max(0, prev - 1));
        
        // Filter list
        setLeadsList((prev) => prev.filter((lead) => lead.id !== id));
        
        // Add activity notice
        const delAct = {
          id: Date.now(),
          type: 'lead_delete',
          text: `Lead deleted: ${leadToDelete?.name || 'Prospect'}`,
          time: 'Just now',
          icon: <XCircle size={16} className="text-red-500" />,
          bg: 'bg-red-50',
        };
        setRecentActivities([delAct, ...recentActivities]);

        // Go back
        setSelectedLeadDetail(null);
        showSuccessToast('Lead deleted successfully!');
        setShowDeleteConfirm(false);
        setLeadToDelete(null);
      } else {
        showErrorToast('Failed to delete lead.');
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
      showErrorToast('Failed to delete lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activity CRUD Handlers
  const handleAddActivityClick = () => {
    setActivityModalMode('add');
    setEditingActivityId(null);
    setFormActivityData('');
    // Current date YYYY-MM-DD
    const now = new Date();
    const dateVal = now.toISOString().slice(0, 10);
    const timeVal = now.toTimeString().slice(0, 5);
    setFormActivityDate(dateVal);
    setFormActivityTime(timeVal);

    // Pre-fill POC from lead details
    setFormActivityPocName(selectedLeadDetail?.name || '');
    setFormActivityPocEmail(selectedLeadDetail?.email || '');
    setFormActivityPocPhone(selectedLeadDetail?.phone || '');
    setFormActivityPocDept(selectedLeadDetail?.pocDepartment || 'N/A');

    // Pre-fill Rep details
    setFormActivityRepName(selectedLeadDetail?.assignedTo || 'Jane Smith');
    setFormActivityRepType(selectedLeadDetail?.employeeType === 'contract' ? 'Contract' : 'Employee');

    // Find detailed representative profile details from dbEmployees
    const repEmp = dbEmployees.find(e => e.id === selectedLeadDetail?.employeeSelectedId);
    if (repEmp) {
      setFormActivityRepDept(repEmp.department || 'N/A');
      setFormActivityRepRole(repEmp.designation || 'N/A');
      setFormActivityRepPhone(repEmp.phoneNumber || 'N/A');
      setFormActivityRepEmail(repEmp.email || 'N/A');
    } else {
      setFormActivityRepDept('N/A');
      setFormActivityRepRole('N/A');
      setFormActivityRepPhone('N/A');
      setFormActivityRepEmail('N/A');
    }

    setShowActivityModal(true);
  };

  const handleEditActivityClick = (activity) => {
    setEditingActivityId(activity.id);
    setModalMode('editActivity');
    
    // Parse pocName
    const pocNameParts = (activity.pocName || '').split(' ');
    setFormFirstName(pocNameParts[0] || '');
    setFormLastName(pocNameParts.slice(1).join(' ') || '');
    
    setFormEmail(activity.pocEmail || '');
    setFormPhone(activity.pocPhone || '');
    setFormPocDepartment(activity.pocDept || '');
    
    setFormNotes(activity.data || '');
    setFormDate(activity.date || '');
    setFormTime(activity.time || '');
    
    setFormEmployeeType(activity.repType === 'Contract' ? 'contract' : 'employee');
    const repEmp = dbEmployees.find(e => `${e.firstName} ${e.lastName}` === activity.repName);
    setFormEmployeeSelectedId(repEmp ? repEmp.id : '');
    
    setFormReminderName(activity.reminderName || '');
    setFormReminderDate(activity.reminderDate || '');
    
    if (selectedLeadDetail) {
      setFormCompany(selectedLeadDetail.company || '');
      setFormCompanyAddress(selectedLeadDetail.companyAddress || '');
      setFormCompanyEmail(selectedLeadDetail.companyEmail || '');
      setFormCompanyWebsite(selectedLeadDetail.companyWebsite || '');
    }
    
    setShowAddLeadModal(true);
  };

  const handleDeleteActivity = (activity) => {
    setActivityToDelete(activity);
    setShowActivityDeleteConfirm(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      const res = await fetch(`/api/crm/${activityToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setActivitiesList((prev) => prev.filter((act) => act.id !== activityToDelete.id));
        showSuccessToast('Activity deleted successfully!');
      } else {
        showErrorToast('Failed to delete activity.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Failed to delete activity.');
    } finally {
      setShowActivityDeleteConfirm(false);
      setActivityToDelete(null);
    }
  };

  // Move Customer Promotion handler
  const handleSaveMoveCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitLabel('Moving Customer status...');
    try {
      const res = await fetch(`/api/crm/${selectedLeadDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formMoveStatus,
        }),
      });

      if (res.ok) {
        const oldStatus = selectedLeadDetail.status || 'New';
        const newStatus = formMoveStatus;

        if (oldStatus !== newStatus) {
          setCounts((prev) => {
            const prevKey = oldStatus === 'Lead' ? 'New' : oldStatus;
            const newKey = newStatus === 'Lead' ? 'New' : newStatus;
            return {
              ...prev,
              [prevKey]: Math.max(0, (prev[prevKey] || 1) - 1),
              [newKey]: (prev[newKey] || 0) + 1,
            };
          });

          if (oldStatus === 'Qualified') setQualifiedCount((prev) => Math.max(0, prev - 1));
          if (newStatus === 'Qualified') setQualifiedCount((prev) => prev + 1);
        }

        // Update local list
        setLeadsList((prev) =>
          prev.map((lead) =>
            lead.id === selectedLeadDetail.id
              ? { ...lead, status: formMoveStatus }
              : lead
          )
        );
        setSelectedLeadDetail((prev) => ({
          ...prev,
          status: formMoveStatus,
        }));
        showSuccessToast(`Lead successfully moved to ${formMoveStatus}!`);
        setShowMoveCustomerModal(false);
      } else {
        showErrorToast('Failed to update lead status.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Error occurred updating lead status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!formFirstName || !formLastName) return;

    const fullName = `${formFirstName} ${formLastName}`;

    // Filter out mock employee/contract IDs so they don't trigger foreign key constraint errors
    const isMockAssignee = ['e1', 'e2', 'e3', 'c1', 'c2'].includes(formEmployeeSelectedId);

    const leadPayload = {
      companyName: formCompany,
      companyAddress: formCompanyAddress,
      companyEmail: formCompanyEmail,
      companyWebsite: formCompanyWebsite,
      pocName: fullName,
      pocDepartment: formPocDepartment,
      pocMobile: formPhone,
      pocEmail: formEmail,
      assigneeType: formEmployeeType === 'employee' ? 'EMPLOYEE' : 'CONTRACT_EMPLOYEE',
      assigneeId: isMockAssignee ? null : formEmployeeSelectedId,
      date: formDate ? new Date(formDate).toISOString() : null,
      time: formTime || null,
      notes: formNotes,
      reminderName: formReminderName || null,
      reminderDate: formReminderDate ? new Date(formReminderDate).toISOString() : null,
    };

    if (modalMode === 'edit') {
      setIsSubmitting(true);
      setSubmitLabel('Updating lead...');
      try {
        const res = await fetch(`/api/crm/${editingLeadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...leadPayload, updatedBy: authUser?.name || 'User' }),
        });
        if (res.ok) {
          const updatedLeadFromDb = await res.json();
          const oldLead = leadsList.find((l) => l.id === editingLeadId);
          const oldStatus = oldLead ? oldLead.status : 'New';

          const updatedLead = {
            id: updatedLeadFromDb.id,
            firstName: formFirstName,
            lastName: formLastName,
            name: fullName,
            company: formCompany,
            email: formEmail,
            phone: formPhone,
            source: formSource,
            industry: formIndustry,
            status: formStatus,
            assignedTo: formAssignedTo,
            notes: formNotes,
            title: oldLead?.title || 'Senior Consultant',
            location: oldLead?.location || 'San Francisco, CA',
            leadId: oldLead?.leadId || `${String(editingLeadId).slice(-5)}`,
            leadScore: oldLead?.leadScore || 70,
            annualRevenue: oldLead?.annualRevenue || '$5M - $10M',
            companyAddress: formCompanyAddress,
            companyEmail: formCompanyEmail,
            companyWebsite: formCompanyWebsite,
            pocDepartment: formPocDepartment,
            employeeType: formEmployeeType,
            employeeSelectedId: formEmployeeSelectedId,
            employeeDetailsText: formEmployeeDetailsText,
            reminderName: updatedLeadFromDb.reminderName || formReminderName || '',
            reminderDate: updatedLeadFromDb.reminderDate || formReminderDate || '',
            date: updatedLeadFromDb.date,
            time: updatedLeadFromDb.time,
            createdAt: updatedLeadFromDb.createdAt,
            updatedAt: updatedLeadFromDb.updatedAt,
            createdBy: updatedLeadFromDb.createdBy || 'Unknown',
            updatedBy: updatedLeadFromDb.updatedBy || 'Unknown',
          };

          // Update lead details in state
          setLeadsList((prev) =>
            prev.map((lead) => (lead.id === editingLeadId ? updatedLead : lead))
          );

          // Sync Lead Detail Sub-page View immediately
          if (selectedLeadDetail && selectedLeadDetail.id === editingLeadId) {
            setSelectedLeadDetail(updatedLead);
          }

          // Adjust counts if status changed
          if (oldStatus !== formStatus) {
            setCounts((prev) => {
              const prevKey = oldStatus === 'Lead' ? 'New' : oldStatus;
              const newKey = formStatus === 'Lead' ? 'New' : formStatus;
              return {
                ...prev,
                [prevKey]: Math.max(0, (prev[prevKey] || 1) - 1),
                [newKey]: (prev[newKey] || 0) + 1,
              };
            });

            // Adjust main dashboard overview stats
            if (oldStatus === 'Qualified') setQualifiedCount((prev) => Math.max(0, prev - 1));
            if (formStatus === 'Qualified') setQualifiedCount((prev) => prev + 1);
          }

          // Add to activity feed
          const editAct = {
            id: Date.now(),
            type: 'lead_edit',
            text: `Lead details updated: ${fullName} (${formCompany}) - Status: ${formStatus}`,
            time: 'Just now',
            icon: <Sparkles size={16} className="text-[#004475]" />,
            bg: 'bg-[#004475]/10',
          };
          setRecentActivities([editAct, ...recentActivities]);
          resetFormState();
          showSuccessToast('Lead updated successfully!');
        } else {
          showErrorToast('Failed to update lead.');
        }
      } catch (err) {
        console.error('Failed to update lead:', err);
        showErrorToast('Failed to update lead.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (modalMode === 'editActivity') {
      const targetLeadId = selectedLeadDetail?.id;
      if (!targetLeadId) return;

      const repEmp = dbEmployees.find(e => e.id === formEmployeeSelectedId);
      
      const payload = {
        companyName: 'ACTIVITY_LOG',
        companyAddress: targetLeadId,
        pocName: fullName || 'Unknown',
        pocEmail: formEmail,
        pocMobile: formPhone,
        pocDepartment: formPocDepartment,
        assigneeType: formEmployeeType === 'contract' ? 'CONTRACT_EMPLOYEE' : 'EMPLOYEE',
        assigneeId: repEmp?.id || null,
        notes: formNotes,
        date: formDate ? new Date(formDate).toISOString() : null,
        time: formTime,
        reminderName: formReminderName || null,
        reminderDate: formReminderDate ? new Date(formReminderDate).toISOString() : null,
        createdBy: authUser?.name || 'User'
      };

      setIsSubmitting(true);
      setSubmitLabel('Updating activity...');
      
      try {
        const res = await fetch(`/api/crm/${editingActivityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          // Update local state
          setActivitiesList((prev) =>
            prev.map((act) =>
              act.id === editingActivityId
                ? {
                    ...act,
                    data: formNotes,
                    date: formDate,
                    time: formTime,
                    pocName: fullName,
                    pocEmail: formEmail,
                    pocPhone: formPhone,
                    pocDept: formPocDepartment,
                    repName: formAssignedTo,
                    repType: formEmployeeType === 'contract' ? 'Contract' : 'Employee',
                    repDept: repEmp ? (repEmp.department || 'N/A') : 'N/A',
                    repRole: repEmp ? (repEmp.designation || 'N/A') : 'N/A',
                    repPhone: repEmp ? (repEmp.phoneNumber || 'N/A') : 'N/A',
                    repEmail: repEmp ? (repEmp.email || 'N/A') : 'N/A',
                    reminderName: formReminderName || null,
                    reminderDate: formReminderDate || null,
                  }
                : act
            )
          );
          setShowAddLeadModal(false);
          resetFormState();
          showSuccessToast('Activity updated successfully!');
        } else {
          showErrorToast('Failed to update activity.');
        }
      } catch (err) {
        console.error(err);
        showErrorToast('Failed to update activity.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (modalMode === 'logActivity') {
      const targetLeadId = editingLeadId || selectedLeadDetail?.id;
      if (!targetLeadId) return;

      const repEmp = dbEmployees.find(e => e.id === formEmployeeSelectedId);
      
      const payload = {
        companyName: 'ACTIVITY_LOG',
        companyAddress: targetLeadId,
        pocName: fullName || 'Unknown',
        pocEmail: formEmail,
        pocMobile: formPhone,
        pocDepartment: formPocDepartment,
        assigneeType: formEmployeeType === 'contract' ? 'CONTRACT_EMPLOYEE' : 'EMPLOYEE',
        assigneeId: repEmp?.id || null,
        notes: formNotes,
        date: formDate ? new Date(formDate).toISOString() : null,
        time: formTime,
        reminderName: formReminderName || null,
        reminderDate: formReminderDate ? new Date(formReminderDate).toISOString() : null,
        createdBy: authUser?.name || 'User'
      };

      setIsSubmitting(true);
      setSubmitLabel('Logging activity...');
      
      try {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const savedAct = await res.json();
          const newAct = {
            id: savedAct.id,
            leadId: targetLeadId,
            data: formNotes,
            date: formDate,
            time: formTime,
            pocName: fullName,
            pocEmail: formEmail,
            pocPhone: formPhone,
            pocDept: formPocDepartment,
            repName: formAssignedTo,
            repType: formEmployeeType === 'contract' ? 'Contract' : 'Employee',
            repDept: repEmp ? (repEmp.department || 'N/A') : 'N/A',
            repRole: repEmp ? (repEmp.designation || 'N/A') : 'N/A',
            repPhone: repEmp ? (repEmp.phoneNumber || 'N/A') : 'N/A',
            repEmail: repEmp ? (repEmp.email || 'N/A') : 'N/A',
            reminderName: formReminderName || null,
            reminderDate: formReminderDate || null,
          };

          setActivitiesList((prev) => [newAct, ...prev]);
          setShowAddLeadModal(false);
          resetFormState();
          showSuccessToast('Activity logged successfully with POC details!');
        } else {
          showErrorToast('Failed to log activity.');
        }
      } catch (err) {
        console.error(err);
        showErrorToast('Failed to log activity.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Add new lead mode
      setIsSubmitting(true);
      setSubmitLabel('Creating lead...');
      try {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...leadPayload, createdBy: authUser?.name || 'User' }),
        });
        if (res.ok) {
          const newLeadFromDb = await res.json();
          setLeadsCount((prev) => prev + 1);
          if (formStatus === 'Qualified') setQualifiedCount((prev) => prev + 1);
          if (formStatus === 'Proposal' || formStatus === 'Negotiation') setOppCount((prev) => prev + 1);

          const stageKey = formStatus === 'Lead' ? 'New' : formStatus;
          const newLead = {
            id: newLeadFromDb.id,
            firstName: formFirstName,
            lastName: formLastName,
            name: fullName,
            company: formCompany,
            email: formEmail,
            phone: formPhone,
            source: formSource,
            industry: formIndustry,
            status: formStatus === 'Lead' ? 'New' : formStatus,
            assignedTo: formAssignedTo,
            notes: formNotes,
            title: 'Project Lead',
            location: 'San Francisco, CA',
            leadId: `${newLeadFromDb.id.slice(-5)}`,
            leadScore: 75,
            annualRevenue: '$10M - $25M',
            companyAddress: formCompanyAddress,
            companyEmail: formCompanyEmail,
            companyWebsite: formCompanyWebsite,
            pocDepartment: formPocDepartment,
            employeeType: formEmployeeType,
            employeeSelectedId: formEmployeeSelectedId,
            employeeDetailsText: formEmployeeDetailsText,
            reminderName: newLeadFromDb.reminderName || formReminderName || '',
            reminderDate: newLeadFromDb.reminderDate || formReminderDate || '',
            date: newLeadFromDb.date,
            time: newLeadFromDb.time,
            createdAt: newLeadFromDb.createdAt,
            updatedAt: newLeadFromDb.updatedAt,
            createdBy: newLeadFromDb.createdBy || 'Unknown',
            updatedBy: newLeadFromDb.updatedBy || 'Unknown',
          };

          setLeadsList([newLead, ...leadsList]);
          setCounts((prev) => ({
            ...prev,
            [stageKey]: (prev[stageKey] || 0) + 1,
          }));

          // Add to activity feed
          const newAct = {
            id: Date.now(),
            type: 'lead_add',
            text: `New lead added: ${fullName} (${formCompany}) - Status: ${formStatus}`,
            time: 'Just now',
            icon: <Sparkles size={16} className="text-[#004475]" />,
            bg: 'bg-[#004475]/10',
          };
          setRecentActivities([newAct, ...recentActivities]);
          resetFormState();
          showSuccessToast('Lead created successfully!');
        } else {
          showErrorToast('Failed to create lead.');
        }
      } catch (err) {
        console.error('Failed to create lead:', err);
        showErrorToast('Failed to create lead.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetFormState = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('Referral');
    setFormIndustry('SaaS & Technology');
    setFormStatus('New');
    setFormAssignedTo('');
    setFormNotes('');
    setFormCompanyAddress('');
    setFormCompanyEmail('');
    setFormCompanyWebsite('');
    setFormPocDepartment('');
    setFormEmployeeType('employee');
    setFormEmployeeSelectedId('');
    setFormEmployeeDetailsText('');
    setFormDate('');
    setFormTime('');
    setShowAddLeadModal(false);
  };

  const chartData = [
    { month: 'Jan', percentage: 20, revenue: '₹2.4L' },
    { month: 'Feb', percentage: 45, revenue: '₹5.4L' },
    { month: 'Mar', percentage: 35, revenue: '₹4.2L' },
    { month: 'Apr', percentage: 70, revenue: '₹8.4L' },
    { month: 'May', percentage: 85, revenue: '₹10.2L' },
    { month: 'Jun', percentage: 100, revenue: '₹12.0L' },
  ];

  // Lead status styling mapper
  const getLeadDesign = (status) => {
    switch (status?.toLowerCase()) {
      case 'qualified':
        return {
          barBg: 'bg-blue-500',
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-600',
        };
      case 'contacted':
        return {
          barBg: 'bg-orange-500',
          badgeBg: 'bg-orange-50',
          badgeText: 'text-orange-600',
        };
      case 'won':
        return {
          barBg: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-600',
        };
      case 'new':
      case 'lead':
      default:
        return {
          barBg: 'bg-gray-400',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-600',
        };
    }
  };

  // Filtered list of leads for search queries
  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return leadsList;
    return leadsList.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.status.toLowerCase().includes(query)
      );
    });
  }, [leadsList, searchQuery]);

  // Filtered list of logged activities for the selected lead
  const leadActivities = useMemo(() => {
    if (!selectedLeadDetail) return [];
    let list = activitiesList.filter((act) => act.leadId === selectedLeadDetail.id);
    
    // Find representative details from dbEmployees using lead's assigneeId/employeeSelectedId
    const repEmp = dbEmployees.find(e => e.id === selectedLeadDetail.employeeSelectedId);
    
    // Format lead date and time
    let leadDate = '';
    let leadTime = '10:00';
    if (selectedLeadDetail.date) {
      const d = new Date(selectedLeadDetail.date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      leadDate = (new Date(d - tzOffset)).toISOString().slice(0, 10);
      leadTime = selectedLeadDetail.time || '10:00';
    } else {
      leadDate = new Date().toISOString().slice(0, 10);
    }

    // Construct the initial Representative Assignment activity row using lead's own data
    const initialActivity = {
      id: `init-${selectedLeadDetail.id}`,
      leadId: selectedLeadDetail.id,
      data: selectedLeadDetail.notes || 'Representative Assignment',
      date: leadDate,
      time: leadTime,
      pocName: selectedLeadDetail.name,
      pocEmail: selectedLeadDetail.email || 'N/A',
      pocPhone: selectedLeadDetail.phone || 'N/A',
      pocDept: selectedLeadDetail.pocDepartment || 'N/A',
      repName: selectedLeadDetail.assignedTo || 'Unassigned',
      repType: selectedLeadDetail.employeeType === 'contract' ? 'Contract' : 'Employee',
      repDept: repEmp ? (repEmp.department || 'N/A') : 'N/A',
      repRole: repEmp ? (repEmp.designation || 'N/A') : 'N/A',
      repPhone: repEmp ? (repEmp.phoneNumber || 'N/A') : 'N/A',
      repEmail: repEmp ? (repEmp.email || 'N/A') : 'N/A',
      reminderName: selectedLeadDetail.reminderName || null,
      reminderDate: selectedLeadDetail.reminderDate ? new Date(selectedLeadDetail.reminderDate).toISOString().slice(0, 10) : null,
      isInitial: true // flag to disable Edit/Delete actions in the table
    };

    // Filter manually logged activities by search query
    if (activitySearchTerm.trim()) {
      const q = activitySearchTerm.toLowerCase().trim();
      list = list.filter((act) => act.data.toLowerCase().includes(q));
    }
    
    // Sort manual activities using date and time
    list.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return activitySortOrder === 'newest' ? dateTimeB - dateTimeA : dateTimeA - dateTimeB;
    });
    
    // Check if initial activity matches the search query
    const matchesSearch = !activitySearchTerm.trim() || initialActivity.data.toLowerCase().includes(activitySearchTerm.toLowerCase().trim());
    
    if (matchesSearch) {
      if (activitySortOrder === 'newest') {
        // Initial activity is the oldest, so append it to the end
        return [...list, initialActivity];
      } else {
        // Prepend it to the start
        return [initialActivity, ...list];
      }
    }
    
    return list;
  }, [activitiesList, selectedLeadDetail, dbEmployees, activitySearchTerm, activitySortOrder]);

  if (pageLoading || isSubmitting) {
    return <Loader label={isSubmitting ? submitLabel : "Loading CRM Module..."} />;
  }

  if (!canViewCrm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 animate-fadeIn">
        <XCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Access Denied</h2>
        <p className="max-w-md text-center leading-relaxed">
          You do not have permission to view the CRM module. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-left h-full flex flex-col min-h-0 bg-[#f8fafc] p-1">
      
      {/* Dynamic View: Lead Detail Sub-page */}
      {selectedLeadDetail ? (
        <CRMLeadDetail
          selectedLeadDetail={selectedLeadDetail}
          setSelectedLeadDetail={setSelectedLeadDetail}
          canControlCrm={canControlCrm}
          setFormMoveStatus={setFormMoveStatus}
          setShowMoveCustomerModal={setShowMoveCustomerModal}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          formatTime24Hours={formatTime24Hours}
          formatTimeAMPM={formatTimeAMPM}
          activitySearchTerm={activitySearchTerm}
          setActivitySearchTerm={setActivitySearchTerm}
          activitySortOrder={activitySortOrder}
          setActivitySortOrder={setActivitySortOrder}
          handleLogNewActivityLeadClick={handleLogNewActivityLeadClick}
          leadActivities={leadActivities}
          handleViewLeadClick={handleViewLeadClick}
          handleEditActivityClick={handleEditActivityClick}
          handleDeleteActivity={handleDeleteActivity}
          handleEditLeadClick={handleEditLeadClick}
          handleDeleteLead={handleDeleteLead}
        />






      ) : (
        <>
        
          <CRMHeader />

          {/* 2. Main Content Card - Matching Finance content wrapper */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm p-4 m-0.5 mt-1.5 min-h-0">
            {/* Tabs switcher */}
            <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-4 mb-3 border-b border-gray-300 w-full">
              <div className="flex items-center overflow-x-auto gap-1.5">
                {['Dashboard', 'Leads'].map((tab) => (
                  <TabButton
                    key={tab}
                    isActive={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </TabButton>
                ))}
              </div>
            </div>

            {/* Scrollable interior content */}
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pt-2">
              {/* Dashboard Tab */}
              {activeTab === 'Dashboard' && (
                <CRMDashboardOverview
                  authUser={authUser}
                  tasksCount={tasksCount}
                  leadsCount={leadsCount}
                  qualifiedCount={qualifiedCount}
                  oppCount={oppCount}
                  chartData={chartData}
                  recentActivities={recentActivities}
                  upcomingTasks={upcomingTasks}
                />
              )}

              {/* Leads Management Tab */}
              {activeTab === 'Leads' && (
                <CRMLeadsTab
                  leadsList={leadsList}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  canControlCrm={canControlCrm}
                  handleAddLeadClick={handleAddLeadClick}
                  counts={counts}
                  filteredLeads={filteredLeads}
                  getLeadDesign={getLeadDesign}
                  setSelectedLeadDetail={setSelectedLeadDetail}
                  handleLogNewActivityLeadClick={handleLogNewActivityLeadClick}
                  handleEditLeadClick={handleEditLeadClick}
                  handleDeleteLead={handleDeleteLead}
                  formatDateTime={formatDateTime}
                />
              )}

              {/* Placeholder views for other tabs */}
              {activeTab !== 'Dashboard' && activeTab !== 'Leads' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#004475] mb-4 shadow-inner">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">{activeTab} tab is ready!</h3>
                  <p className="text-sm font-semibold text-slate-500 max-w-sm mt-1">
                    We've set up the routing for this section. Fully custom controls and dynamic forms will render here.
                  </p>
                  <button
                    onClick={() => setActiveTab('Dashboard')}
                    className="mt-6 px-4 py-2 bg-[#004475] hover:bg-[#33a8d9] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>

        
        </>
      )}
        
      <CRMLeadModal
        showAddLeadModal={showAddLeadModal} setShowAddLeadModal={setShowAddLeadModal}
        modalMode={modalMode} handleAddLead={handleAddLead}
        formCompany={formCompany} setFormCompany={setFormCompany}
        formCompanyEmail={formCompanyEmail} setFormCompanyEmail={setFormCompanyEmail}
        formCompanyWebsite={formCompanyWebsite} setFormCompanyWebsite={setFormCompanyWebsite}
        formCompanyAddress={formCompanyAddress} setFormCompanyAddress={setFormCompanyAddress}
        formFirstName={formFirstName} setFormFirstName={setFormFirstName}
        formLastName={formLastName} setFormLastName={setFormLastName}
        formPocDepartment={formPocDepartment} setFormPocDepartment={setFormPocDepartment}
        formPhone={formPhone} setFormPhone={setFormPhone}
        formEmail={formEmail} setFormEmail={setFormEmail}
        pocDropdownRef={pocDropdownRef} isPocDropdownOpen={isPocDropdownOpen} setIsPocDropdownOpen={setIsPocDropdownOpen}
        pocSearchQuery={pocSearchQuery} setPocSearchQuery={setPocSearchQuery} filteredPocSuggestions={filteredPocSuggestions}
        formEmployeeType={formEmployeeType} setFormEmployeeType={setFormEmployeeType} representativeDropdownRef={representativeDropdownRef}
        representativeSearch={representativeSearch} setRepresentativeSearch={setRepresentativeSearch} isRepresentativeDropdownOpen={isRepresentativeDropdownOpen}
        setIsRepresentativeDropdownOpen={setIsRepresentativeDropdownOpen} formEmployeeSelectedId={formEmployeeSelectedId} setFormEmployeeSelectedId={setFormEmployeeSelectedId}
        formEmployeeDetailsText={formEmployeeDetailsText} filteredSuggestions={filteredSuggestions}
        formDate={formDate} setFormDate={setFormDate} formTime={formTime} setFormTime={setFormTime} reminderDropdownRef={reminderDropdownRef}
        formReminderName={formReminderName} setFormReminderName={setFormReminderName} isReminderDropdownOpen={isReminderDropdownOpen}
        setIsReminderDropdownOpen={setIsReminderDropdownOpen} filteredReminderPocSuggestions={filteredReminderPocSuggestions} formReminderDate={formReminderDate}
        setFormReminderDate={setFormReminderDate} formNotes={formNotes} setFormNotes={setFormNotes} currentEditingLead={currentEditingLead}
        formatDateTime={formatDateTime} isSubmitting={isSubmitting}
      />



      <CustomModalForm
        open={showMoveCustomerModal}
        onClose={() => setShowMoveCustomerModal(false)}
        title="Move Customer Status"
        widthClass="max-w-sm"
      >
        <form onSubmit={handleSaveMoveCustomer} className="space-y-4 p-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Target Status / Stage
            </label>
            <select
              value={formMoveStatus}
              onChange={(e) => setFormMoveStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-sm text-slate-805 px-3 py-2 rounded-lg transition-colors cursor-pointer font-semibold"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Won">Won (Customer)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowMoveCustomerModal(false)}
              className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-705 font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#004475] hover:bg-[#33a8d9] text-white font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 duration-200"
            >
              <span>Save Status</span>
            </button>
          </div>
        </form>
      </CustomModalForm>

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteLead}
        title="Delete Lead"
        message={`Are you sure you want to delete lead "${leadToDelete?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isSubmitting}
        details={
          leadToDelete && (
            <div className="text-sm">
              <p className="font-bold">{leadToDelete.company}</p>
              <p className="text-gray-500">ID: {leadToDelete.id}</p>
            </div>
          )
        }
      />

      <CustomAlertForm
        isOpen={showActivityDeleteConfirm}
        onClose={() => setShowActivityDeleteConfirm(false)}
        onConfirm={confirmDeleteActivity}
        title="Delete Logged Activity"
        message="Are you sure you want to delete this logged activity? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
    </>
  );
}
