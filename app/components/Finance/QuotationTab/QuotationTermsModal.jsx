import React, { useState, useEffect } from 'react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CustomModalForm from '../../CustomModalForm';
import QuotationPreviewForm from './QuotationPreviewForm';

const DEFAULT_TERMS = `Implementation: Included
User Training: Included
Data Migration: Included for agreed master data

Payment Terms:
30% – Advance
40% – After major module completion
20% – User Acceptance Testing
10% – Go-Live

Support: 3 months free support after Go-Live.
Quotation Validity: 30 days.`;

const QuotationTermsModal = ({
  isOpen,
  onBack,
  onCloseFlow,
  onCreateQuotation,
  selectedClient,
  subject,
  greeting,
  items = [],
  subTotal = 0,
  initialData,
  showHeader = true,
  nextQuotationNumber,
}) => {
  const [gstPercent, setGstPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.gstPercent !== undefined) {
        setGstPercent(Number(initialData.gstPercent));
      }
      if (initialData.discountPercent !== undefined) {
        setDiscountPercent(Number(initialData.discountPercent));
      }
      if (initialData.termsAndConditions !== undefined) {
        setTermsAndConditions(initialData.termsAndConditions || DEFAULT_TERMS);
      }
    }
  }, [initialData]);

  const handleGstChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setGstPercent(value);
    }
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDiscountPercent(value);
    }
  };

  const previewData = {
    quotationNumber:
      initialData?.quotationNumber || nextQuotationNumber || 'New Quotation',
    date: initialData?.quotationDate || new Date().toISOString(),
    client: {
      name: selectedClient?.name,
      city: selectedClient?.city,
      state: selectedClient?.state,
    },
    subject,
    greeting,
    items,
    subTotal,
    gstPercent,
    discountPercent,
    termsAndConditions,
  };

  const handleSaveQuotation = async () => {
    const quotationData = {
      client: selectedClient,
      subject,
      greeting,
      items,
      subTotal,
      gstPercent,
      discountPercent,
      termsAndConditions,
    };

    setIsSaving(true);
    try {
      await onCreateQuotation(quotationData);
      setShowPreview(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="w-full space-y-6">
          <div className="p-6 rounded border border-gray-200 shadow-sm bg-gray-100 m-2">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Taxes & Discounts</h4>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-3">
                  GST Rate (%)
                </label>
                <input
                  type="text"
                  value={gstPercent}
                  onChange={handleGstChange}
                  className="bg-white w-full max-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50/30"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Shown on the quotation as a rate only (e.g. "GST: 18%
                  applicable"). Leave at 0 to show "Extra as applicable".
                </p>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-3">
                  Discount Percentage (%)
                </label>
                <input
                  type="text"
                  value={discountPercent}
                  onChange={handleDiscountChange}
                  className="bg-white w-full max-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50/30"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Discount applied to the subtotal before GST.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 m-2 p-6 rounded border border-gray-100 shadow-sm">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Terms & Conditions
            </h4>
            <textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={12}
              className="bg-white w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm text-gray-700 resize-y"
              placeholder="Implementation, training, payment terms, support, validity..."
            />
            <p className="text-xs text-gray-400 mt-2">
              Shown below the module table on the quotation, exactly as
              written here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {showHeader ? (
        <CustomModalForm
          open={isOpen}
          onClose={onCloseFlow || onBack}
          title="Step 3: GST & Terms"
          widthClass="max-w-4xl"
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg shadow-none"
              >
                <span className="font-bold">Back</span>
              </Button>
              <PrimaryButton
                onClick={() => setShowPreview(true)}
                className="px-8 py-2 !bg-[#004d7a] shadow-none font-bold"
              >
                Preview Quotation
              </PrimaryButton>
            </div>
          }
        >
          {modalContent}
        </CustomModalForm>
      ) : (
        <div className="h-full">{modalContent}</div>
      )}

      {showPreview && (
        <CustomModalForm
          open={showPreview}
          onClose={() => {
            if (onCloseFlow) onCloseFlow();
          }}
          title={
            <span className="text-2xl">
              {`Quotation Preview — ${previewData.quotationNumber}`}
            </span>
          }
          widthClass="max-w-6xl"
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full items-center text-sm font-medium">
              <Button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-none font-bold"
              >
                Back
              </Button>
              <PrimaryButton
                onClick={handleSaveQuotation}
                disabled={isSaving}
                className="px-6 py-2 !bg-[#004d7a] shadow-none rounded-md text-white font-semibold font-bold"
              >
                {isSaving ? 'Saving...' : 'Save Quotation'}
              </PrimaryButton>
            </div>
          }
        >
          <div className="w-full no-scrollbar relative bg-white flex justify-center">
            <div className="bg-white p-0 printable w-full">
              <QuotationPreviewForm quotationData={previewData} />
            </div>
          </div>
        </CustomModalForm>
      )}
    </>
  );
};

export default QuotationTermsModal;
