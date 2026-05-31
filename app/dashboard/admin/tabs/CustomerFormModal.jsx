'use client';

import React, { useState, useEffect } from 'react';
import Button from '../../../components/Buttons/Button';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import CustomModalForm from '../../../components/CustomModalForm';
import {
  Phone,
  Mail,
  Hash,
  CreditCard,
  SquarePen,
} from 'lucide-react';

const CustomerFormModal = ({
  isOpen,
  onClose,
  type = 'add',
  customer = null,
  onSuccess,
  onEdit,
}) => {
  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    gstnNumber: '',
    mobile: '',
    email: '',
    preferredPaymentMethod: '',
    preferredPaymentTerms: '',
    pincode: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarksCount, setRemarksCount] = useState(0);

  // Initialize form when customer changes or modal opens
  useEffect(() => {
    if (isOpen && customer && type !== 'add') {
      setFormData({
        id: customer.id || '',
        name: customer.name || '',
        address1: customer.address1 || '',
        address2: customer.address2 || '',
        city: customer.city || '',
        state: customer.state || '',
        gstnNumber: customer.gstnNumber || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        preferredPaymentMethod: customer.preferredPaymentMethod || '',
        preferredPaymentTerms: customer.preferredPaymentTerms || customer.paymentTerms || '',
        pincode: customer.pincode || '',
        remarks: customer.remarks || '',
      });
      setRemarksCount((customer.remarks || '').length);
    } else if (isOpen && type === 'add') {
      setFormData({
        id: '',
        name: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        gstnNumber: '',
        mobile: '',
        email: '',
        preferredPaymentMethod: '',
        preferredPaymentTerms: '',
        pincode: '',
        remarks: '',
      });
      setRemarksCount(0);
    }
    setErrors({});
  }, [isOpen, customer, type]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    const pincodeRegex = /^\d{6}$/;

    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    
    if (!formData.mobile?.trim()) {
      newErrors.mobile = 'Mobile is required';
    } else if (!mobileRegex.test(formData.mobile.trim())) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.address1?.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    
    if (!formData.pincode?.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!pincodeRegex.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (formData.gstnNumber?.trim() && !gstnRegex.test(formData.gstnNumber.trim())) {
      newErrors.gstnNumber = 'Invalid GSTN format (e.g. 22AAAAA0000A1Z5)';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'remarks') setRemarksCount(value.length);
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        type === 'add' ? '/api/customers' : `/api/customers/${formData.id}`;
      const method = type === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save customer');
      }

      const savedCustomer = await res.json();
      onSuccess(savedCustomer);
      handleClose();
    } catch (err) {
      console.error('Submit customer failed:', err);
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button onClick={handleClose} disabled={isSubmitting}>
        {type === 'view' ? 'Close' : 'Cancel'}
      </Button>

      <div className="flex items-center gap-3">
        {type === 'view' && onEdit && (
          <PrimaryButton onClick={onEdit} className="gap-2">
            <SquarePen size={18} />
            Edit Profile
          </PrimaryButton>
        )}

        {type !== 'view' && (
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[140px] flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {type === 'add' ? 'Saving...' : 'Updating...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {type === 'add' ? 'Add Customer' : 'Update Changes'}
              </>
            )}
          </PrimaryButton>
        )}
      </div>
    </div>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onClose={handleClose}
      title={type === 'add' ? 'Add New Customer' : type === 'edit' ? 'Edit Customer' : 'Customer Details'}
      footer={renderFooter}
      widthClass="max-w-2xl"
    >
      <div className="px-6 py-4">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

          {/* Customer ID Row Removed */}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Personal Information</h3>

            {/* Row 1: Name + Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder=""
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.name ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone size={13} /> Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.mobile ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
              </div>
            </div>

            {/* Row 2: Email + GSTN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail size={13} /> Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.email ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <Hash size={13} /> GSTN Number (Optional)
                </label>
                <input
                  type="text"
                  name="gstnNumber"
                  value={formData.gstnNumber || ''}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm uppercase font-mono outline-none transition-all ${
                    errors.gstnNumber ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.gstnNumber && <p className="text-xs text-red-500">{errors.gstnNumber}</p>}
              </div>
            </div>

            {/* Row 3: Payment Method + Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <CreditCard size={13} /> Preferred Payment Method
                </label>
                <select
                  name="preferredPaymentMethod"
                  value={formData.preferredPaymentMethod}
                  onChange={handleInputChange}
                  disabled={type === 'view'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-400 ${
                    type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  <option value="">Select Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  <CreditCard size={13} /> Preferred Payment Terms
                </label>
                <select
                  name="preferredPaymentTerms"
                  value={formData.preferredPaymentTerms}
                  onChange={handleInputChange}
                  disabled={type === 'view'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-400 ${
                    type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  <option value="">Select Terms</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Address Information</h3>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleInputChange}
                readOnly={type === 'view'}
                className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                  errors.address1 ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
              />
              {errors.address1 && <p className="text-xs text-red-500">{errors.address1}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Address Line 2</label>
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleInputChange}
                readOnly={type === 'view'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-400 ${
                  type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  list="city-options"
                  value={formData.city}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.city ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                <datalist id="city-options">
                  <option value="Mumbai" />
                  <option value="Delhi" />
                  <option value="Bangalore" />
                  <option value="Hyderabad" />
                  <option value="Ahmedabad" />
                  <option value="Chennai" />
                  <option value="Kolkata" />
                  <option value="Surat" />
                  <option value="Pune" />
                  <option value="Jaipur" />
                </datalist>
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.state ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  readOnly={type === 'view'}
                  className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${
                    errors.pincode ? 'border-red-300' : 'border-gray-300 focus:border-blue-400'
                  } ${type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
                {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Additional Remarks */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Additional Remarks</h3>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Remarks (Optional)</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="4"
                readOnly={type === 'view'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-400 resize-y ${
                  type === 'view' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500 font-medium">{errors.submit}</p>
          )}
        </form>
      </div>
    </CustomModalForm>
  );
};

export default CustomerFormModal;
