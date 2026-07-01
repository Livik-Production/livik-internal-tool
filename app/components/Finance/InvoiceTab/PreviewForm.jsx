'use client';

import React, { useState, useEffect } from 'react';

const PreviewForm = ({
  invoiceData = {},
  initialCompanyDetails = null,
  letterPad = 'with', // "with" | "without"
}) => {
  const [companyDetails, setCompanyDetails] = useState(initialCompanyDetails);

  useEffect(() => {
    if (initialCompanyDetails) return;

    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch('/api/companyDetails');

        if (response.ok) {
          const data = await response.json();

          setCompanyDetails(data);
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    };

    fetchCompanyDetails();
  }, []);

  const {
    client,

    products,

    totalAmount,

    discountType,

    discountValue,

    discountAmount,

    subtotalAfterDiscount,

    cgstRate,

    sgstRate,

    cgstAmount,

    sgstAmount,

    totalAmountWithGST,

    date,

    invoiceNumber,

    invoiceType,

    notes,
  } = invoiceData || {};

  const clientGst = client?.gstnNumber || client?.gstin || client?.gst || '';
  const clientCin = client?.cinNumber || client?.cin || '';

  const isWithPad = letterPad === 'with';

  const primaryCurrency = products?.[0]?.currency || 'INR';

  // Helper function for number to words

  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'Zero';

    const a = [
      '',

      'One',

      'Two',

      'Three',

      'Four',

      'Five',

      'Six',

      'Seven',

      'Eight',

      'Nine',

      'Ten',

      'Eleven',

      'Twelve',

      'Thirteen',

      'Fourteen',

      'Fifteen',

      'Sixteen',

      'Seventeen',

      'Eighteen',

      'Nineteen',
    ];

    const b = [
      '',

      '',

      'Twenty',

      'Thirty',

      'Forty',

      'Fifty',

      'Sixty',

      'Seventy',

      'Eighty',

      'Ninety',
    ];

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

  // Format currency

  const formatCurrency = (amount, currencyCode = 'INR') => {
    if (!amount && amount !== 0) {
      const sym =
        currencyCode === 'INR'
          ? '₹'
          : currencyCode === '₹'
            ? '$'
            : currencyCode;

      return `${sym}0`;
    }

    const num = parseFloat(amount) || 0;

    const locales = {
      INR: 'en-IN',

      USD: 'en-US',

      EUR: 'de-DE',

      GBP: 'en-GB',

      AED: 'ar-AE',

      SGD: 'en-SG',

      AUD: 'en-AU',

      CAD: 'en-CA',

      JPY: 'ja-JP',
    };

    return new Intl.NumberFormat(locales[currencyCode] || 'en-US', {
      style: 'currency',

      currency: currencyCode,

      minimumFractionDigits: 0,

      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div>
      {/* Invoice Title

      <div className="text-center font-bold text-[14px] mt-3 tracking-wider uppercase">

        {invoiceType === 'Proforma' ? 'PROFORMA INVOICE' : (invoiceType || 'TAX INVOICE')}

      </div> */}

      <div className="flex justify-center p-3 print:bg-white print:p-0 w-full no-scroll">
        <div className="w-full border border-[#1f2937] bg-white text-sm">
          <div className="flex">
            {/* Left Column */}

            <div className="w-1/2 shrink-0 border-r border-[#1f2937] bg-white flex flex-col">
              {/* Top Box: Company Info */}

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
                      State Name : {companyDetails?.state || 'Tamil Nadu'}, Code
                      : {companyDetails?.stateCode || '33'}
                    </p>

                    <p className="text-[12px] text-[#374151] leading-tight">
                      CIN:{' '}
                      {companyDetails?.cinNumber || 'U62020TZ2023PTC028410'}
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
              {/* Row 1 */}
              <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 shrink-0 p-1 border-r border-[#1f2937] min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Invoice No. :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {invoiceNumber || 'INV-2024-001'}
                    </span>
                  </p>
                </div>
                <div className="w-1/2 shrink-0 p-1 min-h-[40px] flex items-center justify-center">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Dated :{' '}
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

              {/* LUT and Bond Info */}
              {primaryCurrency === 'USD' && (
                <div className="border-b border-[#1f2937] px-2.5 space-y-1 p-0.5 flex flex-col justify-center   min-h-[60px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight">
                    Country:{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {companyDetails?.exportCountry || 'Malaysia'}
                    </span>
                  </p>
                  <p className="text-[11.5px] text-[#374151] leading-tight">
                    LUT/Bond No. :{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {companyDetails?.lutBondNo || 'AD330625001940G'}
                    </span>
                  </p>
                  <p className="text-[11.5px] text-[#374151] leading-tight">
                    From:{' '}
                    <span className="font-bold text-[#111827] text-xs">
                      {companyDetails?.lutValidFrom
                        ? new Date(companyDetails.lutValidFrom)
                            .toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                            .replace(/\//g, '-')
                        : '01-04-2025'}{' '}
                      to{' '}
                      {companyDetails?.lutValidTo
                        ? new Date(companyDetails.lutValidTo)
                            .toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                            .replace(/\//g, '-')
                        : '31-03-2026'}
                    </span>
                  </p>
                </div>
              )}

              {/* Bottom Box: Buyer Info */}

              <div className="p-2 px-2.5 flex-1 space-y-0.5">
                <p className="text-[12px] text-[#1f2937] mb-0.5 leading-tight">
                  Buyer (Bill to)
                </p>

                <h2 className="text-[14px] font-bold text-[#111827] leading-tight">
                  {client?.name || 'Buyers Company Name'}
                </h2>

                <p className="w-[65%] text-[12px] text-[#374151] leading-tight mt-1 break-words">
                  {client?.address || 'No. 8, Round Road'}
                </p>

                {client?.address2 && (
                  <p className="w-[65%] text-[12px] text-[#374151] leading-tight break-words">
                    {client.address2}
                  </p>
                )}

                <div className="mt-1">
                  <p className="text-[12px] text-[#374151] leading-tight flex">
                    <span className="w-20">GSTIN/UIN</span>

                    <span>: {client?.gstin || client?.gst || '123456'}</span>
                  </p>

                  <p className="text-[12px] text-[#374151] leading-tight flex py-1">
                    <span className="w-20">State Name</span>

                    <span>
                      : {client?.state || 'TamilNadu'}
                      {client?.stateCode ? `, Code : ${client.stateCode}` : ''}
                    </span>
                  </p>
                </div>
              </div>

              {/* Row 2 */}
              {/* <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 p-1 border-r border-[#1f2937] min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Delivery Note :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
                <div className="w-1/2 p-1 min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Mode/Terms of Payment :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
              </div> */}

              {/* Row 3 */}
              {/* <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 p-1 border-r border-[#1f2937] min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Reference No. & Date. :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
                <div className="w-1/2 p-1 min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Other References :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
              </div> */}

              {/* Row 4 */}
              {/* <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 p-1 border-r border-[#1f2937] min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Buyer's Order No. :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
                <div className="w-1/2 p-1 min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Dated :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
              </div> */}

              {/* Row 5 */}
              {/* <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 p-1 border-r border-[#1f2937] min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Dispatch Doc No. :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
                <div className="w-1/2 p-1 min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Delivery Note Date :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
              </div> */}

              {/* Row 6 */}
              {/* <div className="flex border-b border-[#1f2937]">
                <div className="w-1/2 p-1 border-r border-[#1f2937] min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Dispatched through :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
                <div className="w-1/2 p-1 min-h-[40px]">
                  <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                    Destination :{' '}
                    <span className="font-bold text-[#111827] text-xs"></span>
                  </p>
                </div>
              </div> */}

              {/* Row 7
              <div className="flex-1 p-1 min-h-[70px]">
                <p className="text-[11.5px] text-[#374151] leading-tight break-words">
                  Terms of Delivery :{' '}
                  <span className="font-bold text-[#111827] text-xs"></span>
                </p>
              </div> */}
            </div>
          </div>
          {/* ITEMS TABLE */}
          <div className="w-full border-t border-b border-[#1f2937]">
            {/* Table Header */}

            <div className="flex border-b border-[#1f2937] h-8">
              <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center whitespace-nowrap">
                <div style={{ textAlign: 'center', width: '100%' }}>Sl No.</div>
              </div>
              <div className="flex-1 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>
                  Particulars
                </div>
              </div>
              <div className="w-24 shrink-0 border-r border-[#1f2937] p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>
                  HSN/SAC
                </div>
              </div>
              <div className="w-28 shrink-0 p-1 text-[11px] font-semibold flex flex-col justify-center items-center text-center">
                <div style={{ textAlign: 'center', width: '100%' }}>Amount</div>
              </div>
            </div>

            {/* Table Body */}

            <div className="flex flex-col min-h-[240px]">
              {products?.map((product, index) => {
                const descriptionLines = (product.description || '')

                  .split('\n')

                  .filter(Boolean);

                return (
                  <div key={index} className="flex">
                    <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 pt-2 text-center text-xs">
                      {index + 1}
                    </div>

                    <div className="flex-1 border-r border-[#1f2937] p-1 pt-2 px-2">
                      <div className="font-bold text-[13px] text-[#111827] leading-tight">
                        {product.name || product.productName || 'Product Name'}
                      </div>

                      {descriptionLines.map((line, i) => (
                        <div
                          key={i}
                          className={`text-[11px] text-[#374151] leading-tight mt-0.5 ${i === 0 ? 'italic' : ''}`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>

                    <div className="w-24 shrink-0 border-r border-[#1f2937] p-1 pt-2 text-center text-[11px] text-[#374151]">
                      {product.hsn || product.hsnCode || '12345'}
                    </div>

                    <div className="w-28 shrink-0 p-1 pt-2 text-center text-[12px] font-bold text-[#111827] pr-4">
                      {Number(
                        product.price || product.amount || 0
                      ).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,

                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                );
              }) || (
                <div className="flex">
                  <div className="w-12 border-r border-[#1f2937] p-1 pt-2 text-center text-xs whitespace-nowrap">
                    1
                  </div>

                  <div className="flex-1 border-r border-[#1f2937] p-1 pt-2 px-2">
                    <div className="font-bold text-[13px] text-[#111827] leading-tight">
                      Information technology (IT) consulting and support
                      services
                    </div>

                    <div className="text-[11px] text-[#374151] italic leading-tight mt-0.5">
                      Web development for Oct-2025
                    </div>

                    <div className="text-[11px] text-[#374151] leading-tight mt-0.5">
                      Kamesh (1,20,000 / 20*18)
                    </div>
                  </div>

                  <div className="w-24 border-r border-[#1f2937] p-1 pt-2 text-center text-[11px] text-[#374151]">
                    998313
                  </div>

                  <div className="w-28 p-1 pt-2 text-center text-[12px] font-bold text-[#111827] pr-4">
                    1,08,000.00
                  </div>
                </div>
              )}

              {/* Taxes (directly below items) */}

              {(discountAmount > 0 ||
                cgstAmount > 0 ||
                sgstAmount > 0 ||
                (!cgstAmount &&
                  !sgstAmount &&
                  totalAmountWithGST > totalAmount)) && (
                <div className="flex">
                  <div className="w-12 border-r border-[#1f2937]"></div>

                  <div className="flex-1 border-r border-[#1f2937] p-1 px-2 pt-6 flex flex-col items-end pr-4">
                    {discountAmount > 0 && (
                      <div className="font-bold text-[12px] text-[#111827]">
                        Discount{' '}
                        {discountType === 'percentage'
                          ? `(${discountValue}%)`
                          : ''}
                      </div>
                    )}

                    {cgstAmount > 0 && (
                      <div className="font-bold text-[12px] text-[#111827] mt-1">
                        Output CGST {cgstRate}%
                      </div>
                    )}

                    {sgstAmount > 0 && (
                      <div className="font-bold text-[12px] text-[#111827] mt-1">
                        Output SGST {sgstRate}%
                      </div>
                    )}

                    {!cgstAmount &&
                      !sgstAmount &&
                      totalAmountWithGST > totalAmount && (
                        <div className="font-bold text-[12px] text-[#111827] mt-1">
                          Output IGST 18%
                        </div>
                      )}
                  </div>

                  <div className="w-24 border-r border-[#1f2937]"></div>

                  <div className="w-28 p-1 px-2 pt-6 text-right flex flex-col font-bold text-[12px] text-[#111827] pr-4">
                    {discountAmount > 0 && (
                      <div className="text-[#dc2626]">
                        -{' '}
                        {Number(discountAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,

                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )}

                    {cgstAmount > 0 && (
                      <div className="mt-1">
                        {Number(cgstAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,

                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )}

                    {sgstAmount > 0 && (
                      <div className="mt-1">
                        {Number(sgstAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,

                          maximumFractionDigits: 2,
                        })}
                      </div>
                    )}

                    {!cgstAmount &&
                      !sgstAmount &&
                      totalAmountWithGST > totalAmount && (
                        <div className="mt-1">
                          {Number(
                            totalAmountWithGST - totalAmount
                          ).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,

                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Filler space to push Total to bottom, maintaining column borders */}

              <div className="flex flex-1 min-h-[100px]">
                <div className="w-12 shrink-0 border-r border-[#1f2937]"></div>

                <div className="flex-1 border-r border-[#1f2937]"></div>

                <div className="w-24 shrink-0 border-r border-[#1f2937]"></div>

                <div className="w-28 shrink-0"></div>
              </div>
            </div>

            {/* Table Footer - Total Row */}

            <div className="flex border-t border-[#1f2937] min-h-[28px]">
              <div className="flex-1 border-r border-[#1f2937] p-1 pr-4 text-right font-bold text-[12px] text-[#111827] flex flex-col justify-center">
                Total
              </div>

              <div className="w-24 shrink-0 border-r border-[#1f2937] p-1"></div>

              <div className="w-28 p-1 px-2 font-bold text-[13px] text-[#111827] flex justify-between items-center">
                <span>
                  {primaryCurrency === 'INR'
                    ? '₹'
                    : primaryCurrency === 'USD'
                      ? '$'
                      : primaryCurrency}
                </span>

                <span className="pr-2">
                  {Number(totalAmountWithGST || 499140).toLocaleString(
                    'en-IN',

                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
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
              {primaryCurrency === 'INR' ? 'INR' : primaryCurrency}{' '}
              {numberToWords(Math.floor(totalAmountWithGST || 499140))} Only
            </div>
          </div>
          {/* NOTES SECTION */}
          {notes && (
            <div className="w-full border border-[#d1d5db] p-3 mb-4">
              <div className="font-semibold">Additional Notes</div>

              <div className="mt-1 text-sm text-[#374151]">{notes}</div>
            </div>
          )}{' '}
          {/* TAX TABLE */}
          <div className="w-full border-b border-[#1f2937] border-t-0 bg-white">
            {/* Table Header */}

            <div className="border-b border-[#1f2937]">
              {/* First Header Row */}

              <div className="flex items-stretch">
                <div className="flex-1 border-r border-[#1f2937] p-1 text-center text-[11px] font-semibold flex items-center justify-center min-h-[40px]"></div>

                <div className="w-24 shrink-0 border-r border-[#1f2937] flex items-center justify-center text-center text-[11px] font-semibold p-1 leading-tight px-2">
                  Taxable <br /> Value
                </div>

                {cgstAmount > 0 || sgstAmount > 0 ? (
                  <>
                    {/* CGST */}

                    <div className="w-32 shrink-0 border-r border-[#1f2937] flex flex-col text-center text-[11px] font-semibold">
                      <div className="border-b border-[#1f2937] flex-1 flex items-center justify-center p-1">
                        CGST
                      </div>

                      <div className="flex flex-1">
                        <div className="w-12 shrink-0 border-r border-[#1f2937] flex items-center justify-center p-1">
                          Rate
                        </div>

                        <div className="flex-1 flex items-center justify-center p-1">
                          Amount
                        </div>
                      </div>
                    </div>

                    {/* SGST */}

                    <div className="w-32 shrink-0 border-r border-[#1f2937] flex flex-col text-center text-[11px] font-semibold">
                      <div className="border-b border-[#1f2937] flex-1 flex items-center justify-center p-1">
                        SGST
                      </div>

                      <div className="flex flex-1">
                        <div className="w-12 shrink-0 border-r border-[#1f2937] flex items-center justify-center p-1">
                          Rate
                        </div>

                        <div className="flex-1 flex items-center justify-center p-1">
                          Amount
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* IGST */}

                    <div className="w-32 shrink-0 border-r border-[#1f2937] flex flex-col text-center text-[11px] font-semibold">
                      <div className="border-b border-[#1f2937] flex-1 flex items-center justify-center p-1">
                        IGST
                      </div>

                      <div className="flex flex-1">
                        <div className="w-12 shrink-0 border-r border-[#1f2937] flex items-center justify-center p-1">
                          Rate
                        </div>

                        <div className="flex-1 flex items-center justify-center p-1">
                          Amount
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="w-24 shrink-0 flex items-center justify-center text-center text-[11px] font-semibold p-1 leading-tight px-2">
                  Total Tax <br /> Amount
                </div>
              </div>
            </div>

            {/* Table Body - Removed individual items to only show total */}

            {/* Table Footer */}

            <div className="flex font-bold text-[11px] text-[#111827] min-h-[30px]">
              <div className="flex-1 border-r border-[#1f2937] p-1 text-right flex items-center justify-end pr-4">
                Total
              </div>

              <div className="w-24 shrink-0 border-r border-[#1f2937] p-1 text-right flex items-center justify-end pr-2">
                {formatCurrency(
                  subtotalAfterDiscount || totalAmount || 423000,

                  primaryCurrency
                ).replace(/[^0-9.,]/g, '')}
              </div>

              {cgstAmount > 0 || sgstAmount > 0 ? (
                <>
                  <div className="w-32 shrink-0 border-r border-[#1f2937] flex">
                    <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 flex items-center justify-center">
                      {cgstRate || 9}%
                    </div>

                    <div className="flex-1 p-1 text-right flex items-center justify-end pr-2">
                      {formatCurrency(cgstAmount || 0, primaryCurrency).replace(
                        /[^0-9.,]/g,

                        ''
                      )}
                    </div>
                  </div>

                  <div className="w-32 shrink-0 border-r border-[#1f2937] flex">
                    <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 flex items-center justify-center">
                      {sgstRate || 9}%
                    </div>

                    <div className="flex-1 p-1 text-right flex items-center justify-end pr-2">
                      {formatCurrency(sgstAmount || 0, primaryCurrency).replace(
                        /[^0-9.,]/g,

                        ''
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-32 shrink-0 border-r border-[#1f2937] flex">
                  <div className="w-12 shrink-0 border-r border-[#1f2937] p-1 flex items-center justify-center">
                    18%
                  </div>

                  <div className="flex-1 p-1 text-right flex items-center justify-end pr-2">
                    {formatCurrency(
                      totalAmountWithGST - totalAmount || 76140,

                      primaryCurrency
                    ).replace(/[^0-9.,]/g, '')}
                  </div>
                </div>
              )}

              <div className="w-24 shrink-0 p-1 text-right flex items-center justify-end pr-2">
                {formatCurrency(
                  cgstAmount > 0 || sgstAmount > 0
                    ? (cgstAmount || 0) + (sgstAmount || 0)
                    : totalAmountWithGST - totalAmount || 76140,

                  primaryCurrency
                ).replace(/[^0-9.,]/g, '')}
              </div>
            </div>
          </div>
          {/* TAX AMOUNT IN WORDS */}
          <div className="w-full border-b border-[#1f2937] py-2 px-2 bg-white text-[10px] text-[#374151] flex items-center">
            <span className="mr-2">Tax Amount (in words) :</span>

            <span className="font-bold text-[#111827]">
              {primaryCurrency === 'INR' ? 'INR' : primaryCurrency}{' '}
              {numberToWords(
                Math.floor(
                  cgstAmount > 0 || sgstAmount > 0
                    ? (cgstAmount || 0) + (sgstAmount || 0)
                    : totalAmountWithGST - totalAmount || 76140
                )
              )}{' '}
              Only
            </span>
          </div>
          {/* FOOTER SECTION */}
          <div className="w-full flex">
            {/* Left Box */}

            <div className="flex-1 p-2 flex flex-col justify-end">
              <div className="flex items-center text-[11px] text-[#111827] mb-1">
                <span className="w-28">Company's PAN</span>

                <span className="font-bold">
                  : {companyDetails?.panNumber || 'AAQCM8677E'}
                </span>
              </div>

              <div className="text-[10px] text-[#374151] underline mb-0.5">
                Declaration
              </div>

              <div className="text-[10px] text-[#374151]">
                Terms: Client will Pay the Transaction fee.
              </div>

              <div className="text-[10px] text-[#374151]">
                Balance Due in 10 Days.
              </div>
            </div>

            {/* Right Box - Bank Details & Signatory */}

            <div className="w-[55%] border-l border-[#1f2937] flex flex-col">
              <div className="p-2 text-[10px] text-[#111827]">
                <div className="mb-1 underline">Company's Bank Details</div>

                <div className="flex">
                  <span className="w-32">A/c Holder's Name</span>

                  <span className="font-bold">
                    :{' '}
                    {companyDetails?.accountHolderName ||
                      'LIVIKTECH SOLUTIONS PRIVATE LIMITED'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-32">Bank Name</span>

                  <span className="font-bold">
                    : {companyDetails?.bankName || 'HDFC Bank Ltd'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-32">A/c No.</span>

                  <span className="font-bold">
                    : {companyDetails?.accountNumber || '1234567899632'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-32">Branch </span>

                  <span className="font-bold">
                    :{' '}
                    {companyDetails?.branchName
                      ? `${companyDetails.branchName}`
                      : 'RM Colony, Dindigul'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-32">IFSC Code </span>

                  <span className="font-bold">
                    :{' '}
                    {companyDetails?.ifscCode
                      ? `${companyDetails.ifscCode}`
                      : 'HDFC000053'}
                  </span>
                </div>

                <div className="flex mt-0.5">
                  <span className="w-32">SWIFT Code</span>

                  <span className="font-bold">
                    : {companyDetails?.swiftCode || 'HDFCDED'}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#1f2937] p-2 flex flex-col justify-between items-end flex-1 min-h-[70px]">
                <div className="text-[10px] font-bold text-[#111827]">
                  for{' '}
                  {companyDetails?.companyName ||
                    'LIVIKTECH SOLUTIONS PRIVATE LIMITED'}
                </div>

                <div className="text-[9px] text-[#374151] mt-8">
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#1f2937] py-2">
        This is a Computer Generated Invoice
      </div>
    </div>
  );
};
export default PreviewForm;
// export default PreviewForm;
