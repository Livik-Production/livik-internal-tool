'use client';

import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../Buttons/PrimaryButton';
import Button from '../../Buttons/Button';

export default function OperationsStaffForm({ mode, initialData, onSubmit, onCancel }) {
  const isViewOnly = mode === 'view';

  const [formData, setFormData] = useState({
    empId: '',
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    joiningDate: '',
    employmentType: 'Permanent',
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const raw = initialData.__raw || initialData;
      setFormData({
        empId: raw.empId || '',
        firstName: raw.firstName || '',
        lastName: raw.lastName || '',
        designation: raw.designation || '',
        department: raw.department || '',
        phoneNumber: raw.phoneNumber || '',
        alternatePhoneNumber: raw.alternatePhoneNumber || '',
        email: raw.email || '',
        address: raw.address || '',
        dateOfBirth: raw.dateOfBirth ? new Date(raw.dateOfBirth).toISOString().split('T')[0] : '',
        gender: raw.gender || '',
        joiningDate: raw.joiningDate ? new Date(raw.joiningDate).toISOString().split('T')[0] : '',
        employmentType: raw.employmentType || 'Permanent',
      });
    } else {
      setFormData({
        empId: '',
        firstName: '',
        lastName: '',
        designation: '',
        department: '',
        phoneNumber: '',
        alternatePhoneNumber: '',
        email: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        joiningDate: '',
        employmentType: 'Permanent',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004475] disabled:bg-gray-100 disabled:text-gray-600";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  const designations = [
    'Driver',
    'Sweeper',
    'Tea Boy',
    'Office Assistant',
    'Security Guard',
    'Housekeeping Staff'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
        <h3 className="text-lg font-bold text-[#004475] border-b border-blue-200 pb-2 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Employee ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="empId"
              value={formData.empId}
              onChange={handleChange}
              required
              disabled={isViewOnly || mode === 'edit'}
              className={inputClass}
              placeholder="e.g. OP-001"
            />
          </div>
          <div>
            <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
              placeholder="Full Name"
            />
          </div>
          <div className="hidden">
            {/* Keeping lastName hidden to support DB structure but satisfying "Full Name" visually as firstName */}
            <input
              type="hidden"
              name="lastName"
              value={formData.lastName}
            />
          </div>
          <div>
            <label className={labelClass}>Role/Designation <span className="text-red-500">*</span></label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
            >
              <option value="">Select Designation</option>
              {designations.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Department <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
              placeholder="e.g. Operations"
            />
          </div>
          <div>
            <label className={labelClass}>Mobile Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
              placeholder="Mobile Number"
            />
          </div>
          <div>
            <label className={labelClass}>Alternate Contact Number</label>
            <input
              type="text"
              name="alternatePhoneNumber"
              value={formData.alternatePhoneNumber}
              onChange={handleChange}
              disabled={isViewOnly}
              className={inputClass}
              placeholder="Alternate Number"
            />
          </div>
          <div>
            <label className={labelClass}>Email (Optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isViewOnly}
              className={inputClass}
              placeholder="Email Address"
            />
          </div>
          <div>
            <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gender <span className="text-red-500">*</span></label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Joining Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Employment Type <span className="text-red-500">*</span></label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              className={inputClass}
            >
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Address <span className="text-red-500">*</span></label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={isViewOnly}
              rows={3}
              className={inputClass}
              placeholder="Full Address"
            />
          </div>
        </div>
      </div>

      {!isViewOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300">
            Cancel
          </Button>
          <PrimaryButton type="submit" className="px-6 py-2">
            {mode === 'add' ? 'Create Staff' : 'Save Changes'}
          </PrimaryButton>
        </div>
      )}
    </form>
  );
}
