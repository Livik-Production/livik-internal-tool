'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../Toast';
import Loader from '../Loader';

export default function CompanyDetailsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [companyDetails, setCompanyDetails] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    city: '',
    state: '',
    country: '',
    address: '',
    startedDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchName: '',
    gstnNumber: '',
    panNumber: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
    exportCountry: '',
    lutBondNo: '',
    lutValidFrom: '',
    lutValidTo: '',
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch('/api/companyDetails');
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            setCompanyDetails({
              ...data,
              startedDate: data.startedDate
                ? data.startedDate.split('T')[0]
                : new Date().toISOString().split('T')[0],
              bankName: data.bankName || '',
              branchName: data.branchName || '',
              gstnNumber: data.gstnNumber || '',
              companyEmail: data.companyEmail || '',
              companyPhone: data.companyPhone || '',
              city: data.city || '',
              state: data.state || '',
              country: data.country || '',
              address: data.address || '',
              panNumber: data.panNumber || '',
              accountHolderName: data.accountHolderName || '',
              accountNumber: data.accountNumber || '',
              ifscCode: data.ifscCode || '',
              swiftCode: data.swiftCode || '',
              exportCountry: data.exportCountry || '',
              lutBondNo: data.lutBondNo || '',
              lutValidFrom: data.lutValidFrom
                ? data.lutValidFrom.split('T')[0]
                : '',
              lutValidTo: data.lutValidTo ? data.lutValidTo.split('T')[0] : '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchCompanyDetails();
  }, []);

  const handleCompanyDetailsChange = (e) => {
    const { name, value } = e.target;
    setCompanyDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/companyDetails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyDetails),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save company details');
      }
      showSuccessToast('Company details saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast(
        error.message || 'Failed to save settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <Loader label="Loading Company Details..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 text-left">
                Company Details
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-full">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={companyDetails.companyName}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Company Email
              </label>
              <input
                type="email"
                name="companyEmail"
                value={companyDetails.companyEmail}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Company Phone
              </label>
              <input
                type="text"
                name="companyPhone"
                value={companyDetails.companyPhone}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                City
              </label>
              <input
                type="text"
                name="city"
                value={companyDetails.city}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                State
              </label>
              <input
                type="text"
                name="state"
                value={companyDetails.state}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={companyDetails.country}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-3 w-1/2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Address
              </label>
              <textarea
                name="address"
                value={companyDetails.address}
                onChange={handleCompanyDetailsChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Started Date
              </label>
              <input
                type="date"
                name="startedDate"
                value={companyDetails.startedDate}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={companyDetails.bankName}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Branch Name
              </label>
              <input
                type="text"
                name="branchName"
                value={companyDetails.branchName}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                GSTN Number
              </label>
              <input
                type="text"
                name="gstnNumber"
                value={companyDetails.gstnNumber}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={companyDetails.panNumber}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Account Holder Name
              </label>
              <input
                type="text"
                name="accountHolderName"
                value={companyDetails.accountHolderName}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={companyDetails.accountNumber}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                IFSC Code
              </label>
              <input
                type="text"
                name="ifscCode"
                value={companyDetails.ifscCode}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                SWIFT Code
              </label>
              <input
                type="text"
                name="swiftCode"
                value={companyDetails.swiftCode}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* LUT / Export Details */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                Export Country
              </label>
              <input
                type="text"
                name="exportCountry"
                value={companyDetails.exportCountry}
                onChange={handleCompanyDetailsChange}
                placeholder="e.g. Malaysia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                LUT/Bond No.
              </label>
              <input
                type="text"
                name="lutBondNo"
                value={companyDetails.lutBondNo}
                onChange={handleCompanyDetailsChange}
                placeholder="e.g. AD330625001940G"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                LUT Valid From
              </label>
              <input
                type="date"
                name="lutValidFrom"
                value={companyDetails.lutValidFrom}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block text-left">
                LUT Valid To
              </label>
              <input
                type="date"
                name="lutValidTo"
                value={companyDetails.lutValidTo}
                onChange={handleCompanyDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#004475] rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Save Company Details'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
