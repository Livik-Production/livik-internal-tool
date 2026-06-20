// components/EmployeeForm/sections/AddressSection.jsx
import React from 'react';

export default function AddressSection({ form, setField, errors, isView }) {
  if (isView) {
    return (
      <>
        <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">
          Address Details :
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-medium text-gray-900 whitespace-nowrap">
              Present Address :
            </span>
            <div className="text-gray-800 text-[14px] whitespace-pre-wrap leading-relaxed font-medium">
              {form.presentAddress || '-'}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-medium text-gray-900 whitespace-nowrap">
              Permanent Address :
            </span>
            <div className="text-gray-800 text-[14px] whitespace-pre-wrap leading-relaxed font-medium">
              {form.permanentAddress || '-'}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <h2 className="text-lg font-semibold col-span-1 md:col-span-4 border-b border-gray-300 pb-2">
        Address Details
      </h2>
      <div className="md:col-span-2">
        <label className="text-[13px] text-gray-600 font-semibold">
          Present Address
        </label>
        <textarea
          value={form.presentAddress}
          onChange={(e) => setField('presentAddress', e.target.value)}
          className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md"
        />
        {errors.presentAddress && (
          <div className="text-xs text-red-600 mt-1">
            {errors.presentAddress}
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="text-[13px] text-gray-600 font-semibold">
          Permanent Address
        </label>
        <textarea
          value={form.permanentAddress}
          onChange={(e) => setField('permanentAddress', e.target.value)}
          className="mt-1 w-full h-24 px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
}
