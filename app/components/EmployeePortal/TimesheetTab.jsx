'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  MessageSquare,
  FolderKanban,
  FileText,
  Plus,
  Pencil,
  Trash2,
  SquarePen,
  Loader2,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';
import CustomModalForm from '../CustomModalForm';
import CustomAlertForm from '../CustomAlertForm';
import Pagination from '../Pagination';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import Loader from '../Loader';

const PROJECTS = [
  'Product Design - Kinetic UI',
  'API Integration Layer',
  'Documentation Review',
  'Quality Assurance Phase 1',
  'Q4 Resource Planning',
];

export default function TimesheetTab({ authUser }) {
  // Modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Deletion confirmation modal state
  const [deletingLog, setDeletingLog] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [logDuration, setLogDuration] = useState('1 hour');
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [projectTitle, setProjectTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Logs list state
  const [logs, setLogs] = useState([
    {
      id: 1,
      project: 'Product Design - Kinetic UI',
      title: 'Kinetic UI Prototype',
      description: 'Worked on interactive mockups and hover animations',
      date: 'Oct 23, 2026',
      duration: '1 hour',
      status: 'Approved',
    },
    {
      id: 2,
      project: 'Documentation Review',
      title: 'Documentation Spec Review',
      description: 'Reviewed onboarding documentation and API specs',
      date: 'Oct 22, 2026',
      duration: '2 hour',
      status: 'Pending',
    },
    {
      id: 3,
      project: 'Quality Assurance Phase 1',
      title: 'Sprint 1 QA Suite',
      description: 'Wrote unit tests for auth forms and user profile endpoints',
      date: 'Oct 18, 2026',
      duration: '1 hour',
      status: 'Approved',
    },
    {
      id: 4,
      project: 'API Integration Layer',
      title: 'S3 Integration Work',
      description: 'Integrated S3 helper with document approval flows',
      date: 'Oct 16, 2026',
      duration: '2 hour',
      status: 'Approved',
    },
  ]);

  // Helper date formatter
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleOpenCreateModal = () => {
    setEditingLog(null);
    setProjectTitle('');
    setWorkDescription('');
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogDuration('1 hour');
    setSelectedProject(PROJECTS[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (log) => {
    try {
      setLoadingEditId(log.id);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setEditingLog(log);

      // Parse the display date string (e.g. "Oct 23, 2026") to a YYYY-MM-DD string
      const parsedDate = new Date(log.date);
      const dateInputVal = !isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setLogDate(dateInputVal);
      setLogDuration(log.duration || '1 hour');
      setSelectedProject(log.project || PROJECTS[0]);
      setProjectTitle(log.title || '');
      setWorkDescription(log.description || '');
      setIsModalOpen(true);
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleLogHours = async () => {
    if (!projectTitle.trim()) {
      showErrorToast('Please enter the project title before logging!');
      return;
    }
    if (!workDescription.trim()) {
      showErrorToast('Please describe your output before logging!');
      return;
    }

    setIsSubmitting(true);
    handleCloseModal();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (editingLog) {
      // Edit mode
      setLogs(
        logs.map((log) =>
          log.id === editingLog.id
            ? {
                ...log,
                project: selectedProject,
                title: projectTitle,
                description: workDescription,
                date: formatDateString(logDate),
                duration: logDuration,
              }
            : log
        )
      );
      showSuccessToast('Timesheet updated successfully!');
    } else {
      // Create mode
      const newLog = {
        id: Date.now(),
        project: selectedProject,
        title: projectTitle,
        description: workDescription,
        date: formatDateString(logDate),
        duration: logDuration,
        status: 'Pending',
      };
      setLogs([newLog, ...logs]);
      setCurrentPage(1); // Go to first page to see the newly added item
      showSuccessToast('Timesheet logged successfully!');
    }

    setLoading(false);
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return;
    const targetId = deletingLog.id;
    setIsDeleting(true);
    setDeletingLog(null);
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));
    const updatedLogs = logs.filter((log) => log.id !== targetId);
    setLogs(updatedLogs);

    // Check if the current page has become empty
    const totalPages = Math.ceil(updatedLogs.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }

    setLoading(false);
    setIsDeleting(false);
    showSuccessToast('Timesheet deleted successfully!');
  };

  // Filter & Pagination logic
  const filteredLogs = logs.filter(
    (log) =>
      log.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full flex flex-col gap-6 px-1 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-[#004475] rounded-xl flex items-center justify-center border border-blue-100">
            <Clock size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Timesheets</h2>
          </div>
        </div>

        {/* Action Button */}
        <PrimaryButton onClick={handleOpenCreateModal}>
          <Plus size={16} /> Create New Timesheet
        </PrimaryButton>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects or titles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#004475]"
          />
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto">
          <PrimaryButton
            onClick={() => showSuccessToast('Statement exported successfully!')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-[#004475] rounded-xl text-xs font-bold transition-colors"
          >
            <Download size={13} /> Export PDF
          </PrimaryButton>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">
          Previous Timesheets
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[200px]">
            <Loader label="Loading timesheets..." size="md" fullScreen={false} />
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 font-bold">
            No timesheets logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col gap-3 group hover:border-blue-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1 min-w-0 mr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-[#004475] text-sm group-hover:text-blue-600 transition-colors truncate">
                        {log.title || log.project}
                      </h4>
                      {log.title && (
                        <span className="text-[10px] bg-blue-50 text-[#004475] border border-blue-100/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                          {log.project}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      {log.description}
                    </p>
                  </div>

                  {/* Actions Column (Edit/Delete buttons) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <IconButton
                      title="Edit Timesheet"
                      onClick={() => handleOpenEditModal(log)}
                      className="text-gray-500 hover:text-blue-600"
                      disabled={loadingEditId !== null}
                    >
                      <SquarePen size={14} />

                    </IconButton>
                    <IconButton
                      title="Remove Timesheet"
                      onClick={() => setDeletingLog(log)}
                      className="text-gray-500 hover:text-red-600"
                      disabled={loadingEditId !== null}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} /> {log.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> {log.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination component */}
      {filteredLogs.length > 0 && (
        <div className="mt-2 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Create / Edit Timesheet Modal */}
      <CustomModalForm
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingLog ? 'Edit Timesheet' : 'Create New Timesheet'}
        widthClass="max-w-md"
        icon={<Clock size={20} />}
      >
        <div className="p-6 flex flex-col gap-5">
          {/* Date Picker Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-[#33a8d9]" /> Date
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#004475] font-semibold text-gray-700 bg-white"
            />
          </div>

          {/* Time duration dropdown selector (values: 1 hour, 2 hour) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} className="text-[#33a8d9]" /> Time (Duration)
            </label>
            <select
              value={logDuration}
              onChange={(e) => setLogDuration(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#004475] font-semibold text-gray-700"
            >
              <option value="1 hour">1 hour</option>
              <option value="2 hour">2 hour</option>
            </select>
          </div>

          {/* Project selection dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban size={12} className="text-[#33a8d9]" /> Project Name
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#004475] font-semibold text-gray-700"
            >
              {PROJECTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Title of the project field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} className="text-[#33a8d9]" /> Title of the
              project
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter project or task title..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#004475]"
            />
          </div>

          {/* Description field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={12} className="text-[#33a8d9]" /> Description
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="Describe your output..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:border-[#004475] resize-none"
            />
          </div>

          {/* Action buttons inside the modal body/footer area */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLogHours}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#004475] text-white rounded-xl text-xs font-bold hover:bg-[#003358] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[80px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {editingLog ? 'Updating...' : 'Submitting...'}
                </>
              ) : editingLog ? (
                'Update'
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      </CustomModalForm>

      {/* Delete Confirmation Alert Modal */}
      <CustomAlertForm
        isOpen={deletingLog !== null}
        onClose={() => !isDeleting && setDeletingLog(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this timesheet entry?\n\n"${deletingLog?.title || deletingLog?.project}"`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
      />
    </div>
  );
}
