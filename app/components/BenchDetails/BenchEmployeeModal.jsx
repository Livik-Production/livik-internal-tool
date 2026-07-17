'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  MapPin,
  Globe,
  Upload,
  FileText,
  ChevronDown,
} from 'lucide-react';
import CustomModalForm from '../CustomModalForm';

const Field = ({ label, id, children, error }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function BenchEmployeeModal({
  open,
  onClose,
  mode = 'add',
  data = null,
  onSubmit,
}) {
  const isAdd = mode === 'add';
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  const [form, setForm] = useState(() => {
    if (data) {
      return {
        empId: data.id ?? '',
        name: data.name ?? '',
        designation: data.designation ?? '',
        department: data.department ?? '',
        experience: data.experience ?? '',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills ?? ''),
        benchSince: data.benchSince ?? '',
        manager: data.manager ?? '',
        location: data.location ?? '',
        status: data.status ?? 'Available',
        remarks: data.remarks ?? '',
        resumeFile: null,
        resumeName: data.resumeName ?? '',
        projectsDone: data.projectsDone ?? '',
      };
    }
    return {
      empId: '',
      name: '',
      designation: '',
      department: '',
      experience: '',
      skills: '',
      benchSince: '',
      manager: '',
      location: '',
      status: 'Available',
      remarks: '',
      resumeFile: null,
      resumeName: '',
      projectsDone: '',
    };
  });

  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      alert('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5 MB.');
      return;
    }
    setForm((prev) => ({ ...prev, resumeFile: file, resumeName: file.name }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.empId?.trim()) e.empId = 'Employee ID is required';
    if (!form.name?.trim()) e.name = 'Name is required';
    if (!form.designation?.trim()) e.designation = 'Designation is required';
    if (!form.benchSince?.trim()) e.benchSince = 'Bench Since date is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit?.({
      ...form,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  };

  const labelCls = 'block text-sm font-bold text-gray-700 mb-2';
  const inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#004475] transition-all bg-white placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500';

  const footer = isView ? null : (
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
        form="bench-employee-form"
        className="flex-1 max-w-[200px] flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 transition-all shadow-lg"
      >
        {isAdd ? 'Add to Bench' : 'Update Details'}
        <Plus size={18} />
      </button>
    </div>
  );

  return (
    <CustomModalForm
      open={open}
      onCancel={onClose}
      title={isView ? 'Bench Employee Details' : isAdd ? 'Add Bench Employee' : 'Edit Employee Details'}
      widthClass="max-w-2xl"
      footer={footer}
    >
      <form id="bench-employee-form" onSubmit={handleSubmit} noValidate>
        <div className="px-8 pt-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto no-scrollbar">
          <Field label="Employee ID *" id="empId" error={errors.empId}>
            <input
              id="empId"
              type="text"
              placeholder="e.g. EMP001"
              value={form.empId}
              onChange={(e) => handleChange('empId', e.target.value)}
              disabled={isView}
              className={`${inputCls} ${errors.empId ? 'border-red-400 bg-red-50' : ''}`}
            />
          </Field>

          <Field label="Full Name *" id="name" error={errors.name}>
            <input
              id="name"
              type="text"
              placeholder="e.g. Arjun Sharma"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isView}
              className={`${inputCls} ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
            />
          </Field>

          <Field label="Designation *" id="designation" error={errors.designation}>
            <input
              id="designation"
              type="text"
              placeholder="e.g. React Developer"
              value={form.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              disabled={isView}
              className={`${inputCls} ${errors.designation ? 'border-red-400 bg-red-50' : ''}`}
            />
          </Field>

          <Field label="Department" id="department">
            <input
              id="department"
              type="text"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              disabled={isView}
              className={inputCls}
            />
          </Field>

          <Field label="Projects Done" id="projectsDone">
            <input
              id="projectsDone"
              type="number"
              placeholder="e.g. 5"
              value={form.projectsDone}
              onChange={(e) => handleChange('projectsDone', e.target.value)}
              disabled={isView}
              className={inputCls}
            />
          </Field>

          <Field label="Experience" id="experience">
            <input
              id="experience"
              type="text"
              placeholder="e.g. 3 yrs"
              value={form.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              disabled={isView}
              className={inputCls}
            />
          </Field>

          <Field label="Bench Since *" id="benchSince" error={errors.benchSince}>
            <input
              id="benchSince"
              type="date"
              value={form.benchSince}
              onChange={(e) => handleChange('benchSince', e.target.value)}
              disabled={isView}
              className={`${inputCls} ${errors.benchSince ? 'border-red-400 bg-red-50' : ''}`}
            />
          </Field>

          <Field label="Reporting Manager" id="manager">
            <input
              id="manager"
              type="text"
              placeholder="e.g. Ramesh Iyer"
              value={form.manager}
              onChange={(e) => handleChange('manager', e.target.value)}
              disabled={isView}
              className={inputCls}
            />
          </Field>

          <Field label="Location" id="location">
            <div className="relative group">
              <input
                id="location"
                type="text"
                placeholder="e.g. Chennai"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                disabled={isView}
                className={inputCls}
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </Field>

          <Field label="Status" id="status">
            <div className="relative group">
              <select
                id="status"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isView}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="Available">Available</option>
                <option value="In Talks">In Talks</option>
                <option value="Shadow Mode">Shadow Mode</option>
                <option value="Assigned">Assigned</option>
              </select>
              {!isView && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400 group-focus-within:text-[#004475]">
                  <ChevronDown size={14} />
                </div>
              )}
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Skills (comma-separated)" id="skills">
              <div className="relative group">
                <input
                  id="skills"
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js"
                  value={form.skills}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  disabled={isView}
                  className={inputCls}
                />
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="remarks" className={labelCls}>Remarks</label>
            <textarea
              id="remarks"
              rows={3}
              placeholder="Any additional notes..."
              value={form.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              disabled={isView}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="sm:col-span-2 pb-6">
            <label className={labelCls}>Resume</label>
            {!isView && (
              <div
                className={`flex flex-col items-center justify-center gap-3 w-full py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${dragOver ? 'border-[#004475] bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
                onClick={() => document.getElementById('resume-upload').click()}
              >
                <Upload size={24} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                </div>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            )}
            {form.resumeName && (
              <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#004475]" />
                  <span className="text-sm font-bold text-[#004475] truncate max-w-[200px]">{form.resumeName}</span>
                </div>
                {!isView && (
                  <button type="button" onClick={() => handleChange('resumeName', '')} className="text-xs font-bold text-red-500 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </CustomModalForm>
  );
}
