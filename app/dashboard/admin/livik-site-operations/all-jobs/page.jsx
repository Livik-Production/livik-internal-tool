'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  PlusCircle,
  Briefcase,
  MapPin,
  Calendar,
  XCircle,
  ExternalLink,
  Globe,
  Check,
  Ban,
  SquarePen,
} from 'lucide-react';

export default function AllJobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const guessDepartment = (title) => {
    const t = title.toLowerCase();
    if (
      t.includes('design') ||
      t.includes('ui') ||
      t.includes('ux') ||
      t.includes('creative') ||
      t.includes('graphic')
    )
      return 'Design';
    if (
      t.includes('marketing') ||
      t.includes('growth') ||
      t.includes('seo') ||
      t.includes('content') ||
      t.includes('social')
    )
      return 'Marketing';
    if (
      t.includes('sales') ||
      t.includes('business development') ||
      t.includes('account executive') ||
      t.includes('closing')
    )
      return 'Sales';
    if (
      t.includes('recruiter') ||
      t.includes('hr') ||
      t.includes('talent') ||
      t.includes('human resources') ||
      t.includes('people')
    )
      return 'HR';
    return 'Engineering';
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/job-openings?all=true');
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || 'Failed to fetch job openings');

      const mapped = (json.data || []).map((dbJob) => ({
        id: dbJob.id,
        jobId: dbJob.jobId,
        title: dbJob.jobTitle,
        department: guessDepartment(dbJob.jobTitle),
        location: dbJob.location || 'Remote',
        type: dbJob.employmentType || 'Full-time',
        experience: dbJob.experience || 'Not Specified',
        date: new Date(dbJob.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        isActive: dbJob.status !== 'INACTIVE',
        description: dbJob.jobDescription || '',
      }));

      setJobs(mapped);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message || 'An error occurred while loading job openings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleToggleStatus = async (job) => {
    const newStatus = job.isActive ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/job-openings/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.jobId,
          jobTitle: job.title,
          experience: job.experience,
          location: job.location,
          employmentType: job.type,
          jobDescription: job.description,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update job status');

      showToast(`Job ${job.jobId} marked as ${newStatus.toLowerCase()}!`);
      // Update local state
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, isActive: !job.isActive } : j
        )
      );
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const departments = [
    'All',
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'HR',
  ];
  const statuses = ['All', 'Active', 'Inactive'];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === 'All' || job.department === selectedDepartment;
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Active' && job.isActive) ||
      (selectedStatus === 'Inactive' && !job.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col gap-y-1 min-h-0 animate-dashboard-reveal">
      {/* ===== HEADER CARD ===== */}
      <div className="bg-white shadow-sm rounded-2xl px-4 py-3 m-0.5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/livik-site-operations"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
            title="Back to Website Operations"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="p-2 bg-blue-50 text-[#33a8d9] rounded-xl">
            <Globe size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Website Operations
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage website content including contact submissions and job
              openings.
            </p>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white shadow-sm rounded-2xl p-6 m-0.5 min-h-0">
        {/* Toolbar (Search, Filters, Create Job Button) */}
        <div className="flex justify-end items-center gap-3 mb-6">
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475]"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004475]/20 focus:border-[#004475] cursor-pointer"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'All Status' : status}
              </option>
            ))}
          </select>

          <Link
            href="/dashboard/admin/livik-site-operations"
            className="flex items-center gap-2 px-4 py-1.5 bg-[#004475] text-white text-sm font-semibold rounded-lg hover:bg-[#004475]/90 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Create Job</span>
          </Link>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 h-[290px] flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-24 h-6 bg-gray-200 rounded-lg" />
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                  </div>
                  <div className="w-3/4 h-6 bg-gray-200 rounded-md mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="w-20 h-6 bg-gray-200 rounded-md" />
                    <div className="w-20 h-6 bg-gray-200 rounded-md" />
                  </div>
                  <div className="w-full h-12 bg-gray-200 rounded-md mb-4" />
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between">
                  <div className="w-20 h-4 bg-gray-200 rounded-md" />
                  <div className="w-20 h-4 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50/30 border border-red-100 rounded-2xl p-16 text-center shadow-sm max-w-2xl mx-auto mt-8">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Failed to load jobs
            </h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-5 py-2.5 bg-[#004475] hover:bg-[#004475]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No jobs found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              We couldn't find any job openings matching your search criteria or
              selected filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('All');
                setSelectedStatus('All');
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#004475]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Active/Inactive Top Border Accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    job.isActive
                      ? 'bg-gradient-to-r from-[#004475] to-[#33a8d9]'
                      : 'bg-gray-300'
                  }`}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 bg-[#E6F0F9] text-[#004475] text-xs font-mono font-bold rounded-lg border border-blue-200/60">
                      {job.jobId}
                    </span>
                    <Link
                      href={`/dashboard/admin/livik-site-operations?editJobId=${job.id}`}
                      className="text-xs font-bold uppercase tracking-wider text-[#004475] hover:bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold shadow-sm"
                    >
                      <SquarePen size={16} />
                    </Link>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#004475] transition-colors leading-snug">
                    {job.title}
                  </h3>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1">
                      <Briefcase size={13} className="text-gray-500" />
                      {job.department}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1">
                      <MapPin size={13} className="text-gray-500" />
                      {job.location}
                    </span>
                    {job.experience && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md flex items-center gap-1">
                        <span className="text-gray-400 font-medium">Exp:</span>
                        {job.experience}
                      </span>
                    )}
                  </div>

                  {/* Description Snippet */}
                  <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Card Footer Info & Buttons */}
                <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={13} />
                    <span>{job.date}</span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(job)}
                    className={`relative flex items-center h-[28px] rounded-full p-[2px] transition-all duration-300 shadow-inner cursor-pointer select-none border shrink-0 ${
                      job.isActive
                        ? 'bg-green-500 border-green-500 w-[86px] flex-row'
                        : 'bg-[#9ca3af] border-[#6b7280] w-[96px] flex-row-reverse'
                    }`}
                  >
                    {/* Text */}
                    <span
                      className={`text-[11px] font-extrabold tracking-wider select-none px-2 uppercase ${
                        job.isActive
                          ? 'text-white pl-2.5'
                          : 'text-gray-800 pr-2.5'
                      }`}
                    >
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>

                    {/* Slider circle */}
                    <div className="w-[22px] h-[22px] rounded-full bg-white flex items-center justify-center shadow-md shrink-0">
                      {job.isActive ? (
                        <Check
                          size={12}
                          className="text-[#3b82f6] stroke-[3]"
                        />
                      ) : (
                        <Ban size={12} className="text-[#9ca3af] stroke-[3]" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
