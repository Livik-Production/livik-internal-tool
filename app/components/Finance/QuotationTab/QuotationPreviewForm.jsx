'use client';

import React, { useState, useEffect } from 'react';

import Loader from '../../Loader';
import { renderFormattedTerms } from './formatTerms';
import RichTextEditor from './RichTextEditor';
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
    discountAmount,
    termsAndConditions,
  } = quotationData || {};

  const total =
    items.length > 0
      ? items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
      : Number(subTotal || 0);

  const finalDiscountAmount = Number(discountAmount || 0);
  const totalAfterDiscount = total - finalDiscountAmount;
  const gstAmount = totalAfterDiscount * (Number(gstPercent || 0) / 100);
  const grandTotal = totalAfterDiscount + gstAmount;

  // Terms & Conditions is now authored as rich HTML (bold/italic/underline/
  // bullets) via RichTextEditor. Splitting raw HTML by string position would
  // risk cutting a tag in half, so it's rendered as a single block instead
  // of the old left/right "Payment Terms" column split. Quotations saved
  // before this change still store plain text, so that's detected here and
  // rendered through the legacy line-based formatter for compatibility.
  const isHtmlTerms = /<[a-z][\s\S]*>/i.test(termsAndConditions || '');

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
    <div className="w-full">
      {/* Plain block, not flex: Chromium's print/PDF engine doesn't reliably
          honor page-break-inside: avoid on an element that is itself a flex
          item, which was forcing the Terms section onto its own page even
          though there was plenty of room left on page 1. */}
      <div className="p-3 print:bg-white print:px-3 print:py-4 w-full no-scroll">
        {/* HEADER OUTSIDE BORDER */}
        <div className="w-full flex justify-end items-center mb-2 px-2 mt-6">
          {/* Right Logo */}
          <div className="shrink-0 text-right pr-2">
            <img
              src="/asset/livik-logo.png"
              alt="Company Logo"
              className="h-[60px] object-contain"
            />
          </div>
        </div>

        <div className="w-full text-center mb-4">
          <h2 className="text-xl font-bold font-serif tracking-wide text-[#111827]">Proforma Invoice</h2>
        </div>

        <div
          className="w-full border border-[#1f2937] bg-white text-sm"
          style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
        >
          {/* Invoice-like Header */}
          <div className="flex border-t border-b border-[#1f2937]">
            {/* Left Column (Company Details) */}
            <div className="w-1/2 shrink-0 border-r border-[#1f2937] p-2 px-2.5 flex flex-col justify-between relative bg-white min-h-[140px]">
              <div>
                <h2 className="text-[16px] font-bold text-[#111827] uppercase leading-tight mt-1 mb-1">
                  {companyDetails?.companyName || 'LIVIK SOFTWARE SOLUTIONS'}
                </h2>

                <div className="space-y-0.5">
                  <p className="text-[12px] text-[#374151] whitespace-pre-wrap leading-tight">
                    {companyDetails?.address || 'R.M colony\nDindigul - Tamilnadu'}
                  </p>

                  <p className="text-[12px] text-[#374151] leading-tight">
                    GSTIN/UIN :{' '}
                    {companyDetails?.gstnNumber || '33AAQCM8677E1ZY'}
                  </p>

                  <p className="text-[12px] text-[#374151] leading-tight">
                    State Name : {companyDetails?.state || 'Tamil Nadu'}, Code
                    : {companyDetails?.gstnNumber?.substring(0, 2) || '33'}
                  </p>

                  <p className="text-[12px] text-[#374151] leading-tight">
                    CIN: {companyDetails?.cinNumber || 'U62020TZ2023PTC028410'}
                  </p>

                  <p className="text-[12px] text-[#374151] leading-tight">
                    E-Mail :{' '}
                    {companyDetails?.companyEmail || 'invoices@livik.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-1/2 shrink-0 bg-white flex flex-col">
              {/* Row 1 */}
              <div className="flex border-b border-[#1f2937]">
                <div className="w-[60%] shrink-0 p-1 border-r border-[#1f2937] min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Quotation No. :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {quotationNumber || 'PI-1001-2026'}
                    </span>
                  </p>
                </div>
                <div className="w-[40%] shrink-0 p-1 min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Dated :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {date
                        ? new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Bottom Box: Buyer Info */}
              <div className="p-2 px-2.5 flex-1 space-y-0.5">
                <p className="text-[12px] text-[#1f2937] mb-0.5 leading-tight">
                  Buyer (Bill to)
                </p>

                <h2 className="text-[14px] font-bold text-[#111827] leading-tight">
                  {client?.name || 'SURYA PLASTICS'}
                </h2>

                <div className="text-[11.5px] text-[#374151] whitespace-pre-wrap leading-tight mb-1">
                  {[client?.address, client?.city, client?.state, client?.pincode]
                    .filter(Boolean)
                    .join(', ') || '80, State highway, Nambiampalayam, Dindigul, Tamil Nadu - 641670'}
                </div>

                <div className="mt-2 space-y-0.5 pt-1">
                  <p className="text-[11px] text-[#374151] leading-tight">
                    GSTIN/UIN : {client?.gstin || client?.gstnNumber || '33AXNPR8237L1ZR'}
                  </p>
                  <p className="text-[11px] text-[#374151] leading-tight">
                    State Name : {client?.state || 'Tamil Nadu'}
                  </p>
                </div>
              </div>
            </div>
          </div>



          {/* MODULE TABLE */}
          <div className="w-full border-t border-b border-[#1f2937]">
            {/* Table Header */}
            <div className="flex border-b border-[#1f2937] h-8">
              <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center whitespace-nowrap">
                <div style={{ textAlign: 'center', width: '100%' }}>S No.</div>
              </div>
              <div className="flex-1 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>
                  Description of Services
                </div>
              </div>
              <div className="w-36 shrink-0 p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>Amount</div>
              </div>
            </div>

            {/* Table Body - fills to the height of 5 rows when there are
                fewer, but grows (and spills onto a following page) instead
                of clipping once there are more than 5 items. */}
            <div className="flex flex-col min-h-[155px]">
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

                  <div className="w-36 shrink-0 p-1 pt-2 text-center text-[12px] font-bold text-[#111827] pr-4">
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
                <div className="w-36 shrink-0"></div>
              </div>
            </div>

            {/* Table Footer - Total Row */}
            <div className="flex border-t border-[#1f2937] min-h-[28px]">
              <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[12px] text-[#111827] flex flex-col justify-center">
                Total
              </div>
              <div className="w-36 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                <span>₹</span>
                <span className="pr-2">
                  {Number(total || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Table Footer - Discount */}
            {Number(discountAmount || 0) > 0 && (
              <div className="flex border-t border-[#1f2937] min-h-[28px]">
                <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[12px] text-[#111827] flex flex-col justify-center">
                  Discount
                </div>
                <div className="w-36 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                  <span>- ₹</span>
                  <span className="pr-2">
                    {Number(finalDiscountAmount || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Table Footer - GST */}
            {Number(gstPercent || 0) > 0 && (
              <div className="flex border-t border-[#1f2937] min-h-[28px]">
                <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[12px] text-[#111827] flex flex-col justify-center">
                  GST ({gstPercent}%)
                </div>
                <div className="w-36 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                  <span>+ ₹</span>
                  <span className="pr-2">
                    {Number(gstAmount || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Table Footer - Grand Total */}
            {(Number(discountAmount || 0) > 0 || Number(gstPercent || 0) > 0) && (
              <div className="flex border-t border-[#1f2937] min-h-[28px]">
                <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[13px] text-[#111827] flex flex-col justify-center">
                  Grand Total
                </div>
                <div className="w-36 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                  <span>₹</span>
                  <span className="pr-2">
                    {Number(grandTotal || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AMOUNT IN WORDS */}
          <div className="w-full p-1 pb-2">
            <div className="flex justify-between items-center text-[11px] text-[#374151] px-2 pt-1">
              <span>Amount Chargeable (in words)</span>
              <span className="italic font-bold">E. & O.E</span>
            </div>
            <div className="font-bold text-[13px] text-[#111827] mt-1 px-2">
              INR {numberToWords(Math.floor(grandTotal || 0))} Only
            </div>
          </div>
        </div>

        {/* GST & TERMS SECTION
            Wrapped in a plain block div carrying page-break-inside: avoid —
            Chromium's print engine doesn't reliably honor that rule when it's
            set directly on a flex container, which was pushing this whole
            section onto its own page with a large blank gap left on page 1. */}
        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="w-full border-x border-b border-t border-[#1f2937] p-3 flex flex-col min-h-[160px]">
          <div className="font-bold text-[14px] text-[#111827] mb-2">
            Terms and Conditions
          </div>

          <div className="flex-1">
            <div className="font-semibold text-[12px] text-[#111827] mb-1">
              GST:{' '}
              {Number(gstPercent || 0) > 0
                ? `${Number(gstPercent)}% applicable`
                : 'Extra as applicable'}
            </div>
            {termsAndConditions && (
              isHtmlTerms ? (
                <div
                  className="quotation-terms-html mt-2 text-sm text-[#374151] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: termsAndConditions }}
                />
              ) : (
                <div className="mt-2 text-sm text-[#374151] leading-relaxed space-y-0.5">
                  {renderFormattedTerms(termsAndConditions)}
                </div>
              )
            )}
          </div>

          {/* Global on purpose: this content comes from dangerouslySetInnerHTML,
              so it never picks up styled-jsx's scoping class. */}
          <style jsx global>{`
            .quotation-terms-html ul {
              list-style: disc;
              padding-left: 1.25rem;
              margin: 4px 0;
            }
            .quotation-terms-html ol {
              list-style: decimal;
              padding-left: 1.25rem;
              margin: 4px 0;
            }
            .quotation-terms-html li {
              margin-bottom: 2px;
            }
          `}</style>

          {/* Bottom aligned: Bank Details (Left) + Signatory (Right) */}
          <div className="flex mt-8 border-t border-[#1f2937] -mx-3 mb-[-12px]">
            {/* Bank Details */}
            <div className="w-[55%] flex flex-col items-start text-left pl-4 py-3 border-r border-[#1f2937]">
              <div className="text-[12px] text-[#111827] underline mb-1">
                Company's Bank Details
              </div>
              <div className="text-[11px] text-[#111827] space-y-0.5 pr-2">
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">A/c Holder's Name</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.accountHolderName || 'Livik'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">Bank Name</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.bankName || 'Canara Bank'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">A/c No.</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.accountNumber || '22233345211'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">Branch</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.branchName || 'RM Colony, Dindigul'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">IFSC Code</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.ifscCode || 'HDFC000053'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">SWIFT Code</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.swiftCode || 'HDFCDED'}
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 shrink-0 whitespace-nowrap">PAN Number</span>
                  <span className="flex-1">
                    :{' '}
                    <span className="font-semibold break-words">
                      {companyDetails?.panNumber || 'AAQCM8677E'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Signatory */}
            <div className="w-[45%] flex flex-col items-end text-right justify-end pr-4 py-3">
              <div className="text-[13px] font-bold text-[#111827]">
                for{' '}
                {companyDetails?.companyName ||
                  'LIVIKTECH SOLUTIONS PRIVATE LIMITED'}
              </div>
              <div className="text-[12px] text-[#374151] mt-9">
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
