'use client';
import CustomTable from '../CustomTable';
import Pagination from '../Pagination';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import StatCard from '../StatCard';
import PrimaryButton from '../Buttons/PrimaryButton';
import {
  Search,
  Star,
  Filter,
  Target,
  IndianRupee,
  TrendingUp,
  Bookmark,
  List,
  Download,
  Phone,
  Mail,
  MoreHorizontal,
  Linkedin,
  Globe,
  UsersRound,
  MessageCircle,
  Presentation,
  X,
  SquarePen,
  Trash,
  PlusCircle,
  Upload,
  Send,
  UserPlus2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import FilterDropdown from '../Buttons/FilterDropdown';
import IconButton from '../Buttons/IconButton';
import { showInfoToast, showSuccessToast } from '../Toast';

// ── Sub-tab (stage) definitions ─────────────────────────────────────────────
const STAGE_TABS = ['All Leads', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const STAGE_COLORS = {
  New: '#8b5cf6',
  Contacted: '#f59e0b',
  Qualified: '#14b8a6',
  Proposal: '#ec4899',
  Negotiation: '#3b82f6',
  Won: '#10b981',
  Lost: '#ef4444',
};

const EXTRA_STAGE_BADGES = {
  Proposal: { badgeBg: 'bg-pink-50', badgeText: 'text-pink-600' },
  Negotiation: { badgeBg: 'bg-sky-50', badgeText: 'text-sky-600' },
  Lost: { badgeBg: 'bg-red-50', badgeText: 'text-red-600' },
};

// ── Presentational demo data used only where the schema has no real field yet ──
const SOURCE_META = {
  LinkedIn: { icon: Linkedin, color: 'text-[#0a66c2]' },
  Website: { icon: Globe, color: 'text-emerald-600' },
  'Email': { icon: Mail, color: 'text-orange-500' },
  WhatsApp: { icon: FaWhatsapp, color: 'text-[#25D366]' },
};
const SOURCE_KEYS = Object.keys(SOURCE_META);

const INDUSTRY_POOL = ['SaaS & Technology', 'Healthcare', 'Finance & Banking', 'E-commerce', 'Manufacturing', 'Education', 'Real Estate'];
const COUNTRY_POOL = ['India', 'USA', 'UK', 'UAE', 'Singapore', 'Australia'];
const FOLLOW_UP_TYPES = ['Call', 'Demo', 'Proposal', 'Final Discussion', 'Meeting'];
const AVATAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-600', 'bg-rose-500', 'bg-indigo-500'];

function hashStr(str) {
  let h = 0;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function getInitials(name) {
  if (!name) return 'NA';
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  return initials || name.slice(0, 2).toUpperCase();
}

function formatShortDate(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatValue(value) {
  const num = Number(value) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num > 0) return `₹${num.toFixed(2)}`;
  return '₹0.00';
}

// Derives presentational-only fields for columns/filters not yet backed by the database
function augmentLead(lead, index) {
  const h = hashStr(lead.id ?? index);
  
  // Normalize status case
  let rawStatus = lead.status || 'New';
  if (rawStatus.toLowerCase() === 'lead') rawStatus = 'New';
  const status = STAGE_TABS.find(s => s.toLowerCase() === rawStatus.toLowerCase()) || 'New';

  // Normalize source case
  let rawSource = lead.source || 'Referral';
  const source = SOURCE_KEYS.find(s => s.toLowerCase() === rawSource.toLowerCase()) || rawSource;

  let followUpDate = null;
  let followUpType = 'Follow-up';
  let lastContactedDate = lead.updatedAt;
  
  if (lead.followUps && lead.followUps.length > 0) {
    const nextFollowUp = lead.followUps[lead.followUps.length - 1];
    if (nextFollowUp.date) followUpDate = new Date(nextFollowUp.date);
    if (nextFollowUp.notes) followUpType = nextFollowUp.notes;
    
    if (lead.followUps.length > 1) {
      const prevFollowUp = lead.followUps[lead.followUps.length - 2];
      if (prevFollowUp.date) lastContactedDate = new Date(prevFollowUp.date);
    }
  }

  return {
    ...lead,
    _status: status,
    _jobTitle: lead.pocDepartment || 'N/A',
    _source: source,
    _owner: lead.assignedTo && lead.assignedTo !== 'Unassigned' ? lead.assignedTo : 'Unassigned',
    _value: Number(lead.expectedRevenue) || 0,
    _followUpDate: followUpDate,
    _followUpType: followUpType,
    _lastContactedDate: lastContactedDate,
    _country: COUNTRY_POOL[(h >> 5) % COUNTRY_POOL.length],
    _industry: lead.industry || INDUSTRY_POOL[(h >> 7) % INDUSTRY_POOL.length],
    _avatarColor: AVATAR_COLORS[hashStr(lead.name || lead.id) % AVATAR_COLORS.length],
    _ownerAvatarColor: AVATAR_COLORS[hashStr(lead.assignedTo || 'Unassigned') % AVATAR_COLORS.length],
  };
}



function MultiSelectDropdown({ label, options, selected, onChange, className = 'w-40' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  const displayLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 bg-white hover:border-gray-400 shadow-sm transition-colors"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`ml-2 text-gray-900 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-45 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto py-1">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="w-3.5 h-3.5 rounded border-gray-300 accent-[#004475] cursor-pointer"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-xs font-bold text-red-500 hover:bg-red-50 py-2 border-t border-gray-100 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CRMLeadsTab({
  leadsList,
  searchQuery,
  setSearchQuery,
  canControlCrm,
  handleAddLeadClick,
  counts,
  filteredLeads,
  getLeadDesign,
  handleViewLeadClick,
  handleLogNewActivityLeadClick,
  handleEditLeadClick,
  handleDeleteLead,
  formatDateTime,
  handleMoveToContacted,
  tabType = 'Leads',
  addLabel = 'Add Lead',
}) {
  const [stageFilter, setStageFilter] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState([]);
  const [sourceFilter, setSourceFilter] = useState([]);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [starredIds, setStarredIds] = useState(new Set());
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [denseView, setDenseView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Full augmented dataset (independent of active filters) — used for overview stats & sidebar
  const augmentedAll = useMemo(() => leadsList.map((l, i) => augmentLead(l, i)), [leadsList]);

  // Search-filtered (from parent) + presentational fields
  const augmented = useMemo(() => filteredLeads.map((l, i) => augmentLead(l, i)), [filteredLeads]);

  const stageCounts = useMemo(() => {
    const c = { 'All Leads': leadsList.length };
    STAGE_TABS.slice(1).forEach((stage) => {
      c[stage] = augmentedAll.filter((l) => l._status === stage).length;
    });
    return c;
  }, [leadsList.length, augmentedAll]);

  const ownerOptions = useMemo(() => {
    const owners = new Set(augmentedAll.map((l) => l._owner));
    return Array.from(owners).sort();
  }, [augmentedAll]);

  const fullyFiltered = useMemo(() => {
    return augmented.filter((l) => {
      if (stageFilter.length && !stageFilter.includes(l._status)) return false;
      if (ownerFilter.length && !ownerFilter.includes(l._owner)) return false;
      if (sourceFilter.length && !sourceFilter.includes(l._source)) return false;
      if (industryFilter !== 'all' && l._industry !== industryFilter) return false;
      if (countryFilter !== 'all' && l._country !== countryFilter) return false;
      return true;
    });
  }, [augmented, stageFilter, ownerFilter, sourceFilter, industryFilter, countryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stageFilter, ownerFilter, sourceFilter, industryFilter, countryFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(fullyFiltered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = fullyFiltered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStageFilter([]);
    setOwnerFilter([]);
    setSourceFilter([]);
    setIndustryFilter('all');
    setCountryFilter('all');
  };

  const activeChips = [];
  if (stageFilter.length) activeChips.push({ key: 'stage', label: `Stage: ${stageFilter.join(', ')}`, clear: () => setStageFilter([]) });
  if (ownerFilter.length) activeChips.push({ key: 'owner', label: `Owner: ${ownerFilter.join(', ')}`, clear: () => setOwnerFilter([]) });
  if (sourceFilter.length) activeChips.push({ key: 'source', label: `Source: ${sourceFilter.join(', ')}`, clear: () => setSourceFilter([]) });
  if (industryFilter !== 'all') activeChips.push({ key: 'industry', label: `Industry: ${industryFilter}`, clear: () => setIndustryFilter('all') });
  if (countryFilter !== 'all') activeChips.push({ key: 'country', label: `Country: ${countryFilter}`, clear: () => setCountryFilter('all') });
  if (searchQuery) activeChips.push({ key: 'search', label: `Search: "${searchQuery}"`, clear: () => setSearchQuery('') });

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === fullyFiltered.length && fullyFiltered.length > 0) return new Set();
      return new Set(fullyFiltered.map((l) => l.id));
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStar = (id) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resolveStageDesign = (status) => EXTRA_STAGE_BADGES[status] || getLeadDesign(status);

  const totalValue = useMemo(() => augmentedAll.reduce((sum, l) => sum + l._value, 0), [augmentedAll]);
  const conversionRate = leadsList.length ? (((stageCounts['Won'] || 0) / leadsList.length) * 100).toFixed(2) : '0.00';

  const leadSourceBreakdown = useMemo(() => {
    const defs = [
      { label: 'Website', pct: 35 },
      { label: 'LinkedIn', pct: 25 },
      { label: 'Referral', pct: 15 },
      { label: 'Email', pct: 10 },
      { label: 'Conference', pct: 8 },
      { label: 'WhatsApp', pct: 5 },
      { label: 'Others', pct: 2 },
    ];
    return defs.map((d) => ({ ...d, count: Math.round((leadsList.length * d.pct) / 100) }));
  }, [leadsList.length]);

  const donutStops = useMemo(() => {
    const total = leadsList.length || 1;
    let cum = 0;
    return STAGE_TABS.slice(1).map((stage) => {
      const count = stageCounts[stage] || 0;
      const pct = (count / total) * 100;
      const start = cum;
      cum += pct;
      return { stage, count, pct, start, end: cum, color: STAGE_COLORS[stage] };
    });
  }, [stageCounts, leadsList.length]);

  const conicGradient = leadsList.length
    ? `conic-gradient(${donutStops.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
    : '#e5e7eb';

  const handleExportCsv = () => {
    if (!fullyFiltered.length) {
      showInfoToast('No leads to export.');
      return;
    }
    const headers = ['Name', 'Company', 'Job Title', 'Email', 'Phone', 'Source', 'Stage', 'Owner', 'Value (INR L)', 'Next Follow-up', 'Last Contacted'];
    const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvRows = fullyFiltered.map((l) => [
      l.name,
      l.company,
      l._jobTitle,
      l.email,
      l.phone,
      l._source,
      l._status,
      l._owner,
      l._value.toFixed(2),
      l._followUpDate ? formatShortDate(l._followUpDate) : '',
      formatShortDate(l.updatedAt) || '',
    ]);
    const csvContent = [headers, ...csvRows].map((r) => r.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccessToast('Leads exported successfully!');
  };

  const columns = [
    {
      key: 'name',
      label: 'Lead Name',
      render: (lead) => {
        const isStarred = starredIds.has(lead.id);
        return (
          <div className="flex items-center gap-2 min-w-0 justify-center">    
            <span 
              className="font-bold text-[#004475] hover:underline cursor-pointer truncate"
              onClick={(e) => {
                e.stopPropagation();
                handleViewLeadClick(lead);
              }}
            >
              {lead.name || 'N/A'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(lead.id);
              }}
              className={`shrink-0 transition-opacity ${isStarred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
             </button>
          </div>
        );
      },
    },
    {
      key: 'source',
      label: 'Source',
      render: (lead) => {
        const sourceMeta = SOURCE_META[lead._source];
        if (sourceMeta && sourceMeta.icon) {
          const SourceIcon = sourceMeta.icon;
          return (
            <div className="flex items-center gap-1.5 justify-center" title={lead._source}>
              <span className={`inline-flex items-center justify-center ${sourceMeta.color}`}>
               <SourceIcon size={18} />
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center text-gray-500 text-xs font-semibold" title="No Source">
            N/A
          </div>
        );
      },
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (lead) => {
        const design = resolveStageDesign(lead._status);
        return (
          <span className={`inline-block px-2 py-1 ${design.badgeBg} ${design.badgeText} text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap`}>
            {lead._status}
          </span>
        );
      },
    },
    {
      key: 'owner',
      label: 'Lead Owner',
      render: (lead) => (
        <div className="flex items-center gap-2 min-w-0 justify-center">
          <span className="text-gray-700 font-semibold truncate max-w-25">{lead._owner}</span>
        </div>
      ),
    },
   
    {
      key: 'followUp',
      label: 'Next Follow-up',
      className: 'whitespace-nowrap',
      render: (lead) => lead._followUpDate ? (
        <div className="flex flex-col">
          <span className="text-gray-800 font-bold text-sm">
           
            {formatShortDate(lead._followUpDate)}
          </span>
        </div>
      ) : (
        <span className="text-gray-300">—</span>
      ),
    },
    {
      key: 'lastContacted',
      label: 'Last Contacted',
      className: 'text-gray-500 font-medium whitespace-nowrap',
      render: (lead) => (
        <span title={formatDateTime(lead._lastContactedDate)}>
          {formatShortDate(lead._lastContactedDate) || 'N/A'}
        </span>
      ),
    }
  ];

  const renderActions = (lead) => (
    <div className="flex items-center justify-center gap-1 relative">
      {canControlCrm && (
        <>
          {tabType !== 'Contacted' && (
            <IconButton 
              onClick={(e) => { e.stopPropagation(); handleMoveToContacted(lead); }} 
              title="Move to Contacted" 
              className="text-[#004475] hover:text-[#33a8d9]"
            >
              <LogOut size={15} />
            </IconButton>
          )}
          <IconButton 
            onClick={(e) => { e.stopPropagation(); handleEditLeadClick(lead); }} 
            title="Edit Lead" 
            className="text-[#004475] hover:text-[#33a8d9]"
          >
            <SquarePen size={15} />
          </IconButton>
          <IconButton 
            onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }} 
            title="Delete Lead" 
            className="text-[#004475] hover:text-[#33a8d9]"
          >
            <Trash size={15} />
          </IconButton>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5 [animation-delay:100ms] animate-dashboard-reveal text-left">

      <div className="flex flex-col gap-3 px-1">
        {/* ── Main Column ─────────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          <div>
            <div className="flex flex-col md:flex-row items-center gap-3 justify-end">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads by name, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <div className="absolute right-1 top-0.5">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <MultiSelectDropdown label="All Sources" className="w-36" selected={sourceFilter} onChange={setSourceFilter} options={SOURCE_KEYS} />
                <PrimaryButton onClick={handleAddLeadClick}>
                  <span className="text-xl mr-1 leading-none">+</span>
                  {addLabel}
                </PrimaryButton>
              </div>
            </div>

          
          </div>

          {/* Leads Table */}
          <div className="bg-white border border-gray-100 rounded-[18px] shadow-sm overflow-hidden">
            <CustomTable
              columns={columns}
              data={paginatedLeads}
              rowKey="id"
              actions={renderActions}
              actionsHeader="Actions"
              actionsAlign="center"
              headerAlignment={{ name: 'center', source: 'center', owner: 'center' }}
              cellAlignment={{ name: 'center', source: 'center', owner: 'center' }}
              rowClassName={(lead) => `group hover:bg-[#f8fafc] transition-colors ${denseView ? 'h-10' : 'h-14'}`}
            />

            {/* Pagination Footer */}
            <div>
              <Pagination
                currentPage={safePage}
                totalItems={fullyFiltered.length}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setPageSize}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

function getPageNumbers(currentPage, totalPages) {
  const pageNumbers = [];
  const maxPagesToShow = 5;

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 4; i++) pageNumbers.push(i);
    pageNumbers.push('...');
    pageNumbers.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    pageNumbers.push(1);
    pageNumbers.push('...');
    for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    pageNumbers.push('...');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
    pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }
  return pageNumbers;
}
