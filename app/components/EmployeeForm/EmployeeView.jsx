'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BasicInfo from './sections/BasicInfo';
import AddressSection from './sections/AddressSection';
import EducationSection from './sections/EducationSection';
import EmploymentBankSection from './sections/EmploymentBankSection';
import ReviewSection from './sections/ReviewSection';
import BondDetails from '../../components/EmployeeForm/sections/BondDetails';
import PhotoSection from '../../components/EmployeeForm/sections/PhotoSection';
import PrimaryButton from '../Buttons/PrimaryButton';

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

export default function EmployeeView({
  initialData = {},
  onEdit,
  customUploadSection,
  hideStatus = false,
}) {
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
    opacity: 0,
    glareX: 50,
    glareY: 50,
  });

  const router = useRouter();
  const [status, setStatus] = useState(
    initialData.status === 'Inactive'
      ? 'Inactive'
      : initialData.status === 'PENDING' ||
          initialData.status === 'PENDING_ADMIN'
        ? 'Pending'
        : 'Active'
  );

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);

    if (newStatus !== 'Inactive') {
      try {
        const dbStatus = newStatus === 'Pending' ? 'PENDING' : 'Active';
        const res = await fetch(`/api/employees/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: dbStatus }),
        });
        if (!res.ok) throw new Error('Failed to update status');
        alert(`Employee status updated to ${newStatus}`);
      } catch (err) {
        console.error(err);
        alert('Failed to update employee status');
      }
    }
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8; // Max tilt 8deg
    const rotateY = ((x - centerX) / centerX) * 8;

    setTilt({
      x: rotateX,
      y: rotateY,
      opacity: 0.25,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, opacity: 0, glareX: 50, glareY: 50 });
  };

  const form = {
    empId: initialData.empId ?? '',
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
  };

  const educations = (
    initialData.educationDetails ||
    initialData.education ||
    []
  ).length
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
      ];

  const inputProps = (name, type = 'text', opts = {}) => ({
    name,
    value: form[name] ?? '',
    onChange: () => {},
    type,
    readOnly: true,
    disabled: true,
    className:
      'mt-1 w-full px-3 py-4 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-700',
    ...opts,
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-2 py-1 h-full min-h-0">
      {/* Left Column: Profile Card */}
      <div
        className="w-full lg:w-[320px] xl:w-[355px] shrink-0 h-fit mx-auto lg:mx-0"
        style={{ perspective: '1200px' }}
      >
        <div className="">
          <div
            className="relative rounded-[2rem] p-3 mt-4.5 py-5 bg-transparent border border-gray-400 transition-all duration-200 ease-out antialiased"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow:
                tilt.opacity > 0
                  ? '0 30px 60px rgba(0,0,0,0.15)'
                  : '0 10px 40px rgba(0,0,0,0.08)',
            }}
          >
            {/* Holographic glare overlay */}
            <div
              className="absolute inset-0 z-50 pointer-events-none rounded-[2rem] transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)`,
                opacity: tilt.opacity,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Realistic Background Curve */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none bg-[#03345A] -z-10 transition-transform duration-300">
              <div className="absolute w-[180%] h-[120%] bg-[#BEE5FA] left-[-30%] top-[-60%] rounded-[0_0_50%_50%] transform -rotate-[5deg]" />
              <div className="absolute w-[200%] h-[120.5%] bg-white left-[-50%] top-[-65%] rounded-[0_0_50%_50%] transform rotate-[3deg]" />
            </div>

            {/* Edit Button */}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="absolute top-6 right-6 text-[13px] font-bold text-gray-400 hover:text-[#003B6D] transition-all cursor-pointer flex items-center gap-1.5 z-[100] pointer-events-auto"
                style={{
                  transform:
                    tilt.opacity > 0 ? 'translateZ(50px)' : 'translateZ(10px)',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                Edit
              </button>
            )}

            {/* Photo and Name Container */}
            <div
              className="relative z-10 flex flex-col items-center transition-transform duration-300 ease-out "
              style={{
                transform:
                  tilt.opacity > 0 ? 'translateZ(40px)' : 'translateZ(0px)',
              }}
            >
              <div className="w-32 h-32 rounded-2xl border-[4px] border-white bg-white overflow-hidden flex items-center justify-center shadow-[0_10px_25px_rgb(0,0,0,0.1)] mb-2">
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 font-bold text-sm tracking-wide">
                    PHOTO
                  </span>
                )}
              </div>

              <div className="text-center">
                <div className="font-bold text-2xl text-[#004475] tracking-tight mt-1.5">
                  {form.firstName} {form.lastName}
                </div>
                {form.designation && (
                  <div className="text-[13px] font-bold text-gray-800 mt-0.5">
                    {form.designation}
                  </div>
                )}
                {form.empId && (
                  <div className="text-[12px] font-semibold text-black mt-1 tracking-wider uppercase">
                    {form.empId}
                  </div>
                )}
              </div>
            </div>

            <div
              className="space-y-2 text-[13px] text-gray-800 font-medium px-2 relative z-10 mt-6 mb-4 transition-transform duration-300 ease-out mx-auto w-fit"
              style={{
                transform:
                  tilt.opacity > 0 ? 'translateZ(20px)' : 'translateZ(0px)',
              }}
            >
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-black font-semibold uppercase text-[11px] tracking-wide">
                  Date Of Birth
                </span>
                <span className="w-4 text-center shrink-0 text-black">:</span>
                <span className="text-black font-bold flex-1 pl-2 break-all">
                  {form.dateOfBirth || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Gender
                </span>
                <span className="w-4 text-center shrink-0 text-black">:</span>
                <span className="text-black font-bold flex-1 pl-2 break-all">
                  {form.gender || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Blood group
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span className="text-white font-bold flex-1 pl-2 break-all">
                  {form.bloodGroup || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Phone
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span className="text-white font-bold flex-1 pl-2 break-all">
                  {form.phoneNumber || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Email
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span
                  className="text-white font-bold flex-1 pl-2 break-all"
                  title={form.email}
                >
                  {form.email || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Emergency
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span className="text-white font-bold flex-1 pl-2 break-all">
                  {form.emergencyContact || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  Aadhaar No
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span className="text-white font-bold flex-1 pl-2 break-all">
                  {form.aadhaarNumber || '-'}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-[100px] shrink-0 text-[#96cceb] font-semibold uppercase text-[11px] tracking-wide">
                  PAN No
                </span>
                <span className="w-4 text-center shrink-0 text-white/50">
                  :
                </span>
                <span className="text-white font-bold flex-1 pl-2 break-all">
                  {form.panNumber || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Other Sections */}
      <div className="w-full lg:w-2/3 space-y-5 overflow-y-auto no-scroll h-full py-5">
        {!hideStatus && (
          <div className="flex justify-between items-center pb-2 border-b">
            <div />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status:
                </label>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="px-3 py-1.5 mr-2 border border-gray-300 rounded-xl text-sm bg-white text-gray-800 font-semibold cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {status === 'Inactive' && (
                <PrimaryButton
                  onClick={() =>
                    router.push(`/dashboard/hr/exit/${initialData.id}`)
                  }
                >
                  Exit Employee
                </PrimaryButton>
              )}
            </div>
          </div>
        )}
        <div>
          <EducationSection
            educations={educations}
            addEducation={() => {}}
            updateEducation={() => {}}
            removeEducation={() => {}}
            errors={{}}
            isView={true}
          />
        </div>

        <div>
          <AddressSection
            form={form}
            setField={() => {}}
            errors={{}}
            isView={true}
          />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
            Employment :
          </h3>
          <EmploymentBankSection
            form={form}
            setField={() => {}}
            inputProps={inputProps}
            errors={{}}
            isView={true}
            mode="employment"
          />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
            Bank Details :
          </h3>
          <EmploymentBankSection
            form={form}
            setField={() => {}}
            inputProps={inputProps}
            errors={{}}
            isView={true}
            mode="bank"
          />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-800 border-t py-5">
            Uploads Sections :
          </h3>
          {customUploadSection ? (
            customUploadSection
          ) : (
            <PhotoSection
              form={form}
              setField={() => {}}
              isView={true}
              empId={form.empId}
            />
          )}
        </div>

        <div>
          {/* <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Bond & Documents :</h3> */}
          <BondDetails
            form={form}
            setField={() => {}}
            errors={{}}
            isView={true}
          />
        </div>
        
        {(initialData.createdAt || initialData.updatedAt || initialData.createdBy || initialData.createBy || initialData.created_by) && (
          <div className="flex flex-col text-xs text-gray-400 font-medium pt-4 mt-6 border-t border-gray-100">
            <span>Created: {initialData.createdAt ? new Date(initialData.createdAt).toLocaleString() : ''} {(initialData.createdBy || initialData.createBy || initialData.created_by) ? `by ${initialData.createdBy || initialData.createBy || initialData.created_by}` : ''}</span>
            {(initialData.updatedAt || initialData.updated_at) && (
              <span>Updated: {new Date(initialData.updatedAt || initialData.updated_at).toLocaleString()} {(initialData.updatedBy || initialData.UpdatedBy || initialData.updated_by) ? `by ${initialData.updatedBy || initialData.UpdatedBy || initialData.updated_by}` : ''}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
