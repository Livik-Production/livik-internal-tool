'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../../store/slices/authSlice';
import { uploadEmployeeDocument } from '../../../app/actions/uploadEmployeeDocument';
import { showSuccessToast, showErrorToast } from '../../../app/components/Toast';
import {
  User,
  Briefcase,
  FileText,
  ArrowLeft,
  Edit2,
  Eye,
  Upload,
  CheckCircle,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { IoEarthSharp } from 'react-icons/io5';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: User, percent: 10 },
  { id: 'contract', title: 'Profile Details', icon: Briefcase, percent: 50 },
  { id: 'documents', title: 'Document Uploads', icon: FileText, percent: 100 },
];

export default function ProfileSetupWizardContract({ rawEmployeeData }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [errors, setErrors] = useState({});

  const scrollContainerRef = useRef(null);

  // Scroll to top of the form container on step change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentStep]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    skillset: '',
    designation: '',
    totalExperience: '',
    timing: '',
    workType: '',
    workMode: '',
    aadhaarCard: '',
    panCard: '',
    photo: '',
  });

  const FIELD_TO_DOCUMENT_TYPE = {
    photo: 'PROFILE_PHOTO',
    aadhaarCard: 'AADHAR',
    panCard: 'PAN',
  };

  const parseBondRemarks = (remarks) => {
    if (!remarks) return {};
    const skillsetMatch = remarks.match(/Skillset:\s*([^;]+)/i);
    const timingMatch = remarks.match(/Timing:\s*([^;]+)/i);
    return {
      skillset: skillsetMatch ? skillsetMatch[1].trim() : '',
      timing: timingMatch ? timingMatch[1].trim() : '',
    };
  };

  useEffect(() => {
    if (rawEmployeeData) {
      const parsedRaw = parseBondRemarks(rawEmployeeData.bondRemarks);
      setForm((p) => ({
        ...p,
        firstName: rawEmployeeData.firstName || p.firstName,
        lastName: rawEmployeeData.lastName || p.lastName,
        email: rawEmployeeData.email || p.email,
        phoneNumber: rawEmployeeData.phoneNumber || p.phoneNumber,
        skillset: parsedRaw.skillset || p.skillset,
        timing: parsedRaw.timing || p.timing,
        designation: rawEmployeeData.designation || p.designation,
        totalExperience: rawEmployeeData.totalExperience || p.totalExperience,
        workType: rawEmployeeData.workType || p.workType,
        workMode: rawEmployeeData.workMode || p.workMode,
        aadhaarCard: rawEmployeeData.aadhaarCard || p.aadhaarCard || '',
        panCard: rawEmployeeData.panCard || p.panCard || '',
        photo: rawEmployeeData.photo || p.photo || '',
      }));

      // If we only have partial data, fetch full employee details from API
      if (rawEmployeeData.id && rawEmployeeData.id !== 'mock-123') {
        fetch(`/api/employees/${rawEmployeeData.id}`)
          .then((res) => res.json())
          .then((fullData) => {
            const parsedFull = parseBondRemarks(fullData.bondRemarks);
            setForm((p) => ({
              ...p,
              firstName: fullData.firstName || p.firstName,
              lastName: fullData.lastName || p.lastName,
              email: fullData.email || p.email,
              phoneNumber: fullData.phoneNumber || p.phoneNumber,
              skillset: parsedFull.skillset || p.skillset,
              timing: parsedFull.timing || p.timing,
              designation: fullData.designation || p.designation,
              totalExperience: fullData.totalExperience || p.totalExperience,
              workType: fullData.workType || p.workType,
              workMode: fullData.workMode || p.workMode,
              aadhaarCard: fullData.aadhaarCard || p.aadhaarCard || '',
              panCard: fullData.panCard || p.panCard || '',
              photo: fullData.photo || p.photo || '',
            }));
          })
          .catch((err) => console.error('Failed to fetch full employee data:', err));
      }
    }
  }, [rawEmployeeData]);

  // Handlers
  const handleBack = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      dispatch(logoutSuccess());
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      router.push('/login');
    }
  };

  const handleTopLeftBack = () => {
    if (currentStep > 1) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
    } else {
      handleBack();
    }
  };
  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadError(null);
      setIsUploading(true);
      // Resolve empId: prefer explicit empId/employeeId/contractEmpId, otherwise fetch by DB id
      let empId = rawEmployeeData?.empId || rawEmployeeData?.employeeId || rawEmployeeData?.contractEmpId;
      if (!empId && rawEmployeeData?.id) {
        try {
          const r = await fetch(`/api/employees/${rawEmployeeData.id}`);
          if (r.ok) {
            const d = await r.json();
            empId = d.empId || d.employeeId || d.contractEmpId || empId;
          }
        } catch (err) {
          // ignore - will throw below if empId still missing
        }
      }
      if (!empId) throw new Error('Employee ID not found. Please refresh and try again.');
      const documentType = FIELD_TO_DOCUMENT_TYPE[field];
      if (!documentType) throw new Error(`Unsupported document field: ${field}`);
      const result = await uploadEmployeeDocument(file, empId, documentType);
      handleChange(field, result.url);
      setUploadError(null);
      showSuccessToast('Document uploaded successfully!');
    } catch (err) {
      console.error('Upload failed:', err);
      const message = err?.message || 'Failed to upload document';
      // If Forbidden, try to resolve empId from current session and retry once
      if (String(message).toLowerCase().includes('forbidden') && rawEmployeeData?.id) {
        try {
          const meRes = await fetch('/api/auth/me');
          if (meRes.ok) {
            const meJson = await meRes.json();
            const sessionEmp = meJson?.user?.empId || meJson?.user?.employeeId || meJson?.user?.contractEmpId;
            if (sessionEmp && sessionEmp !== empId) {
              try {
                const retryResult = await uploadEmployeeDocument(file, sessionEmp, documentType);
                handleChange(field, retryResult.url);
                setUploadError(null);
                showSuccessToast('Document uploaded successfully!');
                return;
              } catch (retryErr) {
                console.error('Retry upload failed:', retryErr);
                const rm = retryErr?.message || 'Retry failed';
                setUploadError(rm);
                showErrorToast(rm);
                return;
              }
            }
          }
        } catch (meErr) {
          console.error('Failed to fetch /api/auth/me during upload retry:', meErr);
        }
      }

      setUploadError(message);
      showErrorToast(message);
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.firstName) newErrors.firstName = 'First name required';
    if (!form.lastName) newErrors.lastName = 'Last name required';
    if (!form.phoneNumber) newErrors.phoneNumber = 'Phone number required';
    if (!form.email) newErrors.email = 'Email required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateForm()) {
        setCurrentStep(2);
      } 
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorToast('Please fill all mandatory fields correctly.');
      return;
    }
    try {
      setIsSubmitting(true);
      if (rawEmployeeData?.id === 'mock-123') {
        await new Promise((r) => setTimeout(r, 800));
        showSuccessToast('Contract profile setup complete (mock)');
        return;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        designation: form.designation,
        totalExperience: form.totalExperience,
        workType: form.workType,
        workMode: form.workMode,
        bondRemarks: `Skillset: ${form.skillset}; Timing: ${form.timing}`,
        aadhaarCard: form.aadhaarCard,
        panCard: form.panCard,
        photo: form.photo,
      };

      // Remove role fields if present
      delete payload.roleId;
      delete payload.role;

      const res = await fetch(`/api/employees/${rawEmployeeData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save contract profile');

      showSuccessToast('Profile setup complete!');
      window.location.reload();
    } catch (err) {
      showErrorToast(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = React.useMemo(() => {
    const fieldsToCheck = [
      form.firstName, form.lastName, form.email, form.phoneNumber,
      form.skillset, form.designation, form.totalExperience, form.timing, form.workType, form.workMode,
      form.photo, form.aadhaarCard, form.panCard
    ];
    const filledCount = fieldsToCheck.filter(v => v && String(v).trim() !== '').length;
    const total = fieldsToCheck.length;
    return Math.round((filledCount / (total || 1)) * 100);
  }, [form]);

  return (
    <div className="min-h-screen w-full bg-[#004475] text-sm font-sans flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] max-h-[900px]">
        
        {/* Left Panel - Branding */}
        <div className="bg-gradient-to-r from-[#004475] to-[#1d8fe1] hidden md:flex md:w-5/12 relative flex-col justify-center p-12 overflow-hidden">
          
          {/* Desktop Absolute Back Button */}
          <button
            onClick={handleTopLeftBack}
            className="hidden md:flex absolute top-6 left-6 z-40 p-2.5 text-white hover:bg-white/10 rounded-full border border-white/20 shadow-sm transition-all cursor-pointer items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div className="relative z-20 flex flex-col items-center justify-center mb-15">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center">
              <img
                src="/asset/logo.png"
                alt="Livik Tech"
                className="w-25 h-25 object-contain"
              />
            </div>

            {/* Brand Name */}
            <h1 className="mb-6 text-6xl font-bold text-white tracking-wide text-center">
              Livi<span className="text-[#33a8d9]">k</span> Tech
            </h1>

            {/* Tagline */}
            <p className="text-lg text-white/90 text-center font-medium mb-6">
              Driven by People, Defined by Results
            </p>

            {/* Social Links */}
            <div className="flex justify-center gap-5 mb-8">
             
               <a
                href="https://www.liviktech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-cyan-200 hover:scale-110 transition-all"
              >
                <IoEarthSharp size={28} />
              </a>

              <a
                href="https://www.linkedin.com/company/liviktech/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 hover:scale-110 transition-all"
              >
                <FaLinkedin size={28} />
              </a>
 <a
                href="https://www.instagram.com/livik_technologies_pvt_ltd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pink-200 hover:scale-110 transition-all"
              >
                <FaInstagram size={28} />
              </a>
             
            </div>

            {/* Values */}
            <div className="max-w-sm text-center">
              <h3 className="text-white font-semibold text-lg mb-2">Our Values</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Innovation • Ownership • Collaboration
              </p>
              <p className="text-white/90 text-sm mt-3 leading-relaxed">
                We believe great products are built by passionate people working together with purpose.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Scrollable Form Wizard */}
        <div className="w-full md:w-7/12 h-full flex flex-col relative bg-white z-0">
          
          {/* Curved Divider vertically between Left and Right panels */}
          {/* <div className="absolute top-1/2 left-0 w-[1000px] h-[1000px] pointer-events-none select-none z-10 hidden md:block" style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="absolute inset-0 transform rotate-90 origin-center">
              <div className="absolute w-[180%] h-[120%] bg-[#BEE5FA] left-[-30%] top-[-60%] rounded-[0_0_50%_50%] transform -rotate-[5deg]" />
              <div className="absolute w-[200%] h-[120.5%] bg-white left-[-50%] top-[-65%] rounded-[0_0_50%_50%] transform rotate-[3deg]" />
            </div>
          </div> */}
          
          {/* Top Navbar - Mobile only */}
          <nav className="md:hidden w-full bg-white/90 backdrop-blur-md flex justify-between items-center px-4 py-3 sticky top-0 z-30 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button onClick={handleTopLeftBack} className="text-gray-400 hover:text-[#004475] transition-colors p-1">
                <ArrowLeft size={18} className="stroke-[2.5]" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/asset/logo.png" alt="Livik" className="w-8 h-8 object-contain" />
                <h1 className="text-xl leading-none font-bold text-[#004475] tracking-wide">
                  Livi<span className="text-[#33a8d9]">k</span> Tech
                </h1>
              </div>
            </div>
          </nav>

          <div ref={scrollContainerRef} className="flex-1 scroll-smooth overflow-y-auto  px-8 lg:px-16 pt-8 pb-16 relative z-20">
            
            {/* Step 0: Welcome Step */}
            {STEPS[currentStep]?.id === 'welcome' && (
              <div className="flex flex-col mt-18 items-center justify-center min-h-[65vh] text-center px-4 animate-fade-in text-gray-800 font-bold">
                <h1 className="text-4xl leading-snug mb-4">
                  Welcome to the Team, {form.firstName || 'new joiner'}!
                </h1>

                <p className="text-[14px] max-w-md mx-auto mb-10 font-normal text-gray-500 leading-snug">
               We're thrilled to have you join our growing team. Complete your profile information to help us get to know you better and make your onboarding experience seamless.                </p>

                {/* Get Started Button - Bottom Right */}
                <div className="w-full max-w-md mx-auto flex justify-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-3 px-8 py-3.5 bg-[#004475] text-white rounded-xl font-bold text-[13px] tracking-wider uppercase shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Get Started <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile Picture */}
            {currentStep >= 1 && (
              <div className="flex justify-center mb-12">
                <div id="photo" className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-white shadow-lg flex items-center justify-center">
                    {form.photo ? (
                      <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-gray-300" />
                    )}
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 rounded-full">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={28} className="animate-spin text-white" />
                        <span className="text-[12px] text-white font-semibold">Uploading...</span>
                      </div>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#2563eb] text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-md hover:bg-blue-700 transition-colors">
                    <Edit2 size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} disabled={isUploading} />
                  </label>
                  {errors.photo && <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-red-500 font-bold whitespace-nowrap">{errors.photo}</p>}
                  {uploadError && <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-red-500 font-bold whitespace-nowrap">{uploadError}</p>}
                </div>
              </div>
            )}

            {/* Form Container */}
            {currentStep >= 1 && (
              <div className="flex flex-col w-full max-w-[600px] mx-auto">
                
                {/* Step 1: Contract Details */}
                {STEPS[currentStep]?.id === 'contract' && (
                  <div data-index="1">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <Briefcase size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Profile Details</h2>
                    </div>

                    <h4 className="text-sm font-bold text-[#004475] border-b pb-2 mb-4 tracking-wider uppercase">Personal</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                      <FloatingInput id="contractEmpId" label="ID" value={rawEmployeeData?.contractEmpId || rawEmployeeData?.empId || ''} disabled={true} />
                      <FloatingInput id="firstName" label="FIRST NAME" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} required />
                      <FloatingInput id="lastName" label="LAST NAME" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} required />
                      <FloatingInput id="email" label="CORPORATE EMAIL" value={form.email} onChange={(e) => handleChange('email', e.target.value)} type="email" error={errors.email} required />
                      <FloatingInput id="phoneNumber" label="PHONE NUMBER" value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} error={errors.phoneNumber} required />
                    </div>

                    <h4 className="text-sm font-bold text-[#004475] border-b pb-2 mb-4 tracking-wider uppercase">Contract Section</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <FloatingInput id="skillset" label="SKILLSET" value={form.skillset} onChange={(e) => handleChange('skillset', e.target.value)} error={errors.skillset} />
                      <FloatingInput id="designation" label="DESIGNATION" value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} error={errors.designation} />
                      <FloatingInput id="totalExperience" label="YEARS OF EXPERIENCE" value={form.totalExperience} onChange={(e) => handleChange('totalExperience', e.target.value)} error={errors.totalExperience} />
                      <FloatingInput id="timing" label="TIMING" value={form.timing} onChange={(e) => handleChange('timing', e.target.value)} error={errors.timing} />
                      <FloatingInput id="workType" label="WORK TYPE" value={form.workType} onChange={(e) => handleChange('workType', e.target.value)} isSelect={true} options={[{label:'Contract',value:'CONTRACT'},{label:'Permanent',value:'PERMANENT'}]} error={errors.workType}/>
                      <FloatingInput id="workMode" label="WORK MODE" value={form.workMode} onChange={(e) => handleChange('workMode', e.target.value)} isSelect={true} options={[{label:'Onsite',value:'ONSITE'},{label:'Remote',value:'REMOTE'},{label:'Hybrid',value:'HYBRID'}]} error={errors.workMode} />
                    </div>
                  </div>
                )}

                {/* Step 2: Documents */}
                {STEPS[currentStep]?.id === 'documents' && (
                  <div data-index="2">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <FileText size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Document Uploads</h2>
                    </div>
                    <p className="text-gray-500 mb-6 text-[14px]">Please upload any contract documents if available. You can skip and complete later.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                      <FileUploadSlot id="aadhaarCard" label="AADHAAR CARD" error={errors.aadhaarCard} fileUrl={form.aadhaarCard} onUpload={(e) => handleFileUpload(e, 'aadhaarCard')} isUploading={isUploading} />
                      <FileUploadSlot id="panCard" label="PAN CARD" error={errors.panCard} fileUrl={form.panCard} onUpload={(e) => handleFileUpload(e, 'panCard')} isUploading={isUploading} />
                    </div>

                    <div className="mt-6 p-3 bg-gray-50 rounded-lg text-[11px] text-gray-500 flex items-center justify-center gap-2 border border-gray-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Note: Upload each document in JPG/PNG, less than 1 MB.
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Fixed Footer for Buttons */}
          {currentStep >= 1 && (
            <div className="border-t border-gray-100 p-4 px-8 lg:px-16 bg-white flex justify-end items-center relative z-30 shrink-0">
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#004475] text-white rounded-xl font-bold text-[13px] tracking-wider uppercase shadow-lg shadow-blue-900/20 hover:bg-blue-900 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Next Step <ArrowLeft size={16} className="rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-12 py-3 bg-emerald-600 text-white rounded-xl font-bold text-[13px] tracking-wider uppercase shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle size={18} /> Complete Setup</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Floating Input Component (copied from ProfileSetupWizard)
function FloatingInput({ id, label, value, onChange, type = 'text', disabled = false, isTextarea = false, isSelect = false, options = [], placeholder = '', error = '', required = false }) {
  const hasValue = value && String(value).trim().length > 0;
  const borderClass = error ? 'border-red-500' : disabled ? 'border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-[#004475] group-hover:border-gray-400';
  const labelColorClass = error ? 'text-red-500' : hasValue ? 'text-[#004475]' : 'text-gray-400 group-focus-within:text-[#004475]';

  return (
    <div id={id} className="relative group w-full pt-4 mb-3 transition-all duration-300">
      <label className={`absolute left-0 transition-all duration-300 font-bold uppercase tracking-widest pointer-events-none ${hasValue ? `-top-1 text-[10px] ${labelColorClass}` : `top-4 text-[12px] ${labelColorClass} group-focus-within:-top-1 group-focus-within:text-[10px]`}`}>
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {isSelect ? (
        <select value={value} onChange={onChange} disabled={disabled} className={`w-full bg-transparent border-b py-2 px-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors ${borderClass} ${!hasValue ? 'text-transparent focus:text-gray-800' : ''}`}>
          <option value="" disabled hidden className="text-gray-400">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} rows={1} className={`w-full bg-transparent border-b py-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors resize-none placeholder-transparent focus:placeholder-gray-300 ${borderClass}`} />
      ) : (
        <input type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className={`w-full bg-transparent border-b py-2 px-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors placeholder-transparent focus:placeholder-gray-300 ${borderClass} ${type === 'date' && !hasValue ? 'text-transparent focus:text-gray-800' : ''}`} />
      )}

      {error && <p className="absolute -bottom-4 left-0 text-[10px] text-red-500 font-semibold">{error}</p>}
    </div>
  );
}

function FileUploadSlot({ id, label, fileUrl, onUpload, isUploading, error = '', aspectSquare = false }) {
  const isPdf = fileUrl?.toLowerCase().includes('.pdf');

  return (
    <div id={id} className="flex flex-col gap-1.5 w-full transition-all duration-300">
      <div className={`relative border-2 border-dashed ${error ? 'border-red-500' : 'border-gray-500'} rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#004475] hover:bg-purple-50/50 transition-all group overflow-hidden ${aspectSquare ? 'aspect-square h-auto' : 'h-40'}`}>
        {fileUrl ? (
          <>
            {isPdf ? (
              <div className="absolute inset-0 w-full h-full bg-blue-50 flex flex-col items-center justify-center text-blue-500 transition-transform duration-300 group-hover:scale-105">
                <FileText size={40} className="mb-2 opacity-80" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-800 opacity-80">PDF Document</span>
              </div>
            ) : (
              <img src={fileUrl} alt={label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col items-center justify-center gap-3">
              <div className="flex gap-4">
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(fileUrl, '_blank'); }} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white hover:text-[#004475] text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm z-30 relative cursor-pointer" title="View">
                  <Eye size={18} />
                </button>
                <div className="w-10 h-10 rounded-full bg-white/20 hover:bg-white hover:text-[#004475] text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm pointer-events-none" title="Change">
                  <Edit2 size={18} />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-[#004475] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Upload size={18} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
              <p className="text-[11px] font-semibold text-[#004475] cursor-pointer">Click to Upload</p>
            </div>
          </>
        )}
        <input type="file" onChange={onUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20" />
      </div>
      {error && <p className="text-[11px] text-red-500 font-semibold text-center">{error}</p>}
    </div>
  );
}
