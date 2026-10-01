'use client';

import React, { useState, useEffect } from 'react';

import Loader from '../../Loader';

const QuotationPreviewForm = ({
  quotationData = {},
  initialCompanyDetails = null,
}) => {
  const [companyDetails, setCompanyDetails] = useState(initialCompanyDetails);
  const [isLoading, setIsLoading] = useState(!initialCompanyDetails);

  useEffect(() => {
    if (initialCompanyDetails) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch('/api/companyDetails');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setCompanyDetails(data);
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCompanyDetails();

    return () => {
      isMounted = false;
    };
  }, [initialCompanyDetails]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader label="Loading preview..." />
      </div>
    );
  }

  const {
    client,
    quotationNumber,
    date,
    subject,
    greeting,
    items = [],
    subTotal,
    gstPercent,
    termsAndConditions,
  } = quotationData || {};

  const total =
    items.length > 0
      ? items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
      : Number(subTotal || 0);

  // Helper: number to words (mirrors Invoice's PreviewForm)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'Zero';

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
      'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    const n = Math.floor(num);
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' ' + numberToWords(n % 100) : '')
      );
    if (n < 100000)
      return (
        numberToWords(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + numberToWords(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        numberToWords(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + numberToWords(n % 100000) : '')
      );
    return (
      numberToWords(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + numberToWords(n % 10000000) : '')
    );
  };

  return (
    <div>
      <div className="flex justify-center p-3 print:bg-white print:p-0 w-full no-scroll">
        <div
          className="w-full border border-[#1f2937] bg-white text-sm"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          <div className="flex">
            {/* Left Column */}
            <div className="w-1/2 shrink-0 border-r border-[#1f2937] bg-white flex flex-col">
              <div className="p-1.5">
                <div className="flex flex-col items-start gap-2 mb-1">
                  <div className="shrink-0 mt-0">
                    <img
                      src="/asset/livik-logo.png"
                      alt="Livik Logo"
                      className="h-11 object-contain print:h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-[15px] font-bold text-[#111827] leading-tight uppercase mt-0.5">
                      {companyDetails?.companyName ||
                        'LIVIK SOFTWARE SOLUTIONS PVT. LTD.'}
                    </h1>

                    <p className="text-[12px] text-[#374151] leading-tight mt-0.5">
                      {companyDetails?.address || '9th cross, RM colony,'}
                    </p>

                    <p className="text-[12px] text-[#374151] leading-tight">
                      {companyDetails?.city
                        ? `${companyDetails.city}${companyDetails.state ? ` - ${companyDetails.state}` : ''}`
                        : 'Dindigul - TamilNadu'}
                    </p>

                    <p className="text-[12px] text-[#374151] leading-tight mt-0.5">
                      GSTIN/UIN :{' '}
                      {companyDetails?.gstnNumber || '33AAQCM8677E1ZY'}
                    </p>

                    <p className="text-[12px] text-[#374151] leading-tight">
                      E-Mail :{' '}
                      {companyDetails?.companyEmail || 'invoices@livik.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-1/2 shrink-0 bg-white flex flex-col">
              {/* Row 1: Quotation No. / Date */}
              <div className="flex border-b border-[#1f2937]">
                <div className="w-[60%] shrink-0 p-1 border-r border-[#1f2937] min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Quotation No. :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {quotationNumber || 'QTN-2026-001'}
                    </span>
                  </p>
                </div>
                <div className="w-[40%] shrink-0 p-1 min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Date :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {date
                        ? new Date(date)
                            .toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                            })
                            .replace(/ /g, '-')
                        : new Date()
                            .toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit',
                            })
                            .replace(/ /g, '-')}
                    </span>
                  </p>
                </div>
              </div>

              {/* To / Buyer Info */}
              <div className="p-2 px-2.5 flex-1 space-y-0.5">
                <p className="text-[12px] text-[#1f2937] mb-0.5 leading-tight">
                  To
                </p>

                <h2 className="text-[14px] font-bold text-[#111827] leading-tight">
                  {client?.name || 'Client Name'}
                </h2>

                {(client?.city || client?.state) && (
                  <p className="w-[65%] text-[12px] text-[#374151] leading-tight mt-1 break-words">
                    {[client?.city, client?.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SUBJECT + GREETING / MESSAGE */}
          {(subject || greeting) && (
            <div className="w-full border-t border-[#1f2937] p-3 px-4">
              {subject && (
                <p className="text-[12px] text-[#111827] leading-tight mb-2">
                  <span className="font-bold">Subject:</span> {subject}
                </p>
              )}
              {greeting && (
                <p className="text-[12.5px] text-[#111827] leading-relaxed whitespace-pre-wrap">
                  {greeting}
                </p>
              )}
            </div>
          )}

          {/* MODULE TABLE */}
          <div className="w-full border-t border-b border-[#1f2937]">
            {/* Table Header */}
            <div className="flex border-b border-[#1f2937] h-8">
              <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center whitespace-nowrap">
                <div style={{ textAlign: 'center', width: '100%' }}>Sl No.</div>
              </div>
              <div className="flex-1 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>
                  Module
                </div>
              </div>
              <div className="w-28 shrink-0 p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>Amount</div>
              </div>
            </div>

            {/* Table Body - fixed to the height of 5 rows, regardless of record count */}
            <div className="flex flex-col h-[155px] overflow-hidden">
              {(items.length > 0
                ? items
                : [{ serialNumber: 1, moduleName: 'Module', amount: 0 }]
              ).map((item, index) => (
                <div key={item.id || index} className="flex">
                  <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 pt-2 text-center text-xs">
                    {item.serialNumber ?? index + 1}
                  </div>

                  <div className="flex-1 border-r border-[#1f2937] p-1 pt-2 px-2">
                    <div className="font-bold text-[13px] text-[#111827] leading-tight">
                      {item.moduleName || item.name || 'Module'}
                    </div>
                  </div>

                  <div className="w-28 shrink-0 p-1 pt-2 text-center text-[12px] font-bold text-[#111827] pr-4">
                    {Number(item.amount || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}

              {/* Filler space to maintain column borders down to the Total row */}
              <div className="flex flex-1 min-h-[10px]">
                <div className="w-12 shrink-0 border-r border-[#1f2937]"></div>
                <div className="flex-1 border-r border-[#1f2937]"></div>
                <div className="w-28 shrink-0"></div>
              </div>
            </div>

            {/* Table Footer - Total Row */}
            <div className="flex border-t border-[#1f2937] min-h-[28px]">
              <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[12px] text-[#111827] flex flex-col justify-center">
                Total
              </div>
              <div className="w-28 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                <span>₹</span>
                <span className="pr-2">
                  {Number(total || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* AMOUNT IN WORDS */}
          <div className="w-full border-b border-[#1f2937] p-1 pb-2">
            <div className="flex justify-between items-center text-[11px] text-[#374151] px-2 pt-1">
              <span>Amount Chargeable (in words)</span>
              <span className="italic font-bold">E. & O.E</span>
            </div>
            <div className="font-bold text-[13px] text-[#111827] mt-1 px-2">
              INR {numberToWords(Math.floor(total || 0))} Only
            </div>
          </div>

          {/* GST & TERMS SECTION + BANK DETAILS */}
          <div className="w-full flex border border-[#d1d5db]">
            {/* Left - Terms and Conditions */}
            <div className="w-1/2 shrink-0 p-3">
              <div className="font-bold text-[12px] text-[#111827] mb-2">
                Terms and Conditions
              </div>
              <div className="font-semibold text-[12px] text-[#111827] mb-1">
                GST:{' '}
                {Number(gstPercent || 0) > 0
                  ? `${Number(gstPercent)}% applicable`
                  : 'Extra as applicable'}
              </div>
              {termsAndConditions && (
                <div className="mt-2 text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">
                  {termsAndConditions}
                </div>
              )}
            </div>

            {/* Right - Company's Bank Details (above) + Signatory (below, last) */}
            <div className="w-1/2 shrink-0 border-l border-[#d1d5db] flex flex-col">
              {/* Company's Bank Details */}
              <div className="p-3 text-[9px] text-[#111827]">
                <div className="mb-1 underline font-bold">
                  Company's Bank Details
                </div>

                <div className="flex">
                  <span className="w-24 shrink-0 whitespace-nowrap">A/c Holder's Name</span>
                  <span className="font-bold whitespace-nowrap">
                    :{' '}
                    {companyDetails?.accountHolderName ||
                      'LIVIKTECH SOLUTIONS PRIVATE LIMITED'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-24 shrink-0 whitespace-nowrap">Bank Name</span>
                  <span className="font-bold whitespace-nowrap">
                    : {companyDetails?.bankName || 'HDFC Bank Ltd'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-24 shrink-0 whitespace-nowrap">A/c No.</span>
                  <span className="font-bold whitespace-nowrap">
                    : {companyDetails?.accountNumber || '1234567899632'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-24 shrink-0 whitespace-nowrap">IFSC Code </span>
                  <span className="font-bold whitespace-nowrap">
                    :{' '}
                    {companyDetails?.ifscCode
                      ? `${companyDetails.ifscCode}`
                      : 'HDFC000053'}
                  </span>
                </div>
              </div>

              {/* Signatory - pinned to the bottom of this column */}
              <div className="mt-auto border-t border-[#d1d5db] p-3 flex flex-col items-end text-right">
                <div className="text-[10px] font-bold text-[#111827]">
                  for{' '}
                  {companyDetails?.companyName ||
                    'LIVIKTECH SOLUTIONS PRIVATE LIMITED'}
                </div>
                <div className="text-[9px] text-[#374151] mt-9">
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#1f2937] py-2">
        This is a Computer Generated Quotation
      </div>
    </div>
  );
};

export default QuotationPreviewForm;
