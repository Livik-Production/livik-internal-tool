'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  ChevronDown,
  Edit2,
  X,
  Calendar,
  Save,
  Loader2,
  SquarePen,
  Layers,
  Users,
} from 'lucide-react';
import Loader from '../Loader';
import { toast } from 'react-toastify';

const SkillsDirectory = ({ isTab = false, isViewOnly = false }) => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedExp, setSelectedExp] = useState('All Employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [editForm, setEditForm] = useState({
    skills: [],
    totalExperience: '',
    projectsDone: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Mid' });
  const [isSaving, setIsSaving] = useState(false);

  // Derive unique departments from employee data
  const departments = [
    'All Departments',
    ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
  ];

  useEffect(() => {
    setMounted(true);
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Failed to load employee directory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (employee) => {
    if (isViewOnly) return;
    setSelectedEmployee(employee);
    setEditForm({
      skills: employee.skills
        ? employee.skills.map((s) => ({
          name: s.name,
          category: s.category || 'Mid',
        }))
        : [],
      totalExperience: employee.totalExperience || '',
      projectsDone: employee.projectsDone || '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setNewSkill({ name: '', category: 'Mid' });
    setIsModalOpen(true);
  };

  const addSkillTag = () => {
    if (
      newSkill.name.trim() &&
      !editForm.skills.some((s) => s.name === newSkill.name.trim())
    ) {
      setEditForm((prev) => ({
        ...prev,
        skills: [
          ...prev.skills,
          { name: newSkill.name.trim(), category: newSkill.category },
        ],
      }));
      setNewSkill({ name: '', category: 'Mid' });
    }
  };

  const removeSkillTag = (skillName) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name !== skillName),
    }));
  };

  const handleSaveSkills = async () => {
    if (!selectedEmployee || isViewOnly) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/employees/${selectedEmployee.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: editForm.skills.map((s) => ({
            name: s.name,
            category: s.category,
            proficiency: s.category, // Mapping category to proficiency for display consistency
            effectiveDate: editForm.effectiveDate,
          })),
          totalExperience: editForm.totalExperience,
          projectsDone: editForm.projectsDone,
        }),
      });

      if (!res.ok) throw new Error('Failed to update skills');

      toast.success('Skills updated successfully');
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Save skills error:', error);
      toast.error('Failed to update skills');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === 'All Departments' || emp.department === selectedDept;
    const matchesExp =
      selectedExp === 'All Employees' ||
      (emp.skills && emp.skills.some((s) =>
        (s.category || '').toLowerCase() === selectedExp.toLowerCase()
      ));
    const status = (emp.status || '').toLowerCase();
    const isApproved = status === 'active' || status === 'approved';

    return matchesSearch && matchesDept && matchesExp && isApproved;
  });

  return (
    <div className={`flex flex-col h-full bg-transparent ${isTab ? '' : 'space-y-2 overflow-hidden'}`}>
      {/* Page Header */}
      {!isTab && (
        <header className="bg-white rounded-xl shadow-md p-2 m-0.5 border border-gray-200 animate-dashboard-reveal">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                <Layers size={30} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Employee Skills Directory
                </h1>
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  Manage and track workforce competencies across all departments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
              <div className="flex -space-x-3">
                {employees.slice(0, 5).map((e, i) => (
                  <img key={i} src={e.photo || `https://i.pravatar.cc/150?u=${e.id}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                ))}
                <div className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400">
                  +{employees.length > 5 ? employees.length - 5 : 0}
                </div>
              </div>
              <div className="h-6 w-px bg-blue-200 mx-1"></div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#004475]" />
                <span className="text-[11px] font-black text-[#004475] uppercase tracking-widest">
                  {filteredEmployees.length} Professionals
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Content Card */}
      <div className={isTab ? "flex-1 flex flex-col min-h-0 space-y-3 md:space-y-3" : "bg-white rounded-2xl shadow-xl border border-gray-200 m-1 flex-1 flex flex-col min-h-0 space-y-3 md:space-y-3 overflow-y-auto custom-scrollbar"}>
        {/* Filter Bar */}
        <div className="p-3 md:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 md:gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, role or emp ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Department Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-gray-600 sm:min-w-[180px]"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>

              {/* Experience Level Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-gray-600 sm:min-w-[160px]"
                >
                  <option value="All Employees">All Levels</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Expert">Expert</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <Loader label="Syncing directory..." size="lg" fullScreen={false} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4 px-3">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white border border-gray-400 rounded-[1.5rem] p-3 md:p-4 shadow-[0_15px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.07)] transition-all duration-500 group flex flex-col justify-between min-h-[320px] md:min-h-[290px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100/40 transition-colors"></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-white">
                        <img
                          src={emp.photo || `https://i.pravatar.cc/150?u=${emp.id}`}
                          alt={emp.firstName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="pt-1">
                        <h3 className="text-xl font-bold text-[#1a1c23] leading-tight transition-colors">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <p className="text-[11px] font-bold text-[#004475] mt-1.5 uppercase tracking-[0.05em]">
                          {emp.designation || 'Technical Specialist'}
                        </p>
                        <div className="mt-1.5 py-0.5 text-gray-500 text-[11px] font-bold rounded-lg w-fit">
                          {emp.empId}
                        </div>
                      </div>
                    </div>
                    {!isViewOnly && (
                      <div className="flex flex-col items-end gap-6">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 border border-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-gray-50 shadow-sm bg-white hover:border-blue-100"
                          title="Edit Skills"
                        >
                          <SquarePen size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metrics Section (Moved Above Proficiencies) */}
                  <div className="pt-3 pb-2.5 mb-4 border-t border-b border-gray-300 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col items-start min-w-[120px]">
                      <span className="text-[12px] font-bold text-[#004475] mb-2 uppercase tracking-[0.04em]">
                        Department
                      </span>
                      <span className="text-[11.5px] font-bold text-[#1a1c23] uppercase tracking-tight">
                        {emp.department || 'Dev Team'}
                      </span>
                    </div>
                    <div className="flex gap-8 md:gap-12">
                      <div className="flex flex-col items-center">
                        <span className="text-[12px] font-bold text-[#004475] mb-2 uppercase tracking-[0.05em]">
                          Experience
                        </span>
                        <span className="text-md font-bold text-[#1a1c23]">
                          {emp.totalExperience || '0Y'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center relative">
                        <span className="text-[12px] font-bold text-[#004475] mb-2 uppercase tracking-[0.05em]">
                          Projects
                        </span>
                        <span className="text-md font-bold text-[#1a1c23]">
                          {emp.projectsDone || '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Proficiencies (Now at bottom) */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-col items-center">
                        <p className="text-[12px] font-black text-gray-700 uppercase tracking-[0.1em] mb-2 flex items-center gap-2.5 justify-center">
                          Core Proficiencies
                        </p>
                      </div>
                      <div className="max-h-[110px] overflow-y-auto pr-2 custom-scrollbar mt-1 mb-2 p-1 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {emp.skills && emp.skills.length > 0 ? (
                            emp.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1.5 bg-white text-[#475569] text-[10px] font-bold rounded-xl uppercase tracking-wider shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-300 hover:scale-105 hover:text-[#33a8d9] transition-all duration-300"
                              >
                                {skill.name}
                              </span>
                            ))
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center">
                              <span className="text-xs text-gray-400 italic font-bold">
                                No skills listed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-300 relative z-[10000] overflow-hidden animate-dashboard-reveal">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Update Professional Skills
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-red-400 text-white border border-red-500 hover:bg-red-600 rounded-md transition flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 w-8 h-8"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-widest">
                      Employee Name
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-600">
                      {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black  uppercase tracking-widest">
                      Employee ID
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-600">
                      {selectedEmployee?.empId}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-black  uppercase tracking-widest">
                    Add New Skills
                  </label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-[2]">
                      <input
                        type="text"
                        placeholder="Skill name (e.g. AWS)"
                        value={newSkill.name}
                        onChange={(e) =>
                          setNewSkill((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        onKeyPress={(e) => e.key === 'Enter' && addSkillTag()}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                    <div className="relative flex-1">
                      <select
                        value={newSkill.category}
                        onChange={(e) =>
                          setNewSkill((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium appearance-none"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
                    </div>
                    <button
                      onClick={addSkillTag}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center font-bold text-sm"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-gray-50 rounded-2xl border border-gray-300">
                    {editForm.skills.length > 0 ? (
                      editForm.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white text-gray-700 text-xs font-bold rounded-xl border border-gray-100 shadow-sm group/tag"
                        >
                          <span className="text-blue-600">{skill.name}</span>
                          <span className="px-1.5 py-0.5 bg-blue-50 text-[10px] rounded uppercase">
                            {skill.category}
                          </span>
                          <button
                            onClick={() => removeSkillTag(skill.name)}
                            className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic p-1">
                        No skills selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black  uppercase tracking-widest">
                      Total Experience
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5+ Years"
                      value={editForm.totalExperience}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          totalExperience: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black  uppercase tracking-widest">
                      Projects Done
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12 Projects"
                      value={editForm.projectsDone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          projectsDone: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black  uppercase tracking-widest">
                      Effective Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={editForm.effectiveDate}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            effectiveDate: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                      />
                      <Calendar
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSkills}
                  disabled={isSaving}
                  className="px-6 py-3 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#004475] hover:text-white transition-all shadow-md disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSaving ? 'Processing...' : 'Update Skills'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SkillsDirectory;
