// components/EmployeeForm/sections/BasicInfo.jsx
import React from 'react';

export default function BasicInfo({
  form,
  inputProps,
  errors,
  setField,
  isView,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
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
