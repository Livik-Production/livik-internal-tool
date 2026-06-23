'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../../store/slices/authSlice';
import { uploadEmployeeDocument } from '../../../app/actions/uploadEmployeeDocument';
import {
  User,
  GraduationCap,
  MapPin,
  Briefcase,
  CreditCard,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  Plus,
  ShieldCheck,
  Check,
  Loader2,
  Eye,
  Edit2,
  ArrowLeft,
  PartyPopper,
} from 'lucide-react';
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import { IoEarthSharp } from "react-icons/io5";
import { showSuccessToast, showErrorToast } from '../../../app/components/Toast';

const STEPS = [
  { id: 'personal', title: 'Personal Details', icon: User, percent: 15 },
  { id: 'education', title: 'Education History', icon: GraduationCap, percent: 35 },
  { id: 'address', title: 'Address Details', icon: MapPin, percent: 50 },
  { id: 'employment', title: 'Employment Info', icon: Briefcase, percent: 65 },
  { id: 'bank', title: 'Bank Details', icon: CreditCard, percent: 85 },
  { id: 'documents', title: 'Document Uploads', icon: FileText, percent: 100 },
];

export default function ProfileSetupWizard({ rawEmployeeData }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (currentStep > 0) {
      handlePrev();
    } else if (currentStep === 0) {
      setCurrentStep(-1);
    } else {
      handleBack();
    }
  };

  // Refs for scrolling and ScrollSpy
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef([]);

  // Scroll to top of the form container on step change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentStep]);

  // Initialize form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',

    educationDetails: [{ institution: '', qualification: '', yearCompleted: '' }],

    presentAddress: '',
    permanentAddress: '',

    designation: '',
    department: '',
    dateOfJoining: '',

    bankName: '',
    accountNumber: '',
    ifscCode: '',

    aadhaarNumber: '',
    panNumber: '',
    aadhaarCard: '',
    panCard: '',
    photo: '',
  });

  useEffect(() => {
    const populateForm = (data) => {
      setForm((prev) => ({
        ...prev,
        firstName: data.firstName || prev.firstName || '',
        lastName: data.lastName || prev.lastName || '',
        email: data.email || prev.email || '',
        phoneNumber: data.phoneNumber || prev.phoneNumber || '',
        dateOfBirth: (data.dateOfBirth && typeof data.dateOfBirth === 'string' && !data.dateOfBirth.startsWith('1970-01-01')) ? data.dateOfBirth.slice(0, 10) : prev.dateOfBirth || '',
        gender: data.gender || prev.gender || '',

        educationDetails: data.educationDetails?.length > 0
          ? data.educationDetails
          : prev.educationDetails,

        presentAddress: data.presentAddress || prev.presentAddress || '',
        permanentAddress: data.permanentAddress || prev.permanentAddress || '',

        designation: data.designation || prev.designation || '',
        department: data.department || prev.department || '',
        dateOfJoining: data.dateOfJoining?.slice(0, 10) || prev.dateOfJoining || '',

        bankName: data.bankName || prev.bankName || '',
        accountNumber: data.accountNumber || prev.accountNumber || '',
        ifscCode: data.ifscCode || prev.ifscCode || '',

        aadhaarNumber: data.aadhaarNumber || prev.aadhaarNumber || '',
        panNumber: data.panNumber || prev.panNumber || '',
        aadhaarCard: data.aadhaarCard || prev.aadhaarCard || '',
        panCard: data.panCard || prev.panCard || '',
        photo: data.photo || prev.photo || '',
      }));
    };

    if (rawEmployeeData) {
      populateForm(rawEmployeeData);

      // Fetch full details if only partial data (like authUser) was passed
      if (rawEmployeeData.id && rawEmployeeData.id !== 'mock-123') {
        fetch(`/api/employees/${rawEmployeeData.id}`)
          .then(res => res.json())
          .then(fullData => {
            populateForm(fullData);
          })
          .catch(err => console.error('Failed to fetch full employee data:', err));
      }
    }
  }, [rawEmployeeData]);

  // Calculate dynamic completion percentage
  const completionPercentage = React.useMemo(() => {
    const fieldsToCheck = [
      form.firstName, form.lastName, form.email, form.phoneNumber, form.dateOfBirth, form.gender,
      form.presentAddress, form.permanentAddress, form.bankName, form.accountNumber, form.ifscCode,
      form.aadhaarNumber, form.panNumber, form.aadhaarCard, form.panCard, form.photo
    ];

    let filledCount = fieldsToCheck.filter(val => val && String(val).trim() !== '').length;

    if (form.educationDetails && form.educationDetails.length > 0) {
      const hasValidEdu = form.educationDetails.some(edu => edu.institution || edu.qualification || edu.yearCompleted);
      if (hasValidEdu) filledCount++;
    }

    const totalFields = fieldsToCheck.length + 1;
    return Math.round((filledCount / totalFields) * 100);
  }, [form]);



  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addDegree = () => {
    setForm(p => ({
      ...p,
      educationDetails: [{ institution: '', qualification: '', yearCompleted: '' }, ...p.educationDetails]
    }));
  };

  const removeDegree = (idx) => {
    setForm(p => ({
      ...p,
      educationDetails: p.educationDetails.filter((_, i) => i !== idx)
    }));
    // Also remove the error for this idx if it exists
    if (errors.educationDetails) {
      const newEduErrors = [...errors.educationDetails];
      newEduErrors.splice(idx, 1);
      setErrors(p => ({ ...p, educationDetails: newEduErrors.length > 0 ? newEduErrors : undefined }));
    }
  };

  const updateDegree = (idx, field, value) => {
    setForm(p => {
      const newDocs = [...p.educationDetails];
      newDocs[idx] = { ...newDocs[idx], [field]: value };
      return { ...p, educationDetails: newDocs };
    });

    if (errors.educationDetails?.[idx]?.[field]) {
      const newEduErrors = [...(errors.educationDetails || [])];
      if (newEduErrors[idx]) {
        newEduErrors[idx] = { ...newEduErrors[idx], [field]: undefined };
      }
      setErrors(p => ({ ...p, educationDetails: newEduErrors }));
    }
  };

  // Maps form field names to S3 document types
  const FIELD_TO_DOCUMENT_TYPE = {
    photo: 'PROFILE_PHOTO',
    aadhaarCard: 'AADHAR',
    panCard: 'PAN',
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const empId = rawEmployeeData?.empId;
      if (!empId) throw new Error('Employee ID not found. Please refresh and try again.');
      const documentType = FIELD_TO_DOCUMENT_TYPE[field];
      if (!documentType) throw new Error(`Unsupported document field: ${field}`);
      const result = await uploadEmployeeDocument(file, empId, documentType);
      // Store the S3 URL in the form field for preview
      handleChange(field, result.url);
      showSuccessToast('Document uploaded successfully!');
    } catch (err) {
      showErrorToast(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const validateStep = (s) => {
    const newErrors = {};

    if (s === 0) {
      if (!form.firstName) newErrors.firstName = 'First name is required';
      if (!form.lastName) newErrors.lastName = 'Last name is required';
      if (!form.email) newErrors.email = 'Corporate email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
      if (!form.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!form.gender) newErrors.gender = 'Gender is required';
    } else if (s === 1) {
      const eduErrors = [];
      form.educationDetails.forEach((edu, idx) => {
        const eduErr = {};
        if (!edu.qualification) eduErr.qualification = 'Required';
        if (!edu.institution) eduErr.institution = 'Required';
        if (!edu.yearCompleted) eduErr.yearCompleted = 'Required';
        if (Object.keys(eduErr).length > 0) eduErrors[idx] = eduErr;
      });
      if (eduErrors.length > 0) newErrors.educationDetails = eduErrors;
    } else if (s === 2) {
      if (!form.presentAddress) newErrors.presentAddress = 'Present address is required';
      if (!form.permanentAddress) newErrors.permanentAddress = 'Permanent address is required';
    } else if (s === 4) {
      if (!form.bankName) newErrors.bankName = 'Bank name is required';
      if (!form.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!form.ifscCode) newErrors.ifscCode = 'IFSC code is required';
    } else if (s === 5) {
      if (!form.aadhaarNumber) newErrors.aadhaarNumber = 'Aadhaar number is required';
      if (!form.panNumber) newErrors.panNumber = 'PAN number is required';
      if (!form.photo) newErrors.photo = 'Profile photo is required';
      if (!form.aadhaarCard) newErrors.aadhaarCard = 'Aadhaar document is required';
      if (!form.panCard) newErrors.panCard = 'PAN document is required';
    }

    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      let elementId = firstErrorKey;
      if (firstErrorKey === 'educationDetails') {
        const firstErrIdx = newErrors.educationDetails.findIndex(e => e !== undefined);
        elementId = `educationDetails-${firstErrIdx}`;
      }
      setTimeout(() => {
        const el = document.getElementById(elementId);
        const container = scrollContainerRef.current;
        if (el && container) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const scrollTop = container.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
          container.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 100);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } 
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      showErrorToast('Please fill all mandatory fields for this step.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate API call for mock data so it doesn't fail during design/testing
      if (rawEmployeeData?.id === 'mock-123') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        showSuccessToast('Profile setup complete (Mock Data)!');
        return;
      }

      const payload = { ...form };
      // Explicitly remove role fields to prevent backend 403 Forbidden checks
      delete payload.roleId;
      delete payload.role;

      const res = await fetch(`/api/employees/${rawEmployeeData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update profile');

      showSuccessToast('Profile setup complete!');
      window.location.reload();
    } catch (err) {
      showErrorToast(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

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

    {/* Optional Startup Message */}
    <div className="max-w-sm text-center">
  <h3 className="text-white font-semibold text-lg mb-2">
    Our Values
  </h3>
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
          
{/*      
          <div className="absolute top-1/2 left-0 w-[1000px] h-[1000px] pointer-events-none select-none z-10 hidden md:block" style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="absolute inset-0 transform rotate-90 origin-center">
              <div className="absolute w-[200%] h-[120%] bg-[#BEE5FA] left-[-30%] top-[-60%] rounded-[0_0_50%_50%] transform -rotate-[5deg]" />
              <div className="absolute w-[200%] h-[120.5%] bg-white left-[-50%] top-[-65%] rounded-[0_0_50%_50%] transform rotate-[3deg]" />
            </div>
          </div>  */}
          
          {/* Top Navbar - Mobile only (Without progress) */}
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

          <div ref={scrollContainerRef} className="flex-1 scroll-smooth overflow-y-auto px-8 lg:px-16 pt-8 pb-16 relative z-20">

            {currentStep === -1 && (
            <div className="flex flex-col mt-18 items-center justify-center min-h-[65vh] text-center px-4 animate-fade-in text-gray-800 font-bold">
                <h1 className="text-4xl leading-snug mb-4">
                  Welcome to the Team, {form.firstName || 'new joiner'}!
                </h1>


 <p className="text-[14px] max-w-md mx-auto mb-10 font-normal text-gray-500 leading-snug">
    We're thrilled to have you here. Let's get your profile set up and ready for your first day.
  </p>

  {/* Excited to have you on board banner */}
  {/* <div className="flex items-center gap-4 bg-sky-50/60 border border-sky-100/50 p-5 rounded-2xl max-w-md w-full mx-auto mt-2 text-left shadow-sm">
    <div className="flex items-center justify-center text-[#004475] shrink-0">
      <PartyPopper size={36} className="stroke-[1.8]" />
    </div>

    <div className="flex flex-col">
      <span className="text-[15px] leading-snug">
        We're excited to have you on board!
      </span>

      <span className="text-[13px] text-gray-500 font-normal leading-snug mt-0.5">
        Your journey with Livik Tech starts here. 💙
      </span>
    </div>
  </div> */}

  {/* Get Started Button - Bottom Right */}
  <div className="w-full max-w-md mx-auto flex justify-center">
                   <button
                     type="button"
                     onClick={() => setCurrentStep(0)}
                     className="flex items-center gap-3 px-8 py-3.5 bg-[#004475] text-white rounded-xl font-bold text-[13px] tracking-wider uppercase shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                   >
                     Get Started <ArrowLeft size={16} className="rotate-180" />
                   </button>
                 </div>
</div>
            )}

            {/* Profile Picture */}
            {currentStep >= 0 && (
              <div className="flex justify-center mb-12">
                <div id="photo" className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-50 overflow-hidden bg-white shadow-lg flex items-center justify-center">
                    {form.photo ? (
                      <img src={form.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-gray-300" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#2563eb] text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-md hover:bg-blue-700 transition-colors">
                    <Edit2 size={16} />
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} disabled={isUploading} />
                  </label>
                  {errors.photo && <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-red-500 font-bold whitespace-nowrap">{errors.photo}</p>}
                </div>
              </div>
            )}

            {/* Form Container */}
            {currentStep >= 0 && (
              <div className="flex flex-col w-full max-w-[600px] mx-auto">
                {/* Section 0: Personal Details */}
                {currentStep === 0 && (
                  <div data-index="0">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <User size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Personal Details</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <FloatingInput id="firstName" label="FIRST NAME" error={errors.firstName} value={form.firstName} onChange={() => { }} disabled required />
                      <FloatingInput id="lastName" label="LAST NAME" error={errors.lastName} value={form.lastName} onChange={() => { }} disabled required />
                      <FloatingInput id="email" label="CORPORATE EMAIL" error={errors.email} value={form.email} onChange={(e) => handleChange('email', e.target.value)} type="email" required />
                      <FloatingInput id="phoneNumber" label="PHONE NUMBER" error={errors.phoneNumber} value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} required />
                      <FloatingInput id="dateOfBirth" label="DATE OF BIRTH" error={errors.dateOfBirth} value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} type="date" required />
                      <FloatingInput
                        id="gender"
                        label="GENDER"
                        value={form.gender}
                        error={errors.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        isSelect
                        options={[
                          { label: 'Male', value: 'Male' },
                          { label: 'Female', value: 'Female' },
                          { label: 'Other', value: 'Other' },
                        ]}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Section 1: Education History */}
                {currentStep === 1 && (
                  <div data-index="1">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3">
                        <GraduationCap size={24} className="text-[#004475]" />
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Education History</h2>
                      </div>
                      <button
                        onClick={addDegree}
                        className="text-[#2563eb] text-[11px] font-bold uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add Degree
                      </button>
                    </div>
                    <div className="space-y-4">
                      {form.educationDetails.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          No education history added yet.
                        </div>
                      ) : (
                        form.educationDetails.map((degree, idx) => (
                          <div id={`educationDetails-${idx}`} key={idx} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-200 relative group transition-all duration-300">
                            <button
                              type="button"
                              onClick={() => removeDegree(idx)}
                              className="absolute top-4 right-4 p-2 z-10 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-white rounded-full shadow-sm"
                              title="Remove Degree"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              <div className="col-span-2">
                                <FloatingInput label="INSTITUTION" error={errors.educationDetails?.[idx]?.institution} value={degree.institution} onChange={(e) => updateDegree(idx, 'institution', e.target.value)} placeholder="e.g. Stanford University" />
                              </div>
                              <FloatingInput label="DEGREE / QUALIFICATION" error={errors.educationDetails?.[idx]?.qualification} value={degree.qualification} onChange={(e) => updateDegree(idx, 'qualification', e.target.value)} placeholder="e.g. MBA" />
                              <FloatingInput label="YEAR OF COMPLETION" error={errors.educationDetails?.[idx]?.yearCompleted} value={degree.yearCompleted} onChange={(e) => updateDegree(idx, 'yearCompleted', e.target.value)} placeholder="e.g. 2020" type="number" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Section 2: Address Details */}
                {currentStep === 2 && (
                  <div data-index="2">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <MapPin size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Address Details</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <FloatingInput id="presentAddress" label="PRESENT ADDRESS" error={errors.presentAddress} value={form.presentAddress} onChange={(e) => handleChange('presentAddress', e.target.value)} isTextarea />
                      <FloatingInput id="permanentAddress" label="PERMANENT ADDRESS" error={errors.permanentAddress} value={form.permanentAddress} onChange={(e) => handleChange('permanentAddress', e.target.value)} isTextarea />
                    </div> 
                  </div>
                )}

                {/* Section 3: Employment Info */}
                {currentStep === 3 && (
                  <div data-index="3">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <Briefcase size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Employment Info</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="col-span-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                        <Briefcase size={16} className="text-[#004475] shrink-0 mt-0.5" />
                        <p className="text-[12px] text-blue-900 font-medium leading-relaxed">
                          Your employment information has been configured by HR. If you see any discrepancies, please contact your HR representative.
                        </p>
                      </div>
                      <FloatingInput label="DESIGNATION" value={form.designation} onChange={() => { }} disabled />
                      <FloatingInput label="DEPARTMENT" value={form.department} onChange={() => { }} disabled />
                      <FloatingInput label="DATE OF JOINING" value={form.dateOfJoining} onChange={() => { }} disabled type="date" />
                    </div>
                  </div>
                )}

                {/* Section 4: Bank Details */}
                {currentStep === 4 && (
                  <div data-index="4">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <CreditCard size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Bank Details</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      <div className="col-span-2">
                        <FloatingInput id="bankName" label="BANK NAME" error={errors.bankName} value={form.bankName} onChange={(e) => handleChange('bankName', e.target.value)} />
                      </div>
                      <FloatingInput id="accountNumber" label="ACCOUNT NUMBER" error={errors.accountNumber} value={form.accountNumber} onChange={(e) => handleChange('accountNumber', e.target.value)} />
                      <FloatingInput id="ifscCode" label="IFSC / SWIFT CODE" error={errors.ifscCode} value={form.ifscCode} onChange={(e) => handleChange('ifscCode', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Section 5: Document Uploads */}
                {currentStep === 5 && (
                  <div data-index="5">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-3">
                      <FileText size={24} className="text-[#004475]" />
                      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Document Uploads</h2>
                    </div>
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <FloatingInput id="aadhaarNumber" label="AADHAAR NUMBER" error={errors.aadhaarNumber} value={form.aadhaarNumber} onChange={(e) => handleChange('aadhaarNumber', e.target.value)} />
                        <FloatingInput id="panNumber" label="PAN NUMBER" error={errors.panNumber} value={form.panNumber} onChange={(e) => handleChange('panNumber', e.target.value)} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                        <FileUploadSlot id="aadhaarCard" label="AADHAAR CARD" error={errors.aadhaarCard} fileUrl={form.aadhaarCard} onUpload={(e) => handleFileUpload(e, 'aadhaarCard')} isUploading={isUploading} />
                        <FileUploadSlot id="panCard" label="PAN CARD" error={errors.panCard} fileUrl={form.panCard} onUpload={(e) => handleFileUpload(e, 'panCard')} isUploading={isUploading} />
                      </div>
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
          {currentStep >= 0 && (
            <div className="border-t border-gray-100 p-4 px-8 lg:px-16 bg-white flex justify-end items-center relative z-30 shrink-0">
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
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

// Reusable Floating Input Component
function FloatingInput({ id, label, value, onChange, type = 'text', disabled = false, isTextarea = false, isSelect = false, options = [], placeholder = '', error = '', required = false }) {
  const hasValue = value && String(value).trim().length > 0;
  const borderClass = error ? 'border-red-500' : disabled ? 'border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:border-[#004475] group-hover:border-gray-400';
  const labelColorClass = error ? 'text-red-500' : hasValue ? 'text-[#004475]' : 'text-gray-400 group-focus-within:text-[#004475]';

  return (
    <div id={id} className="relative group w-full pt-4 mb-3 transition-all duration-300">
      {/* Label - Floating or Static depending on value/focus */}
      <label
        className={`absolute left-0 transition-all duration-300 font-bold uppercase tracking-widest pointer-events-none ${hasValue
          ? `-top-1 text-[10px] ${labelColorClass}`
          : `top-4 text-[12px] ${labelColorClass} group-focus-within:-top-1 group-focus-within:text-[10px]`
          }`}
      >
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {isSelect ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full bg-transparent border-b py-2 px-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors ${borderClass} ${!hasValue ? 'text-transparent focus:text-gray-800' : ''}`}
        >
          <option value="" disabled hidden className="text-gray-400">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-gray-800">
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={`w-full bg-transparent border-b py-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors resize-none placeholder-transparent focus:placeholder-gray-300 ${borderClass}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-transparent border-b py-2 px-2 text-[15px] font-semibold text-gray-800 focus:outline-none transition-colors placeholder-transparent focus:placeholder-gray-300 ${borderClass} ${type === 'date' && !hasValue ? 'text-transparent focus:text-gray-800' : ''}`}
        />
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
                {/* View Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(fileUrl, '_blank');
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white hover:text-[#004475] text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm z-30 relative cursor-pointer"
                  title="View"
                >
                  <Eye size={18} />
                </button>
                {/* Change Button Visual */}
                <div
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white hover:text-[#004475] text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-sm pointer-events-none"
                  title="Change"
                >
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
              <p className="text-[11px] font-semibold text-[#004475] cursor-pointer">
                Click to Upload
              </p>
            </div>
          </>
        )}
        <input
          type="file"
          onChange={onUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        />
      </div>
      {error && <p className="text-[11px] text-red-500 font-semibold text-center">{error}</p>}
    </div>
  );
}
