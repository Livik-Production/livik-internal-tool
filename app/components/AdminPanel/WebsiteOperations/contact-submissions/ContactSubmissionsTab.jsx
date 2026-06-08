'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Inbox,
  UserPlus,
  Users,
  Activity,
  Search,
  Download,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import StatCard from '../../../StatCard';
import CustomTable from '../../../CustomTable';
import IconButton from '../../../Buttons/IconButton';
import Pagination from '../../../Pagination';
import Loader from '../../../Loader';

export default function ContactSubmissionsTab({ navigationState, clearNavigationState }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal and Feedback state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeServiceFilter, setActiveServiceFilter] = useState('All');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (navigationState?.search) {
      setSearchQuery(navigationState.search);
      if (clearNavigationState) clearNavigationState();
    }
  }, [navigationState, clearNavigationState]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/contact-submissions');
      const data = await res.json();
      if (data.data) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setFeedbackText(submission.feedback || '');
  };

  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;
    setSavingFeedback(true);
    try {
      const res = await fetch(
        `/api/contact-submissions/${selectedSubmission.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback: feedbackText }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save feedback');

      showToast('Feedback saved successfully!');
      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubmission.id
            ? { ...sub, feedback: feedbackText }
            : sub
        )
      );
      setSelectedSubmission(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?'))
      return;
    try {
      const res = await fetch(`/api/contact-submissions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete submission');

      showToast('Submission deleted successfully.');
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const contactColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <span className="font-mono text-sm text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
          {row.id.slice(0, 7)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date Received',
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <span className="font-bold text-gray-900 whitespace-nowrap">
          {row.name ||
            `${row.firstName || ''} ${row.lastName || ''}`.trim() ||
            'Unknown'}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Work Email',
      render: (row) => (
        <span className="text-[#004475] hover:underline cursor-pointer">
          {row.email}
        </span>
      ),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      render: (row) => (
        <span className="text-gray-500">
          {row.whatsapp || row.phoneNumber || '-'}
        </span>
      ),
    },
    {
      key: 'service',
      label: 'Service Interested',
      render: (row) => (
        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-[#004475] rounded-md">
          {row.service}
        </span>
      ),
    },
    {
      key: 'message',
      label: 'Message Preview',
      render: (row) => (
        <div
          className="truncate max-w-[200px] text-gray-500"
          title={row.message || row.projectDetails}
        >
          {row.message || row.projectDetails}
        </div>
      ),
    },
  ];

  const contactActions = (row) => (
    <div className="flex gap-2 justify-center">
      <IconButton title="View Details" onClick={() => handleViewDetails(row)}>
        <Eye size={16} />
      </IconButton>
      <IconButton
        title="Delete Submission"
        onClick={() => handleDeleteClick(row.id)}
        className="hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-gray-400"
      >
        <Trash2 size={16} />
      </IconButton>
    </div>
  );

  const filteredSubmissions = submissions.filter((sub) => {
    const fullName = sub.name || `${sub.firstName || ''} ${sub.lastName || ''}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.service || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.message || sub.projectDetails || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (activeServiceFilter === 'All') return matchesSearch;
    return (
      matchesSearch &&
      sub.service?.toLowerCase().includes(activeServiceFilter.toLowerCase())
    );
  });

  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getServiceCount = (serviceName) => {
    return submissions.filter((sub) =>
      sub.service?.toLowerCase().includes(serviceName.toLowerCase())
    ).length;
  };

  const exportToCSV = () => {
    const headers = [
      'Enquiry ID',
      'Date Received',
      'Name',
      'Work Email',
      'WhatsApp / Phone',
      'Service Interested',
      'Message',
      'Feedback / Internal Notes',
    ];

    const csvRows = [
      headers.join(','),
      ...filteredSubmissions.map((row) => {
        const dateReceived = row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '';
        const name = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown';
        const phone = row.whatsapp || row.phoneNumber || '';
        const message = row.message || row.projectDetails || '';

        const fields = [
          row.id || '',
          dateReceived,
          name,
          row.email || '',
          phone,
          row.service || '',
          message,
          row.feedback || '',
        ];

        return fields
          .map((field) => {
            const stringValue = String(field);
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n') ||
              stringValue.includes('\r')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',');
      }),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `client_enquiries_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading submissions..." size="md" />
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

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div
          onClick={() => setActiveServiceFilter('All')}
          className="cursor-pointer"
        >
          <StatCard
            title="Total Submissions"
            value={submissions.length}
            icon={Inbox}
            trend={activeServiceFilter === 'All' ? 'Viewing All' : 'View All'}
          />
        </div>
        <div
          onClick={() => setActiveServiceFilter('Software Outsourcing')}
          className="cursor-pointer"
        >
          <StatCard
            title="Software Outsourcing"
            value={getServiceCount('Software Outsourcing')}
            icon={Activity}
            trend={
              activeServiceFilter === 'Software Outsourcing'
                ? 'Viewing'
                : 'View Details'
            }
          />
        </div>
        <div
          onClick={() => setActiveServiceFilter('Dedicated Teams')}
          className="cursor-pointer"
        >
          <StatCard
            title="Dedicated Teams"
            value={getServiceCount('Dedicated Teams')}
            icon={Users}
            trend={
              activeServiceFilter === 'Dedicated Teams'
                ? 'Viewing'
                : 'View Details'
            }
          />
        </div>
        <div
          onClick={() => setActiveServiceFilter('Staff Augmentation')}
          className="cursor-pointer"
        >
          <StatCard
            title="Staff Augmentation"
            value={getServiceCount('Staff Augmentation')}
            icon={UserPlus}
            trend={
              activeServiceFilter === 'Staff Augmentation'
                ? 'Viewing'
                : 'View Details'
            }
          />
        </div>
      </div>

      {/* 2. Data Table */}
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
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] w-64 bg-white shadow-sm"
              />
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#004475] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex-1 bg-white p-2 border-x border-gray-200">
          <CustomTable
            columns={contactColumns}
            data={paginatedSubmissions}
            actions={contactActions}
            actionsHeader="Actions"
            rowKey="id"
          />
        </div>
        <div className="rounded-b-xl overflow-hidden border-x border-b border-gray-200 bg-white">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSubmissions.length}
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
      {selectedSubmission && typeof document !== 'undefined'
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
                      Client Enquiry Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
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
                        Enquiry ID
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedSubmission.id}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Date Received
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={new Date(
                          selectedSubmission.createdAt
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
                        Client Name
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          selectedSubmission.name ||
                          `${selectedSubmission.firstName || ''} ${selectedSubmission.lastName || ''}`.trim() ||
                          'Unknown'
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedSubmission.email}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        WhatsApp / Phone
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          selectedSubmission.whatsapp ||
                          selectedSubmission.phoneNumber ||
                          '-'
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Service Interested
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedSubmission.service}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Project Details / Message
                    </label>
                    <textarea
                      readOnly
                      disabled
                      rows={3}
                      value={
                        selectedSubmission.message ||
                        selectedSubmission.projectDetails
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none resize-none"
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-4" />

                  {/* Feedback Section */}
                  <div>
                    <label className="block text-xs font-bold text-[#004475] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      Feedback / Internal Notes
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Add internal feedback or notes about this client enquiry..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveFeedback}
                    disabled={savingFeedback}
                    className="px-6 py-2.5 bg-[#004475] rounded-xl text-white font-bold text-sm hover:bg-[#004475]/90 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 cursor-pointer animate-pulse-subtle"
                  >
                    {savingFeedback ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
