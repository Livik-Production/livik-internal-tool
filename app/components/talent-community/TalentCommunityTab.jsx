'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Download,
  Eye,
  Trash2,
  Clock,
  MapPin,
  Star,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import StatCard from '../StatCard';
import CustomTable from '../CustomTable';
import IconButton from '../Buttons/IconButton';
import Pagination from '../Pagination';
import Loader from '../Loader';
import CustomModalForm from '../CustomModalForm';
import PrimaryButton from '../Buttons/PrimaryButton';
import * as XLSX from 'xlsx';

const DEFAULT_COLUMNS = {
  createdAt: false,
  applicant: true,
  phoneNumber: false,
  qualification: true,
  roleApplyingFor: false,
  experienceLevel: true,
  location: true,
  skillset: true,
  shortMessage: false,
};

const DEFAULT_EXPERIENCE_FILTER = {
  entry: true,
  mid: false,
  senior: false,
  lead: false,
};

export default function TalentCommunityTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Column selector state
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [tempVisibleColumns, setTempVisibleColumns] = useState(DEFAULT_COLUMNS);

  // Experience filter state
  const [experienceFilter, setExperienceFilter] = useState(
    DEFAULT_EXPERIENCE_FILTER
  );
  const [tempExperienceFilter, setTempExperienceFilter] = useState(
    DEFAULT_EXPERIENCE_FILTER
  );

  const openColumnFilter = () => {
    setTempVisibleColumns({ ...visibleColumns });
    setTempExperienceFilter({ ...experienceFilter });
    setShowColumnFilter(true);
  };

  const handleViewDetails = async (email) => {
    try {
      const res = await fetch(
        `/api/talent-community?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch details');
      if (data.data) {
        setSelectedEntry(data.data);
      }
    } catch (err) {
      console.error('Error fetching details by email:', err);
      alert(err.message);
    }
  };

  const ALL_COLUMNS = [
    { key: 'createdAt', label: 'Date Submitted' },
    { key: 'applicant', label: 'Applicant Name' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'roleApplyingFor', label: 'Role Interested In' },
    { key: 'experienceLevel', label: 'Experience' },
    { key: 'location', label: 'Location' },
    { key: 'skillset', label: 'Skills' },
    { key: 'shortMessage', label: 'Message' },
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/talent-community');
        const data = await res.json();
        if (data.data) {
          setEntries(data.data);
        }
      } catch (error) {
        console.error('Error fetching talent community entries:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/job-openings?all=true');
        const data = await res.json();
        if (data.data) {
          setJobs(data.data);
        }
      } catch (error) {
        console.error('Error fetching jobs in TalentCommunityTab:', error);
      }
    };
    fetchEntries();
    fetchJobs();
  }, []);

  const experienceLabelMap = {
    entry: 'Entry Level (0-2 yrs)',
    mid: 'Mid Level (3-5 yrs)',
    senior: 'Senior Level (5-8 yrs)',
    lead: 'Lead / Expert (8+ yrs)',
  };

  const experienceBadgeColor = {
    entry: 'bg-green-100 text-green-700',
    mid: 'bg-blue-100 text-blue-700',
    senior: 'bg-purple-100 text-purple-700',
    lead: 'bg-orange-100 text-orange-700',
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Date Submitted',
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'applicant',
      label: 'Applicant Name',
      render: (row) => {
        return (
          <button
            onClick={() => handleViewDetails(row.email)}
            className="font-bold text-[13px] text-gray-900 hover:text-[#004475] cursor-pointer hover:underline text-left bg-transparent border-0 p-0 focus:outline-none"
          >
            {row.fullName}
          </button>
        );
      },
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (row) => <span className="text-gray-500">{row.phoneNumber}</span>,
    },
    {
      key: 'qualification',
      label: 'Qualification',
      render: (row) => (
        <span className="text-gray-600 font-semibold">
          {row.qualification || '-'}
        </span>
      ),
    },
    {
      key: 'roleApplyingFor',
      label: 'Role Interested In',
      render: (row) => {
        const matchedJob = jobs.find(
          (j) =>
            j.jobTitle.toLowerCase() ===
            (row.roleApplyingFor || '').toLowerCase()
        );
        return (
          <div>
            <div className="font-semibold text-gray-700 text-[13px]">
              {row.roleApplyingFor}
            </div>
            {matchedJob && matchedJob.jobId && (
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                Job ID: {matchedJob.jobId}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'experienceLevel',
      label: 'Experience',
      render: (row) => (
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
            experienceBadgeColor[row.experienceLevel] ||
            'bg-gray-100 text-gray-600'
          }`}
        >
          {experienceLabelMap[row.experienceLevel] || row.experienceLevel}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
          <MapPin size={12} />
          {row.location}
        </div>
      ),
    },
    {
      key: 'skillset',
      label: 'Skills',
      render: (row) => (
        <div
          className="truncate max-w-[180px] text-gray-500 text-sm"
          title={row.skillset}
        >
          {row.skillset}
        </div>
      ),
    },
    {
      key: 'shortMessage',
      label: 'Message',
      render: (row) => (
        <div
          className="truncate max-w-[160px] text-gray-400 text-sm italic"
          title={row.shortMessage}
        >
          {row.shortMessage}
        </div>
      ),
    },
  ];

  const downloadResumeFile = async (key, fullName, id) => {
    try {
      const res = await fetch(
        `/api/talent-community/download?key=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get signed URL');

      const fileRes = await fetch(data.url);
      if (!fileRes.ok) throw new Error('Failed to fetch file');
      const blob = await fileRes.blob();

      let ext = 'pdf';
      const lastDot = key.lastIndexOf('.');
      if (lastDot !== -1) {
        ext = key.substring(lastDot + 1).split('?')[0] || ext;
      }

      const safeName = (fullName || 'resume')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-\.]/g, '');
      const filename = `${safeName}-${id}.${ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Failed to download resume');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/api/talent-community/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete entry');

      showToast('Entry deleted successfully.');
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const exportToExcel = () => {
    try {
      const excelData = filtered.map((entry) => ({
        'Date Submitted': new Date(entry.createdAt).toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }
        ),
        'Applicant Name': entry.fullName || '',
        'Email Address': entry.email || '',
        'Phone Number': entry.phoneNumber || '',
        Qualification: entry.qualification || '',
        'Role Interested In': entry.roleApplyingFor || '',
        'Experience Level':
          experienceLabelMap[entry.experienceLevel] ||
          entry.experienceLevel ||
          '',
        Location: entry.location || '',
        'Portfolio / LinkedIn': entry.portfolioUrl || '',
        'Skills / Stack': entry.skillset || '',
        Message: entry.shortMessage || '',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const maxWidth = excelData.reduce((acc, row) => {
        Object.keys(row).forEach((key) => {
          const length = String(row[key] || '').length;
          if (!acc[key] || length > acc[key]) {
            acc[key] = length;
          }
        });
        return acc;
      }, {});

      const wscols = Object.keys(maxWidth).map((key) => ({
        wch: Math.min(Math.max(maxWidth[key] + 2, 10), 50),
      }));

      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Open Applications');

      const excelFileName = `Open_Applications_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      XLSX.writeFile(wb, excelFileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export to Excel', 'error');
    }
  };

  const actions = (row) => (
    <div className="flex gap-2 justify-center">
      <IconButton
        title="View Details"
        onClick={() => handleViewDetails(row.email)}
      >
        <Eye size={16} />
      </IconButton>
      {row.resume && (
        <IconButton
          title="Download Resume"
          onClick={async () => {
            try {
              const res = await fetch(
                `/api/talent-community/download?key=${encodeURIComponent(
                  row.resume
                )}`
              );
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Download failed');
              window.open(data.url, '_blank');
            } catch (err) {
              console.error('Error opening resume URL:', err);
              alert('Failed to open resume');
            }
          }}
        >
          <Download size={16} />
        </IconButton>
      )}
      <IconButton
        title="Delete Entry"
        onClick={() => handleDeleteClick(row.id)}
        className="hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-gray-400"
      >
        <Trash2 size={16} />
      </IconButton>
    </div>
  );

  const filtered = entries.filter((e) => {
    // 1. Experience level filter
    if (experienceFilter && experienceFilter[e.experienceLevel] === false) {
      return false;
    }

    // 2. Date range filter
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const entryDate = new Date(e.createdAt);
      if (entryDate < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      const entryDate = new Date(e.createdAt);
      if (entryDate > end) return false;
    }

    // 3. Search query filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.fullName?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.roleApplyingFor?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.skillset?.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading open roles..." size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-dashboard-reveal">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col shrink-0">
        {/* Table Header Controls */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search talent community..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] w-64 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] bg-white text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] bg-white text-gray-700"
              />
            </div>

            {/* Column Filter Button (Right of Search) */}
            <PrimaryButton
              onClick={openColumnFilter}
              title="Check the columns to display the extra fields in table"
            >
              <SlidersHorizontal size={14} className="text-white" />
              <span>Columns</span>
            </PrimaryButton>
          </div>
          <div className="flex gap-3 items-center">
            <PrimaryButton
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#004475]  rounded-lg transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </PrimaryButton>
          </div>
        </div>

        <div className="flex-1 bg-white p-2 border-x border-gray-200">
          <CustomTable
            columns={columns.filter((col) => visibleColumns[col.key])}
            data={paginated}
            actions={actions}
            actionsHeader="Actions"
            rowKey="id"
            showScrollbar={true}
            headerAlignment={{ location: 'center' }}
            cellAlignment={{ location: 'center' }}
          />
        </div>
        <div className="rounded-b-xl overflow-hidden border-x border-b border-gray-200 bg-white">
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* View Details Modal */}
      <CustomModalForm
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.fullName || 'Open Application Details'}
        icon={<Eye size={18} />}
        widthClass="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setSelectedEntry(null)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            {selectedEntry?.resume && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/talent-community/download?key=${encodeURIComponent(
                        selectedEntry.resume
                      )}`
                    );
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(data.error || 'Download failed');
                    window.open(data.url, '_blank');
                  } catch (err) {
                    console.error('Error opening resume URL:', err);
                    alert('Failed to open resume');
                  }
                }}
                className="px-6 py-2.5 bg-[#004475] rounded-xl text-white font-bold text-sm hover:bg-[#004475]/90 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                <span>Download Resume</span>
              </button>
            )}
          </>
        }
      >
        {selectedEntry && (
          <div className="p-6 space-y-4 text-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Application ID
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.id}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Date Submitted
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={new Date(selectedEntry.createdAt).toLocaleString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.fullName}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.phoneNumber}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.location}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedEntry.qualification}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Experience Level
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    experienceLabelMap[selectedEntry.experienceLevel] ||
                    selectedEntry.experienceLevel
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Role Applying For
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    selectedEntry.roleApplyingFor || 'None / Open application'
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Portfolio / LinkedIn URL
                </label>
                {selectedEntry.portfolioUrl ? (
                  <a
                    href={selectedEntry.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-600 font-semibold hover:underline"
                  >
                    View Portfolio &rarr;
                  </a>
                ) : (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="Not Provided"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Skillset / Stack
              </label>
              <textarea
                readOnly
                disabled
                rows={2}
                value={selectedEntry.skillset}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Short Message
              </label>
              <textarea
                readOnly
                disabled
                rows={4}
                value={selectedEntry.shortMessage}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
      </CustomModalForm>

      {/* Column Filter Modal */}
      <CustomModalForm
        open={showColumnFilter}
        onClose={() => setShowColumnFilter(false)}
        title="Customize Table Columns"
        icon={<SlidersHorizontal size={18} />}
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => {
                setTempVisibleColumns({ ...DEFAULT_COLUMNS });
                setTempExperienceFilter({ ...DEFAULT_EXPERIENCE_FILTER });
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              onClick={() => {
                setVisibleColumns({ ...tempVisibleColumns });
                setExperienceFilter({ ...tempExperienceFilter });
                setShowColumnFilter(false);
              }}
              className="px-5 py-2.5 bg-[#004475] rounded-xl text-white font-bold text-sm hover:bg-[#004475]/90 transition-colors shadow-sm cursor-pointer"
            >
              Apply Changes
            </button>
          </div>
        }
      >
        <div className="p-6 space-y-6 text-gray-700">
          {/* Top Section: Experience Filter Checkboxes */}
          <div className="pb-4 border-b border-gray-100">
            <h4 className="text-xs font-bold text-[#004475] uppercase tracking-wider mb-2">
              Filter Experience
            </h4>
            <p className="text-xs text-gray-500 font-medium mb-3">
              Select candidate experience levels to display in the table.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {Object.keys(tempExperienceFilter).map((level) => {
                const labels = {
                  entry: '0-2 Years (Entry-level)',
                  mid: '3-5 Years (Mid)',
                  senior: '5-8 Years (Senior)',
                  lead: '8+ Years (Lead / Expert)',
                };
                return (
                  <label
                    key={level}
                    className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 rounded-xl cursor-pointer text-xs font-semibold text-gray-800 select-none transition-colors border border-gray-100 hover:border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={tempExperienceFilter[level]}
                      onChange={() => {
                        setTempExperienceFilter((prev) => ({
                          ...prev,
                          [level]: !prev[level],
                        }));
                      }}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-[#004475] focus:ring-[#004475]/20 accent-[#004475] cursor-pointer"
                    />
                    <span>{labels[level] || level}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Column Visibility Checkboxes */}
          <div>
            <h4 className="text-xs font-bold text-[#004475] uppercase tracking-wider mb-2">
              Column Visibility
            </h4>
            <p className="text-xs text-gray-500 font-medium mb-3">
              Select which columns should be visible in the open applications
              table.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 rounded-xl cursor-pointer text-xs font-semibold text-gray-800 select-none transition-colors border border-gray-100 hover:border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={tempVisibleColumns[col.key]}
                    onChange={() => {
                      setTempVisibleColumns((prev) => ({
                        ...prev,
                        [col.key]: !prev[col.key],
                      }));
                    }}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-[#004475] focus:ring-[#004475]/20 accent-[#004475] cursor-pointer"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CustomModalForm>
    </div>
  );
}
