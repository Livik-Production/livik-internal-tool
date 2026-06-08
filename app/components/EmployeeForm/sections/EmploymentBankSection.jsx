// components/EmployeeForm/sections/EmploymentBankSection.jsx
import React from 'react';

export default function EmploymentBankSection({
  form,
  setField,
  errors,
  isView,
  mode = 'both', // 'both', 'employment', 'bank'
}) {
  const showEmployment = mode === 'both' || mode === 'employment';
  const showBank = mode === 'both' || mode === 'bank';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {showEmployment && (
        <>
          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Designation <span className='text-red-500'>*</span>
            </label>
            <input
              value={form.designation}
              onChange={(e) => setField('designation', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.designation && (
              <div className="text-xs text-red-600 mt-1">
                {errors.designation}
              </div>
            )}
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Department <span className='text-red-500'>*</span>
            </label>
            <input
              value={form.department}
              onChange={(e) => setField('department', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.department && (
              <div className="text-xs text-red-600 mt-1">
                {errors.department}
              </div>
            )}
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Date of Joining <span className='text-red-500'>*</span>
            </label>
            <input
              type="date"
              value={form.dateOfJoining}
              onChange={(e) => setField('dateOfJoining', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 text-sm text-gray-400 border border-gray-300 rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.dateOfJoining && (
              <div className="text-xs text-red-600 mt-1">
                {errors.dateOfJoining}
              </div>
            )}
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Work Location
            </label>
            <input
              value={form.workLocation}
              onChange={(e) => setField('workLocation', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 border border-gray-300 text-sm rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
        </>
      )}

      {showBank && (
        <>
          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Bank Name
            </label>
            <input
              value={form.bankName}
              onChange={(e) => setField('bankName', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 border border-gray-300 text-sm rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              Account Number
            </label>
            <input
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 border border-gray-300 text-sm rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.accountNumber && (
              <div className="text-xs text-red-600 mt-1">
                {errors.accountNumber}
              </div>
            )}
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-semibold">
              IFSC Code
            </label>
            <input
              value={form.ifscCode}
              onChange={(e) => setField('ifscCode', e.target.value)}
              readOnly={isView}
              disabled={isView}
              className={`mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md ${isView ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.ifscCode && (
              <div className="text-xs text-red-600 mt-1">{errors.ifscCode}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
