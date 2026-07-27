'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User,
  FileText,
} from 'lucide-react';
import CloseButton from '../../Buttons/CloseButton';
import { useState } from 'react';
import CustomModalForm from '../../CustomModalForm';

export default function EmployeeApprovalModal({
  isOpen,
  onClose,
  employee,
  onStatusChange,
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  if (!isOpen || !employee) return null;

  const handleStatusChange = (newStatus) => {
    onStatusChange(employee.id, newStatus, adminNotes);
    setAdminNotes('');
    setSelectedStatus('');
    onClose();
  };

  const handleSubmit = () => {
    if (selectedStatus) {
      handleStatusChange(selectedStatus);
    }
  };

  const statusOptions = [
    {
      value: 'active',
      label: 'Active',
      description: 'Approve & activate employee account',
      icon: CheckCircle,
      color: 'green',
      buttonText: 'Approve',
    },
    {
      value: 'rejected',
      label: 'Reject',
      description: 'Decline employee request',
      icon: XCircle,
      color: 'red',
      buttonText: 'Reject',
    },
  ];

  const titleComponent = (
    <div>
      <h3 className="text-xl font-bold text-gray-900">Employee Approval</h3>
      <p className="text-sm text-gray-500 mt-1 font-normal leading-normal">
        Review and confirm employee status
      </p>
    </div>
  );

  const iconComponent = (
    <div className="p-2 bg-blue-50 rounded-lg">
      <User className="w-6 h-6 text-blue-600" />
    </div>
  );

  const footer = (
    <>
      <PrimaryButton
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
      >
        Cancel
      </PrimaryButton>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {selectedStatus ? 'Ready to proceed' : 'Select a status'}
        </span>
        {statusOptions.map(
          (option) =>
            selectedStatus === option.value && (
              <PrimaryButton
                key={option.value}
                onClick={handleSubmit}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow flex items-center gap-2
                ${
                  option.value === 'active'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.buttonText}
              </PrimaryButton>
            )
        )}
      </div>
    </>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      title={titleComponent}
      icon={iconComponent}
      footer={footer}
      widthClass="max-w-lg"
    >
      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
              style={{ backgroundColor: employee.avatarColor }}
            >
              {employee.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {employee.name}
              </h4>
              <p className="text-gray-600 text-sm mb-2">
                {employee.designation}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs font-medium text-yellow-700">
                  Pending Review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Employee ID</span>
            </div>
            <p className="font-semibold text-gray-900">{employee.empId}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Mail className="w-4 h-4" />
              <span className="text-xs font-medium">Email Address</span>
            </div>
            <HyperlinkButton
              href={`mailto:${employee.email}`}
              className="block truncate text-sm"
            >
              {employee.email}
            </HyperlinkButton>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <Phone className="w-4 h-4" />
              <span className="text-xs font-medium">Mobile Number</span>
            </div>
            <a
              href={`tel:${employee.mobile}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm"
            >
              {employee.mobile}
            </a>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">
            Select New Status
          </h5>
          <div className="space-y-3">
            {statusOptions.map((option) => (
              <PrimaryButton
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
                  ${
                    selectedStatus === option.value
                      ? option.value === 'active'
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${option.value === 'active' ? 'bg-green-100' : 'bg-red-100'}`}
                  >
                    <option.icon
                      className={`w-4 h-4 ${option.value === 'active' ? 'text-green-600' : 'text-red-600'}`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
                {selectedStatus === option.value && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${option.value === 'active' ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                )}
              </PrimaryButton>
            ))}
          </div>
        </div>

        {/* Admin Notes */}
        <div className="mb-2">
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Notes</span>
            <span className="text-xs text-gray-400">(Optional)</span>
          </div>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any notes or comments about this approval/rejection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all resize-none text-sm"
            rows="2"
            maxLength={500}
          />
          <div className="text-right mt-1">
            <span
              className={`text-xs ${adminNotes.length > 500 ? 'text-red-500' : 'text-gray-400'}`}
            >
              {adminNotes.length}/500
            </span>
          </div>
        </div>
      </div>
    </CustomModalForm>
  );
}
