'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import StatCard from '../StatCard';
import CustomTable from '../CustomTable';
import IconButton from '../Buttons/IconButton';
import Pagination from '../Pagination';
import Loader from '../Loader';

export default function TalentCommunityTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

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
          <div>
            <div className="font-bold text-[13px] text-gray-900">
              {row.fullName}
            </div>
            <div className="text-[11px] text-gray-500 hover:text-[#004475] cursor-pointer">
              {row.email}
            </div>
          </div>
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
      render: (row) => <span className="text-gray-600 font-semibold">{row.qualification || '-'}</span>,
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
        <div className="flex items-center gap-1 text-gray-500 text-sm">
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
      const res = await fetch(`/api/talent-community/download?key=${encodeURIComponent(key)}`);
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
    if (!window.confirm('Are you sure you want to delete this entry?'))
      return;
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

  const actions = (row) => (
    <div className="flex gap-2 justify-center">
      <IconButton title="View Details" onClick={() => setSelectedEntry(row)}>
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
          <div className="flex gap-3 items-center">
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
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] w-64"
              />
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#004475] hover:bg-blue-50 rounded-lg transition-colors">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex-1 bg-white p-2 border-x border-gray-200">
          <CustomTable
            columns={columns}
            data={paginated}
            actions={actions}
            actionsHeader="Actions"
            rowKey="id"
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
      {selectedEntry && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
              <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#004475]/10 text-[#004475] flex items-center justify-center">
                      <Eye size={18} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Open Application Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-gray-700">
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
                        value={new Date(
                          selectedEntry.createdAt
                        ).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
                        value={experienceLabelMap[selectedEntry.experienceLevel] || selectedEntry.experienceLevel}
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
                        value={selectedEntry.roleApplyingFor || 'None / Open application'}
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

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {selectedEntry.resume && (
                    <button
                      onClick={() =>
                        downloadResumeFile(
                          selectedEntry.resume,
                          selectedEntry.fullName,
                          selectedEntry.id
                        )
                      }
                      className="px-6 py-2.5 bg-[#004475] rounded-xl text-white font-bold text-sm hover:bg-[#004475]/90 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Download Resume</span>
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
