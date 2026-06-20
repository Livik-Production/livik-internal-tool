'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BasicInfo from './sections/BasicInfo';
import AddressSection from './sections/AddressSection';
import EducationSection from './sections/EducationSection';
import EmploymentBankSection from './sections/EmploymentBankSection';
import ReviewSection from './sections/ReviewSection';
import Payroll from '../../../app/components/EmployeeForm/Payroll';
import BondDetails from '../../components/EmployeeForm/sections/BondDetails';
import PhotoSection from '../../components/EmployeeForm/sections/PhotoSection';
import {
  Loader2,
  Monitor,
  Calendar,
  Briefcase,
  IndianRupee,
} from 'lucide-react';
import PrimaryButton from '../Buttons/PrimaryButton';
import { deleteEmployeeDocument } from '../../actions/deleteEmployeeDocument';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const aadhaarRegex = /^\d{12}$/;
const phoneRegex = /^\d{10,14}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const accountRegex = /^[0-9]{6,20}$/;

function toISODateIfValid(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (s === '') return null;
  const needsTime = !/T|\+|\-/.test(s);
  const iso = needsTime ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/* ---------- small UI helpers ---------- */

function calculateBondDuration(start, end) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
  const diffTime = Math.abs(e - s);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  const rounded = Math.round(diffYears * 2) / 2;
  return rounded > 0 ? rounded : '';
}

function reconstructDocuments(data) {
  if (!data) return [];
  const docs = [];
  if (data.docSSLCCollected) docs.push('sslc');
  if (data.docHSCCollected) docs.push('hsc');
  if (data.docDegreeCollected) docs.push('degree');
  return docs;
}

function TopTabs({ tabs, active, onChange }) {
  return (
    <nav
      role="tablist"
      aria-label="subtabs"
      className="flex space-x-1 border-b border-gray-300 mb-4 px-2"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2 font-semibold text-sm transition rounded-t-xl ${
              isActive
                ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
            }`}
          >
            {t.label}
            {t.count ? (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#ffd6db] text-[#9b303d] font-bold text-xs">
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ---------- Main ---------- */

export default function EmployeeForm({
  mode = 'create',
  initialData = {},
  onCancel,
  onSubmit,
  onApprove,
  showApprove = false,
  isHrRole = false,
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  // HR role can add and view but not edit specific sections
  const isHrEditRestricted = isHrRole && isEdit;

  // Steps:
  const steps = useMemo(
    () => [
      'Personal Details',
      'Uploads',
      'Employment & Bank',
      'Bond & Documents',
      'Review',
    ],
    []
  );

  const [step, setStep] = useState(0);
  const currentStepLabel = steps[step];

  const [form, setForm] = useState({
    empId: initialData.empId ?? '',
    workMode: initialData.workMode ?? '',
    wfoOffice: initialData.wfoOffice ?? '',
    workType: initialData.workType ?? '',
    firstName: initialData.firstName ?? '',
    lastName: initialData.lastName ?? '',
    dateOfBirth:
      initialData.dateOfBirth && !isNaN(Date.parse(initialData.dateOfBirth))
        ? new Date(initialData.dateOfBirth).toISOString().slice(0, 10)
        : '',
    gender: initialData.gender ?? '',
    aadhaarNumber: initialData.aadhaarNumber ?? '',
    panNumber: initialData.panNumber ?? '',
    email: initialData.email ?? '',
    phoneNumber: initialData.phoneNumber ?? '',
    emergencyContact: initialData.emergencyContact ?? '',
    photo: initialData.photo ?? '',
    aadhaarCard: initialData.aadhaarCard ?? '',
    panCard: initialData.panCard ?? '',
    proofs: initialData.proofs ?? [],
    bloodGroup: initialData.bloodGroup ?? '',
    presentAddress: initialData.presentAddress ?? '',
    permanentAddress: initialData.permanentAddress ?? '',
    designation: initialData.designation ?? '',
    department: initialData.department ?? '',
    role: initialData.role ?? '',
    dateOfJoining:
      initialData.dateOfJoining && !isNaN(Date.parse(initialData.dateOfJoining))
        ? new Date(initialData.dateOfJoining).toISOString().slice(0, 10)
        : '',
    workLocation: initialData.workLocation ?? '',
    bankName: initialData.bankName ?? '',
    accountNumber: initialData.accountNumber ?? '',
    ifscCode: initialData.ifscCode ?? '',

    bondDuration: String(
      initialData.bondDuration ??
        calculateBondDuration(
          initialData.bondStartDate,
          initialData.bondEndDate
        ) ??
        ''
    ),
    documentsCollected:
      initialData.documentsCollected ?? reconstructDocuments(initialData),
    bondRemarks: initialData.bondRemarks ?? '',
  });

  const [educations, setEducations] = useState(
    (initialData.educationDetails || initialData.education || []).length
      ? (initialData.educationDetails || initialData.education || []).map(
          (e) => ({
            university: e.university ?? '',
            institution: e.institution ?? '',
            qualification: e.qualification ?? '',
            yearCompleted: e.yearCompleted ?? '',
          })
        )
      : [
          {
            university: '',
            institution: '',
            qualification: '',
            yearCompleted: '',
          },
        ]
  );

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setErrors({});
  }, [step]);

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const addEducation = () =>
    setEducations((p) => [
      ...p,
      { university: '', institution: '', qualification: '', yearCompleted: '' },
    ]);

  const updateEducation = (idx, field, value) =>
    setEducations((p) =>
      p.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );

  const removeEducation = (idx) =>
    setEducations((p) => p.filter((_, i) => i !== idx));

  const validators = {
    firstName: (v) => (!v || !v.trim() ? 'First name is required.' : null),
    lastName: (v) => (!v || !v.trim() ? 'Last name is required.' : null),
    email: (v) =>
      !v || !v.trim()
        ? 'Email is required.'
        : v && !emailRegex.test(v)
          ? 'Invalid email.'
          : null,
    phoneNumber: (v) =>
      !v || !v.replace(/\D/g, '').trim()
        ? 'Phone number is required.'
        : v && !phoneRegex.test(v.replace(/\D/g, ''))
          ? 'Phone should be digits (10-14).'
          : null,
    aadhaarNumber: (v) =>
      v && !aadhaarRegex.test(v) ? 'Aadhaar must be 12 digits.' : null,
    panNumber: (v) =>
      v && !panRegex.test(v) ? 'PAN format invalid (e.g. ABCDE1234F).' : null,
    ifscCode: (v) => (v && !ifscRegex.test(v) ? 'IFSC invalid.' : null),
    accountNumber: (v) =>
      v && !accountRegex.test(v) ? 'Account number seems invalid.' : null,
    dateOfBirth: (v) => {
      if (!v || !String(v).trim()) return 'Date of Birth is required.';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return 'Invalid date.';
      if (d > new Date()) return "DOB can't be in the future.";
      return null;
    },
    dateOfJoining: (v) => {
      if (!v || !String(v).trim()) return 'Date of Joining is required.';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return 'Invalid date.';
      return null;
    },
    designation: (v) => (!v || !v.trim() ? 'Designation is required.' : null),
    department: (v) => (!v || !v.trim() ? 'Department is required.' : null),
  };

  const validateStep = (s = step) => {
    if (isView) return true;

    const newErrors = {};

    if (s === 0) {
      ['firstName', 'lastName', 'email', 'phoneNumber'].forEach((k) => {
        const msg = validators[k]?.(form[k]);
        if (msg) newErrors[k] = msg;
      });
    } else if (s === 1) {
    } else if (s === 2) {
      ['designation', 'department', 'dateOfJoining'].forEach((k) => {
        const msg = validators[k]?.(form[k]);
        if (msg) newErrors[k] = msg;
      });
      // workType is required for creation
      if (!form.workType || !String(form.workType).trim()) {
        newErrors.workType = 'Work type is required.';
      }
      // workMode is required
      if (!form.workMode || !String(form.workMode).trim()) {
        newErrors.workMode = 'Work mode is required.';
      }
    } else if (s === 3) {
      if (form.workType !== 'CONTRACT') {
        if (!form.bondDuration || !String(form.bondDuration).trim()) {
          newErrors.bondDuration = 'Bond duration is required.';
        } else {
          const duration = parseFloat(String(form.bondDuration));
          if (isNaN(duration) || duration <= 0 || duration > 10) {
            newErrors.bondDuration =
              'Please enter a valid duration between 0.5 and 10 years.';
          }
        }

        if (!form.documentsCollected || form.documentsCollected.length === 0) {
          newErrors.documentsCollected =
            'At least one document must be selected.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    const ok = validateStep(step);
    if (!ok) return;
    const nextStep = Math.min(steps.length - 1, step + 1);

    setStep(nextStep);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const inputProps = (name, type = 'text', opts = {}) => ({
    name,
    value: form[name] ?? '',
    onChange: (e) => setField(name, e.target.value),
    type,
    readOnly: isView,
    disabled: isView,
    className:
      'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400',
    ...opts,
  });

  /* ------------------ PAYROLL (view-only) with history ------------------ */

  // years list (last 6 years)
  const currentYear = new Date().getFullYear();
  const payrollYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // months list
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // incoming payroll from initialData (optional)
  const payrollFromData = initialData?.payroll ?? null;

  const defaultHistory =
    payrollFromData?.history && payrollFromData.history.length
      ? payrollFromData.history
      : [
          {
            id: 'ver_2024_04',
            effectiveYear: currentYear - 1,
            effectiveMonth: 4,
            components: [
              {
                id: 'basic',
                group: 'Basic',
                name: 'Basic Salary',
                amount: 28000,
              },
              {
                id: 'hra',
                group: 'HRA',
                name: 'House Rent Allowance',
                amount: 7000,
              },
              {
                id: 'allow1',
                group: 'Allowances',
                name: 'Conveyance',
                amount: 800,
              },
              {
                id: 'ded1',
                group: 'Deductions',
                name: 'Professional Tax',
                amount: 200,
              },
            ],
          },
          {
            id: 'ver_2025_01',
            effectiveYear: currentYear,
            effectiveMonth: 1, // Jan this year
            components: [
              {
                id: 'basic',
                group: 'Basic',
                name: 'Basic Salary',
                amount: 30000,
              },
              {
                id: 'hra',
                group: 'HRA',
                name: 'House Rent Allowance',
                amount: 8000,
              },
              {
                id: 'allow1',
                group: 'Allowances',
                name: 'Conveyance',
                amount: 900,
              },
              {
                id: 'ded1',
                group: 'Deductions',
                name: 'Professional Tax',
                amount: 250,
              },
            ],
          },
        ];

  // normalize history: sort by effective date ascending
  const historySorted = [...defaultHistory].sort((a, b) => {
    const da = new Date(a.effectiveYear, (a.effectiveMonth || 1) - 1, 1);
    const db = new Date(b.effectiveYear, (b.effectiveMonth || 1) - 1, 1);
    return da - db;
  });

  const [componentsHistory] = useState(historySorted);

  const effectiveOptions = componentsHistory.map((h) => ({
    id: h.id,
    year: h.effectiveYear,
    month: h.effectiveMonth || 1,
    label: `${monthNames[(h.effectiveMonth || 1) - 1]} ${h.effectiveYear}`,
  }));

  const [selectedEffectiveId, setSelectedEffectiveId] = useState(
    effectiveOptions.length
      ? effectiveOptions[effectiveOptions.length - 1].id
      : null
  );

  const componentsForSelectedEffective = useMemo(() => {
    const v = componentsHistory.find((h) => h.id === selectedEffectiveId);
    return v ? v.components : [];
  }, [componentsHistory, selectedEffectiveId]);

  const findComponentsEffectiveAt = (year, month = 1) => {
    const targetDate = new Date(year, month - 1, 1);

    let chosen = null;
    for (const h of componentsHistory) {
      const hDate = new Date(h.effectiveYear, (h.effectiveMonth || 1) - 1, 1);
      if (hDate <= targetDate) chosen = h;
      else break;
    }
    return chosen
      ? chosen.components
      : componentsHistory.length
        ? componentsHistory[0].components
        : [];
  };

  const [selectedPayslipYear, setSelectedPayslipYear] = useState(
    payrollFromData?.year ?? currentYear
  );

  const generatePayslipsForYear = (year) => {
    const comps = findComponentsEffectiveAt(year, 1);
    const gross = comps.reduce((s, c) => s + Number(c.amount || 0), 0);
    const deductions = comps
      .filter((c) => (c.group || '').toLowerCase().includes('deduct'))
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const net = gross - deductions;
    return monthNames.map((m, idx) => ({
      id: `${year}-${idx + 1}`,
      year,
      monthIdx: idx,
      monthName: m,
      gross,
      deductions,
      net,
      components: comps.map((c) => ({ ...c })),
    }));
  };

  const [payslipsForYear, setPayslipsForYear] = useState(() => {
    return payrollFromData?.payslips && payrollFromData.payslips.length
      ? payrollFromData.payslips.filter((p) => p.year === selectedPayslipYear)
      : generatePayslipsForYear(selectedPayslipYear);
  });

  useEffect(() => {
    const generated =
      payrollFromData?.payslips && payrollFromData.payslips.length
        ? payrollFromData.payslips.filter((p) => p.year === selectedPayslipYear)
        : generatePayslipsForYear(selectedPayslipYear);
    setPayslipsForYear(generated);
  }, [selectedPayslipYear, payrollFromData]);

  const payrollTabs = [
    { id: 'components', label: 'Components' },
    { id: 'payslips', label: 'Payslips', count: payslipsForYear.length },
  ];
  const [activePayrollTab, setActivePayrollTab] = useState('components');

  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState(null);
  const openPayslipModal = (p) => {
    setPayslipModalData(p);
    setPayslipModalOpen(true);
  };
  const closePayslipModal = () => {
    setPayslipModalOpen(false);
    setPayslipModalData(null);
  };

  const totalGrossEffective = componentsForSelectedEffective.reduce(
    (s, c) => s + Number(c.amount || 0),
    0
  );
  const deductionsEffective = componentsForSelectedEffective
    .filter((c) => (c.group || '').toLowerCase().includes('deduct'))
    .reduce((s, c) => s + Number(c.amount || 0), 0);
  const netEffective = totalGrossEffective - deductionsEffective;
  const ctcEffective = totalGrossEffective * 12;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isView) {
      onCancel?.();
      return;
    }

    // If editing as HR, only validate the current step
    if (isEdit && isHrRole) {
      const ok = validateStep(step);
      if (!ok) return;
    } else {
      // Otherwise (Add mode or Admin Edit), validate all previous steps
      for (let i = 0; i < steps.length - 1; i++) {
        const ok = validateStep(i);
        if (!ok) {
          setStep(i);
          return;
        }
      }
    }

    const payload = {
      empId: form.empId || undefined,
      firstName: form.firstName?.trim() || undefined,
      lastName: form.lastName?.trim() || undefined,
      dateOfBirth: toISODateIfValid(form.dateOfBirth),
      gender: form.gender || undefined,
      aadhaarNumber: form.aadhaarNumber?.trim() || undefined,
      panNumber: form.panNumber?.trim() || undefined,
      email: form.email?.trim() || undefined,
      phoneNumber: form.phoneNumber?.replace(/\D/g, '') || undefined,
      emergencyContact: form.emergencyContact?.trim() || undefined,
      photo: form.photo ?? undefined,
      aadhaarCard: form.aadhaarCard ?? undefined,
      panCard: form.panCard ?? undefined,
      proofs: form.proofs ?? [],
      bloodGroup: form.bloodGroup ?? undefined,
      presentAddress: form.presentAddress?.trim() || undefined,
      permanentAddress: form.permanentAddress?.trim() || undefined,
      designation: form.designation?.trim() || undefined,
      department: form.department?.trim() || undefined,
      dateOfJoining: toISODateIfValid(form.dateOfJoining),
      workLocation: form.workLocation?.trim() || undefined,
      bankName: form.bankName?.trim() || undefined,
      accountNumber: form.accountNumber?.trim() || undefined,
      ifscCode: form.ifscCode?.trim() || undefined,
      education: educations
        .filter(
          (e) =>
            (e.institution && e.institution.trim()) ||
            (e.qualification && e.qualification.trim())
        )
        .map((e) => ({
          university: e.university?.trim() || undefined,
          institution: e.institution?.trim() || undefined,
          qualification: e.qualification?.trim() || undefined,
          yearCompleted: e.yearCompleted?.toString().trim() || undefined,
        })),

      // Bond and Documents
      bondDuration: String(form.bondDuration ?? '').trim() || undefined,
      documentsCollected: form.documentsCollected || undefined,
      bondRemarks: form.bondRemarks?.trim() || undefined,
      workMode: form.workMode?.trim() || undefined,
      wfoOffice: form.wfoOffice?.trim() || undefined,
      workType: form.workType?.trim() || undefined,
    };

    if (!payload.firstName || !payload.lastName) {
      setErrors({
        firstName: 'First name required.',
        lastName: 'Last name required.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await Promise.resolve(onSubmit ? onSubmit(payload) : null);

      // Permanently delete deferred documents from blobs only after successful DB save
      if (form.deletedDocuments && form.deletedDocuments.length > 0) {
        for (const deleteUrl of form.deletedDocuments) {
          try {
            await deleteEmployeeDocument(deleteUrl);
          } catch (delErr) {
            console.error(
              'Failed to permanent delete blob:',
              deleteUrl,
              delErr
            );
          }
        }
      }

      return result;
    } catch (err) {
      // Error is already handled by toast in the parent component
      // Do not re-throw to prevent Next.js Runtime Error overlay
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="md:space-y-5 md:px-4 sm:px-2 sm:py-2"
      >
        <div className="flex justify-center bg-gray-100 py-2 rounded-xl no-scroll mb-3 border border-gray-200 shadow-inner">
          {steps.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s}
                onClick={() => setStep(i)}
                type="button"
                className={`
                  relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap
                  ${
                    active
                      ? 'bg-white text-blue-700 shadow-md transform scale-[1.02]'
                      : done
                        ? 'text-blue-600 hover:bg-white/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }
                `}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    active ? 'bg-blue-100' : done ? 'bg-green-100' : 'bg-white'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div className="text-sm font-semibold">{s}</div>
              </button>
            );
          })}
        </div>

        <div>
          {currentStepLabel === 'Personal Details' && (
            <>
              <BasicInfo
                form={form}
                inputProps={inputProps}
                errors={errors}
                setField={setField}
                isView={isView}
              />

              <AddressSection
                form={form}
                setField={setField}
                errors={errors}
                isView={isView}
              />

              <EducationSection
                educations={educations}
                addEducation={addEducation}
                updateEducation={updateEducation}
                removeEducation={removeEducation}
                errors={errors}
                isView={isView}
              />
            </>
          )}

          {currentStepLabel === 'Uploads' && (
            <PhotoSection
              form={form}
              setField={setField}
              isView={isView}
              empId={form.empId}
            />
          )}

          {currentStepLabel === 'Employment & Bank' && (
            <EmploymentBankSection
              form={form}
              setField={setField}
              inputProps={inputProps}
              errors={errors}
              isView={isView || isHrEditRestricted}
            />
          )}

          {currentStepLabel === 'Bond & Documents' && (
            <BondDetails
              form={form}
              setField={setField}
              errors={errors}
              isView={isView || isHrEditRestricted}
            />
          )}

          {currentStepLabel === 'Review' && (
            <ReviewSection form={form} educations={educations} />
          )}
        </div>

        {/* Error message removed per user preference - relies on toast */}
        {errors.payroll && (
          <div className="text-sm text-red-600">{errors.payroll}</div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="px-4 py-2 rounded-md border hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border hover:bg-gray-50"
            >
              Cancel
            </button>
            {step < steps.length - 1 && (
              <PrimaryButton
                type="button"
                onClick={goNext}
                className="px-4 py-2 rounded-md bg-[#004475] text-white"
              >
                Next
              </PrimaryButton>
            )}

            {!isView && (
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-md text-white font-medium flex items-center gap-2 ${submitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Create Employee'}
              </button>
            )}

            {showApprove && (
              <button
                type="button"
                onClick={onApprove}
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 border-2 border-green-700 font-bold shadow-md"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
