'use client';

import { useState } from 'react';
import {
  FolderCheck,
  Search,
  RefreshCcw,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import CustomModalForm from '../CustomModalForm';
import EmployeeProfileModal from '../EmployeeProfile/EmployeeProfileModal';
import BenchEmployeeModal from './BenchEmployeeModal';
import ConfirmDialog from '../ConfirmDialog';
import Loader from '../Loader';
import { toast } from 'react-toastify';
import Pagination from '../Pagination';
import IconButton from '../Buttons/IconButton';

/* ====================================================================
   ASSIGN PROJECT MODAL
   ==================================================================== */
function AssignProjectModal({ open, onClose, employee, onAssign, projects }) {
  const labelCls = 'block text-sm font-bold text-gray-700 mb-2';
  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all bg-white placeholder-gray-400';

  const [form, setForm] = useState({
    projectId: '',
    roleInProject: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = 'Please select a project';
    if (!form.roleInProject.trim()) e.roleInProject = 'Role is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    return e;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const project = projects.find((p) => p.id === form.projectId);
    onAssign?.({
      empId: employee?.id,
      empName: employee?.name,
      designation: employee?.designation,
      experience: employee?.experience,
      projectId: form.projectId,
      projectName: project?.name ?? '',
      client: project?.client ?? '',
      roleInProject: form.roleInProject,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: form.notes,
    });
    onClose();
  };

  const selectedProject = projects.find((p) => p.id === form.projectId);

  const footer = (
    <div className="flex items-center justify-center gap-4 w-full py-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 max-w-[140px] px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="assign-project-form"
        className="flex-1 max-w-[200px] flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#004475] rounded-xl hover:bg-[#00335a] transition-all shadow-lg"
      >
        Assign Resource
        <FolderCheck size={18} />
      </button>
    </div>
  );

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title="Resource Allocation"
      widthClass="max-w-2xl"
      footer={footer}
    >
      <form id="assign-project-form" onSubmit={handleSubmit} noValidate>
        <div className="px-8 pt-6 pb-2 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
          {/* Employee Summary Chip */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#004475] shadow-sm font-bold">
              {employee?.name?.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                {employee?.name}
              </h4>
              <p className="text-xs text-gray-500 font-medium">
                {employee?.designation} • {employee?.experience}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="projectId" className={labelCls}>
                Select Target Project *
              </label>
              <div className="relative group">
                <select
                  id="projectId"
                  value={form.projectId}
                  onChange={(e) => handleChange('projectId', e.target.value)}
                  className={`${inputCls} appearance-none pr-10 ${errors.projectId ? 'border-red-400 bg-red-50' : ''}`}
                >
                  <option value="">— Choose from active projects —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <ChevronDown size={14} />
                </div>
              </div>
              {errors.projectId && (
                <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="roleInProject" className={labelCls}>
                Project Role *
              </label>
              <input
                id="roleInProject"
                type="text"
                placeholder="e.g. Lead Developer"
                value={form.roleInProject}
                onChange={(e) => handleChange('roleInProject', e.target.value)}
                className={`${inputCls} ${errors.roleInProject ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.roleInProject && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.roleInProject}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="startDate" className={labelCls}>
                Allocation Start *
              </label>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`${inputCls} ${errors.startDate ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className={labelCls}>
                Expected End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="assignNotes" className={labelCls}>
                Assignment Notes
              </label>
              <textarea
                id="assignNotes"
                rows={3}
                placeholder="Specify key deliverables or focus areas..."
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
}

/* ====================================================================
   TALENT CARD COMPONENT
   ==================================================================== */
function TalentCard({ emp, onView, onAssign, onViewSkills }) {
  const isBench = emp.status !== 'Assigned';

  const statusConfig = {
    Available: {
      label: 'BENCH',
      color: 'bg-blue-100 text-blue-800',
    },
    'In Talks': {
      label: 'PIPELINE',
      color: 'bg-amber-100 text-amber-800',
    },
    'Shadow Mode': {
      label: 'SHADOW',
      color: 'bg-purple-100 text-purple-800',
    },
    Assigned: {
      label: 'PROJECT',
      color: 'bg-emerald-100 text-emerald-800',
    },
  };

  const config = statusConfig[emp.status] || statusConfig['Available'];

  const skills = (Array.isArray(emp.skills) ? emp.skills : []).map((s) =>
    typeof s === 'string' ? s : s.name || ''
  );

  return (
    <div
      className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex flex-1">
        {/* Left Section */}
        <div className="w-[42%] bg-[#f8fafc] p-6 flex flex-col items-center text-center justify-center border-r border-gray-50 relative">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
              {emp.avatar ? (
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-[#004475]">
                  {emp.name.charAt(0)}
                </span>
              )}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isBench ? 'bg-[#22c55e]' : 'bg-amber-500'}`}
            ></div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
            {emp.name}
          </h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight mb-4 min-h-[24px]">
            {emp.designation || 'Software Engineer'}
          </p>

          <span
            className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${config.color}`}
          >
            {config.label}
          </span>
        </div>

        {/* Right Section */}
        <div className="w-[58%] p-6 flex flex-col justify-center">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block mb-2">
              Expertise
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 3).map((skill, index) => {
                const isLast =
                  index === 2 ||
                  (index === skills.length - 1 && skills.length < 3);
                return (
                  <span
                    key={index}
                    className="px-2.5 py-1 text-[10px] bg-blue-100 text-blue-600 font-bold rounded-full"
                  >
                    {skill}
                  </span>
                );
              })}
              {skills.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSkills?.(emp);
                  }}
                  className="px-2.5 py-1 text-[10px] bg-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  +{skills.length - 3}
                </button>
              )}
              {skills.length === 0 && (
                <span className="text-xs text-gray-400 font-medium">
                  Not specified
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Exp Level
              </span>
              <span className="text-lg font-bold text-gray-900 leading-none">
                {emp.experience != null && String(emp.experience).trim() !== ''
                  ? `${!isNaN(parseFloat(emp.experience)) ? parseFloat(emp.experience) : emp.experience} yrs`
                  : '1 yrs'}
              </span>
            </div>

            <div
              className={`flex items-center justify-between py-2.5 ${isBench ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Success Rate
              </span>
              <span className="text-[11px] font-bold text-[#22c55e]">
                {emp.projectsDone
                  ? `${emp.projectsDone}+ Projects`
                  : '0 Projects'}
              </span>
            </div>

            {isBench && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Bench Tenure
                </span>
                <span className="text-[11px] font-bold text-orange-500">
                  {emp.benchDays != null ? `${emp.benchDays} Days` : '0 Days'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div
        className={`grid ${isBench ? 'grid-cols-[42%_58%]' : 'grid-cols-1'} border-t border-gray-100 h-12 shrink-0`}
      >
        <button
          onClick={() => onView(emp)}
          className="bg-white hover:bg-gray-50 text-gray-900 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
        >
          View Profile
        </button>
        {isBench && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(emp);
            }}
            className="flex items-center justify-center text-[11px] font-black uppercase tracking-widest transition-colors bg-[#004475] text-white "
          >
            Assign
          </button>
        )}
      </div>
    </div>
  );
}

/* ====================================================================
   FILTER MODAL COMPONENT
   ==================================================================== */
function FilterBenchModal({
  open,
  onClose,
  filters,
  onApply,
  uniqueSkills,
  uniqueDepartments,
}) {
  const [local, setLocal] = useState(filters);
  const labelCls = 'block text-sm font-bold text-gray-700 mb-2';
  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all bg-white';

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    const empty = { skill: '', experience: '', department: '' };
    setLocal(empty);
    onApply(empty);
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-4 w-full py-2">
      <button
        type="button"
        onClick={handleClear}
        className="flex-1 max-w-[140px] px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
      >
        Clear Filters
      </button>
      <PrimaryButton onClick={handleApply}>
        Apply Filters
        <Filter size={18} />
      </PrimaryButton>
    </div>
  );

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title="Filter Resources"
      widthClass="max-w-md"
      footer={footer}
    >
      <div className="px-8 pt-6 pb-2 space-y-6">
        <div>
          <label htmlFor="filterSkill" className={labelCls}>
            Skill
          </label>
          <div className="relative group">
            <select
              id="filterSkill"
              value={local.skill}
              onChange={(e) => setLocal({ ...local, skill: e.target.value })}
              className={`${inputCls} appearance-none pr-10`}
            >
              <option value="">All Skills</option>
              {uniqueSkills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="filterExp" className={labelCls}>
            Experience
          </label>
          <div className="relative group">
            <select
              id="filterExp"
              value={local.experience}
              onChange={(e) =>
                setLocal({ ...local, experience: e.target.value })
              }
              className={`${inputCls} appearance-none pr-10`}
            >
              <option value="">All Experience Levels</option>
              <option value="0-2">0 - 2 Years</option>
              <option value="3-5">3 - 5 Years</option>
              <option value="6-10">6 - 10 Years</option>
              <option value="10+">10+ Years</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="filterDept" className={labelCls}>
            Department
          </label>
          <div className="relative group">
            <select
              id="filterDept"
              value={local.department}
              onChange={(e) =>
                setLocal({ ...local, department: e.target.value })
              }
              className={`${inputCls} appearance-none pr-10`}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>
    </CustomModalForm>
  );
}

/* ====================================================================
   SKILLS LIST MODAL
   ==================================================================== */
function SkillsListModal({ open, onClose, employee }) {
  const skills = (Array.isArray(employee?.skills) ? employee.skills : []).map(
    (s) => (typeof s === 'string' ? s : s.name || '')
  );

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title={`${employee?.name || 'Employee'}'s Skills`}
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end w-full py-2">
          <PrimaryButton onClick={onClose}>Close</PrimaryButton>
        </div>
      }
    >
      <div className="px-8 pt-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? (
            skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No skills specified.</span>
          )}
        </div>
      </div>
    </CustomModalForm>
  );
}

/* ====================================================================
   MAIN BENCH PORTFOLIO COMPONENT
   ==================================================================== */
export default function BenchPortfolio({
  projects,
  benchData,
  setBenchData,
  loading,
  refreshData,
}) {
  const [subTab, setSubTab] = useState('bench'); // 'project' | 'bench'
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Filter state
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    skill: '',
    experience: '',
    department: '',
  });

  // Skills modal state
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [skillsTarget, setSkillsTarget] = useState(null);

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAssignData, setPendingAssignData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openAssign = (emp) => {
    setAssignTarget(emp);
    setAssignOpen(true);
  };

  const handleAssignSubmit = (data) => {
    setPendingAssignData(data);
    setConfirmOpen(true);
  };

  const executeAssign = async () => {
    if (!pendingAssignData) return;
    const data = pendingAssignData;
    setSubmitting(true);

    try {
      const res = await fetch('/api/projects/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: data.projectId,
          employeeId: data.empId,
          role: data.roleInProject,
        }),
      });

      if (res.ok) {
        toast.success(
          `${data.empName} successfully assigned to ${data.projectName}`
        );
        // Refresh all data to ensure consistency across tabs
        if (refreshData) {
          await refreshData();
        } else {
          // Fallback local update if refreshData is missing
          setBenchData((prev) =>
            prev.map((emp) =>
              emp.id === data.empId
                ? {
                    ...emp,
                    status: 'Assigned',
                    assignedProject: data.projectName,
                  }
                : emp
            )
          );
        }
        // Switch to "In Project" tab so user sees the assigned employee
        setSubTab('project');
        setAssignOpen(false);
        setAssignTarget(null);
        setConfirmOpen(false);
        setPendingAssignData(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Assignment failed');
        console.error('Assignment failed:', err.error);
      }
    } catch (err) {
      toast.error('A network error occurred. Please try again.');
      console.error('Assign API error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openAdd = () => {
    setModalMode('add');
    setSelectedEmp(null);
    setModalOpen(true);
  };

  const openView = (emp) => {
    setSelectedEmp(emp);
    setProfileOpen(true);
  };

  const openSkills = (emp) => {
    setSkillsTarget(emp);
    setSkillsModalOpen(true);
  };

  const openEdit = (emp) => {
    setModalMode('edit');
    setSelectedEmp(emp);
    setModalOpen(true);
  };

  const handleAddSubmit = (formData) => {
    setBenchData((prev) => [
      ...prev,
      {
        id: formData.empId,
        name: formData.name,
        designation: formData.designation,
        department: formData.department,
        skills: formData.skills,
        experience: formData.experience,
        projectsDone: formData.projectsDone,
        benchSince: formData.benchSince,
        manager: formData.manager,
        location: formData.location,
        status: formData.status,
        remarks: formData.remarks,
        resumeFile: formData.resumeFile,
        resumeName: formData.resumeName,
        resumes: formData.resumeName
          ? [
              {
                id: Date.now(),
                name: formData.resumeName,
                date: new Date().toISOString().split('T')[0],
                size: 'Uploaded just now',
              },
            ]
          : [],
      },
    ]);
  };

  const uniqueSkills = Array.from(
    new Set(
      benchData.flatMap((emp) =>
        (Array.isArray(emp.skills) ? emp.skills : []).map((s) =>
          typeof s === 'string' ? s : s.name || ''
        )
      )
    )
  )
    .filter(Boolean)
    .sort();

  const uniqueDepartments = Array.from(
    new Set(benchData.map((emp) => emp.department))
  )
    .filter(Boolean)
    .sort();

  const filteredBench = benchData.filter((emp) => {
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.designation || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (Array.isArray(emp.skills) &&
        emp.skills.some((s) =>
          (typeof s === 'string' ? s : s.name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        ));

    // Experience matching
    let matchesExp = true;
    if (activeFilters.experience) {
      const exp = parseFloat(emp.experience) || 0;
      if (activeFilters.experience === '0-2') matchesExp = exp >= 0 && exp <= 2;
      else if (activeFilters.experience === '3-5')
        matchesExp = exp > 2 && exp <= 5;
      else if (activeFilters.experience === '6-10')
        matchesExp = exp > 5 && exp <= 10;
      else if (activeFilters.experience === '10+') matchesExp = exp > 10;
    }

    // Skill matching
    let matchesSkill = true;
    if (activeFilters.skill) {
      matchesSkill =
        Array.isArray(emp.skills) &&
        emp.skills.some(
          (s) =>
            (typeof s === 'string' ? s : s.name || '') === activeFilters.skill
        );
    }

    // Department matching
    let matchesDept = true;
    if (activeFilters.department) {
      matchesDept = emp.department === activeFilters.department;
    }

    const matchesAllFilters =
      matchesSearch && matchesExp && matchesSkill && matchesDept;

    if (subTab === 'project')
      return matchesAllFilters && emp.status === 'Assigned';
    return matchesAllFilters && emp.status !== 'Assigned';
  });

  if (loading) {
    return <Loader label="Loading resources..." size="lg" fullScreen={false} />;
  }

  const currentBenchItems = filteredBench.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-8 bg-[#fdfdfd] p-2 rounded-b-3xl mb-4 animate-dashboard-reveal min-h-[798px] font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row  justify-end gap-6 px-2">
        <div className="flex flex-col md:flex-row items-center justify-end gap-3 px-2">
          {/* Search Field with Integrated Refresh */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Quick find..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder:text-gray-400"
            />
            {searchTerm && (
              <IconButton
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1 shadow-none bg-transparent hover:bg-transparent"
                title="Clear search"
              >
                <X size={14} className="text-gray-400 hover:text-red-500 hover:scale-110" />
              </IconButton>
            )}
          </div>

          <PrimaryButton onClick={() => setFilterModalOpen(true)}>
            <Filter size={16} />
            Filters
            {(activeFilters.skill ||
              activeFilters.experience ||
              activeFilters.department) && (
              <span
                className="flex items-center justify-center p-0.5 ml-1 bg-white/20 hover:bg-white/40 hover:text-red-100 rounded-full transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFilters({
                    skill: '',
                    experience: '',
                    department: '',
                  });
                }}
                title="Clear all filters"
              >
                <X size={14} />
              </span>
            )}
          </PrimaryButton>
        </div>
        <div className="flex items-center bg-gray-100 rounded-2xl w-fit shadow-inner">
          <button
            onClick={() => setSubTab('project')}
            className={`px-8 py-2.5 rounded-xl text-sm border border-gray-300 font-black transition-all ${
              subTab === 'project'
                ? 'bg-white text-[#004475] border-gray-300 shadow-xl scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            In Project
          </button>
          <button
            onClick={() => setSubTab('bench')}
            className={`px-8 py-2.5 rounded-xl text-sm border-gray-300 font-black transition-all ${
              subTab === 'bench'
                ? 'bg-white text-[#004475] border-gray-300 shadow-xl scale-105'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            On Bench
          </button>
        </div>
      </div>

      {/* Filter Bar */}

      {/* Card Grid */}
      {currentBenchItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
          {currentBenchItems.map((emp) => (
            <TalentCard
              key={emp.id}
              emp={emp}
              onView={openView}
              onAssign={openAssign}
              onViewSkills={openSkills}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-sm py-20 select-none bg-gray-50 rounded-xl border border-dashed border-gray-300 w-full mb-6">
          No matches found for your search or applied filters.
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredBench.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
          rowsPerPageOptions={[6, 12, 18, 24]}
        />
      </div>

      {/* Modals */}
      {skillsModalOpen && skillsTarget && (
        <SkillsListModal
          open={skillsModalOpen}
          onClose={() => {
            setSkillsModalOpen(false);
            setSkillsTarget(null);
          }}
          employee={skillsTarget}
        />
      )}

      {filterModalOpen && (
        <FilterBenchModal
          open={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          filters={activeFilters}
          onApply={setActiveFilters}
          uniqueSkills={uniqueSkills}
          uniqueDepartments={uniqueDepartments}
        />
      )}

      {modalOpen && (
        <BenchEmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          data={selectedEmp}
          onSubmit={handleAddSubmit}
        />
      )}

      {profileOpen && (
        <EmployeeProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          employee={selectedEmp}
        />
      )}

      {assignOpen && assignTarget && (
        <AssignProjectModal
          open={assignOpen}
          onClose={() => {
            setAssignOpen(false);
            setAssignTarget(null);
          }}
          employee={assignTarget}
          projects={projects}
          onAssign={handleAssignSubmit}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          open={confirmOpen}
          loading={submitting}
          title="Confirm Assignment"
          description={`Are you sure you want to assign ${pendingAssignData?.empName} to the project "${pendingAssignData?.projectName}" as ${pendingAssignData?.roleInProject}?`}
          confirmLabel="Assign Now"
          onConfirm={executeAssign}
          onCancel={() => {
            if (!submitting) {
              setConfirmOpen(false);
              setPendingAssignData(null);
            }
          }}
        />
      )}
    </div>
  );
}
