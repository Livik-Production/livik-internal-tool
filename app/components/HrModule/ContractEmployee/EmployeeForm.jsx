'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Calendar,
  Briefcase,
  IndianRupee,
  FileText,
  UploadCloud,
  Trash2,
  Camera,
  IdCard,
  CreditCard
} from 'lucide-react';
import { uploadOtherDocument } from '../../../actions/uploadOtherDocument';
import { deleteEmployeeDocument } from '../../../actions/deleteEmployeeDocument';
import { showSuccessToast, showErrorToast } from '../../Toast';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,14}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const accountRegex = /^[0-9]{6,20}$/;

function toISODateIfValid(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function calculateDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';

  const diffTime = Math.abs(e - s);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 365) {
    const years = (diffDays / 365).toFixed(1);
    return `${years} Year${years !== '1.0' ? 's' : ''}`;
  } else {
    const months = Math.round(diffDays / 30);
    return `${months} Month${months !== 1 ? 's' : ''}`;
  }
}

export default function EmployeeForm({
  mode = 'create',
  initialData = {},
  onCancel,
  onSubmit,
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const steps = ['Personal Details', 'Contract & Salary', 'Bank & Documents', 'Review'];
  const [step, setStep] = useState(0);
  const currentStepLabel = steps[step];

  const [form, setForm] = useState({
    firstName: initialData.firstName ?? '',
    lastName: initialData.lastName ?? '',
    email: initialData.email ?? '',
    phoneNumber: initialData.phoneNumber ?? '',
    dateOfBirth: toISODateIfValid(initialData.dateOfBirth),
    gender: initialData.gender ?? '',
    bloodGroup: initialData.bloodGroup ?? '',
    presentAddress: initialData.presentAddress ?? '',
    permanentAddress: initialData.permanentAddress ?? '',

    // Contract details
    designation: initialData.designation ?? '',
    department: initialData.department ?? '',
    contractStartDate: toISODateIfValid(initialData.contractStartDate),
    contractEndDate: toISODateIfValid(initialData.contractEndDate),
    contractDuration: initialData.contractDuration ?? '',
    contractStatus: initialData.contractStatus ?? 'ACTIVE',
    contractRemarks: initialData.contractRemarks ?? '',

    // Salary details
    basicSalary: initialData.basicSalary ?? '',
    allowances: initialData.allowances ?? '',
    deductions: initialData.deductions ?? '',
    netSalary: initialData.netSalary ?? '',
    paymentCycle: initialData.paymentCycle ?? 'MONTHLY',

    // Bank details
    bankName: initialData.bankName ?? '',
    accountNumber: initialData.accountNumber ?? '',
    ifscCode: initialData.ifscCode ?? '',

    // Documents
    contractAgreement: initialData.contractAgreement ?? '',
    idProof: initialData.idProof ?? '',
    otherDocuments: initialData.otherDocuments ?? [],
    deletedDocuments: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Recalculate duration when dates change
  useEffect(() => {
    if (form.contractStartDate && form.contractEndDate) {
      const duration = calculateDuration(form.contractStartDate, form.contractEndDate);
      setForm((prev) => ({ ...prev, contractDuration: duration }));
    }
  }, [form.contractStartDate, form.contractEndDate]);

  // Recalculate net salary when components change
  useEffect(() => {
    const basic = parseFloat(form.basicSalary) || 0;
    const allows = parseFloat(form.allowances) || 0;
    const deducts = parseFloat(form.deductions) || 0;
    const net = Math.max(0, basic + allows - deducts).toFixed(2);
    setForm((prev) => ({ ...prev, netSalary: net }));
  }, [form.basicSalary, form.allowances, form.deductions]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validateStep = (s = step) => {
    if (isView) return true;
    const newErrors = {};

    if (s === 0) {
      if (!form.firstName?.trim()) newErrors.firstName = 'First name is required.';
      if (!form.lastName?.trim()) newErrors.lastName = 'Last name is required.';
      if (!form.email?.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!emailRegex.test(form.email)) {
        newErrors.email = 'Invalid email format.';
      }
      if (!form.phoneNumber?.trim()) {
        newErrors.phoneNumber = 'Phone number is required.';
      } else if (!phoneRegex.test(form.phoneNumber.replace(/\D/g, ''))) {
        newErrors.phoneNumber = 'Phone should be digits (10-14).';
      }
      if (!form.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required.';
      } else {
        const d = new Date(form.dateOfBirth);
        if (d > new Date()) newErrors.dateOfBirth = "DOB can't be in the future.";
      }
      if (!form.presentAddress?.trim()) newErrors.presentAddress = 'Present address is required.';
    } else if (s === 1) {
      if (!form.designation?.trim()) newErrors.designation = 'Designation is required.';
      if (!form.department?.trim()) newErrors.department = 'Department is required.';
      if (!form.contractStartDate) newErrors.contractStartDate = 'Contract start date is required.';
      if (!form.contractEndDate) newErrors.contractEndDate = 'Contract end date is required.';
      if (form.contractStartDate && form.contractEndDate) {
        if (new Date(form.contractStartDate) > new Date(form.contractEndDate)) {
          newErrors.contractEndDate = 'End date cannot be before start date.';
        }
      }
      if (!form.basicSalary || isNaN(parseFloat(form.basicSalary)) || parseFloat(form.basicSalary) <= 0) {
        newErrors.basicSalary = 'Basic salary must be a positive number.';
      }
    } else if (s === 2) {
      if (form.ifscCode && !ifscRegex.test(form.ifscCode)) {
        newErrors.ifscCode = 'Invalid IFSC code.';
      }
      if (form.accountNumber && !accountRegex.test(form.accountNumber)) {
        newErrors.accountNumber = 'Invalid Account Number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(steps.length - 1, s + 1));
    }
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const handleTabClick = (i) => {
    if (isView) {
      setStep(i);
      return;
    }
    if (i <= step) {
      setStep(i);
    } else {
      // Validate up to the target step
      for (let j = step; j < i; j++) {
        if (!validateStep(j)) return;
      }
      setStep(i);
    }
  };

  const handleDocumentUpload = async (field, file) => {
    if (!file || isView) return;
    try {
      const url = await uploadOtherDocument(file);
      setField(field, url);
      showSuccessToast(`${field.replace(/([A-Z])/g, ' $1')} uploaded successfully`);
    } catch (err) {
      showErrorToast(err.message || 'Upload failed');
    }
  };

  const handleDocumentRemove = async (field) => {
    const url = form[field];
    if (!url || isView) return;
    try {
      // Mark it for deletion upon final submit
      setForm((p) => ({
        ...p,
        [field]: '',
        deletedDocuments: [...p.deletedDocuments, url],
      }));
      showSuccessToast(`${field.replace(/([A-Z])/g, ' $1')} marked for deletion.`);
    } catch (err) {
      showErrorToast(err.message || 'Failed to remove');
    }
  };

  const handleAddOtherDocument = async (label, file) => {
    if (!label.trim()) {
      showErrorToast('Please enter a document label');
      return;
    }
    if (!file) {
      showErrorToast('Please select a file');
      return;
    }
    try {
      const url = await uploadOtherDocument(file);
      const updated = [...form.otherDocuments, { label, url }];
      setField('otherDocuments', updated);
      showSuccessToast('Additional document added');
    } catch (err) {
      showErrorToast('Upload failed');
    }
  };

  const handleRemoveOtherDocument = (index, url) => {
    const updated = form.otherDocuments.filter((_, i) => i !== index);
    setForm((p) => ({
      ...p,
      otherDocuments: updated,
      deletedDocuments: [...p.deletedDocuments, url],
    }));
    showSuccessToast('Document removed. Save changes to commit.');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isView) {
      onCancel?.();
      return;
    }

    // Validate all steps up to current
    for (let i = 0; i <= step; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    try {
      setSubmitting(true);
      await Promise.resolve(onSubmit?.(form));

      // Clean up deleted documents in blob storage
      if (form.deletedDocuments.length > 0) {
        for (const url of form.deletedDocuments) {
          try {
            await deleteEmployeeDocument(url);
          } catch (err) {
            console.error('Failed to delete blob:', url, err);
          }
        }
      }
    } catch (err) {
      showErrorToast('Operation failed: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputProps = (name, type = 'text', opts = {}) => ({
    name,
    value: form[name] ?? '',
    onChange: (e) => setField(name, e.target.value),
    type,
    readOnly: isView,
    disabled: isView,
    className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 text-gray-900',
    ...opts,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 py-2">
      {/* Stepper Header */}
      <div className="flex justify-between bg-gray-50 py-3 px-3 rounded-xl border border-gray-200 shadow-inner mb-6 no-scrollbar">
        {steps.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s}
              onClick={() => handleTabClick(i)}
              type="button"
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${active
                ? 'bg-white text-blue-700 shadow-md transform scale-[1.02]'
                : (done || isView)
                  ? 'text-blue-600 hover:bg-white/50 cursor-pointer'
                  : 'text-gray-400'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${active ? 'bg-blue-100 border-blue-600 text-blue-700' : done ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-gray-300'
                  }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span>{s}</span>
            </button>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="min-h-[350px]">
        {currentStepLabel === 'Personal Details' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2 flex items-center gap-2">
                <Briefcase className="text-blue-500 w-4 h-4" /> Personal Information
              </h3>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">First Name <span className="text-red-500">*</span></label>
                <input {...inputProps('firstName')} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Last Name <span className="text-red-500">*</span></label>
                <input {...inputProps('lastName')} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Date of Birth <span className="text-red-500">*</span></label>
                <input {...inputProps('dateOfBirth', 'date')} />
                {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                  disabled={isView}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 disabled:bg-gray-50"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setField('bloodGroup', e.target.value)}
                  disabled={isView}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 disabled:bg-gray-50"
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                <input {...inputProps('email', 'email')} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Phone Number <span className="text-red-500">*</span></label>
                <input {...inputProps('phoneNumber')} />
                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2">Addresses</h3>
              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Present Address <span className="text-red-500">*</span></label>
                <textarea {...inputProps('presentAddress', 'textarea', { className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 h-20 text-gray-900 disabled:bg-gray-50' })} />
                {errors.presentAddress && <p className="text-xs text-red-500 mt-1">{errors.presentAddress}</p>}
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider font-semibold">Permanent Address</label>
                <textarea {...inputProps('permanentAddress', 'textarea', { className: 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 h-20 text-gray-900 disabled:bg-gray-50' })} />
              </div>
            </div>
          </div>
        )}

        {currentStepLabel === 'Contract & Salary' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2 flex items-center gap-2">
                <Calendar className="text-blue-500 w-4 h-4" /> Contract Details
              </h3>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Designation <span className="text-red-500">*</span></label>
                <input {...inputProps('designation')} />
                {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Department <span className="text-red-500">*</span></label>
                <input {...inputProps('department')} />
                {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Contract Start Date <span className="text-red-500">*</span></label>
                <input {...inputProps('contractStartDate', 'date')} />
                {errors.contractStartDate && <p className="text-xs text-red-500 mt-1">{errors.contractStartDate}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Contract End Date <span className="text-red-500">*</span></label>
                <input {...inputProps('contractEndDate', 'date')} />
                {errors.contractEndDate && <p className="text-xs text-red-500 mt-1">{errors.contractEndDate}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Contract Duration</label>
                <input {...inputProps('contractDuration', 'text', { readOnly: true, disabled: true })} />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Contract Status</label>
                <select
                  value={form.contractStatus}
                  onChange={(e) => setField('contractStatus', e.target.value)}
                  disabled={isView}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 disabled:bg-gray-50"
                >
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                  <option>EXPIRED</option>
                </select>
              </div>

              <div className="col-span-full">
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Contract Remarks</label>
                <input {...inputProps('contractRemarks')} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2 flex items-center gap-2">
                <IndianRupee className="text-blue-500 w-4 h-4" /> Salary Setup
              </h3>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Payment Cycle</label>
                <select
                  value={form.paymentCycle}
                  onChange={(e) => setField('paymentCycle', e.target.value)}
                  disabled={isView}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-900 disabled:bg-gray-50"
                >
                  <option>MONTHLY</option>
                  <option>WEEKLY</option>
                  <option>HOURLY</option>
                  <option>DAILY</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Basic Pay <span className="text-red-500">*</span></label>
                <input {...inputProps('basicSalary', 'number', { step: '0.01' })} />
                {errors.basicSalary && <p className="text-xs text-red-500 mt-1">{errors.basicSalary}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Allowances</label>
                <input {...inputProps('allowances', 'number', { step: '0.01' })} />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Deductions</label>
                <input {...inputProps('deductions', 'number', { step: '0.01' })} />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Net Salary</label>
                <input {...inputProps('netSalary', 'number', { readOnly: true, disabled: true })} />
              </div>
            </div>
          </div>
        )}

        {currentStepLabel === 'Bank & Documents' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2">Banking Details</h3>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Bank Name</label>
                <input {...inputProps('bankName')} />
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Account Number</label>
                <input {...inputProps('accountNumber')} />
                {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">IFSC Code</label>
                <input {...inputProps('ifscCode')} />
                {errors.ifscCode && <p className="text-xs text-red-500 mt-1">{errors.ifscCode}</p>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <h3 className="text-sm font-bold text-gray-800 col-span-full border-b pb-2 mb-2">Contract Agreement & Documents</h3>

              {/* Document Uploader 1: Contract Agreement */}
              <DocumentUploadField
                label="Contract Agreement"
                value={form.contractAgreement}
                onUpload={(file) => handleDocumentUpload('contractAgreement', file)}
                onRemove={() => handleDocumentRemove('contractAgreement')}
                isView={isView}
                icon={FileText}
              />
              {/* Document Uploader 3: ID Proof */}
              <DocumentUploadField
                label="ID Proof"
                value={form.idProof}
                onUpload={(file) => handleDocumentUpload('idProof', file)}
                onRemove={() => handleDocumentRemove('idProof')}
                isView={isView}
                icon={CreditCard}
              />
            </div>
          </div>
        )}

        {currentStepLabel === 'Review' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 border-b pb-2">Review Employee Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 font-medium block">Name</span>
                  <span className="text-gray-900 font-bold">{form.firstName} {form.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Email</span>
                  <span className="text-gray-900 font-bold truncate block">{form.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Phone</span>
                  <span className="text-gray-900 font-bold">{form.phoneNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">DOB</span>
                  <span className="text-gray-900 font-bold">{form.dateOfBirth || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Designation</span>
                  <span className="text-gray-900 font-bold">{form.designation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Department</span>
                  <span className="text-gray-900 font-bold">{form.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Contract Range</span>
                  <span className="text-gray-900 font-bold">
                    {form.contractStartDate} to {form.contractEndDate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Duration</span>
                  <span className="text-gray-900 font-bold">{form.contractDuration || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Net Salary</span>
                  <span className="text-gray-900 font-bold text-blue-700">₹{form.netSalary || '0.00'} / {form.paymentCycle}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${form.contractStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {form.contractStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Footer / Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === 0}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 bg-white"
        >
          Back
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm font-semibold text-gray-700 bg-white transition"
          >
            Cancel
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Next
            </button>
          ) : (
            !isView && (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-55 flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Contract Employee'}
              </button>
            )
          )}
        </div>
      </div>
    </form>
  );
}

function DocumentUploadField({ label, value, onUpload, onRemove, isView, icon: Icon }) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isView) return;
    try {
      setUploading(true);
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const isPDF = value?.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-gray-600 flex items-center gap-2">
        <Icon size={14} className="text-blue-500" />
        {label}
      </label>

      <div className={`relative min-h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 transition ${value ? 'bg-blue-50/20 border-blue-200' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        }`}>
        {value ? (
          <div className="w-full flex flex-col items-center justify-center gap-2 relative group">
            {isPDF ? <FileText size={40} className="text-blue-500" /> : <img src={value} alt={label} className="max-h-[100px] object-contain rounded" />}
            <a href={value} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline block truncate max-w-[150px]">
              View Upload
            </a>
            {!isView && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute -top-1 -right-1 p-1 bg-white border border-red-200 rounded-full text-red-500 hover:bg-red-50 shadow-sm transition"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <Loader2 className="animate-spin text-blue-500 mx-auto w-8 h-8 mb-2" />
            ) : (
              <UploadCloud className="text-gray-400 mx-auto w-8 h-8 mb-2" />
            )}
            <p className="text-xs font-semibold text-gray-600">
              {uploading ? 'Uploading...' : `Upload ${label}`}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">PDF, JPG or PNG</p>
            {!isView && !uploading && (
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
