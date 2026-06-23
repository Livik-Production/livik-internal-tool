'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  FolderKanban,
  Briefcase,
  Search,
  Plus,
  Calendar,
  TrendingUp,
  Rocket,
  Building2,
  ChevronDown,
  Globe,
  Trash2,
  CheckCircle2,
  SquarePen,
  Code2,
  UserCheck,
  UserMinus,
  Upload,
  FileText,
  Target,
  Loader2,
} from 'lucide-react';
import TabButton from '../Buttons/TabButton';
import PrimaryButton from '../Buttons/PrimaryButton';
import CustomModalForm from '../CustomModalForm';
import ConfirmDialog from '../ConfirmDialog';
import EmployeeProfileModal from '../EmployeeProfile/EmployeeProfileModal';
import Loader from '../Loader';
import Pagination from '../Pagination';
import IconButton from '../Buttons/IconButton';
import { showSuccessToast, showErrorToast } from '../Toast';

/* ====================================================================
   SUB-COMPONENTS
   ==================================================================== */

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [tags];
    } catch (e) {
      return [tags];
    }
  }
  return [];
};

function ProjectCard({ project, onEdit, onDelete, onTeamClick, onComplete }) {
  const isCompleted = project.status === 'Completed';

  // Calculate progress (mock or real based on available data)
  const progress = project.progress || 65;

  const tags = parseTags(project.tags)
    .filter(
      (tag) =>
        !tag.startsWith('AGREEMENT_FILE:') &&
        !tag.startsWith('CATEGORY:') &&
        tag !== 'ON TRACK'
    );
  const mainTag = tags.length > 0 ? tags[0] : 'GENERAL';

  return (
    <div
      className="p-3 bg-gray-50/50 rounded-3xl transition-all duration-500 relative border border-gray-300 hover:scale-[1.01] hover:shadow-xl shadow-sm flex flex-col xl:flex-row gap-2 group"
    >
      {/* LEFT COLUMN: Dark Blue Box */}
      <div className={`flex-1 rounded-2xl p-5 md:p-5 flex flex-col justify-between relative overflow-hidden ${isCompleted ? 'bg-[#0f291e]' : 'bg-[#0b1727]'}`}>
        {/* Top Right Action Area */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
          {!isCompleted && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border bg-blue-900/50 text-blue-300 border-blue-800/50">
              ACTIVE
            </span>
          )}
          <div className="flex items-center gap-2 transition-all">
            {onEdit && (
              <IconButton
                onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}
                className="p-2 bg-white/10 backdrop-blur text-gray-300 cursor-pointer hover:bg-white/20 hover:text-white rounded-lg transition-all"
                title="Edit Project"
              >
                <SquarePen size={16} />
              </IconButton>
            )}
            <IconButton
              onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
              className="p-2 bg-white/10 backdrop-blur text-red-400 cursor-pointer hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all"
              title="Delete Project"
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        </div>
        <div className="flex flex-col gap-5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border bg-white/10 text-gray-300 border-white/20">
              {mainTag}
            </span>
          </div>
          <div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {project.name}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-4 max-w-5xl leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Tech Stack - moved here */}
          {project.techStack && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Code2 size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Tech Stack
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.split(',').map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/10 text-blue-200 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-12 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="p-1 bg-white/5 rounded text-gray-300">
                <Briefcase size={12} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Client
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {project.client}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="p-1 bg-white/5 rounded text-gray-300">
                <Calendar size={12} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Start Date
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {new Date(project.start).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="p-1 bg-white/5 rounded text-gray-300">
                <UserCheck size={12} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Manager
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {project.manager || 'Unassigned'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="p-1 bg-white/5 rounded text-gray-300">
                <Target size={12} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Priority
              </span>
            </div>
            <span className="text-sm font-bold text-white">
              {project.priority || 'Medium'}
            </span>
          </div>
          {isCompleted ? (
            <div className="flex flex-col gap-2 justify-center">
              <div className="flex items-center gap-1.5 text-green-400 bg-green-900/30 px-3 py-1.5 rounded-full border border-green-800/50 shadow-sm w-fit mt-auto mb-auto">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Completed</span>
              </div>
            </div>
          ) : (
            onComplete && (
              <div className="flex flex-col gap-2 justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete?.(project); }}
                  className="flex items-center gap-1.5 text-blue-400 bg-blue-900/30 hover:bg-blue-800/50 hover:text-white px-3 py-1.5 rounded-full border border-blue-800/50 shadow-sm w-fit mt-auto mb-auto transition-all cursor-pointer"
                  title="Mark as Completed"
                >
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Mark Complete</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Assigned Employees */}
      <div className="w-full xl:w-[350px] flex flex-col gap-4">
        {/* Assigned Employees Box */}
        <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm flex flex-col gap-4 flex-1 max-h-[400px] overflow-y-auto no-scroll">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Assigned Team
            </span>
            <span className="text-[11px] font-bold text-[#004cf0] bg-blue-50 px-2 py-0.5 rounded-full">
              {project.members?.length || 0} Members
            </span>
          </div>

          {(project.members?.length || 0) > 0 ? (
            <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto no-scroll">
              {(project.members || []).map((m, idx) => {
                const name = m.employee
                  ? `${m.employee.firstName} ${m.employee.lastName}`
                  : 'Unknown';
                const role = m.role || m.employee?.designation || 'Staff';
                const avatar =
                  m.employee?.photo ||
                  `https://i.pravatar.cc/150?u=${m.employee?.id || m.employeeId}`;
                return (
                  <div
                    key={m.id || idx}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-100 shrink-0">
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {name}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium truncate">
                        {role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <Users size={28} className="text-gray-200" />
              <p className="text-xs font-medium text-gray-400">
                No team members assigned
              </p>
            </div>
          )}

          <button
            onClick={() => onTeamClick?.(project)}
            className={`w-full text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow ${(project.members?.length || 0) > 0
              ? 'bg-[#004cf0] text-white hover:bg-[#003bcc]'
              : 'bg-blue-50 text-[#004cf0] hover:bg-blue-100'
              }`}
          >
            {(project.members?.length || 0) > 0
              ? 'Manage Team'
              : 'Assign Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectTeamModal({
  open,
  onClose,
  project,
  onMemberClick,
  onUnassign,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const teamMembers = (project?.members || []).map((m) => ({
    id: m.employee?.id || m.employeeId,
    name: m.employee
      ? `${m.employee.firstName} ${m.employee.lastName}`
      : 'Unknown Employee',
    role: m.role || m.employee?.designation || 'Staff',
    status: 'online',
    skills: Array.isArray(m.employee?.skills)
      ? m.employee.skills
      : m.employee?.skills
        ? m.employee.skills.split(',')
        : [],
    avatar:
      m.employee?.photo ||
      `https://i.pravatar.cc/150?u=${m.employee?.id || m.employeeId}`,
  }));

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportRoster = () => {
    if (!project || !teamMembers.length) return;

    const headers = ['Name', 'Role', 'Skills'];
    const rows = teamMembers.map((m) => [m.name, m.role, m.skills.join('; ')]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${project.name.replace(/\s+/g, '_')}_Roster.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const footer = (
    <div className="flex items-center justify-end w-full gap-4 px-2"></div>
  );

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title={
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">Project Team</span>
          <span className="text-xs font-medium text-gray-500 mt-0.5">
            {project?.name}
          </span>
        </div>
      }
      widthClass="max-w-2xl"
      footer={footer}
    >
      <div className="flex flex-col h-full">
        {/* Search & Filter */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search assigned members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto max-h-[450px] no-scrollbar px-6 py-4 space-y-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-start justify-between group cursor-pointer hover:bg-blue-50/50 p-2 -m-2 rounded-xl transition-all"
              onClick={() => onMemberClick?.(member)}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 leading-tight">
                      {member.name}
                    </h4>
                    <p className="text-xs font-medium text-blue-600">
                      {member.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {member.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-[#1a1c23] text-white text-[10px] font-bold rounded-md uppercase tracking-wider"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnassign?.(member);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Unassign Member"
              >
                <UserMinus size={18} />
              </button>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <Users className="text-gray-200" size={48} />
              <p className="text-sm font-medium text-gray-500">
                No team members assigned to this project
              </p>
            </div>
          )}
        </div>
      </div>
    </CustomModalForm>
  );
}

function CreateProjectModal({ open, onClose, onSubmit }) {
  const labelCls = 'block text-sm font-bold text-gray-700 mb-2';
  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all bg-white placeholder-gray-400';

  const [form, setForm] = useState({
    name: '',
    client: '',
    industry: '',
    category: '',
    start: '',
    description: '',
    techStack: '',
    manager: '',
    priority: 'Medium',
    agreementName: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.client.trim()) e.client = 'Client is required';
    if (!form.start) e.start = 'Start date is required';
    return e;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    handleChange('agreementName', file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const tags = [form.industry.toUpperCase() || 'GENERAL', 'ON TRACK'];
      if (form.agreementName) {
        tags.push(`AGREEMENT_FILE:${form.agreementName}`);
      }
      const success = await onSubmit?.({
        ...form,
        projectCategory: form.category,
        id: `PROJ-${Math.floor(Math.random() * 1000)}`,
        team: [],
        status: 'Active',
        tags: tags,
      });
      if (success !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-4 w-full py-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 max-w-[140px] px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
      >
        Cancel
      </button>
      <PrimaryButton type="submit" form="create-project-form" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Creating...
          </>
        ) : (
          <>
            Create Project
            <Rocket size={18} />
          </>
        )}
      </PrimaryButton>
    </div>
  );

  const priorities = ['Low', 'Medium', 'Critical'];

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title="Create New Project"
      widthClass="max-w-3xl"
      footer={footer}
    >
      <div className="px-8 pt-6 pb-2">
        <form
          id="create-project-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="projName" className={labelCls}>
                Project Name *
              </label>
              <input
                id="projName"
                type="text"
                placeholder="e.g. Retail Analytics Platform"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`${inputCls} ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="projClient" className={labelCls}>
                Client Name *
              </label>
              <div className="relative group">
                <input
                  id="projClient"
                  type="text"
                  placeholder="Enter corporate entity name"
                  value={form.client}
                  onChange={(e) => handleChange('client', e.target.value)}
                  className={`${inputCls} pr-10 ${errors.client ? 'border-red-400 bg-red-50' : ''}`}
                />
                <Building2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
              {errors.client && (
                <p className="text-xs text-red-500 mt-1">{errors.client}</p>
              )}
            </div>

            <div>
              <label htmlFor="projManager" className={labelCls}>
                Project Owner
              </label>
              <div className="relative group">
                <input
                  id="projManager"
                  type="text"
                  placeholder="Assign a lead manager"
                  value={form.manager}
                  onChange={(e) => handleChange('manager', e.target.value)}
                  className={inputCls}
                />
                <UserCheck
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
            </div>

            <div>
              <label htmlFor="projIndustry" className={labelCls}>
                Industry
              </label>
              <div className="relative group">
                <select
                  id="projIndustry"
                  value={form.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select industry sector
                  </option>
                  <option value="Cloud Infrastructure">
                    Cloud Infrastructure
                  </option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <Globe size={18} />
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="projCategory" className={labelCls}>
                Project Category
              </label>
              <div className="relative group">
                <select
                  id="projCategory"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select project category
                  </option>
                  <option value="Development">Development</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Research & Development">
                    Research & Development
                  </option>
                  <option value="Internal">Internal</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <FolderKanban size={18} />
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="projStart" className={labelCls}>
                Start Date *
              </label>
              <div className="relative group">
                <input
                  id="projStart"
                  type="date"
                  value={form.start}
                  onChange={(e) => handleChange('start', e.target.value)}
                  className={`${inputCls} pr-10 ${errors.start ? 'border-red-400 bg-red-50' : ''}`}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors pointer-events-none"
                  size={18}
                />
              </div>
              {errors.start && (
                <p className="text-xs text-red-500 mt-1">{errors.start}</p>
              )}
            </div>

            <div className="md:col-span-2 w-1/2">
              <label htmlFor="projTechStack" className={labelCls}>
                Tech Stack
              </label>
              <div className="relative group">
                <input
                  id="projTechStack"
                  type="text"
                  placeholder="e.g. React, Node.js, AWS, MongoDB"
                  value={form.techStack}
                  onChange={(e) => handleChange('techStack', e.target.value)}
                  className={inputCls}
                />
                <Code2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Agreement Certificate</label>
              <div className="flex flex-col gap-2">
                <div
                  className={`flex flex-col items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver
                    ? 'border-[#004475] bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() =>
                    document.getElementById('agreement-upload').click()
                  }
                >
                  <Upload size={20} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700">
                      Click to upload or drag & drop Agreement Certificate
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      PDF, DOC, DOCX or images up to 5MB
                    </p>
                  </div>
                  <input
                    id="agreement-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
                {form.agreementName && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[#004475] shrink-0" />
                      <span className="text-xs font-bold text-[#004475] truncate">
                        {form.agreementName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('agreementName', '')}
                      className="text-xs font-bold text-red-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="projDesc" className={labelCls}>
                Project Description
              </label>
              <textarea
                id="projDesc"
                rows={3}
                placeholder="Outline the primary objectives, technical scope, and expected deliverables..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Project Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChange('priority', p)}
                    className={`py-2.5 text-sm font-bold rounded-xl border transition-all ${form.priority === p
                      ? 'bg-white border-blue-600 text-blue-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </CustomModalForm>
  );
}

function EditProjectModal({ open, onClose, project, onUpdate, isUpdating }) {
  const labelCls = 'block text-sm font-bold text-gray-700 mb-2';
  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all bg-white placeholder-gray-400';

  const [form, setForm] = useState({
    name: '',
    client: '',
    industry: '',
    category: '',
    start: '',
    description: '',
    priority: 'Medium',
    status: 'Active',
    team: '',
    techStack: '',
    manager: '',
    agreementName: '',
  });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (project) {
      const allTags = parseTags(project.tags);
      const agreementTag = allTags.find((tag) =>
        tag.startsWith('AGREEMENT_FILE:')
      );
      const agreementName = agreementTag
        ? agreementTag.replace('AGREEMENT_FILE:', '')
        : '';

      setForm({
        name: project.name || '',
        client: project.client || '',
        industry: parseTags(project.tags)[0] || '',
        category: project.projectCategory || '',
        start: project.start || '',
        description: project.description || '',
        priority: project.priority || 'Medium',
        status: project.status || 'Active',
        team: project.team?.join(', ') || '',
        techStack: project.techStack || '',
        manager: project.manager || '',
        agreementName: agreementName,
      });
    }
  }, [project]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    handleChange('agreementName', file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tags = [
      form.industry.toUpperCase() || 'GENERAL',
      parseTags(project.tags).find(
        (t) => t === 'ON TRACK' || t === 'AT RISK'
      ) || 'ON TRACK',
    ];
    if (form.agreementName) {
      tags.push(`AGREEMENT_FILE:${form.agreementName}`);
    }
    const success = await onUpdate?.({
      ...project,
      projectCategory: form.category,
      name: form.name,
      client: form.client,
      start: form.start,
      description: form.description,
      priority: form.priority,
      progress: parseInt(form.progress) || 0,
      team: form.team
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      tags: tags,
    });
    if (success) {
      onClose();
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-4 w-full py-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 max-w-[140px] px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
      >
        Cancel
      </button>
      <PrimaryButton type="submit" form="edit-project-form" disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update Project'}
        <Rocket size={18} />
      </PrimaryButton>
    </div>
  );

  const priorities = ['Low', 'Medium', 'Critical'];

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title="Edit Project Details"
      widthClass="max-w-3xl"
      footer={footer}
    >
      <div className="px-8 pt-6 pb-2">
        <form
          id="edit-project-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 h-[500px] overflow-y-auto no-scrollbar pr-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="editProjName" className={labelCls}>
                Project Name
              </label>
              <input
                id="editProjName"
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="editProjClient" className={labelCls}>
                Client Name
              </label>
              <div className="relative group">
                <input
                  id="editProjClient"
                  type="text"
                  value={form.client}
                  onChange={(e) => handleChange('client', e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <Building2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
            </div>

            <div>
              <label htmlFor="editProjManager" className={labelCls}>
                Project Owner
              </label>
              <div className="relative group">
                <input
                  id="editProjManager"
                  type="text"
                  value={form.manager}
                  onChange={(e) => handleChange('manager', e.target.value)}
                  className={inputCls}
                />
                <UserCheck
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
            </div>

            <div>
              <label htmlFor="editProjIndustry" className={labelCls}>
                Industry
              </label>
              <div className="relative group">
                <select
                  id="editProjIndustry"
                  value={form.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select industry sector
                  </option>
                  <option value="Cloud Infrastructure">
                    Cloud Infrastructure
                  </option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <Globe size={18} />
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="editProjCategory" className={labelCls}>
                Project Category
              </label>
              <div className="relative group">
                <select
                  id="editProjCategory"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Select project category
                  </option>
                  <option value="Development">Development</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Research & Development">
                    Research & Development
                  </option>
                  <option value="Internal">Internal</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <FolderKanban size={18} />
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="editProjStart" className={labelCls}>
                Start Date
              </label>
              <div className="relative group">
                <input
                  id="editProjStart"
                  type="date"
                  value={form.start}
                  onChange={(e) => handleChange('start', e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <Calendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            <div>
              <label htmlFor="editProjTechStack" className={labelCls}>
                Tech Stack
              </label>
              <div className="relative group">
                <input
                  id="editProjTechStack"
                  type="text"
                  value={form.techStack}
                  onChange={(e) => handleChange('techStack', e.target.value)}
                  className={inputCls}
                />
                <Code2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                  size={18}
                />
              </div>
            </div>
            <div>
              <label htmlFor="editProjStatus" className={labelCls}>
                Project Status
              </label>
              <div className="relative group">
                <select
                  id="editProjStatus"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Agreement Certificate</label>
              <div className="flex flex-col gap-2">
                <div
                  className={`flex flex-col items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver
                    ? 'border-[#004475] bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() =>
                    document.getElementById('edit-agreement-upload').click()
                  }
                >
                  <Upload size={20} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-700">
                      Click to upload or drag & drop Agreement Certificate
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      PDF, DOC, DOCX or images up to 5MB
                    </p>
                  </div>
                  <input
                    id="edit-agreement-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>
                {form.agreementName && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[#004475] shrink-0" />
                      <span className="text-xs font-bold text-[#004475] truncate">
                        {form.agreementName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('agreementName', '')}
                      className="text-xs font-bold text-red-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="editProjDesc" className={labelCls}>
                Project Description
              </label>
              <textarea
                id="editProjDesc"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Project Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChange('priority', p)}
                    className={`py-2.5 text-sm font-bold rounded-xl border transition-all ${form.priority === p
                      ? 'bg-white border-blue-600 text-blue-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </CustomModalForm>
  );
}

/* ====================================================================
   MAIN PORTFOLIO COMPONENT
   ==================================================================== */

export default function ProjectPortfolio({
  projectData,
  setProjectData,
  loading,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState('in-progress');
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);
  const [memberToUnassign, setMemberToUnassign] = useState(null);
  const [createSuccessOpen, setCreateSuccessOpen] = useState(false);
  const [lastCreatedProject, setLastCreatedProject] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, searchTerm]);

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setProfileOpen(true);
  };

  const handleTeamClick = (project) => {
    setSelectedProject(project);
    setTeamOpen(true);
  };

  const filteredProjects = projectData.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(term) ||
      (p.client || '').toLowerCase().includes(term) ||
      (Array.isArray(p.team) &&
        p.team.some((m) => (m || '').toLowerCase().includes(term)));

    if (subTab === 'completed')
      return matchesSearch && p.status === 'Completed';
    return matchesSearch && p.status !== 'Completed';
  });

  const handleEditClick = (project) => {
    setSelectedProject(project);
    setEditOpen(true);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleUnassignClick = (member) => {
    setMemberToUnassign(member);
    setUnassignConfirmOpen(true);
  };

  const handleConfirmUnassign = async () => {
    if (selectedProject && memberToUnassign) {
      try {
        const res = await fetch('/api/projects/assign', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProject.id,
            employeeId: memberToUnassign.id,
          }),
        });

        if (res.ok) {
          // Update local state
          const updatedMembers = selectedProject.members.filter(
            (m) => (m.employee?.id || m.employeeId) !== memberToUnassign.id
          );

          const updatedProject = {
            ...selectedProject,
            members: updatedMembers,
            team: updatedMembers.map((m) =>
              m.employee
                ? `${m.employee.firstName} ${m.employee.lastName}`
                : 'Unknown'
            ),
          };

          setProjectData((prev) =>
            prev.map((p) => (p.id === selectedProject.id ? updatedProject : p))
          );

          setSelectedProject(updatedProject);
          setUnassignConfirmOpen(false);
          setMemberToUnassign(null);
          showSuccessToast('Team member unassigned successfully!');
        } else {
          showErrorToast('Failed to unassign team member.');
          console.error('Failed to unassign member');
        }
      } catch (err) {
        showErrorToast('An error occurred during unassignment.');
        console.error('Unassign error:', err);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/projects/${projectToDelete.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setProjectData((prev) =>
            prev.filter((p) => p.id !== projectToDelete.id)
          );
          setDeleteConfirmOpen(false);
          setProjectToDelete(null);
          showSuccessToast('Project deleted successfully!');
        } else {
          showErrorToast('Failed to delete project.');
          console.error('Failed to delete project');
        }
      } catch (err) {
        showErrorToast('An error occurred during deletion.');
        console.error('Delete error:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  const handleUpdateProject = async (updatedProject) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProject.name,
          client: updatedProject.client,
          description: updatedProject.description,
          projectCategory: updatedProject.projectCategory,
          startDate: updatedProject.start,
          priority: updatedProject.priority,
          manager: updatedProject.manager,
          techStack: updatedProject.techStack,
          status: updatedProject.status,
          tags: updatedProject.tags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProjectData((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? {
                ...updated,
                id: updated.id,
                start: updated.startDate,
                team: updated.members
                  ? updated.members.map(
                    (m) =>
                      `${m.employee?.firstName} ${m.employee?.lastName}`
                  )
                  : p.team,
              }
              : p
          )
        );
        showSuccessToast('Project updated successfully!');
        return true;
      } else {
        showErrorToast('Failed to update project.');
        return false;
      }
    } catch (err) {
      showErrorToast('An error occurred during update.');
      console.error('Update project error:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <Loader label="Loading projects..." size="lg" fullScreen={false} />;
  }

  return (
    <div className="flex flex-col gap-4 -m-2 p-2.5 rounded-b-2xl animate-dashboard-reveal">
      {/* Sub-Tabs Section */}
      <nav
        role="tablist"
        className="flex items-center border-b border-gray-200 gap-1.5 mb-2"
      >
        <TabButton
          isActive={subTab === 'in-progress'}
          onClick={() => setSubTab('in-progress')}
        >
          <div className="flex items-center gap-2">
            In-Progress
            <span className="bg-gray-100 text-[#004475] py-0.5 px-2 rounded-full text-xs border border-gray-200">
              {projectData?.filter((p) => p.status !== 'Completed').length || 0}
            </span>
          </div>
        </TabButton>
        <TabButton
          isActive={subTab === 'completed'}
          onClick={() => setSubTab('completed')}
        >
          <div className="flex items-center gap-2">
            Completed
            <span className="bg-gray-100 text-[#004475] py-0.5 px-2 rounded-full text-xs border border-gray-200">
              {projectData?.filter((p) => p.status === 'Completed').length || 0}
            </span>
          </div>
        </TabButton>
      </nav>

      {/* Portfolio Header - Only show under In-Progress if requested, or always show below tabs. 
          Given the text "to be under the sub tab in progress tab", we will wrap it in a condition 
          or just place it below. Let's place it below and show for all, but wait, the prompt says "under the sub tab in progress tab".
          Let's wrap in `subTab === 'in-progress'` condition. */}
      {subTab === 'in-progress' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Project Portfolio
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all w-64 shadow-sm"
              />
            </div>
            <PrimaryButton
              onClick={() => setCreateOpen(true)}
              className="px-5 py-2.5"
            >
              <Plus size={18} />
              Create New Project
            </PrimaryButton>
          </div>
        </div>
      )}

      {subTab === 'completed' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Completed Projects
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004475] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all w-64 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProjects
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onEdit={subTab === 'in-progress' ? handleEditClick : null}
              onDelete={handleDeleteClick}
              onTeamClick={handleTeamClick}
              onComplete={subTab === 'in-progress' ? () => handleUpdateProject({ ...proj, status: 'Completed' }) : null}
            />
          ))}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredProjects.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          rowsPerPageOptions={[6, 12, 24, 48]}
        />
      </div>

      {createOpen && (
        <CreateProjectModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (newProj) => {
            try {
              const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId:
                    newProj.id || `PROJ-${Math.floor(Math.random() * 1000)}`,
                  name: newProj.name,
                  client: newProj.client,
                  description: newProj.description,
                  startDate: newProj.start,
                  manager: newProj.manager,
                  techStack: newProj.techStack,
                  tags: newProj.tags,
                  status: 'Active',
                }),
              });
              if (res.ok) {
                const created = await res.json();
                setProjectData((prev) => [
                  ...prev,
                  {
                    ...created,
                    id: created.id,
                    start: created.startDate,
                    team: [],
                  },
                ]);
                setLastCreatedProject(created);
                setCreateSuccessOpen(true);
                showSuccessToast('Project created successfully!');
                return true;
              } else {
                showErrorToast('Failed to create project.');
                return false;
              }
            } catch (err) {
              showErrorToast('An error occurred during creation.');
              console.error('Create project error:', err);
              return false;
            }
          }}
        />
      )}

      {editOpen && (
        <EditProjectModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onUpdate={handleUpdateProject}
          isUpdating={isUpdating}
        />
      )}

      {teamOpen && (
        <ProjectTeamModal
          open={teamOpen}
          onClose={() => {
            setTeamOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onMemberClick={handleMemberClick}
          onUnassign={handleUnassignClick}
        />
      )}

      {profileOpen && (
        <EmployeeProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          employee={selectedMember}
        />
      )}

      {deleteConfirmOpen && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Project"
          description={
            <p>
              Are you sure you want to delete{' '}
              <span className="font-bold">{projectToDelete?.name}</span>? This
              action cannot be undone and all associated resource allocations
              will be removed.
            </p>
          }
          confirmLabel="Delete Project"
          cancelLabel="Cancel"
          destructive={true}
          loading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
          }}
        />
      )}

      {unassignConfirmOpen && (
        <ConfirmDialog
          open={unassignConfirmOpen}
          title="Unassign Team Member"
          description={
            <p>
              Are you sure you want to remove{' '}
              <span className="font-bold">{memberToUnassign?.name}</span> from{' '}
              <span className="font-bold">{selectedProject?.name}</span>?
            </p>
          }
          confirmLabel="Unassign Member"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleConfirmUnassign}
          onCancel={() => {
            setUnassignConfirmOpen(false);
            setMemberToUnassign(null);
          }}
        />
      )}

      {createSuccessOpen && (
        <ConfirmDialog
          open={createSuccessOpen}
          title="Project Launched Successfully!"
          description={
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-green-900">
                    {lastCreatedProject?.name}
                  </h4>
                  <p className="text-xs text-green-700">
                    Project has been initialized and is ready for resource
                    allocation.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 px-1">
                You can now start assigning team members to this project from
                the Staffing module.
              </p>
            </div>
          }
          confirmLabel="Got it"
          onConfirm={() => {
            setCreateSuccessOpen(false);
            setLastCreatedProject(null);
          }}
          onCancel={() => {
            setCreateSuccessOpen(false);
            setLastCreatedProject(null);
          }}
        />
      )}
    </div>
  );
}
