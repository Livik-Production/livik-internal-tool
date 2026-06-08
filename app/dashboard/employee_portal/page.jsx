// app/dashboard/employee_portal/page.jsx
'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import Loader from './../../components/Loader';
import LeaveRequestForm from '../../components/EmployeePortal/LeaveRequestForm';
import Components from '../../components/EmployeePortal/Payroll/Components';
import EmployeePayslipTab from '../../components/EmployeePortal/Payroll/Payslip';
import LeaveSection from './../../components/EmployeePortal/LeaveRequestTab/LeaveSection';
import AssetDetailsTab from '../../components/EmployeePortal/AssetDetailsTab';
import AssetViewModal from '../../components/EmployeePortal/AssetViewModal';
import PaySlip from '../../components/HrModule/PaySlipTab/Payslip';
import EmployeeView from '../../components/EmployeeForm/EmployeeView';
import TabButton from '../../components/Buttons/TabButton';
import Button from '../../components/Buttons/Button';
import { handleSendPayslipEmail } from '../../components/HrModule/EmailForm';
import { uploadEmployeeDocument } from '../../actions/uploadEmployeeDocument';
import { deleteEmployeeDocument } from '../../actions/deleteEmployeeDocument';
import { showSuccessToast, showErrorToast } from '../../components/Toast';
import {
  Printer,
  Download,
  Mail,
  SquareX,
  IdCard,
  CreditCard,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Plus,
  CheckCircle,
  ArrowUpRight,
  Camera,
  Info,
} from 'lucide-react';
import { handlePrint } from '../../components/HrModule/PrintForm';
import { handleDownloadPayslipPDF } from '../../components/HrModule/DownloadForm';

/* ---------- Config / Mock data ---------- */
const initialPersonal = {
  basic: {
    empId: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    aadhaarNumber: '',
    panNumber: '',
    phone: '',
    emergencyContact: '',
    email: '',
    photo: '',
    aadhaarCard: '',
    panCard: '',
    bloodGroup: '',
    educationDetails: [],
    assetAssignments: [],
  },
  address: {
    present: '',
    permanent: '',
  },
  bank: {
    bankName: '',
    accountNumber: '',
    ifsc: '',
  },
  employment: {
    designation: '',
    department: '',
    dateOfJoining: '',
    workLocation: '',
  },
  proofs: [],
  payroll: {
    year: new Date().getFullYear(),
    history: [],
    payslips: [],
  },
};

/* ---------- Small UI helpers (HR-style tabs) ---------- */

/** Standardized Document Upload Slot for Portal */
function DocSlot({
  label,
  value,
  uploading,
  pending,
  preview,
  onFileSelect,
  onCancel,
  onConfirm,
  pendingRequest
}) {
  return (
    <div className="relative group">
      <div className={`
        relative h-50 rounded-2xl border-2 border-gray-300 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
        ${value || pendingRequest || pending ? 'border-[#33a8d9] mb-1' : 'bg-[#f8fafc] hover:border-[#33a8d9]/50 hover:bg-white'}
      `}>
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[#33a8d9] animate-spin" />
            <span className="text-[10px] font-bold text-[#33a8d9] animate-pulse uppercase tracking-wider">Uploading...</span>
          </div>
        ) : pending ? (
          <div className="flex flex-col items-center gap-2.5 p-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white shadow-md relative">
              {preview && pending.type.startsWith('image/') ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-[#33a8d9]">
                  <FileText size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <button
                onClick={onConfirm}
                className="w-full py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
              >
                Confirm Upload
              </button>
              <button
                onClick={onCancel}
                className="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="relative w-full h-full group bg-white">
            {typeof pendingRequest.documentUrl === 'string' && (pendingRequest.documentUrl.match(/\.(jpeg|jpg|png|webp)/i) || pendingRequest.documentUrl.includes('blob')) ? (
              <img src={pendingRequest.documentUrl} className="w-full h-full object-contain p-4 opacity-50 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#33a8d9] gap-2 opacity-50">
                <FileText size={40} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Document</span>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/5 backdrop-blur-[1px]">
              <div className="px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-300 shadow-lg shadow-yellow-500/10 mb-2 flex items-center gap-1.5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-700"></div>
                <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">Approval Pending</span>
              </div>
              <a
                href={pendingRequest.documentUrl}
                target="_blank"
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 px-4 py-1.5 bg-white text-yellow-700 rounded-lg text-[10px] font-bold shadow-md hover:scale-105 inline-flex items-center gap-1"
              >
                View <ArrowUpRight size={10} />
              </a>
            </div>
          </div>
        ) : value ? (
          <div className="relative w-full h-full group/preview bg-white">
            {typeof value === 'string' && (value.match(/\.(jpeg|jpg|png|webp)/i) || value.includes('blob')) ? (
              <img src={value} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#33a8d9] gap-2">
                <FileText size={40} className="opacity-15" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#33a8d9]/40">View Document</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <a
                href={value}
                target="_blank"
                className="px-4 py-1.5 bg-white text-[#33a8d9] rounded-xl text-[10px] font-bold shadow-lg hover:scale-105 transition-transform"
              >
                View
              </a>
              <div className="relative overflow-hidden px-4 py-1.5 bg-[#004475] text-white rounded-xl text-[10px] font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer">
                Update
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => onFileSelect(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 cursor-pointer w-full h-full justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#33a8d9] shadow-sm border border-[#e2e8f0] group-hover:scale-110 transition-transform">
              <Upload size={22} />
            </div>
            <div className="text-center">
              <div className="text-[13px] font-bold text-[#1e293b]">Upload {label}</div>
              <div className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest mt-1">Max 5MB (JPG, PDF)</div>
            </div>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => onFileSelect(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </div>
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

/* ---------- Component ---------- */

function EmployeePortalContent() {
  const [activeTab, setActiveTab] = useState('personal'); // personal | leave | payroll
  const [personalTab, setPersonalTab] = useState('basic'); // basic | bank | employment | address | proofs
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);
  const [personalData, setPersonalData] = useState(initialPersonal);
  const [rawEmployeeData, setRawEmployeeData] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [activeLeaveTab, setActiveLeaveTab] = useState('pending');
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [uploadingPan, setUploadingPan] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingOther, setUploadingOther] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Pending Uploads for "Select & Confirm" feature
  const [pendingAadhaar, setPendingAadhaar] = useState(null);
  const [previewAadhaar, setPreviewAadhaar] = useState(null);
  const [pendingPan, setPendingPan] = useState(null);
  const [previewPan, setPreviewPan] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [pendingOther, setPendingOther] = useState(null);
  const [previewOther, setPreviewOther] = useState(null);
  const [newProofLabel, setNewProofLabel] = useState('');

  // Payroll sub-tab state
  const [activePayrollTab, setActivePayrollTab] = useState('components');

  const searchParams = useSearchParams();
  const authUser = useSelector((state) => state.auth.user);

  // Determine role for request submission: HR roles submit as 'HR', others as 'EMPLOYEE'
  const userRole = (
    authUser?.role?.name ||
    authUser?.role?.roleName ||
    ''
  ).toUpperCase();
  const requestedByRole =
    userRole.includes('HR') || userRole.includes('ADMIN') ? 'HR' : 'EMPLOYEE';

  // Deep-linking effect from Dashboard
  useEffect(() => {
    const tab = searchParams.get('tab');
    const subtab = searchParams.get('subtab');
    const action = searchParams.get('action');

    if (tab) {
      setActiveTab(tab);
      if (tab === 'leave' && subtab) setActiveLeaveTab(subtab);
      if (tab === 'payroll' && subtab) setActivePayrollTab(subtab);
      if (tab === 'personal' && subtab) setPersonalTab(subtab);
    }
    if (action === 'request-leave') setShowLeaveForm(true);
  }, [searchParams]);

  // ... (rest of the logic remains the same)

  // Leave Request Form state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormMode, setLeaveFormMode] = useState('add'); // "add", "view", "edit"
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Payroll Data state
  const [payrollData, setPayrollData] = useState({
    effectiveVersions: [],
    components: [],
    payslips: [],
    history: [],
    processedMonths: [],
  });
  const [isPayrollLoading, setIsPayrollLoading] = useState(false);

  // Payroll state
  const [selectedEffectiveId, setSelectedEffectiveId] = useState('');
  const [selectedPayslipYear, setSelectedPayslipYear] = useState(
    new Date().getFullYear()
  );

  // payslip modal
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState(null); // Payslip handlers
  const handleViewPayslip = async (payslip) => {
    try {
      // payslip object from child component has { monthName, year }
      const res = await fetch('/api/hr/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: authUser.id,
          month: payslip.monthName,
          year: payslip.year,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch payslip data');
      }

      const data = await res.json();

      openPayslipModal({
        rawData: data,
        monthName: payslip.monthName,
        year: payslip.year,
      });
    } catch (err) {
      console.error(err);
      alert('Error generating payslip: ' + err.message);
    }
  };
  const openPayslipModal = (p) => {
    setPayslipModalData(p);
    setPayslipModalOpen(true);
  };
  const closePayslipModal = () => {
    setPayslipModalOpen(false);
    setPayslipModalData(null);
  };

  // Fetch salary history
  useEffect(() => {
    if (!authUser?.id || activeTab !== 'payroll') return;

    const fetchSalaryHistory = async () => {
      try {
        setIsPayrollLoading(true);
        const res = await fetch(
          `/api/payroll/salary-setup?employeeId=${authUser.id}`
        );
        if (!res.ok) throw new Error('Failed to fetch salary history');
        const history = await res.json();

        // Transform history into effectiveVersions and components
        const versions = history.map((h, i) => ({
          id: h.id,
          label: `${new Date(h.effectiveDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${history[i - 1]
            ? new Date(
              new Date(history[i - 1].effectiveDate).setDate(0)
            ).toLocaleDateString('en-IN', {
              month: 'short',
              year: 'numeric',
            })
            : 'Present'
            }`,
          date: h.effectiveDate,
        }));

        const components = [];
        history.forEach((h) => {
          components.push(
            {
              id: `${h.id}-basic`,
              effectiveId: h.id,
              name: 'Basic Salary',
              group: 'Basic',
              amount: Number(h.basicPay),
            },
            {
              id: `${h.id}-hra`,
              effectiveId: h.id,
              name: 'HRA',
              group: 'HRA',
              amount: Number(h.hra),
            },
            {
              id: `${h.id}-other`,
              effectiveId: h.id,
              name: 'Other Allowances',
              group: 'Allowances',
              amount: Number(h.otherAllowances),
            }
          );
        });

        setPayrollData((prev) => ({
          ...prev,
          effectiveVersions: versions, // history from API is desc (newest first)
          components: components,
          history: history,
        }));

        if (versions.length > 0 && !selectedEffectiveId) {
          setSelectedEffectiveId(versions[0].id);
        }

        // Fetch processed payrolls to know which months to show payslips for
        const resData = await fetch(
          `/api/payroll/data?employeeId=${authUser.id}`
        );
        if (resData.ok) {
          const allPayroll = await resData.json();
          const processedMonths = allPayroll
            .filter((p) => {
              const status = (p.status || '').toUpperCase();
              const isProcessed =
                status === 'PROCESSED' || status === 'DISBURSED';
              // Only include if this employee is explicitly in this payroll cycle table
              const isEmployeeInCycle = p.payrolls?.some(
                (pr) => pr.employeeId === authUser.id
              );
              return isProcessed && isEmployeeInCycle;
            })
            .map((p) => p.month); // e.g. "JAN-2026", "FEB-2026"

          setPayrollData((prev) => ({
            ...prev,
            processedMonths,
          }));
        }
      } catch (err) {
        console.error('Salary history fetch failed:', err);
      } finally {
        setIsPayrollLoading(false);
      }
    };

    fetchSalaryHistory();
  }, [authUser?.id, activeTab]);

  const addProof = (proof) =>
    setPersonalData((p) => ({ ...p, proofs: [...p.proofs, proof] }));
  const removeProof = (idx) =>
    setPersonalData((p) => ({
      ...p,
      proofs: p.proofs.filter((_, i) => i !== idx),
    }));

  const handleDownloadPayslip = (payslip) => {
    const text = `Payslip: ${payslip.monthName} ${payslip.year}\nEmployee: ${personalData.basic.firstName}\nGross: ₹${payslip.gross}\nDeductions: ₹${payslip.deductions}\nNet Pay: ₹${payslip.net}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslip.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for payroll components
  const getComponentsForEffective = (effectiveId) => {
    return payrollData.components.filter((c) => c.effectiveId === effectiveId);
  };

  const getPayslipsForYear = (year) => {
    if (year === 'All Years') return payrollData.payslips;
    return payrollData.payslips.filter((p) => p.year === year);
  };

  const payrollYears = [
    'All Years',
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
  ];

  const payslipsForYear = getPayslipsForYear(selectedPayslipYear);

  /* ---------- Main tabs config ---------- */
  const mainTabs = [
    { id: 'personal', label: 'Personal Details' },
    {
      id: 'leave',
      label: 'Leave Request',
    },
    { id: 'payroll', label: 'Payroll' },
    { id: 'assets', label: 'Asset Details' },
  ];

  const personalSubTabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'education', label: 'Education' },
    { id: 'bank', label: 'Bank' },
    { id: 'employment', label: 'Employment' },
    { id: 'address', label: 'Address' },
    { id: 'proofs', label: 'Proofs' },
  ];

  const leaveSubTabs = [
    { id: 'pending', label: 'Pendings' },
    { id: 'history', label: 'History' },
    { id: 'holiday', label: 'Holiday Calendar' },
  ];

  const payrollSubTabs = [
    { id: 'components', label: 'Components' },
    { id: 'payslips', label: 'Payslips' },
  ];

  useEffect(() => {
    if (!personalSubTabs.some((t) => t.id === personalTab))
      setPersonalTab('basic');
  }, []);

  const handleSubmitLeave = async (leaveData) => {
    try {
      alert(
        `Leave request submitted successfully!\nLeave ID: ${leaveData.leave_id}`
      );
    } catch (error) {
      console.error('Error submitting leave:', error);
      throw error;
    }
  };

  const handleCloseLeaveForm = () => {
    setShowLeaveForm(false);
    setSelectedLeave(null);
  };

  // Leave Request Form Handlers
  const handleOpenLeaveForm = (mode = 'add', leaveData = null) => {
    setLeaveFormMode(mode);
    setSelectedLeave(leaveData);
    setShowLeaveForm(true);
  };

  useEffect(() => {
    if (!authUser?.id) return;
    if (activeTab !== 'personal') return;

    const fetchEmployee = async () => {
      try {
        const res = await fetch(`/api/employees/${authUser.id}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch employee');

        const emp = await res.json();
        setRawEmployeeData(emp);

        setPersonalData({
          basic: {
            empId: emp.empId ?? '',
            firstName: emp.firstName ?? '',
            lastName: emp.lastName ?? '',
            dob: emp.dateOfBirth?.slice(0, 10) ?? '', // Use dateOfBirth from DB
            gender: emp.gender ?? '',
            aadhaarNumber: emp.aadhaarNumber ?? '',
            panNumber: emp.panNumber ?? '',
            phone: emp.phoneNumber ?? '', // Use phoneNumber from DB
            emergencyContact: emp.emergencyContact ?? '',
            email: emp.email ?? '',
            photo: emp.photo ?? '',
            aadhaarCard: emp.aadhaarCard ?? '',
            panCard: emp.panCard ?? '',
            bloodGroup: emp.bloodGroup ?? '',
            educationDetails: emp.educationDetails ?? [],
          },
          address: {
            present: emp.presentAddress ?? '',
            permanent: emp.permanentAddress ?? '',
          },
          bank: {
            bankName: emp.bankName ?? '',
            accountNumber: emp.accountNumber ?? '',
            ifsc: emp.ifscCode ?? '', // Use ifscCode from DB
          },
          employment: {
            designation: emp.designation ?? '',
            department: emp.department ?? '',
            dateOfJoining: emp.dateOfJoining?.slice(0, 10) ?? '',
            workLocation: emp.workLocation ?? '',
          },
          proofs: emp.proofs ?? [],
          payroll: emp.payroll ?? initialPersonal.payroll,
          assetAssignments: emp.assetAssignments ?? [],
        });
      } catch (err) {
        console.error('Employee fetch failed:', err);
      } finally {
        setIsLoadingEmployee(false);
      }
    };

    fetchEmployee();
  }, [authUser?.id, activeTab]);

  // Fetch pending document requests
  useEffect(() => {
    if (!authUser?.id || activeTab !== 'personal' || personalTab !== 'proofs')
      return;

    const fetchPendingRequests = async () => {
      try {
        const res = await fetch(
          `/api/document-requests?employeeId=${authUser.id}&status=PENDING`
        );
        if (res.ok) {
          const data = await res.json();
          setPendingRequests(data);
        }
      } catch (err) {
        console.error('Failed to fetch pending requests:', err);
      }
    };

    fetchPendingRequests();
  }, [authUser?.id, activeTab, personalTab]);

  // No global loader here - moving it inside the tabs for a better localized experience
  const customUploadsSection = (
    <div className="space-y-8 animate-dashboard-reveal">
      <div>
        <h2 className="text-lg font-bold text-[#0f172a] mb-5 mt-1">
          Employee Photos & Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Employee Photo Slot */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#475569] ml-1">
              <Camera size={18} className="text-[#33a8d9]" />
              <span>Employee Photo</span>
            </div>
            <DocSlot
              label="Employee Photo"
              value={personalData.basic.photo}
              uploading={uploadingPhoto}
              pending={pendingPhoto}
              preview={previewPhoto}
              onFileSelect={(file) => {
                setPendingPhoto(file);
                setPreviewPhoto(URL.createObjectURL(file));
              }}
              onCancel={() => {
                setPendingPhoto(null);
                setPreviewPhoto(null);
              }}
              onConfirm={async () => {
                try {
                  setUploadingPhoto(true);
                  const fd = new FormData();
                  fd.append('file', pendingPhoto);
                  const url = await uploadEmployeeDocument(fd, 'employee-photo');
                  const res = await fetch('/api/document-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: authUser.id,
                      documentType: 'photo',
                      documentUrl: url,
                      requestedByRole: requestedByRole,
                      requestedById: authUser.id,
                    }),
                  });
                  if (res.ok) {
                    const newReq = await res.json();
                    setPendingRequests((prev) => [...prev, newReq]);
                    setPendingPhoto(null);
                    setPreviewPhoto(null);
                    showSuccessToast('Photo submitted for approval');
                  } else throw new Error('Request failed');
                } catch (err) {
                  showErrorToast(err.message || 'Upload failed');
                } finally {
                  setUploadingPhoto(false);
                }
              }}
              pendingRequest={pendingRequests.find(r => r.documentType === 'photo')}
            />
          </div>

          {/* 2. Aadhaar Card Slot */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#475569] ml-1">
              <IdCard size={18} className="text-[#33a8d9]" />
              <span>Aadhaar Card</span>
            </div>
            <DocSlot
              label="Aadhaar Card"
              value={personalData.basic.aadhaarCard}
              uploading={uploadingAadhaar}
              pending={pendingAadhaar}
              preview={previewAadhaar}
              onFileSelect={(file) => {
                setPendingAadhaar(file);
                setPreviewAadhaar(URL.createObjectURL(file));
              }}
              onCancel={() => {
                setPendingAadhaar(null);
                setPreviewAadhaar(null);
              }}
              onConfirm={async () => {
                try {
                  setUploadingAadhaar(true);
                  const fd = new FormData();
                  fd.append('file', pendingAadhaar);
                  const url = await uploadEmployeeDocument(fd, 'employee-aadhaar');
                  const res = await fetch('/api/document-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: authUser.id,
                      documentType: 'aadhaarCard',
                      documentUrl: url,
                      requestedByRole: requestedByRole,
                      requestedById: authUser.id,
                    }),
                  });
                  if (res.ok) {
                    const newReq = await res.json();
                    setPendingRequests((prev) => [...prev, newReq]);
                    setPendingAadhaar(null);
                    setPreviewAadhaar(null);
                    showSuccessToast('Aadhaar card submitted for approval');
                  } else throw new Error('Request failed');
                } catch (err) {
                  showErrorToast(err.message || 'Upload failed');
                } finally {
                  setUploadingAadhaar(false);
                }
              }}
              pendingRequest={pendingRequests.find(r => r.documentType === 'aadhaarCard')}
            />
          </div>

          {/* 3. PAN Card Slot */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#475569] ml-1">
              <CreditCard size={18} className="text-[#33a8d9]" />
              <span>PAN Card</span>
            </div>
            <DocSlot
              label="PAN Card"
              value={personalData.basic.panCard}
              uploading={uploadingPan}
              pending={pendingPan}
              preview={previewPan}
              onFileSelect={(file) => {
                setPendingPan(file);
                setPreviewPan(URL.createObjectURL(file));
              }}
              onCancel={() => {
                setPendingPan(null);
                setPreviewPan(null);
              }}
              onConfirm={async () => {
                try {
                  setUploadingPan(true);
                  const fd = new FormData();
                  fd.append('file', pendingPan);
                  const url = await uploadEmployeeDocument(fd, 'employee-pan');
                  const res = await fetch('/api/document-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      employeeId: authUser.id,
                      documentType: 'panCard',
                      documentUrl: url,
                      requestedByRole: requestedByRole,
                      requestedById: authUser.id,
                    }),
                  });
                  if (res.ok) {
                    const newReq = await res.json();
                    setPendingRequests((prev) => [...prev, newReq]);
                    setPendingPan(null);
                    setPreviewPan(null);
                    showSuccessToast('PAN card submitted for approval');
                  } else throw new Error('Request failed');
                } catch (err) {
                  showErrorToast(err.message || 'Upload failed');
                } finally {
                  setUploadingPan(false);
                }
              }}
              pendingRequest={pendingRequests.find(r => r.documentType === 'panCard')}
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4 border-t border-gray-300 pt-3">
          <h3 className="text-lg font-bold text-[#334155]">
            Other Attachments
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Existing Proofs */}
          {personalData.proofs?.map((p, i) => (
            <div
              key={`proof-${i}`}
              className="group relative flex flex-col p-4 bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#f8fafc] flex items-center justify-center text-[#94a3b8] shrink-0 border border-[#f1f5f9] group-hover:text-[#33a8d9] group-hover:border-[#33a8d9]/20 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#1e293b] truncate" title={p.label || p.proofLabel || 'Untitled Proof'}>
                    {p.label || p.proofLabel || 'Untitled Proof'}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-wider">Document</div>
                </div>
              </div>
              <a
                href={p.url || p.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-[#f8fafc] text-center text-[11px] font-bold text-[#33a8d9] rounded-xl border border-blue-200 hover:bg-[#33a8d9] hover:text-white hover:border-[#33a8d9] transition-all duration-300"
              >
                View Upload
              </a>
            </div>
          ))}

          {/* Pending Proof Requests */}
          {pendingRequests
            .filter((r) => r.documentType === 'proofs')
            .map((r, i) => (
              <div
                key={`pending-${i}`}
                className="flex flex-col p-4 bg-[#f0f9ff]/40 border border-[#bae6fd] rounded-2xl shadow-sm border-dashed"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#33a8d9] shrink-0 border border-[#bae6fd]">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[#1e293b] truncate" title={r.proofLabel}>
                      {r.proofLabel}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-[9px] uppercase font-bold text-yellow-600 tracking-wider">
                        Approval Pending
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={r.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-white text-center text-[11px] font-bold text-[#33a8d9] rounded-xl border border-[#bae6fd] hover:bg-[#33a8d9] hover:text-white transition-all duration-300"
                >
                  View Pending
                </a>
              </div>
            ))}

          {/* Add New Attachment Card */}
          <div className="bg-[#f8fafc] border-2 border-dashed border-blue-300 rounded-2xl p-4 flex flex-col gap-3 hover:border-[#33a8d9]/50 transition-colors">
            <h4 className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-300">
                <Plus size={8} className="text-[#33a8d9] font-bold " />
              </div>
              Add Attachment
            </h4>
            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Document Label"
                value={newProofLabel}
                onChange={(e) => setNewProofLabel(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-[#33a8d9]/20 focus:border-[#33a8d9] outline-none transition-all placeholder:text-gray-400"
              />
              <div className="flex items-stretch gap-2">
                <div className="relative group/upload flex-1 min-w-0">
                  <div className="w-full h-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-2 cursor-pointer group-hover/upload:border-[#33a8d9]/50 transition-colors">
                    <Upload size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate flex-1">
                      {pendingOther ? pendingOther.name : 'Select'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPendingOther(file);
                        setPreviewOther(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <button
                  disabled={uploadingOther || !pendingOther || !newProofLabel.trim()}
                  onClick={async () => {
                    try {
                      setUploadingOther(true);
                      const url = await uploadEmployeeDocument(pendingOther, 'employee-other');
                      const res = await fetch('/api/document-requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          employeeId: authUser.id,
                          documentType: 'proofs',
                          documentUrl: url,
                          proofLabel: newProofLabel.trim(),
                          requestedByRole: requestedByRole,
                          requestedById: authUser.id,
                        }),
                      });
                      if (res.ok) {
                        const newReq = await res.json();
                        setPendingRequests((prev) => [...prev, newReq]);
                        setNewProofLabel('');
                        setPendingOther(null);
                        showSuccessToast('Document submitted for approval');
                      } else throw new Error('Request failed');
                    } catch (err) {
                      showErrorToast('Upload failed');
                    } finally {
                      setUploadingOther(false);
                    }
                  }}
                  className="px-4 py-2.5 bg-[#004475] text-white rounded-xl font-bold text-xs shadow-md hover:bg-[#003358] hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none whitespace-nowrap shrink-0"
                >
                  {uploadingOther ? '...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Requirements Box */}
      <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#dbeafe] flex items-center justify-center text-[#33a8d9] shrink-0 shadow-sm">
          <CreditCard size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#1e40af]">
            Document Requirements
          </h4>
          <p className="text-sm text-[#3b82f6] leading-relaxed">
            Please ensure all documents are clear and legible. Supported formats: <span className="font-bold">JPG and PDF</span>. Maximum file size should not exceed <span className="font-bold">5MB</span> per document.
          </p>
        </div>
      </div>
    </div>
  );

  /* ---------- Render ---------- */
  return (
    <div className="h-full flex flex-col text-left">
      {/* Header */}
      <div className="mb-1.5">
        <div
          className="rounded-xl px-2 md:px-4 py-3"
          style={{
            background:
              'linear-gradient(90deg, rgba(2,6,23,0.55), rgba(8,20,25,0.55))',
          }}
        >
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              {/* Simple Profile Display */}
              <div className="flex items-center gap-3">
                {personalData.basic.photo ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shrink-0">
                    <Image
                      src={personalData.basic.photo}
                      alt={`${personalData.basic.firstName}'s profile`}
                      fill
                      sizes="64px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-15 h-15 rounded-lg bg-gray-200 flex items-center justify-center text-white font-semibold text-lg">
                    {personalData.basic.firstName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-white">
                  Employee Portal
                </h1>
                <div className="mt-1 text-sm text-white/90">
                  <span className="font-medium">
                    {personalData.basic.firstName} {personalData.basic.lastName}
                  </span>
                  • <span>{personalData.employment.designation}</span>•{' '}
                  <span className="font-medium capitalize">
                    {personalData.employment.department}
                  </span>
                </div>
              </div>
            </div>

            <div />
          </div>
        </div>
      </div>

      {/* main card */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm md:px-2 py-2.5 min-h-0">
        <div className="mb-2">
          <nav className="flex space-x-1 border-b border-gray-300 bg-transparent overflow-x-auto no-scroll">
            {mainTabs.map((tab) => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut',
            }}
            className="flex-1 overflow-y-auto no-scrollbar space-y-6 min-h-0"
          >
            {/* Personal Details */}
            {activeTab === 'personal' && (
              <div className="bg-white rounded-xl min-h-[400px] animate-dashboard-reveal h-full pt-4">
                {isLoadingEmployee ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader label="Fetching personal details..." size="md" />
                  </div>
                ) : (
                  <EmployeeView initialData={rawEmployeeData} customUploadSection={customUploadsSection} />
                )}
              </div>
            )}
            {/* Leave Request Tab */}
            {activeTab === 'leave' && (
              <LeaveSection initialTab={activeLeaveTab} />
            )}
            {/* Payroll Tab */}
            {activeTab === 'payroll' && (
              <div>
                {/* TOP ROW: Effective version / Payslip year (RIGHT aligned) */}
                {/* <div className="flex justify-end mb-3">
                {activePayrollTab === "components" &&
                  payrollData.effectiveVersions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Effective version:
                      </span>
                      <select
                        value={
                          selectedEffectiveId ||
                          payrollData.effectiveVersions[0]?.id ||
                          ""
                        }
                        onChange={(e) => setSelectedEffectiveId(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm min-w-[180px]"
                      >
                        {payrollData.effectiveVersions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {activePayrollTab === "payslips" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Payslip year:</span>
                    <select
                      value={selectedPayslipYear}
                      onChange={(e) =>
                        setSelectedPayslipYear(Number(e.target.value))
                      }
                      className="px-3 py-2 border rounded-md text-sm min-w-[120px]"
                    >
                      {payrollYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div> */}

                {/* SECOND ROW: Payroll sub-tabs (LEFT aligned) */}
                <nav className="flex space-x-1 border-b border-gray-300 bg-white sticky top-0 z-20 pt-1 overflow-x-auto no-scroll">
                  {payrollSubTabs.map((tab) => (
                    <TabButton
                      key={tab.id}
                      isActive={activePayrollTab === tab.id}
                      onClick={() => setActivePayrollTab(tab.id)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </nav>

                {/* CONTENT */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePayrollTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.25,
                      ease: 'easeInOut',
                    }}
                    className="mt-3 min-h-[400px]"
                  >
                    {activePayrollTab === 'components' && (
                      <div>
                        <Components
                          employeeId={authUser.id}
                          effectiveId={selectedEffectiveId}
                          versions={payrollData.effectiveVersions}
                          isLoading={isPayrollLoading}
                          components={getComponentsForEffective(
                            selectedEffectiveId
                          )}
                          onVersionChange={setSelectedEffectiveId}
                          historyData={payrollData.history}
                        />
                      </div>
                    )}

                    {activePayrollTab === 'payslips' && (
                      <div>
                        <EmployeePayslipTab
                          years={payrollYears}
                          selectedYear={selectedPayslipYear}
                          onYearChange={setSelectedPayslipYear}
                          processedMonths={payrollData.processedMonths || []}
                          onViewPayslip={handleViewPayslip}
                          onDownloadPayslip={handleDownloadPayslip}
                          isLoading={isPayrollLoading}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Asset Details */}
            {activeTab === 'assets' && (
              <div className="mt-4 min-h-[400px]">
                {isLoadingEmployee ? (
                  <div className="bg-gray-50 rounded-xl p-20 flex items-center justify-center">
                    <Loader label="Fetching assigned assets..." size="md" />
                  </div>
                ) : (
                  <AssetDetailsTab
                    assignments={personalData.assetAssignments || []}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Leave Request Form Modal */}
      {showLeaveForm && (
        <LeaveRequestForm
          mode={leaveFormMode}
          initialData={selectedLeave}
          onClose={handleCloseLeaveForm}
          onSubmit={handleSubmitLeave}
        />
      )}

      {/* Payslip Modal */}
      {payslipModalOpen && payslipModalData && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePayslipModal();
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  Payslip - {payslipModalData.monthName} {payslipModalData.year}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handlePrint('payslip')}
                  className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-blue-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110"
                  title="Print Payslip"
                >
                  <Printer size={18} />
                </Button>
                <Button
                  onClick={() =>
                    handleDownloadPayslipPDF(
                      {
                        id: authUser?.id || personalData.basic.empId,
                        name: `${personalData.basic.firstName} ${personalData.basic.lastName}`.trim(),
                        role: personalData.employment.designation,
                        email: personalData.basic.email,
                        phone: personalData.basic.phone,
                        address: personalData.address.present,
                      },
                      'with'
                    )
                  }
                  className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-green-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110"
                  title="Download Payslip"
                >
                  <Download size={18} />
                </Button>
                <Button
                  onClick={() =>
                    handleSendPayslipEmail({
                      id: authUser?.id || personalData.basic.empId,
                      name: `${personalData.basic.firstName} ${personalData.basic.lastName}`.trim(),
                      role: personalData.employment.designation,
                      email: personalData.basic.email,
                      phone: personalData.basic.phone,
                      address: personalData.address.present,
                    })
                  }
                  className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-purple-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110"
                  title="Email Payslip"
                >
                  <Mail size={18} />
                </Button>
                <button
                  onClick={closePayslipModal}
                  className="w-8 h-8 p-0 bg-red-600 text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110 ml-2"
                  title="Close"
                >
                  <SquareX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scroll">
              <div className="flex justify-center">
                <PaySlip
                  employeeData={{
                    id: authUser?.id || personalData.basic.empId,
                    name: `${personalData.basic.firstName} ${personalData.basic.lastName}`.trim(),
                    role: personalData.employment.designation,
                    department: personalData.employment.department,
                    email: personalData.basic.email,
                    phone: personalData.basic.phone,
                    address: personalData.address.present,
                  }}
                  payslipData={payslipModalData.rawData}
                  letterPad="with"
                  month={payslipModalData.monthName}
                  year={payslipModalData.year}
                />
              </div>
              <div className="pt-4 text-center text-sm text-gray-600 print:hidden">
                <p>
                  This is a computer generated payslip. No signature is
                  required.
                </p>
                <p className="mt-1">
                  Generated on: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeePortalPage() {
  return (
    <Suspense
      fallback={<Loader label="Loading Employee Portal..." size="md" />}
    >
      <div className="h-full flex flex-col min-h-0">
        <EmployeePortalContent />
      </div>
    </Suspense>
  );
}
