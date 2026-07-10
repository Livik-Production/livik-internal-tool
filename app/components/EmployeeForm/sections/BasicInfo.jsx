// components/EmployeeForm/sections/BasicInfo.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function BasicInfo({
  form,
  inputProps,
  errors,
  setField,
  isView,
  isEdit = false,
  isSuperAdmin = false,
}) {
  // Only super admin in edit mode can toggle the inline-edit for Employee ID
  const canEditEmpId = isEdit && isSuperAdmin && !isView;

  const [empIdEditing, setEmpIdEditing] = useState(false);
  const inputRef = useRef(null);

  // Focus the input as soon as editing mode turns on
  useEffect(() => {
    if (empIdEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [empIdEditing]);

  const handleEditClick = () => {
    if (canEditEmpId) setEmpIdEditing(true);
  };

  const handleConfirm = () => {
    setEmpIdEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') setEmpIdEditing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {/* Employee ID — shown above Personal Information heading (hidden on create) */}
      {(isEdit || isView) && (
        <div className="col-span-full mb-1">
          <label className="text-[13px] text-gray-500 font-semibold block mb-1">
            Employee ID
          </label>
          <div className="flex items-center gap-2 max-w-xs">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                name="empId"
                value={form.empId ?? ''}
                onChange={(e) => setField('empId', e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleConfirm}
                type="text"
                readOnly={!empIdEditing}
                placeholder={form.empId ? '' : '—'}
                className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all duration-200 ${
                  empIdEditing
                    ? 'border-blue-500 bg-white text-gray-900 shadow-sm ring-2 ring-blue-100'
                    : 'border-gray-200 bg-gray-50 text-gray-700 cursor-default select-text'
                }`}
              />
            </div>

            {/* Edit pencil button — super admin only */}
            {canEditEmpId && !empIdEditing && (
              <button
                type="button"
                onClick={handleEditClick}
                title="Edit Employee ID"
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 shadow-sm"
              >
                {/* Pencil SVG icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}

            {/* Confirm (check) button — appears while editing */}
            {canEditEmpId && empIdEditing && (
              <button
                type="button"
                onMouseDown={(e) => {
                  // Prevent blur from firing before click
                  e.preventDefault();
                  handleConfirm();
                }}
                title="Confirm"
                className="flex items-center justify-center w-8 h-8 rounded-md border border-green-400 bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-150 shadow-sm"
              >
                {/* Check SVG icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold col-span-full border-b border-gray-300 pb-2">
        Personal Information
      </h2>
      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          First Name <span className='text-red-500'>*</span>
        </label>
        <input {...inputProps('firstName')} />
        {errors.firstName && (
          <div className="text-xs text-red-600 mt-1">{errors.firstName}</div>
        )}
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Last Name <span className='text-red-500'>*</span>
        </label>
        <input {...inputProps('lastName')} />
        {errors.lastName && (
          <div className="text-xs text-red-600 mt-1">{errors.lastName}</div>
        )}
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Date of Birth
        </label>

        <input
          {...inputProps('dateOfBirth', 'date')}
          className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm
      ${form.dateOfBirth ? 'text-gray-900' : 'text-gray-400'}
    `}
        />

        {errors.dateOfBirth && (
          <div className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</div>
        )}
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Gender
        </label>
        <select
          value={form.gender}
          onChange={(e) => setField('gender', e.target.value)}
          disabled={isView}
          className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm
          ${form.gender ? 'text-gray-900' : 'text-gray-600'}
  `}
        >
          <option value="" disabled hidden>
            Select
          </option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Aadhaar Number
        </label>
        <input {...inputProps('aadhaarNumber')} />
        {errors.aadhaarNumber && (
          <div className="text-xs text-red-600 mt-1">
            {errors.aadhaarNumber}
          </div>
        )}
      </div>

      <div>
        <label className="text-[12.5px] text-gray-500 font-semibold">
          PAN Number
        </label>
        <input {...inputProps('panNumber')} />
        {errors.panNumber && (
          <div className="text-xs text-red-600 mt-1">{errors.panNumber}</div>
        )}
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">Email <span className='text-red-500'>*</span></label>
        <input {...inputProps('email', 'email')} />
        {errors.email && (
          <div className="text-xs text-red-600 mt-1">{errors.email}</div>
        )}
      </div>

      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Phone Number <span className='text-red-500'>*</span>
        </label>
        <input {...inputProps('phoneNumber')} />
        {errors.phoneNumber && (
          <div className="text-xs text-red-600 mt-1">{errors.phoneNumber}</div>
        )}
      </div>
      {/* Emergency Contact */}
      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Emergency Contact
        </label>
        <input {...inputProps('emergencyContact')} />
      </div>

      {/* Blood Group */}
      <div>
        <label className="text-[13px] text-gray-500 font-semibold">
          Blood Group
        </label>
        <select
          value={form.bloodGroup}
          onChange={(e) => setField('bloodGroup', e.target.value)}
          disabled={isView}
          className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm
            ${form.bloodGroup ? 'text-gray-900' : 'text-gray-600'}
          `}
        >
          <option value="" disabled hidden>
            Select
          </option>
          <option>A+</option>
          <option>A-</option>
          <option>B+</option>
          <option>B-</option>
          <option>AB+</option>
          <option>AB-</option>
          <option>O+</option>
          <option>O-</option>
          <option>A1+</option>
        </select>
      </div>
    </div>
  );
}
