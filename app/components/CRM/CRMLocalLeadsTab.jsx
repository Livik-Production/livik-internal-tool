'use client';

import React, { useState, useMemo, useEffect } from 'react';
import CustomTable from '../CustomTable';
import Pagination from '../Pagination';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import CustomAlertForm from '../CustomAlertForm';
import CRMLocalLeadModal from './CRMLocalLeadModal';
import CRMMoveCustomerModal from './CRMMoveCustomerModal';
import Loader from '../Loader';
import {
  Search,
  SquarePen,
  Trash,
  X,
  LogOut,
} from 'lucide-react';
import { getLeadDesign, formatDateTime } from '../../../utils/crmUtils';
import { showSuccessToast, showErrorToast } from '../Toast';

const SOURCE_BADGES = {
  linkedin: 'bg-sky-50 text-sky-700 border-sky-200',
  website: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  email: 'bg-amber-50 text-amber-700 border-amber-200',
  whatsapp: 'bg-green-50 text-green-700 border-green-200',
  referral: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  google: 'bg-blue-50 text-blue-700 border-blue-200',
  direct: 'bg-purple-50 text-purple-700 border-purple-200',
  call: 'bg-rose-50 text-rose-700 border-rose-200',
  'cold call': 'bg-rose-50 text-rose-700 border-rose-200',
};

const getSourceBadgeStyle = (source) => {
  if (!source || source === 'N/A') return 'bg-gray-50 text-gray-500 border-gray-200';
  const key = source.trim().toLowerCase();
  return SOURCE_BADGES[key] || 'bg-slate-50 text-slate-700 border-slate-200';
};

const EXTRA_STAGE_BADGES = {
  Proposal: { badgeBg: 'bg-pink-50', badgeText: 'text-pink-600' },
  Negotiation: { badgeBg: 'bg-sky-50', badgeText: 'text-sky-600' },
  Lost: { badgeBg: 'bg-red-50', badgeText: 'text-red-600' },
  New: { badgeBg: 'bg-purple-50', badgeText: 'text-purple-600' },
  Contacted: { badgeBg: 'bg-amber-50', badgeText: 'text-amber-600' },
  Qualified: { badgeBg: 'bg-teal-50', badgeText: 'text-teal-600' },
  Won: { badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600' },
};

const EMPTY_FORM = {
  id: '',
  leadId: '',
  leadName: '',
  phoneNumber: '',
  leadOwner: '',
  date: new Date().toISOString().slice(0, 10),
  whatsapp: '',
  email: '',
  linkedinUrl: '',
  companyName: '',
  source: '',
  visibility: 'Everyone',
  keywords: '',
  notes: '',
  stage: 'New',
  followUps: [],
};

function formatShortDate(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CRMLocalLeadsTab({
  canControl = true,
  authUser,
  dbEmployees = [],
}) {
  const [localLeads, setLocalLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Move Customer Status Modal state
  const [showMoveCustomerModal, setShowMoveCustomerModal] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState(null);
  const [formMoveStatus, setFormMoveStatus] = useState('Contacted');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch local leads from API
  const fetchLocalLeads = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/crm?type=local-lead');
      if (res.ok) {
        const data = await res.json();
        setLocalLeads(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch local leads:', await res.text());
      }
    } catch (err) {
      console.error('Error fetching local leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalLeads();
  }, []);

  // Filtered Leads based on search bar (supports comma-separated multi-token search e.g. "google, usa")
  const filteredLeads = useMemo(() => {
    // "Show for me" leads are only visible to LK005
    const visibleLeads =
      authUser?.empId === 'LK005'
        ? localLeads
        : localLeads.filter((lead) => lead.visibility !== 'Show for me');

    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return visibleLeads;

    // Split search query by comma to allow searches like: "google, usa"
    const searchTokens = query
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (searchTokens.length === 0) return visibleLeads;

    return visibleLeads.filter((lead) => {
      const name = (lead.leadName || '').toLowerCase();
      const phone = (lead.phoneNumber || '').toLowerCase();
      const whatsapp = (lead.whatsapp || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const company = (lead.companyName || '').toLowerCase();
      const owner = (lead.leadOwner || '').toLowerCase();
      const source = (lead.source || '').toLowerCase();
      const keywords = (lead.keywords || '').toLowerCase();
      const notes = (lead.notes || '').toLowerCase();
      const leadId = (lead.leadId || '').toLowerCase();
      const stage = (lead.stage || '').toLowerCase();

      // Every comma-separated token must match at least one field of the lead
      return searchTokens.every((token) => {
        return (
          keywords.includes(token) ||
          name.includes(token) ||
          company.includes(token) ||
          phone.includes(token) ||
          whatsapp.includes(token) ||
          email.includes(token) ||
          owner.includes(token) ||
          source.includes(token) ||
          notes.includes(token) ||
          leadId.includes(token) ||
          stage.includes(token)
        );
      });
    });
  }, [localLeads, debouncedSearchQuery, authUser]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, pageSize]);

  // Paginated leads
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = filteredLeads.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Modal Handlers
  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      ...EMPTY_FORM,
      date: new Date().toISOString().slice(0, 10),
      leadOwner: '',
    });
    setShowModal(true);
  };

  const handleEditClick = (lead) => {
    setModalMode('edit');
    setFormData({
      ...lead,
      date: lead.date ? new Date(lead.date).toISOString().slice(0, 10) : '',
      stage: lead.stage || 'New',
      followUps: Array.isArray(lead.followUps) ? lead.followUps : [],
    });
    setShowModal(true);
  };

  const handleViewClick = (lead) => {
    setModalMode('view');
    setFormData({
      ...lead,
      date: lead.date ? new Date(lead.date).toISOString().slice(0, 10) : '',
      stage: lead.stage || 'New',
      followUps: Array.isArray(lead.followUps) ? lead.followUps : [],
    });
    setShowModal(true);
  };

  // Move Customer Status handlers: opens Move Customer Status modal
  const handleMoveToContacted = (lead) => {
    setSelectedLeadForStatus(lead);
    setFormMoveStatus(lead.stage === 'New' ? 'Contacted' : (lead.stage || 'Contacted'));
    setShowMoveCustomerModal(true);
  };

  const handleSaveMoveCustomer = async (e) => {
    e?.preventDefault();
    if (!selectedLeadForStatus?.id) return;

    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/crm/${selectedLeadForStatus.id}?type=local-lead`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: formMoveStatus,
        }),
      });

      if (res.ok) {
        showSuccessToast(`Lead stage updated to ${formMoveStatus}!`);
        setShowMoveCustomerModal(false);
        fetchLocalLeads();
      } else {
        const errData = await res.json().catch(() => ({}));
        showErrorToast(errData.error || 'Failed to update lead status.');
      }
    } catch (err) {
      console.error(err);
      showErrorToast('Failed to update lead status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Lead (Add or Update)
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.leadName?.trim()) {
      showErrorToast('Lead name is required');
      return;
    }
    if (!formData.phoneNumber?.trim()) {
      showErrorToast('Phone number is required');
      return;
    }
    if (!formData.leadOwner?.trim()) {
      showErrorToast('Lead owner is required');
      return;
    }
    if (!formData.date) {
      showErrorToast('Date is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === 'add') {
        const res = await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            type: 'local-lead',
          }),
        });
        if (res.ok) {
          showSuccessToast('Local lead created successfully!');
          setShowModal(false);
          fetchLocalLeads();
        } else {
          const errData = await res.json().catch(() => ({}));
          showErrorToast(errData.error || 'Failed to create local lead');
        }
      } else {
        const res = await fetch(`/api/crm/${formData.id}?type=local-lead`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            type: 'local-lead',
          }),
        });
        if (res.ok) {
          showSuccessToast('Local lead updated successfully!');
          setShowModal(false);
          fetchLocalLeads();
        } else {
          const errData = await res.json().catch(() => ({}));
          showErrorToast(errData.error || 'Failed to update local lead');
        }
      }
    } catch (err) {
      console.error('Error saving local lead:', err);
      showErrorToast('An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/crm/${leadToDelete.id}?type=local-lead`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showSuccessToast('Local lead deleted successfully!');
        setShowDeleteConfirm(false);
        setLeadToDelete(null);
        fetchLocalLeads();
      } else {
        const errData = await res.json().catch(() => ({}));
        showErrorToast(errData.error || 'Failed to delete local lead');
      }
    } catch (err) {
      console.error('Error deleting local lead:', err);
      showErrorToast('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  const resolveStageDesign = (status) => EXTRA_STAGE_BADGES[status] || getLeadDesign(status);

  // Table Columns matching exact requirements: Lead Name, Phone, Source, Stage, Lead Owner, Next Follow-up, Last Contacted
  const columns = [
    {
      key: 'leadName',
      label: 'Lead Name',
      render: (lead) => (
        <div className="flex items-center gap-2 min-w-0 justify-center">
          <span
            className="font-bold text-[#004475] hover:underline cursor-pointer truncate"
            onClick={(e) => {
              e.stopPropagation();
              handleViewClick(lead);
            }}
          >
            {lead.leadName || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (lead) => {
        const rawSource = lead.source?.trim() || 'N/A';
        const badgeStyle = getSourceBadgeStyle(rawSource);
        return (
          <div className="flex items-center justify-center">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle} tracking-wide whitespace-nowrap shadow-xs`}
              title={rawSource}
            >
              {rawSource}
            </span>
          </div>
        );
      },
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (lead) => {
        const status = lead.stage || 'New';
        const design = resolveStageDesign(status);
        return (
          <span className={`inline-block px-2 py-1 ${design?.badgeBg || 'bg-purple-50'} ${design?.badgeText || 'text-purple-600'} text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap`}>
            {status}
          </span>
        );
      },
    },
    {
      key: 'leadOwner',
      label: 'Lead Owner',
      render: (lead) => (
        <div className="flex items-center gap-2 min-w-0 justify-center">
          <span className="text-gray-700 font-semibold truncate max-w-25">
            {lead.leadOwner || 'Unassigned'}
          </span>
        </div>
      ),
    },
    {
      key: 'followUp',
      label: 'Next Follow-up',
      className: 'whitespace-nowrap',
      render: (lead) => {
        const nextDate = lead.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1]?.date : null;
        return nextDate ? (
          <div className="flex flex-col items-center">
            <span className="text-gray-800 font-bold text-sm">
              {formatShortDate(nextDate)}
            </span>
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
    },
    {
      key: 'lastContacted',
      label: 'Last Contacted',
      className: 'text-gray-500 font-medium whitespace-nowrap',
      render: (lead) => {
        let lastDate = lead.updatedAt || lead.date;
        if (lead.followUps && lead.followUps.length > 1) {
          lastDate = lead.followUps[lead.followUps.length - 2]?.date || lastDate;
        }
        return (
          <span title={formatDateTime(lastDate)}>
            {formatShortDate(lastDate) || 'N/A'}
          </span>
        );
      },
    },
  ];

  // Action Buttons matching CRMLeadsTab: Move to Contacted (default for both stages), Edit, Delete
  const renderActions = (lead) => (
    <div className="flex items-center justify-center gap-1 relative">
      {canControl && (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleMoveToContacted(lead);
            }}
            title="Move to Contacted"
            className="text-[#004475] hover:text-[#33a8d9]"
          >
            <LogOut size={15} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(lead);
            }}
            title="Edit Lead"
            className="text-[#004475] hover:text-[#33a8d9]"
          >
            <SquarePen size={15} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(lead);
            }}
            title="Delete Lead"
            className="text-[#004475] hover:text-red-700"
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
        {/* Main Column */}
        <div className="space-y-5 min-w-0">
          {/* Top Bar matching CRMLeadsTab */}
          <div>
            <div className="flex flex-col md:flex-row items-center gap-3 justify-end">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads by name, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <div className="absolute right-1 top-0.5">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {canControl && (
                <div className="flex items-center gap-2">
                  <PrimaryButton onClick={handleAddClick}>
                    <span className="text-xl mr-1 leading-none">+</span>
                    Add Local Lead
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>

          {/* Leads Table matching CRMLeadsTab */}
          <div className="bg-white border border-gray-100 rounded-[18px] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader label="Loading Local Leads..." />
              </div>
            ) : (
              <>
                <CustomTable
                  columns={columns}
                  data={paginatedLeads}
                  rowKey="id"
                  actions={renderActions}
                  actionsHeader="Actions"
                  actionsAlign="center"
                  headerAlignment={{ leadName: 'center', source: 'center', stage: 'center', leadOwner: 'center', followUp: 'center', lastContacted: 'center' }}
                  cellAlignment={{ leadName: 'center', source: 'center', stage: 'center', leadOwner: 'center', followUp: 'center', lastContacted: 'center' }}
                  rowClassName={() => 'group hover:bg-[#f8fafc] transition-colors h-14'}
                />

                {/* Pagination Footer */}
                <div>
                  <Pagination
                    currentPage={safePage}
                    totalItems={filteredLeads.length}
                    itemsPerPage={pageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setPageSize}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Local Lead Modal */}
      <CRMLocalLeadModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        setModalMode={setModalMode}
        handleSave={handleSave}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        employeesList={dbEmployees}
        authUser={authUser}
      />

      {/* Move Customer Status Modal */}
      <CRMMoveCustomerModal
        showMoveCustomerModal={showMoveCustomerModal}
        setShowMoveCustomerModal={setShowMoveCustomerModal}
        formMoveStatus={formMoveStatus}
        setFormMoveStatus={setFormMoveStatus}
        handleSaveMoveCustomer={handleSaveMoveCustomer}
        isSubmitting={isUpdatingStatus}
      />

      {/* Delete Confirmation Alert */}
      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Local Lead"
        message="Are you sure you want to delete this local lead? This action cannot be undone."
        type="danger"
        confirmText="Delete Lead"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          leadToDelete && (
            <div className="text-sm">
              <p className="font-bold text-slate-900">{leadToDelete.leadName}</p>
              {leadToDelete.companyName && (
                <p className="text-slate-500">Company: {leadToDelete.companyName}</p>
              )}
              {leadToDelete.phoneNumber && (
                <p className="text-slate-500">Phone: {leadToDelete.phoneNumber}</p>
              )}
            </div>
          )
        }
      />
    </div>
  );
}
