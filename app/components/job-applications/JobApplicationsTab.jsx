'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Download,
  Eye,
  Trash2,
  Users,
  Clock,
  MapPin,
} from 'lucide-react';
import StatCard from '../StatCard';
import CustomTable from '../CustomTable';
import IconButton from '../Buttons/IconButton';
import Pagination from '../Pagination';
import Loader from '../Loader';

export default function JobApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/job-applications');
        const data = await res.json();
        if (data.data) {
          setApplications(data.data);
        }
      } catch (error) {
        console.error('Error fetching job applications:', error);
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
        console.error('Error fetching jobs in JobApplicationsTab:', error);
      }
    };
    fetchApplications();
    fetchJobs();
  }, []);

  const columns = [
    {
      key: 'createdAt',
      label: 'Date Applied',
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
          <div className="text-center">
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
      render: (row) => <span className="text-gray-500 block text-center">{row.phoneNumber}</span>,
    },
    {
      key: 'appliedPosition',
      label: 'Applied Position',
      render: (row) => {
        const matchedJob = jobs.find(
          (j) =>
            j.jobTitle.toLowerCase() ===
            (row.appliedPosition || '').toLowerCase()
        );
        return (
          <div className="text-center">
            <div className="font-semibold text-gray-700 text-[13px]">
              {row.appliedPosition}
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
      key: 'experience',
      label: 'Experience',
      render: (row) => <span className="text-gray-600 block text-center">{row.experience}</span>,
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
          className="truncate max-w-[180px] text-gray-500 text-sm mx-auto text-center"
          title={row.skillset}
        >
          {row.skillset}
        </div>
      ),
    },
  ];

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job application?'))
      return;
    try {
      const res = await fetch(`/api/job-applications/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete application');

      showToast('Application deleted successfully.');
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const actions = (row) => (
    <div className="flex gap-2 justify-center">
      <IconButton title="View Details">
        <Eye size={16} />
      </IconButton>
      {row.resume && (
        <IconButton
          title="Download Resume"
          onClick={() => window.open(row.resume, '_blank')}
        >
          <Download size={16} />
        </IconButton>
      )}
      <IconButton
        title="Delete Application"
        onClick={() => handleDeleteClick(row.id)}
        className="hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-gray-400"
      >
        <Trash2 size={16} />
      </IconButton>
    </div>
  );

  const filtered = applications.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.appliedPosition?.toLowerCase().includes(q) ||
      a.location?.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading job applications..." size="md" />
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
                placeholder="Search applications..."
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
            showScrollbar={true}
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
    </div>
  );
}
