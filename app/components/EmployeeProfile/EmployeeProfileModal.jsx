'use client';

import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Briefcase,
  ChevronDown,
  Clock,
  X,
  ExternalLink,
  Plus,
} from 'lucide-react';
import CustomModalForm from '../CustomModalForm';

export default function EmployeeProfileModal({ open, onClose, employee }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  if (!employee) return null;

  const [resumes, setResumes] = useState(() => {
    const list = [...(employee?.resumes || [])];
    if (
      employee?.resumeName &&
      !list.find((r) => r.name === employee.resumeName)
    ) {
      list.unshift({
        id: Date.now(),
        name: employee.resumeName,
        date: new Date().toISOString().split('T')[0],
        size: 'Uploaded just now',
      });
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  const actualSkills =
    Array.isArray(employee.skills) && employee.skills.length > 0
      ? employee.skills.map((s) =>
          typeof s === 'string' ? s : s.name || 'Unknown'
        )
      : [];

  const employeeProjects = Array.isArray(employee.projects)
    ? employee.projects
    : [];

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
          <span>Staffing & Resourcing</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">Employee Profile</span>
        </div>
      }
      widthClass="max-w-4xl"
      footer={null}
    >
      <div className="flex flex-col gap-6 p-4 max-h-[80vh] overflow-y-auto no-scrollbar bg-[#f8fafc] relative">
        {/* Document Preview Overlay */}
        {previewFile && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col p-6 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">
                    {previewFile.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    Version Preview • {previewFile.size}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center relative group">
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} className="text-[#1e70e9]" />
                </div>
                <h4 className="text-xl font-black text-gray-900">
                  Resume Preview Engine
                </h4>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Rendering secure encrypted version of{' '}
                  <b>{previewFile.name}</b>. Real-time document parsing in
                  progress...
                </p>
                <div className="mt-8 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1e70e9] animate-progress-fast"></div>
                </div>
              </div>
              {/* Simulated PDF Content */}
              <div className="w-full h-full p-12 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-y-auto no-scrollbar">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
                    <div>
                      <h1 className="text-4xl font-black uppercase tracking-tighter">
                        {employee.name}
                      </h1>
                      <p className="text-lg font-bold text-blue-600">
                        {employee.designation}
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold text-gray-400">
                      <p>{employee.location}</p>
                      <p>livik.tech/profile/{employee.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-10">
                    <div className="col-span-1 space-y-6">
                      <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2 underline decoration-blue-600 decoration-4">
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {actualSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2 underline decoration-blue-600 decoration-4">
                          Education
                        </h3>
                        <p className="text-[10px] font-bold">
                          B.Tech Computer Science
                        </p>
                        <p className="text-[9px] text-gray-400">
                          Anna University • 2018
                        </p>
                      </section>
                    </div>
                    <div className="col-span-2 space-y-6">
                      <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-2 underline decoration-blue-600 decoration-4">
                          Experience
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-black text-gray-900">
                              Total Experience
                            </p>
                            <p className="text-[10px] font-bold text-blue-600">
                              {employee.experience || 'Not specified'}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Successfully delivered{' '}
                              {employee.projectsDone || '0'} projects.
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex gap-8 border-b border-gray-200 mb-2">
          <button
            onClick={() => setActiveTab('basic')}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === 'basic'
                ? 'border-[#004475] text-[#004475]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Basic Details
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === 'resume'
                ? 'border-[#004475] text-[#004475]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Resume
          </button>
        </div>

        {/* TAB CONTENT: BASIC DETAILS */}
        {activeTab === 'basic' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Top section: 1/3 and 2/3 layout */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Profile Card */}
              <div className="w-full md:w-[35%] bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center self-start">
                <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-100 mb-4 bg-gray-50 flex items-center justify-center">
                  {employee.avatar ? (
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#004475]">
                      {employee.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                  {employee.name}
                </h2>
                <p className="text-gray-500 font-medium text-[13px] mt-1">
                  {employee.designation || 'Software Engineer'}
                </p>
                <div className="flex items-center flex-wrap justify-center gap-3 mt-6 w-full">
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 text-[11px] font-bold rounded-xl w-[45%] border border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
                    {employee.location?.split(',')[0] || 'Not Specified'}
                  </span>
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 text-[11px] font-bold rounded-xl w-[45%] border border-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
                    Full-Time
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full md:w-[65%] flex flex-col gap-4">
                {/* Availability Card */}
                <div className="bg-[#00335a] rounded-xl p-6 text-white shadow-md relative overflow-hidden group">
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <Briefcase size={120} />
                  </div>
                  <p className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-2">
                    Current Availability
                  </p>
                  <h3 className="text-3xl font-bold mt-1 mb-5 tracking-tight relative z-10">
                    {employee.status === 'Assigned'
                      ? 'Currently Assigned'
                      : 'Available for Allocation'}
                  </h3>

                  <div className="relative z-10">
                    <p className="text-sm font-bold opacity-90 flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${employee.status === 'Assigned' ? 'bg-amber-400' : 'bg-[#22c55e]'}`}
                      ></span>
                      {employee.status === 'Assigned'
                        ? 'Assigned to active project'
                        : 'Ready for immediate allocation'}
                    </p>
                  </div>
                </div>

                {/* Skills Distribution */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[140px]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 self-start w-full">
                    Skills Distribution
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 w-full">
                    {actualSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase rounded-lg border border-gray-100/50"
                      >
                        {skill}
                      </span>
                    ))}
                    {actualSkills.length === 0 && (
                      <span className="text-sm text-gray-400">
                        No skills added
                      </span>
                    )}
                  </div>
                  <div className="text-center w-full mt-auto pt-2">
                    <button className="text-xs font-bold text-[#004475] hover:underline">
                      View Full Skill Matrix
                    </button>
                  </div>
                </div>

                {/* Grid for Engagement and Location */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Engagement */}
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#004475] flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Current Engagement
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        {employee.status === 'Assigned'
                          ? 'Active Project'
                          : 'Bench Status'}
                      </p>
                      {employee.status !== 'Assigned' && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Duration:{' '}
                          {employee.benchDays != null
                            ? employee.benchDays
                            : '0'}{' '}
                          Days
                        </p>
                      )}
                      {employee.status === 'Assigned' && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Allocated
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Location */}
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#004475] flex items-center justify-center shrink-0">
                      <Globe size={18} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Location
                      </p>
                      <p className="text-xs font-bold text-gray-900">
                        Remote / On-site
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[120px]">
                        {employee.location || 'Not Specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Project History Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-2">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#004475]">
                  Recent Project History
                </h4>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {employeeProjects.length} TOTAL PROJECTS
                </span>
              </div>
              <div className="p-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-4 min-w-max">
                  {/* Actual Projects Loop */}
                  {employeeProjects.map((proj, idx) => {
                    const isCompleted = proj.status === 'Completed';

                    // Simple duration calculation if dates are present
                    let durationLabel = 'Ongoing';
                    if (proj.start && proj.end) {
                      const m1 = new Date(proj.start);
                      const m2 = new Date(proj.end);
                      if (!isNaN(m1) && !isNaN(m2)) {
                        const months =
                          (m2.getFullYear() - m1.getFullYear()) * 12 +
                          (m2.getMonth() - m1.getMonth());
                        durationLabel =
                          months > 0 ? `${months} Months` : '1 Month';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className="w-80 bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#004475] flex items-center justify-center shrink-0">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                            </svg>
                          </div>
                          {isCompleted ? (
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-bold uppercase tracking-wider rounded">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded">
                              In Progress
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-gray-900 mb-2 line-clamp-1">
                          {proj.title || proj.projectName || 'Project Name'}
                        </h5>
                        <p className="text-xs text-gray-500 leading-relaxed mb-6 line-clamp-2">
                          {proj.description || 'No description provided.'}
                        </p>
                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-500">
                          <span className="text-xs font-bold">
                            {durationLabel}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Manual Project */}
                  <div className="w-80 rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50">
                    <Plus size={32} className="mb-3 text-[#004475]" />
                    <span className="text-sm font-medium">
                      Add Manual Project
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: RESUME */}
        {activeTab === 'resume' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* 3. Resume Management */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-[#1e70e9] rounded-xl shadow-sm">
                    <FileText size={20} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 tracking-tight">
                    Resume Management
                  </h4>
                </div>

                <label className="p-2 bg-[#1e70e9] text-white rounded-xl hover:bg-blue-700 transition-all shadow-md mr-2 z-10 group relative cursor-pointer flex items-center justify-center">
                  <Plus size={20} />
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newResume = {
                          id: Date.now(),
                          name: file.name,
                          date: new Date().toISOString().split('T')[0],
                          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        };
                        setResumes((prev) => [newResume, ...prev]);
                        e.target.value = null;
                      }
                    }}
                  />
                </label>
              </div>

              <div className="divide-y divide-gray-100">
                {resumes.length > 0 ? (
                  resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="p-6 flex items-center gap-5 hover:bg-gray-50 transition-all cursor-pointer group"
                      onClick={() => setPreviewFile(resume)}
                    >
                      <div className="w-14 h-14 bg-blue-50 text-[#1e70e9] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        <FileText size={24} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <p className="text-lg font-black text-gray-900 leading-tight group-hover:text-[#1e70e9] transition-colors">
                          {resume.name}
                        </p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-1 tracking-wider">
                          Revised: {resume.date} • {resume.size}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center flex flex-col items-center gap-3">
                    <FileText size={48} className="text-gray-100" />
                    <p className="text-sm font-bold text-gray-400">
                      No resumes uploaded yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomModalForm>
  );
}
