'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../store/slices/authSlice';
import TabButton from '../../components/Buttons/TabButton';
import CRMDashboardOverview from '../../components/CRM/CRMDashboardOverview';
import Loader from '../../components/Loader';
import CRMLeadsTab from '../../components/CRM/CRMLeadsTab';
import CRMInterviewTab from '../../components/CRM/CRMInterviewTab';
import CRMLocalLeadsTab from '../../components/CRM/CRMLocalLeadsTab';

import CRMHeader from '../../components/CRM/CRMHeader';
import CRMLeadModal from '../../components/CRM/CRMLeadModal';
import CRMCompanyModal from '../../components/CRM/CRMCompanyModal';
import CRMCompaniesTab from '../../components/CRM/CRMCompaniesTab';
import CRMPlaceholderTab from '../../components/CRM/CRMPlaceholderTab';
import CRMMoveCustomerModal from '../../components/CRM/CRMMoveCustomerModal';
import CRMDeleteModals from '../../components/CRM/CRMDeleteModals';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import {
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  SOURCE_KEYS,
  formatDateTime,
  getLeadDesign,
  CRM_CHART_DATA,
} from '../../components/CRM/crmUtils';

export default function CRMDashboard() {
  const authUser = useSelector(selectAuthUser);

  // ── Rights computation ──────────────────────────────────────────────────────
  const { 
    canViewCrm, canControlCrm, 
    canViewDashboard, canControlDashboard, 
    canViewLeads, canControlLeads, 
    canViewCompanies, canControlCompanies, 
    canViewInterview, canControlInterview, 
    canViewContacted, canControlContacted,
    canViewLocalLead, canControlLocalLead
  } = useMemo(() => {
    if (!authUser)
      return {
        canViewCrm: false, canControlCrm: false,
        canViewDashboard: false, canControlDashboard: false,
        canViewLeads: false, canControlLeads: false,
        canViewCompanies: false, canControlCompanies: false,
        canViewInterview: false, canControlInterview: false,
        canViewContacted: false, canControlContacted: false,
        canViewLocalLead: false, canControlLocalLead: false,
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
      canViewCrm: isSuperAdmin || normalizedRights.some(r => r.includes('crm')),
      canControlCrm: isSuperAdmin || checkRight('crm_module_control'),
      canViewDashboard: isSuperAdmin || checkRight('crm_dashboard_view') || checkRight('crm_dashboard_control'),
      canControlDashboard: isSuperAdmin || checkRight('crm_dashboard_control'),
      canViewLeads: isSuperAdmin || checkRight('crm_leads_view') || checkRight('crm_leads_control'),
      canControlLeads: isSuperAdmin || checkRight('crm_leads_control'),
      canViewCompanies: isSuperAdmin || checkRight('crm_companies_view') || checkRight('crm_companies_control'),
      canControlCompanies: isSuperAdmin || checkRight('crm_companies_control'),
      canViewInterview: isSuperAdmin || checkRight('crm_interview_view') || checkRight('crm_interview_control'),
      canControlInterview: isSuperAdmin || checkRight('crm_interview_control'),
      canViewContacted: isSuperAdmin || checkRight('crm_contacted_view') || checkRight('crm_contacted_control'),
      canControlContacted: isSuperAdmin || checkRight('crm_contacted_control'),
      canViewLocalLead: isSuperAdmin || checkRight('crm_localleads_view') || checkRight('crm_localleads_control') || checkRight('crm_leads_view') || checkRight('crm_leads_control'),
      canControlLocalLead: isSuperAdmin || checkRight('crm_localleads_control') || checkRight('crm_leads_control'),
    };
  }, [authUser]);
  
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  useEffect(() => {
    const tabs = ['Dashboard', 'Leads', 'Companies', 'Contacted', 'Local Lead', 'Interview'].filter((tab) => {
      if (tab === 'Dashboard') return canViewDashboard;
      if (tab === 'Leads') return canViewLeads;
      if (tab === 'Companies') return canViewCompanies;
      if (tab === 'Contacted') return canViewContacted;
      if (tab === 'Local Lead') return canViewLocalLead;
      if (tab === 'Interview') return canViewInterview;
      return true;
    });
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [canViewDashboard, canViewLeads, canViewCompanies, canViewContacted, canViewLocalLead, canViewInterview, activeTab]);
  
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingLeadId, setEditingLeadId] = useState(null);

  // Search input state for Leads tab
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
  const [companiesList, setCompaniesList] = useState([]);
  const [interviewsList, setInterviewsList] = useState([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [debouncedCompanySearchQuery, setDebouncedCompanySearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCompanySearchQuery(companySearchQuery), 300);
    return () => clearTimeout(timer);
  }, [companySearchQuery]);

  const [companySourceFilter, setCompanySourceFilter] = useState([]);
  
  const filteredCompanies = useMemo(() => {
    let result = companiesList;
    if (companySourceFilter.length > 0) {
      result = result.filter(company => {
        const rawSource = company.source || 'No Source';
        const normalizedSource = SOURCE_KEYS.find(s => s.toLowerCase() === rawSource.toLowerCase()) || rawSource;
        return companySourceFilter.includes(normalizedSource);
      });
    }
    if (!debouncedCompanySearchQuery.trim()) return result;
    const q = debouncedCompanySearchQuery.toLowerCase().trim();
    return result.filter(company => 
      (company.name && company.name.toLowerCase().includes(q)) ||
      (company.companyId && company.companyId.toLowerCase().includes(q)) ||
      (company.contactName && company.contactName.toLowerCase().includes(q)) ||
      (company.email && company.email.toLowerCase().includes(q)) ||
      (company.industry && company.industry.toLowerCase().includes(q))
    );
  }, [companiesList, debouncedCompanySearchQuery, companySourceFilter]);

  const currentEditingLead = leadsList.find((l) => l.id === editingLeadId);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [showCompanyDeleteConfirm, setShowCompanyDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

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
  const [formLeadName, setFormLeadName] = useState('');
  const [formLeadWhatsapp, setFormLeadWhatsapp] = useState('');
  const [formLeadLinkedin, setFormLeadLinkedin] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSource, setFormSource] = useState('Referral');
  const [formIndustry, setFormIndustry] = useState('SaaS & Technology');
  const [formStage, setFormStage] = useState('New');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formExpectedRevenue, setFormExpectedRevenue] = useState('');
  const [formVisibility, setFormVisibility] = useState('Everyone');

  // New Form Field States for Company details
  const [formCompanyAddress, setFormCompanyAddress] = useState('');
  const [formCompanyEmail, setFormCompanyEmail] = useState('');
  const [formCompanyWebsite, setFormCompanyWebsite] = useState('');
  const [formCompanyLinkedin, setFormCompanyLinkedin] = useState('');
  
  // New Form Field States for Companies Tab
  const [formCompanyIndustry, setFormCompanyIndustry] = useState('');
  const [formCompanyCity, setFormCompanyCity] = useState('');
  const [formCompanyState, setFormCompanyState] = useState('');
  const [formCompanyCountry, setFormCompanyCountry] = useState('');
  const [formCompanyContactName, setFormCompanyContactName] = useState('');
  const [formCompanyContactPhone, setFormCompanyContactPhone] = useState('');
  const [formCompanyDocumentUrl, setFormCompanyDocumentUrl] = useState('');
  const [formCompanySource, setFormCompanySource] = useState('');

  // New Form Field States for POC details
  const [formPocDepartment, setFormPocDepartment] = useState('');

  // New Form Field States for Lead Date and Time
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  // New Form Field States for Follow Ups
  const [formFollowUps, setFormFollowUps] = useState([]);

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



  // Close POC and Reminder suggestions dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pocDropdownRef.current && !pocDropdownRef.current.contains(event.target)) {
        setIsPocDropdownOpen(false);
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

  const fetchInterviewsData = async () => {
    try {
      const res = await fetch('/api/crm?type=interview');
      if (res.ok) {
        const data = await res.json();
        
        // Group by base interviewId if available, fallback to candidateName + title + companyName
        const groups = {};
        data.forEach(interview => {
          let key;
          if (interview.interviewId && interview.interviewId.startsWith('LK-CRM-INT-')) {
            key = interview.interviewId.split('-R')[0];
          } else {
            const candidate = (interview.candidateName || '').toLowerCase().trim();
            const title = (interview.title || '').toLowerCase().trim();
            const company = (interview.companyName || '').toLowerCase().trim();
            key = `${candidate}||${title}||${company}`;
          }
          if (!groups[key]) groups[key] = [];
          groups[key].push(interview);
        });
        
        // Sort each group by createdAt ascending so index 0 is Round 1
        const groupedArray = Object.values(groups).map(group => {
           return group.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        
        // Sort the entire array by the most recent round's createdAt descending
        groupedArray.sort((a,b) => new Date(b[b.length-1].createdAt) - new Date(a[a.length-1].createdAt));
        
        setInterviewsList(groupedArray);
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
    }
  };

  // Load employees & leads from DB on mount
  useEffect(() => {
    const loadAllData = async () => {
      fetchInterviewsData();
      try {
        setPageLoading(true);
        let currentDbEmployees = [];
        const empRes = await fetch('/api/employees');
        if (empRes.ok) {
          currentDbEmployees = await empRes.json();
          setDbEmployees(currentDbEmployees);
        }

        const res = await fetch('/api/crm', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const dbLeads = data.filter(d => d.companyName !== 'ACTIVITY_LOG');
          const dbActivities = data.filter(d => d.companyName === 'ACTIVITY_LOG');
            
          const companiesRes = await fetch('/api/crm?type=company', { cache: 'no-store' });
          if (companiesRes.ok) {
            const companiesData = await companiesRes.json();
            setCompaniesList(companiesData.map(c => ({
              id: c.id,
              companyId: c.companyId,
              name: c.companyName,
              email: c.email || '',
              website: c.websiteUrl || '',
              linkedin: c.linkedinUrl || '',
              address: c.address || '',
              expectedRevenue: c.expectedRevenue || '',
              industry: c.industry || '',
              city: c.city || '',
              state: c.state || '',
              country: c.country || '',
              contactName: c.contactName || '',
              contactPhone: c.contactPhone || '',
              source: c.source || '',
              documentUrl: c.documentUrl || '',
            })));
          }

          const mappedLeads = dbLeads.map((lead) => {
            const dbEmp = lead.leadOwnerId ? currentDbEmployees.find(e => e.id === lead.leadOwnerId) : null;
            return {
              id: lead.id,
              firstName: lead.leadName ? lead.leadName.split(' ')[0] : '',
              lastName: lead.leadName ? lead.leadName.split(' ').slice(1).join(' ') : '',
              name: lead.leadName,
              company: lead.companyName,
              email: lead.email || '',
              phone: lead.phoneNumber || '',
              whatsapp: lead.whatsapp || '',
              source: lead.source || 'Referral',
              expectedRevenue: lead.expectedRevenue || '',
              industry: 'SaaS & Technology',
              status: lead.leadStage || 'New',
              assignedTo: dbEmp ? `${dbEmp.firstName} ${dbEmp.lastName}` : lead.leadOwnerName || 'Unassigned',
              notes: lead.activityDetails || '',
              companyAddress: lead.companyAddress || '',
              companyEmail: lead.companyEmail || '',
              companyWebsite: lead.websiteUrl || '',
              companyLinkedin: lead.linkedinUrl || '',
              pocDepartment: lead.department || '',
              employeeType: lead.leadOwnerType?.toLowerCase() === 'employee' ? 'employee' : 'contract',
              employeeSelectedId: lead.leadOwnerId || '',
              employeeDetailsText: dbEmp ? 
                `Name: ${dbEmp.firstName} ${dbEmp.lastName}\nDepartment: ${dbEmp.department || 'N/A'}\nRole: ${dbEmp.designation || 'N/A'}\nPhone: ${dbEmp.phoneNumber || 'N/A'}\nEmail: ${dbEmp.email || 'N/A'}` : '',
              title: 'Project Lead',
              location: lead.companyAddress || 'San Francisco, CA',
              leadId: lead.leadId,
              leadScore: 75,
              annualRevenue: '$10M - $25M',
              date: lead.date,
              time: lead.time,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt,
              createdBy: lead.createdBy,
              updatedBy: lead.updatedBy,
              followUps: lead.followUps || [],
              visibility: lead.visibility || 'Everyone',
            };
          });

          const mappedActivities = dbActivities.map((act) => {
            const repEmp = act.leadOwnerId ? currentDbEmployees.find(e => e.id === act.leadOwnerId) : null;
            return {
              id: act.id,
              leadId: act.companyAddress, // Parent lead ID stored in companyAddress
              data: act.activityDetails || '',
              date: act.date ? new Date(act.date).toISOString().slice(0, 10) : '',
              time: act.time || '',
              pocName: act.leadName || '',
              pocEmail: act.email || '',
              pocPhone: act.phoneNumber || '',
              pocDept: act.department || '',
              repName: repEmp ? `${repEmp.firstName} ${repEmp.lastName}` : 'Unassigned',
              repType: act.leadOwnerType === 'EMPLOYEE' ? 'Employee' : 'Contract',
              repDept: repEmp?.department || 'N/A',
              repRole: repEmp?.designation || 'N/A',
              repPhone: repEmp?.phoneNumber || 'N/A',
              repEmail: repEmp?.email || 'N/A',
              followUps: act.followUps || [],
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
  const handleAddLeadClick = (defaultStageOrEvent) => {
    const stage = typeof defaultStageOrEvent === 'string' ? defaultStageOrEvent : 'New';
    setModalMode('add');
    setEditingLeadId(null);
    setFormLeadName('');
    setFormLeadWhatsapp('');
    setFormLeadLinkedin('');
    setFormCompany('');
    setFormExpectedRevenue('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('');
    setFormIndustry('SaaS & Technology');
    setFormStage(stage);
    setFormVisibility('Everyone');
    setFormAssignedTo('');
    setFormNotes('');
    setFormCompanyAddress('');
    setFormCompanyEmail('');
    setFormCompanyWebsite('');
    setFormCompanyLinkedin('');
    setFormPocDepartment('');
    setFormEmployeeType('employee');
    setFormEmployeeSelectedId('');
    setFormEmployeeDetailsText('');
    setRepresentativeSearch('');
    setFormFollowUps([]);
    
    // Set date and time
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString();
    setFormDate(localISOTime.slice(0, 10));
    setFormTime(localISOTime.slice(11, 16));

    setShowAddLeadModal(true);
  };

  const handleAddCompanyClick = () => {
    setModalMode('add');
    setFormCompany('');
    setFormCompanyEmail('');
    setFormCompanyWebsite('');
    setFormCompanyLinkedin('');
    setFormCompanyAddress('');
    setFormExpectedRevenue('');
    setFormCompanyIndustry('');
    setFormCompanyCity('');
    setFormCompanyState('');
    setFormCompanyCountry('');
    setFormCompanyContactName('');
    setFormCompanyContactPhone('');
    setFormCompanyDocumentUrl('');
    setFormCompanySource('');
    setShowCompanyModal(true);
  };

  const handleViewCompanyClick = (company) => {
    setModalMode('view');
    setFormCompany(company.name || '');
    setFormCompanyEmail(company.email || '');
    setFormCompanyWebsite(company.website || '');
    setFormCompanyLinkedin(company.linkedin || '');
    setFormCompanyAddress(company.address || '');
    setFormExpectedRevenue(company.expectedRevenue || '');
    setFormCompanyIndustry(company.industry || '');
    setFormCompanyCity(company.city || '');
    setFormCompanyState(company.state || '');
    setFormCompanyCountry(company.country || '');
    setFormCompanyContactName(company.contactName || '');
    setFormCompanyContactPhone(company.contactPhone || '');
    setFormCompanyDocumentUrl(company.documentUrl || '');
    setFormCompanySource(company.source || '');
    setShowCompanyModal(true);
  };

  const handleEditCompanyClick = (company) => {
    setModalMode('edit');
    setEditingCompanyId(company.id);
    setFormCompany(company.name || '');
    setFormCompanyEmail(company.email || '');
    setFormCompanyWebsite(company.website || '');
    setFormCompanyLinkedin(company.linkedin || '');
    setFormCompanyAddress(company.address || '');
    setFormExpectedRevenue(company.expectedRevenue || '');
    setFormCompanyIndustry(company.industry || '');
    setFormCompanyCity(company.city || '');
    setFormCompanyState(company.state || '');
    setFormCompanyCountry(company.country || '');
    setFormCompanyContactName(company.contactName || '');
    setFormCompanyContactPhone(company.contactPhone || '');
    setFormCompanyDocumentUrl(company.documentUrl || '');
    setFormCompanySource(company.source || '');
    setShowCompanyModal(true);
  };

  const handleDeleteCompanyClick = (company) => {
    setCompanyToDelete(company);
    setShowCompanyDeleteConfirm(true);
  };

  const confirmDeleteCompany = async () => {
    if (companyToDelete) {
      setIsDeletingCompany(true);
      try {
        const res = await fetch(`/api/crm/${companyToDelete.id}?type=company`, { method: 'DELETE' });
        if (res.ok) {
          setCompaniesList(prev => prev.filter(c => c.id !== companyToDelete.id));
          showSuccessToast('Company deleted successfully!');
        } else {
          showErrorToast('Failed to delete company');
        }
      } catch (err) {
        console.error(err);
        showErrorToast('An error occurred');
      } finally {
        setIsDeletingCompany(false);
        setShowCompanyDeleteConfirm(false);
        setCompanyToDelete(null);
      }
    }
  };


  // Edit Button Click Handler
  const handleEditLeadClick = (lead) => {
    setModalMode('edit');
    setEditingLeadId(lead.id);
    setFormLeadName(lead.name || '');
    setFormLeadWhatsapp(lead.whatsapp || '');
    setFormLeadLinkedin(lead.companyLinkedin || lead.linkedin || '');
    setFormCompany(lead.company || '');
    setFormExpectedRevenue(lead.expectedRevenue || '');
    setFormEmail(lead.email || '');
    setFormPhone(lead.phone || '');
    setFormSource(lead.source || '');
    setFormIndustry(lead.industry || 'SaaS & Technology');
    setFormStage(lead.status || 'New');
    setFormVisibility(lead.visibility || 'Everyone');
    setFormAssignedTo(lead.assignedTo || '');
    setRepresentativeSearch(lead.assignedTo || '');
    setFormNotes(lead.notes || '');
    setFormCompanyAddress(lead.companyAddress || '');
    setFormCompanyEmail(lead.companyEmail || '');
    setFormCompanyWebsite(lead.companyWebsite || '');
    setFormCompanyLinkedin(lead.companyLinkedin || '');
    setFormPocDepartment(lead.pocDepartment || '');
    setFormEmployeeType(lead.employeeType || 'employee');
    setFormEmployeeSelectedId(lead.employeeSelectedId || '');
    if (lead.followUps && Array.isArray(lead.followUps)) {
      setFormFollowUps(lead.followUps.map(fu => ({
        ...fu,
        date: fu.date ? new Date(new Date(fu.date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : ''
      })));
    } else {
      setFormFollowUps([]);
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
    setFormLeadName(lead.name || '');
    setFormLeadWhatsapp(lead.whatsapp || '');
    setFormLeadLinkedin(lead.companyLinkedin || lead.linkedin || '');
    setFormCompany(lead.company || '');
    setFormExpectedRevenue(lead.expectedRevenue || '');
    setFormEmail(lead.email || '');
    setFormPhone(lead.phone || '');
    setFormSource(lead.source || '');
    setFormIndustry(lead.industry || 'SaaS & Technology');
    setFormStage(lead.status || 'New');
    setFormVisibility(lead.visibility || 'Everyone');
    setFormAssignedTo(lead.assignedTo || '');
    setFormNotes(lead.notes || '');
    setFormCompanyAddress(lead.companyAddress || '');
    setFormCompanyEmail(lead.companyEmail || '');
    setFormCompanyWebsite(lead.companyWebsite || '');
    setFormCompanyLinkedin(lead.companyLinkedin || '');
    setFormPocDepartment(lead.pocDepartment || '');
    setFormEmployeeType(lead.employeeType || 'employee');
    setFormEmployeeSelectedId(lead.employeeSelectedId || '');
    if (lead.followUps && Array.isArray(lead.followUps)) {
      setFormFollowUps(lead.followUps.map(fu => ({
        ...fu,
        date: fu.date ? new Date(new Date(fu.date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : ''
      })));
    } else {
      setFormFollowUps([]);
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
    setFormLeadName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('');
    setFormIndustry('SaaS & Technology');
    setFormStage('New');
    setFormVisibility('Everyone');
    setFormAssignedTo('');
    setFormNotes('');
    setFormPocDepartment('');
    setFormEmployeeType('employee');
    setFormEmployeeSelectedId('');
    setFormEmployeeDetailsText('');
    setFormFollowUps([]);

    setModalMode('logActivity');
    
    const targetLead = lead || selectedLeadDetail;
    if (targetLead) {
      setEditingLeadId(targetLead.id);
      setFormCompany(targetLead.company || '');
      setFormExpectedRevenue(targetLead.expectedRevenue || '');
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
    setFormLeadName(pocNameParts.join(' ') || '');
    
    setFormEmail(activity.pocEmail || '');
    setFormPhone(activity.pocPhone || '');
    setFormPocDepartment(activity.pocDept || '');
    
    setFormNotes(activity.data || '');
    setFormDate(activity.date || '');
    setFormTime(activity.time || '');
    
    setFormEmployeeType(activity.repType === 'Contract' ? 'contract' : 'employee');
    const repEmp = dbEmployees.find(e => `${e.firstName} ${e.lastName}` === activity.repName);
    setFormEmployeeSelectedId(repEmp ? repEmp.id : '');
    
    setFormFollowUps([]);
    
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
    setIsDeletingActivity(true);
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
      setIsDeletingActivity(false);
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
      showErrorToast('Failed to update lead status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveToContacted = (lead) => {
    setSelectedLeadDetail(lead);
    setFormMoveStatus('Contacted');
    setShowMoveCustomerModal(true);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!formLeadName) return;

    const fullName = formLeadName;

    const leadPayload = {
      companyName: formCompany,
      expectedRevenue: formExpectedRevenue,
      companyAddress: formCompanyAddress,
      companyEmail: formCompanyEmail,
      websiteUrl: formCompanyWebsite,
      linkedinUrl: formLeadLinkedin,
      source: formSource,
      leadStage: formStage,
      visibility: formVisibility,
      leadName: fullName,
      department: formPocDepartment,
      phoneNumber: formPhone,
      whatsapp: formLeadWhatsapp,
      email: formEmail,
      leadOwnerType: 'EMPLOYEE',
      leadOwnerId: null,
      leadOwnerName: representativeSearch,
      date: formDate ? new Date(formDate).toISOString() : null,
      time: formTime || null,
      activityDetails: formNotes,
      followUps: formFollowUps,
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
            firstName: formLeadName.split(' ')[0] || '',
            lastName: formLeadName.split(' ').slice(1).join(' ') || '',
            name: fullName,
            company: formCompany,
            expectedRevenue: formExpectedRevenue,
            email: formEmail,
            phone: formPhone,
            source: formSource,
            industry: formIndustry,
            status: formStage,
            visibility: formVisibility,
            assignedTo: representativeSearch || 'Unassigned',
            notes: formNotes,
            title: oldLead?.title || 'Senior Consultant',
            location: oldLead?.location || 'San Francisco, CA',
            leadId: updatedLeadFromDb.leadId || oldLead?.leadId,
            leadScore: oldLead?.leadScore || 70,
            annualRevenue: oldLead?.annualRevenue || '$5M - $10M',
            companyAddress: formCompanyAddress,
            companyEmail: formCompanyEmail,
            companyWebsite: formCompanyWebsite,
            companyLinkedin: formLeadLinkedin,
            whatsapp: formLeadWhatsapp,
            pocDepartment: formPocDepartment,
            employeeType: formEmployeeType,
            employeeSelectedId: formEmployeeSelectedId,
            employeeDetailsText: formEmployeeDetailsText,
            followUps: updatedLeadFromDb.followUps || formFollowUps || [],
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
          if (oldStatus !== formStage) {
            setCounts((prev) => {
              const prevKey = oldStatus === 'Lead' ? 'New' : oldStatus;
              const newKey = formStage === 'Lead' ? 'New' : formStage;
              return {
                ...prev,
                [prevKey]: Math.max(0, (prev[prevKey] || 1) - 1),
                [newKey]: (prev[newKey] || 0) + 1,
              };
            });

            // Adjust main dashboard overview stats
            if (oldStatus === 'Qualified') setQualifiedCount((prev) => Math.max(0, prev - 1));
            if (formStage === 'Qualified') setQualifiedCount((prev) => prev + 1);
          }

          // Add to activity feed
          const editAct = {
            id: Date.now(),
            type: 'lead_edit',
            text: `Lead details updated: ${fullName} (${formCompany}) - Status: ${formStage}`,
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
        followUps: formFollowUps,
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
          const updatedAct = await res.json();
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
                    repType: formEmployeeType === 'Contract' ? 'Contract' : 'Employee',
                    repDept: repEmp ? (repEmp.department || 'N/A') : 'N/A',
                    repRole: repEmp ? (repEmp.designation || 'N/A') : 'N/A',
                    repPhone: repEmp ? (repEmp.phoneNumber || 'N/A') : 'N/A',
                    repEmail: repEmp ? (repEmp.email || 'N/A') : 'N/A',
                    followUps: updatedAct.followUps || formFollowUps || [],
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
        followUps: formFollowUps,
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
            followUps: savedAct.followUps || formFollowUps || [],
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
        const payloadWithId = { ...leadPayload, createdBy: authUser?.name || 'User' };
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithId),
        });
        if (res.ok) {
          const newLeadFromDb = await res.json();
          setLeadsCount((prev) => prev + 1);
          if (formStage === 'Qualified') setQualifiedCount((prev) => prev + 1);
          if (formStage === 'Proposal' || formStage === 'Negotiation') setOppCount((prev) => prev + 1);

          const stageKey = formStage === 'Lead' ? 'New' : formStage;
          const newLead = {
            id: newLeadFromDb.id,
            firstName: formLeadName.split(' ')[0] || '',
            lastName: formLeadName.split(' ').slice(1).join(' ') || '',
            name: fullName,
            company: formCompany,
            expectedRevenue: formExpectedRevenue,
            email: formEmail,
            phone: formPhone,
            source: formSource,
            industry: formIndustry,
            status: formStage === 'Lead' ? 'New' : formStage,
            visibility: formVisibility,
            assignedTo: representativeSearch || 'Unassigned',
            notes: formNotes,
            title: 'Project Lead',
            location: 'San Francisco, CA',
            leadId: newLeadFromDb.leadId,
            leadScore: 75,
            annualRevenue: '$10M - $25M',
            companyAddress: formCompanyAddress,
            companyEmail: formCompanyEmail,
            companyWebsite: formCompanyWebsite,
            companyLinkedin: formLeadLinkedin,
            whatsapp: formLeadWhatsapp,
            pocDepartment: formPocDepartment,
            employeeType: formEmployeeType,
            employeeSelectedId: formEmployeeSelectedId,
            employeeDetailsText: formEmployeeDetailsText,
            followUps: newLeadFromDb.followUps || formFollowUps || [],
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
            text: `New lead added: ${fullName} (${formCompany}) - Status: ${formStage}`,
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

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const fileInput = document.getElementById('company-document-upload');
    const file = fileInput?.files?.[0];

    const formData = new FormData();
    formData.append('type', 'company');
    formData.append('companyName', formCompany);
    formData.append('email', formCompanyEmail);
    formData.append('websiteUrl', formCompanyWebsite);
    formData.append('linkedinUrl', formCompanyLinkedin);
    formData.append('address', formCompanyAddress);
    formData.append('expectedRevenue', formExpectedRevenue);
    formData.append('industry', formCompanyIndustry);
    formData.append('city', formCompanyCity);
    formData.append('state', formCompanyState);
    formData.append('country', formCompanyCountry);
    formData.append('contactName', formCompanyContactName);
    formData.append('contactPhone', formCompanyContactPhone);
    formData.append('source', formCompanySource);

    if (file) {
      formData.append('document', file);
    } else if (formCompanyDocumentUrl && !formCompanyDocumentUrl.startsWith('blob:')) {
      formData.append('documentUrl', formCompanyDocumentUrl);
    }

    try {
      if (modalMode === 'edit') {
        const res = await fetch(`/api/crm/${editingCompanyId}?type=company`, {
          method: 'PUT',
          body: formData,
        });
        if (res.ok) {
          const updated = await res.json();
          setCompaniesList(prev => prev.map(c => c.id === editingCompanyId ? {
            ...c,
            companyId: updated.companyId,
            name: updated.companyName,
            email: updated.email || '',
            website: updated.websiteUrl || '',
            linkedin: updated.linkedinUrl || '',
            address: updated.address || '',
            expectedRevenue: updated.expectedRevenue || '',
            industry: updated.industry || '',
            city: updated.city || '',
            state: updated.state || '',
            country: updated.country || '',
            contactName: updated.contactName || '',
            contactPhone: updated.contactPhone || '',
            source: updated.source || '',
            documentUrl: updated.documentUrl || '',
          } : c));
          showSuccessToast('Company updated successfully!');
        } else {
          showErrorToast('Failed to update company');
        }
      } else {
        const res = await fetch('/api/crm', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const created = await res.json();
          const newCompany = {
            id: created.id,
            companyId: created.companyId,
            name: created.companyName,
            email: created.email || '',
            website: created.websiteUrl || '',
            linkedin: created.linkedinUrl || '',
            address: created.address || '',
            expectedRevenue: created.expectedRevenue || '',
            industry: created.industry || '',
            city: created.city || '',
            state: created.state || '',
            country: created.country || '',
            contactName: created.contactName || '',
            contactPhone: created.contactPhone || '',
            source: created.source || '',
            documentUrl: created.documentUrl || '',
          };
          setCompaniesList(prev => [newCompany, ...prev]);
          showSuccessToast('Company added successfully!');
        } else {
          showErrorToast('Failed to add company');
        }
      }
    } catch (err) {
      console.error(err);
      showErrorToast('An error occurred');
    } finally {
      setIsSubmitting(false);
      setShowCompanyModal(false);
    }
  };


  const resetFormState = () => {
    setFormLeadName('');
    setFormLeadWhatsapp('');
    setFormLeadLinkedin('');
    setFormCompany('');
    setFormExpectedRevenue('');
    setFormEmail('');
    setFormPhone('');
    setFormSource('Referral');
    setFormIndustry('SaaS & Technology');
    setFormStage('New');
    setFormVisibility('Everyone');
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

  const chartData = CRM_CHART_DATA;

  // Filtered list of leads for search queries
  const filteredLeads = useMemo(() => {
    let visibleLeads = leadsList;
    if (authUser?.empId !== 'Livik-DGL-0008') {
      visibleLeads = leadsList.filter((lead) => lead.visibility !== 'Show for me');
    }

    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return visibleLeads;
    return visibleLeads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.status.toLowerCase().includes(query)
      );
    });
  }, [leadsList, debouncedSearchQuery, authUser]);

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
      followUps: selectedLeadDetail.followUps || [],
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
      
      {/* Main Content */}
      <CRMHeader handleAddLeadClick={handleAddLeadClick} />

          {/* 2. Main Content Card - Matching Finance content wrapper */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm p-2 m-0.5 mt-1.5 min-h-0">
            {/* Tabs switcher */}
            <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-4 mb-3 border-b border-gray-300 w-full">
              <div className="flex items-center overflow-x-auto gap-1.5">
                {['Dashboard', 'Leads', 'Companies', 'Contacted', 'Local Lead', 'Interview']
                  .filter((tab) => {
                    if (tab === 'Dashboard') return canViewDashboard;
                    if (tab === 'Leads') return canViewLeads;
                    if (tab === 'Companies') return canViewCompanies;
                    if (tab === 'Contacted') return canViewContacted;
                    if (tab === 'Local Lead') return canViewLocalLead;
                    if (tab === 'Interview') return canViewInterview;
                    return true;
                  })
                  .map((tab) => (
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
                  canControlCrm={canControlLeads}
                  handleAddLeadClick={handleAddLeadClick}
                  counts={counts}
                  filteredLeads={filteredLeads}
                  getLeadDesign={getLeadDesign}
                  setSelectedLeadDetail={setSelectedLeadDetail}
                  handleLogNewActivityLeadClick={handleLogNewActivityLeadClick}
                  handleEditLeadClick={handleEditLeadClick}
                  handleViewLeadClick={handleViewLeadClick}
                  handleDeleteLead={handleDeleteLead}
                  formatDateTime={formatDateTime}
                  handleMoveToContacted={handleMoveToContacted}
                />
              )}

              {/* Contacted Tab */}
              {activeTab === 'Contacted' && (
                <CRMLeadsTab
                  tabType="Contacted"
                  addLabel="Add Contacted Lead"
                  leadsList={leadsList.filter(l => l.status === 'Contacted' || l.status?.toLowerCase() === 'contacted')}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  canControlCrm={canControlContacted}
                  handleAddLeadClick={() => handleAddLeadClick('Contacted')}
                  counts={counts}
                  filteredLeads={filteredLeads.filter(l => l.status === 'Contacted' || l.status?.toLowerCase() === 'contacted')}
                  getLeadDesign={getLeadDesign}
                  setSelectedLeadDetail={setSelectedLeadDetail}
                  handleLogNewActivityLeadClick={handleLogNewActivityLeadClick}
                  handleEditLeadClick={handleEditLeadClick}
                  handleViewLeadClick={handleViewLeadClick}
                  handleDeleteLead={handleDeleteLead}
                  formatDateTime={formatDateTime}
                />
              )}

              {/* Companies Tab */}
              {activeTab === 'Companies' && (
                <CRMCompaniesTab
                  companySearchQuery={companySearchQuery}
                  setCompanySearchQuery={setCompanySearchQuery}
                  canControlCompanies={canControlCompanies}
                  handleAddCompanyClick={handleAddCompanyClick}
                  handleViewCompanyClick={handleViewCompanyClick}
                  handleEditCompanyClick={handleEditCompanyClick}
                  handleDeleteCompanyClick={handleDeleteCompanyClick}
                  filteredCompanies={filteredCompanies}
                />
              )}

              {/* Local Lead Tab */}
              {activeTab === 'Local Lead' && (
                <CRMLocalLeadsTab
                  canControl={canControlLocalLead}
                  authUser={authUser}
                  dbEmployees={dbEmployees}
                />
              )}

              {/* Interview Tab */}
              {activeTab === 'Interview' && (
                <CRMInterviewTab
                  interviewsList={interviewsList}
                  refreshInterviews={fetchInterviewsData}
                  isLoading={pageLoading}
                  canControlInterview={canControlInterview}
                />
              )}

              {/* Placeholder views for other tabs */}
              {activeTab !== 'Dashboard' && activeTab !== 'Leads' && activeTab !== 'Contacted' && activeTab !== 'Companies' && activeTab !== 'Local Lead' && activeTab !== 'Interview' && (
                <CRMPlaceholderTab
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  handleAddLeadClick={handleAddLeadClick}
                />
              )}
            </div>
          </div>

        
      <CRMLeadModal
        showAddLeadModal={showAddLeadModal} setShowAddLeadModal={setShowAddLeadModal}
        modalMode={modalMode} setModalMode={setModalMode} handleAddLead={handleAddLead}
        formCompany={formCompany} setFormCompany={setFormCompany}
        formCompanyEmail={formCompanyEmail} setFormCompanyEmail={setFormCompanyEmail}
        formCompanyWebsite={formCompanyWebsite} setFormCompanyWebsite={setFormCompanyWebsite}
        formCompanyLinkedin={formCompanyLinkedin} setFormCompanyLinkedin={setFormCompanyLinkedin}
        formCompanyAddress={formCompanyAddress} setFormCompanyAddress={setFormCompanyAddress}
        formLeadName={formLeadName} setFormLeadName={setFormLeadName}
        formLeadWhatsapp={formLeadWhatsapp} setFormLeadWhatsapp={setFormLeadWhatsapp}
        formLeadLinkedin={formLeadLinkedin} setFormLeadLinkedin={setFormLeadLinkedin}
        formPocDepartment={formPocDepartment} setFormPocDepartment={setFormPocDepartment}
        formSource={formSource} setFormSource={setFormSource}
        formStage={formStage} setFormStage={setFormStage}
        formPhone={formPhone} setFormPhone={setFormPhone}
        formEmail={formEmail} setFormEmail={setFormEmail}
        pocDropdownRef={pocDropdownRef} isPocDropdownOpen={isPocDropdownOpen} setIsPocDropdownOpen={setIsPocDropdownOpen}
        pocSearchQuery={pocSearchQuery} setPocSearchQuery={setPocSearchQuery} filteredPocSuggestions={filteredPocSuggestions}
        formEmployeeType={formEmployeeType} setFormEmployeeType={setFormEmployeeType} representativeDropdownRef={representativeDropdownRef}
        representativeSearch={representativeSearch} setRepresentativeSearch={setRepresentativeSearch} isRepresentativeDropdownOpen={isRepresentativeDropdownOpen}
        setIsRepresentativeDropdownOpen={setIsRepresentativeDropdownOpen} formEmployeeSelectedId={formEmployeeSelectedId} setFormEmployeeSelectedId={setFormEmployeeSelectedId}
        formEmployeeDetailsText={formEmployeeDetailsText} filteredSuggestions={filteredSuggestions}
        formDate={formDate} setFormDate={setFormDate} formTime={formTime} setFormTime={setFormTime}
        formFollowUps={formFollowUps} setFormFollowUps={setFormFollowUps} formNotes={formNotes} setFormNotes={setFormNotes} currentEditingLead={currentEditingLead}
        formatDateTime={formatDateTime} isSubmitting={isSubmitting}
        formExpectedRevenue={formExpectedRevenue} setFormExpectedRevenue={setFormExpectedRevenue}
        formVisibility={formVisibility} setFormVisibility={setFormVisibility}
        authUser={authUser}
      />

      <CRMCompanyModal
        showModal={showCompanyModal} setShowModal={setShowCompanyModal}
        modalMode={modalMode} handleSave={handleSaveCompany}
        formCompany={formCompany} setFormCompany={setFormCompany}
        formCompanyEmail={formCompanyEmail} setFormCompanyEmail={setFormCompanyEmail}
        formCompanyWebsite={formCompanyWebsite} setFormCompanyWebsite={setFormCompanyWebsite}
        formCompanyLinkedin={formCompanyLinkedin} setFormCompanyLinkedin={setFormCompanyLinkedin}
        formCompanyAddress={formCompanyAddress} setFormCompanyAddress={setFormCompanyAddress}
        formExpectedRevenue={formExpectedRevenue} setFormExpectedRevenue={setFormExpectedRevenue}
        formCompanyIndustry={formCompanyIndustry} setFormCompanyIndustry={setFormCompanyIndustry}
        formCompanyCity={formCompanyCity} setFormCompanyCity={setFormCompanyCity}
        formCompanyState={formCompanyState} setFormCompanyState={setFormCompanyState}
        formCompanyCountry={formCompanyCountry} setFormCompanyCountry={setFormCompanyCountry}
        formCompanyContactName={formCompanyContactName} setFormCompanyContactName={setFormCompanyContactName}
        formCompanyContactPhone={formCompanyContactPhone} setFormCompanyContactPhone={setFormCompanyContactPhone}
        formCompanyDocumentUrl={formCompanyDocumentUrl} setFormCompanyDocumentUrl={setFormCompanyDocumentUrl}
        formCompanySource={formCompanySource} setFormCompanySource={setFormCompanySource}
        isSubmitting={isSubmitting}
      />



      <CRMMoveCustomerModal
        showMoveCustomerModal={showMoveCustomerModal}
        setShowMoveCustomerModal={setShowMoveCustomerModal}
        formMoveStatus={formMoveStatus}
        setFormMoveStatus={setFormMoveStatus}
        handleSaveMoveCustomer={handleSaveMoveCustomer}
        isSubmitting={isSubmitting}
      />

      <CRMDeleteModals
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        confirmDeleteLead={confirmDeleteLead}
        leadToDelete={leadToDelete}
        isSubmitting={isSubmitting}
        showCompanyDeleteConfirm={showCompanyDeleteConfirm}
        setShowCompanyDeleteConfirm={setShowCompanyDeleteConfirm}
        confirmDeleteCompany={confirmDeleteCompany}
        companyToDelete={companyToDelete}
        isDeletingCompany={isDeletingCompany}
        showActivityDeleteConfirm={showActivityDeleteConfirm}
        setShowActivityDeleteConfirm={setShowActivityDeleteConfirm}
        confirmDeleteActivity={confirmDeleteActivity}
        isDeletingActivity={isDeletingActivity}
      />
    </div>
    </>
  );
}
