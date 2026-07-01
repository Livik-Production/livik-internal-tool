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
  Terminal,
  Sparkles,
  ZapOff,
} from 'lucide-react';
import Loader from '../Loader';
import { toast } from 'react-toastify';
import Pagination from '../Pagination';
import IconButton from '../Buttons/IconButton';
import { useMemo } from 'react';

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
    level: 'Mid',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Mid' });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); // 8 matches 2-column grid layout perfectly

  const [dropdownDepartments, setDropdownDepartments] = useState([]);
  const [dropdownLevels, setDropdownLevels] = useState([]);

  // Derive final departments and levels
  const finalDepartments =
    dropdownDepartments.length > 0
      ? [
          'All Departments',
          ...dropdownDepartments.filter(
            (d) => d && d.toLowerCase() !== 'all departments'
          ),
        ]
      : [
          'All Departments',
          ...Array.from(
            new Set(employees.map((e) => e.department).filter(Boolean))
          ).sort(),
        ];

  const finalLevels =
    dropdownLevels.length > 0
      ? [
          'All Employees',
          ...dropdownLevels.filter(
            (l) =>
              l &&
              l.toLowerCase() !== 'all levels' &&
              l.toLowerCase() !== 'all employees'
          ),
        ]
      : ['All Employees', 'Junior', 'Mid', 'Senior', 'Expert'];

  useEffect(() => {
    setMounted(true);
    fetchEmployees();

    const fetchDropdowns = async () => {
      try {
        const deptRes = await fetch('/api/dropdowns?type=departments');
        if (deptRes.ok) {
          const deptJson = await deptRes.json();
          if (deptJson.data)
            setDropdownDepartments(deptJson.data.map((d) => d.value));
        }

        const lvlRes = await fetch('/api/dropdowns?type=levels');
        if (lvlRes.ok) {
          const lvlJson = await lvlRes.json();
          if (lvlJson.data) setDropdownLevels(lvlJson.data.map((d) => d.value));
        }
      } catch (err) {
        console.error('Failed to fetch skill dropdowns', err);
      }
    };
    fetchDropdowns();
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
      level: employee.level || 'Mid',
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
          level: editForm.level,
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

    const searchLower = searchTerm.toLowerCase().trim();
    // Allow matching plural "developers" to singular "developer"
    const searchLowerSingular = searchLower.endsWith('s')
      ? searchLower.slice(0, -1)
      : searchLower;

    const matchesSearch =
      searchLower === '' ||
      fullName.includes(searchLower) ||
      emp.empId?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower) ||
      emp.designation?.toLowerCase().includes(searchLower) ||
      emp.designation?.toLowerCase().includes(searchLowerSingular) ||
      emp.level?.toLowerCase().includes(searchLower) ||
      String(emp.totalExperience || '')
        .toLowerCase()
        .includes(searchLower) ||
      String(emp.projectsDone || '')
        .toLowerCase()
        .includes(searchLower) ||
      (emp.skills &&
        emp.skills.some(
          (s) =>
            s.name?.toLowerCase().includes(searchLower) ||
            s.category?.toLowerCase().includes(searchLower)
        ));

    const matchesDept =
      selectedDept === 'All Departments' ||
      emp.department?.toLowerCase() === selectedDept.toLowerCase();

    // Handle the level filtering based on the employee's overall level
    const matchesExp =
      selectedExp === 'All Employees' ||
      (emp.level || 'Mid').toLowerCase() === selectedExp.toLowerCase();

    const status = (emp.status || '').toLowerCase();
    // Default to true if status is missing to prevent hiding active users
    const isApproved =
      status === '' || status === 'active' || status === 'approved';

    const isMeetingHall =
      emp.empId === 'LOCATION' ||
      fullName.includes('meeting hall') ||
      emp.name?.toLowerCase().includes('meeting hall');

    return (
      matchesSearch && matchesDept && matchesExp && isApproved && !isMeetingHall
    );
  });

  // Reset pagination when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedExp]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  return (
    <div
      className={`flex flex-col h-full bg-transparent ${isTab ? '' : 'space-y-2 overflow-hidden'}`}
    >
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
                  Manage and track workforce competencies across all
                  departments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 shadow-sm">
              <div className="flex -space-x-3">
                {employees.slice(0, 5).map((e, i) =>
                  e.photo ? (
                    <img
                      key={i}
                      src={e.photo}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                      alt=""
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold"
                    >
                      {e.firstName?.[0] || ''}
                      {e.lastName?.[0] || ''}
                    </div>
                  )
                )}
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
      <div
        className={
          isTab
            ? 'flex-1 flex flex-col min-h-0 space-y-3 md:space-y-3'
            : 'bg-white rounded-2xl shadow-xl border border-gray-200 m-1 flex-1 flex flex-col min-h-0 space-y-3 md:space-y-3 overflow-y-auto custom-scrollbar'
        }
      >
        {/* Filter Bar */}
        <div className="p-2 md:p-2">
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
              {searchTerm && (
                <IconButton
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 shadow-none bg-transparent hover:bg-transparent"
                  title="Clear search"
                >
                  <X
                    size={16}
                    className="text-gray-400 hover:text-red-500 hover:scale-110"
                  />
                </IconButton>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Department Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-gray-600 sm:min-w-[180px]"
                >
                  {finalDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
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
                  {finalLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === 'All Employees' ? 'All Levels' : lvl}
                    </option>
                  ))}
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
        ) : filteredEmployees.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-300 m-4 p-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-200 mb-4">
              <Search className="text-gray-400" size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-800">
              No professionals found
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-2 max-w-md text-center">
              We couldn't find any employees matching your current search or
              filters. Try adjusting your criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('All Departments');
                setSelectedExp('All Employees');
              }}
              className="mt-6 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
            >
              <X size={16} /> Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-4 px-3">
              {paginatedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white border-[2px] border-gray-400 rounded-xl transition-all duration-300 flex flex-col min-h-[340px] overflow-hidden group relative"
                >
                  {!isViewOnly && (
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-600 border-[1px] border-gray-300 hover:bg-[#004475] hover:text-white rounded-lg transition-all shadow-sm z-10 bg-white cursor-pointer"
                      title="Edit Skills"
                    >
                      <Edit2 size={14} strokeWidth={3} />
                    </button>
                  )}
                  {/* Top Section */}
                  <div className="flex p-3 border-b-[1px] border-gray-400 relative bg-[#fdfdfd]">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-[3px] border-gray-100 bg-yellow-100 flex items-center justify-center shrink-0 mr-5">
                      {emp.photo ? (
                        <img
                          src={emp.photo}
                          alt={emp.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-black uppercase tracking-widest">
                          {emp.firstName?.[0] || ''}
                          {emp.lastName?.[0] || ''}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0 flex-1 pr-8">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 leading-tight truncate">
                          {emp.firstName} {emp.lastName}
                        </h3>
                        <div className="text-md font-bold text-gray-700 truncate">
                          - {emp.designation || 'DEVELOPER'}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#004475] truncate mt-1.5">
                        {emp.empId}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex flex-1">
                    {/* Left Pane */}
                    <div className="w-[120px] min-w-[120px] border-r-[1px] border-gray-400 p-4 flex flex-col justify-between bg-blue-50/50">
                      {/* DEPT */}
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest mb-1">
                          Department
                        </span>
                        <div className="text-[11px] font-bold text-[#004475] uppercase leading-tight break-words">
                          {emp.department || 'TECH'}
                        </div>
                      </div>

                      {/* LEVEL */}
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest mb-1">
                          Level
                        </span>
                        <div className="text-[11px] font-bold text-[#004475] uppercase leading-tight break-words">
                          {emp.level || 'Mid'}
                        </div>
                      </div>

                      {/* EXPERIENCE */}
                      <div className="flex flex-col items-center">
                        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest mb-1">
                          Experience
                        </span>
                        <div className="flex items-baseline gap-1 text-[#004475]">
                          <span className="text-xl font-black leading-none">
                            {(emp.totalExperience || '0').replace(/\D/g, '') ||
                              '0'}
                          </span>
                          <span className="text-xs font-bold">Y</span>
                        </div>
                      </div>

                      {/* PROJECTS */}
                      <div className="flex flex-col items-center">
                        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest mb-1">
                          Projects
                        </span>
                        <span className="text-xl font-black text-[#004475] leading-none">
                          {emp.projectsDone || '0'}
                        </span>
                      </div>
                    </div>

                    {/* Right Pane */}
                    <div className="flex-1 p-4 flex flex-col bg-white">
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles
                            size={16}
                            className="text-black"
                            strokeWidth={2}
                          />
                          <h4 className="text-[12px] font-extrabold text-black uppercase tracking-widest">
                            Core Proficiencies
                          </h4>
                        </div>

                        {emp.skills && emp.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                            {emp.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-white text-black text-[12px] font-bold rounded-lg border-[1px] border-gray-400"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 border-[2px] border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-2 text-center min-h-[10px]">
                            <ZapOff
                              size={20}
                              className="text-gray-400 mb-2"
                              strokeWidth={2}
                            />
                            <p className="text-[13px] font-bold text-gray-500">
                              No skills listed
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between border-t-[2px] border-black/10">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                          UPDATED :{' '}
                          {emp.updatedAt
                            ? new Date(emp.updatedAt).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )
                            : 'TODAY'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[11px] font-bold text-black">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredEmployees.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                rowsPerPageOptions={[6, 9, 12, 24, 48, 99]}
              />
            </div>
          </>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-widest">
                      Employee Name
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 truncate">
                      {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black  uppercase tracking-widest">
                      Employee ID
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-600 truncate">
                      {selectedEmployee?.empId}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-widest">
                      Level
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.level}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            level: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium appearance-none text-black"
                      >
                        {finalLevels
                          .filter(
                            (lvl) =>
                              lvl !== 'All Employees' && lvl !== 'All Levels'
                          )
                          .map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        size={16}
                      />
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
                        {finalLevels
                          .filter((lvl) => lvl !== 'All Employees')
                          .map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
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
