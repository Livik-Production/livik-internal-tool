'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Info,
  PlusCircle,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import Loader from '../../../Loader';
import JobApplicationsTab from '../job-applications/JobApplicationsTab';
import TalentCommunityTab from '../talent-community/TalentCommunityTab';
import { showSuccessToast, showErrorToast } from '../../../Toast';

export default function JobOpeningsTab({
  navigationState,
  clearNavigationState,
}) {
  const [activeSubTab, setActiveSubTab] = useState('Create Job');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (navigationState?.subtab) {
      setActiveSubTab(navigationState.subtab);
    }
  }, [navigationState]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const res = await fetch('/api/job-openings?all=true');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setJobs(json.data || []);
    } catch (err) {
      setJobsError(err.message);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const getNextJobId = () => {
    const year = new Date().getFullYear();
    const nextNum = jobs.length + 1;
    return `LK-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  const [jobForm, setJobForm] = useState({
    id: null,
    jobId: '',
    title: '',
    department: 'Engineering',
    location: '',
    experience: '',
    type: 'Full-time',
    description: '',
    isActive: true,
    isEditing: false,
  });

  useEffect(() => {
    if (!jobForm.isEditing && jobs.length >= 0) {
      setJobForm((prev) => ({ ...prev, jobId: getNextJobId() }));
    }
  }, [jobs.length]);

  const handleEditJob = (job) => {
    setJobForm({
      id: job.id,
      jobId: job.jobId,
      title: job.jobTitle,
      department: job.department || 'Engineering',
      location: job.location || '',
      experience: job.experience || '',
      type: job.employmentType || 'Full-time',
      description: job.jobDescription || '',
      isActive: job.status !== 'INACTIVE',
      isEditing: true,
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && jobs.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const editJobId = params.get('editJobId');
      if (editJobId) {
        const jobToEdit = jobs.find((j) => String(j.id) === String(editJobId));
        if (jobToEdit) {
          handleEditJob(jobToEdit);
          // Clear query params to keep URL clean
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    }
  }, [jobs]);

  const handleCancelEdit = () => {
    setJobForm({
      id: null,
      jobId: getNextJobId(),
      title: '',
      department: 'Engineering',
      location: '',
      experience: '',
      type: 'Full-time',
      description: '',
      isActive: true,
      isEditing: false,
    });
  };

  const handleSaveJob = async () => {
    if (
      !jobForm.title ||
      !jobForm.location ||
      !jobForm.experience ||
      !jobForm.description
    ) {
      showErrorToast('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        jobId: jobForm.jobId,
        jobTitle: jobForm.title,
        experience: jobForm.experience,
        location: jobForm.location,
        employmentType: jobForm.type,
        jobDescription: jobForm.description,
        status: jobForm.isActive ? 'ACTIVE' : 'INACTIVE',
      };
      if (jobForm.isEditing) {
        const res = await fetch(`/api/job-openings/${jobForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update');
        showSuccessToast('Job opening updated successfully!');
      } else {
        const res = await fetch('/api/job-openings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create');
        showSuccessToast('Job opening posted successfully!');
      }
      await fetchJobs();
      handleCancelEdit();
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobForm.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job-openings/${jobForm.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete');
      showSuccessToast('Job opening deleted.');
      await fetchJobs();
      handleCancelEdit();
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {saving && (
        <Loader
          label={jobForm.isEditing ? 'Saving changes...' : 'Posting job...'}
          fullScreen={true}
        />
      )}

      {/* Sub Tabs Row */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex gap-3">
          {['Create Job', 'Role Applications', 'Open Applications'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeSubTab === tab
                    ? 'bg-[#004475] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {activeSubTab === 'Create Job' && (
        <div className="flex gap-6 items-start ">
          {/* Left Form Area */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-lg bg-[#E6F0F9] flex items-center justify-center text-[#004475]">
                  <PlusCircle size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {jobForm.isEditing
                      ? 'Edit Job Opening'
                      : 'Create New Job Opening'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span
                  className={`text-sm font-bold ${jobForm.isActive ? 'text-green-600' : 'text-gray-500'}`}
                >
                  {jobForm.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setJobForm({ ...jobForm, isActive: !jobForm.isActive })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#004475] focus:ring-offset-2 ${jobForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${jobForm.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Job ID{' '}
                  <span className="text-[10px] lowercase font-normal text-gray-400">
                    (Auto)
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={jobForm.jobId}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-semibold bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  value={jobForm.title}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Experience
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3-5 Years"
                  value={jobForm.experience}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, experience: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dindigul"
                  value={jobForm.location}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Employment Type
                </label>
                <div className="relative">
                  <select
                    value={jobForm.type}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        type: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] bg-white"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-3 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Job Description
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-300 flex gap-4 text-gray-600">
                  <button className="hover:text-gray-900 transition-colors">
                    <Bold size={16} />
                  </button>
                  <button className="hover:text-gray-900 transition-colors">
                    <Italic size={16} />
                  </button>
                  <button className="hover:text-gray-900 transition-colors">
                    <List size={16} />
                  </button>
                  <button className="hover:text-gray-900 transition-colors">
                    <LinkIcon size={16} />
                  </button>
                </div>
                <textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={jobForm.description}
                  onChange={(e) =>
                    setJobForm({
                      ...jobForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full h-35 p-4 text-sm text-gray-700 focus:outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="flex gap-3">
                {jobForm.isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveJob}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#004475] rounded-lg text-sm font-semibold text-white hover:bg-[#004475]/90 transition-colors shadow-sm disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : jobForm.isEditing
                      ? 'Update Job'
                      : 'Post Job'}
                </button>
                {jobForm.isEditing && (
                  <button
                    onClick={handleDeleteJob}
                    disabled={saving}
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="w-120 flex flex-col gap-5 shrink-0">
            {/* Previously Created Jobs */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-[478px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Previously Created Jobs
                </h3>
                <Link
                  href="/dashboard/admin/livik-site-operations/all-jobs"
                  className="text-xs font-bold text-[#004475] hover:underline flex items-center gap-1"
                >
                  View All &rarr;
                </Link>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar flex-1">
                {jobsLoading ? (
                  <Loader
                    label="Loading openings..."
                    size="sm"
                    fullScreen={false}
                  />
                ) : jobsError ? (
                  <div className="flex items-center justify-center h-32 text-red-500 text-sm">
                    {jobsError}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    No job openings yet.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-100 rounded-lg p-3 bg-gray-50/80 flex items-center justify-between hover:border-[#004475]/20 transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#004475] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {job.jobId}
                          </span>
                          <h4 className="font-semibold text-sm text-gray-800">
                            {job.jobTitle}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              job.status !== 'INACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {job.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                          {new Date(job.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          &bull; {job.location || 'Remote / Hybrid'} &bull;{' '}
                          {job.experience || '3-5 Years'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditJob(job)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 text-sm cursor-pointer hover:bg-white hover:border-gray-300 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'Role Applications' && (
        <JobApplicationsTab
          navigationState={navigationState}
          clearNavigationState={clearNavigationState}
        />
      )}

      {activeSubTab === 'Open Applications' && (
        <TalentCommunityTab
          navigationState={navigationState}
          clearNavigationState={clearNavigationState}
        />
      )}
    </div>
  );
}
