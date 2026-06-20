'use client';

import React from 'react';

const OfferLetterSimple = ({
  employeeData = {},
  letterPad = 'with', // "with" | "without"
}) => {
  const data = {
    employeeName: 'Mr. XXX',
    position: 'Associate Software Engineer',
    startDate: '01st Oct 2025',
    startTime: '9:30 AM',
    probationSalary: '8,000',
    permanentSalary: '12,000',
  };

  const employee = { ...data, ...employeeData };
  const isWithPad = letterPad === 'with';

  // Date function to format current date
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="flex justify-center bg-gray-100 p-4 print:bg-white print:p-0 mt-6">
      {/* A4 PAGE - SAME DIMENSIONS FOR BOTH MODES */}
      <div
        id="offer-letter-print"
        className={`relative w-[794px] h-[1123px] bg-white pdf-safe ${
          isWithPad ? 'letterpad-print' : 'no-letterpad-print'
        }`}
        style={
          isWithPad
            ? {
                backgroundImage: "url('/asset/Background_letter.jpg')",
                backgroundSize: '794px 1123px',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'top center',
              }
            : {}
        }
      >
        {/* WATERMARK (ONLY WITHOUT IMAGE LETTERPAD) */}
        {!isWithPad && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/asset/livik-watermark.png"
              alt="Livik Watermark"
              className="w-[420px] opacity-10 p"
            />
          </div>
        )}

        {/* CONTENT LAYER - IDENTICAL FOR BOTH MODES */}
        <div className="relative z-10 h-full flex flex-col">
          {/* LOGO (ONLY WHEN WITH LETTERPAD) */}
          {isWithPad && (
            <div className="flex justify-center pt-8">
              <img
                src="/asset/livik-logo.png"
                alt="Livik Technologies Logo"
                className="h-16 w-auto"
              />
            </div>
          )}
          {/* COMPANY NAME AND DATE - USING GRID */}
          <div className="grid grid-cols-2 items-center px-16 pt-[36px]">
            <h1 className="text-2xl font-bold text-gray-900">
              Livik Technologies
            </h1>
            <div className="flex justify-end pr-12.5">
              <h1 className="text-md font-semibold text-gray-900">
                Date : {getCurrentDate()}
              </h1>
            </div>
          </div>

          {/* COMPANY DETAILS AND EMPLOYEE DETAILS - USING GRID */}
          <div className="grid grid-cols-2 items-start px-16 pt-2">
            {/* LEFT: COMPANY ADDRESS */}
            <div className="text-sm leading-5 text-gray-700">
              <p>HIG A-7, 2nd Street, 9th Cross</p>
              <p>R.M. Colony, Dindigul - 624001</p>
              <p>Tel: +91 8610470324</p>
              <p>Email: liviktechnologies@gmail.com</p>
            </div>

            {/* RIGHT: EMPLOYEE DETAILS */}
            <div className="text-sm text-gray-900 flex flex-col items-start pl-38">
              <p className="font-bold">{employeeData?.name || 'Mr. XXX'}</p>
              <p>{employeeData?.address || '[Address]'}</p>
              <p>{employeeData?.email || '[Email]'}</p>
              <p>{employeeData?.phone || '[Phone]'}</p>
            </div>
          </div>
          {/* LETTER CONTENT - IDENTICAL POSITIONING */}
          <div className="px-16 pt-16 text-sm text-gray-800 flex-grow">
            {/* SALUTATION */}
            <p className="mb-8">
              Dear
              <span className="font-semibold px-1">
                {employeeData?.name || 'Mr. XXX'}
              </span>
              ,
            </p>

            {/* BODY */}
            <div className="space-y-5 text-justify leading-relaxed">
              <p className="text-justify">
                Thank you for exploring career opportunities with Livik
                Technologies. You have successfully completed our initial
                selection process and we are pleased to offer you a full-time
                position with our company as{' '}
                <strong>{employee.position}</strong>. Please report to HIG A-7,
                2nd Street, 9th Cross, R.M. Colony, Dindigul - 624001 for duty
                on <strong>{employee.startDate}</strong> at{' '}
                <strong>{employee.startTime}</strong>, along with all your
                testimonials for verification and return.
              </p>

              <p className="text-justify">
                You will undergo a probationary period of three (3) months,
                commencing from <strong>{employee.startDate}</strong>. During
                this probationary period, your salary will be Rs.{' '}
                <strong>{employee.probationSalary}</strong> per month. Upon
                successful completion of the probation and satisfactory
                performance evaluation, your salary will be revised to Rs.{' '}
                <strong>{employee.permanentSalary}</strong> per month.
              </p>

              <p className="text-justify">
                All other terms and employment benefits shall be in accordance
                with the company's policies and procedures.
              </p>

              <p className="text-justify">
                Please sign and return a copy of this letter as confirmation of
                your acceptance of the above terms.
              </p>

              <p className="text-justify">
                We look forward to a long-term and mutually beneficial
                relationship with you.
              </p>
            </div>

            {/* CLOSING - IDENTICAL POSITIONING */}
            <div className="mt-20">
              <p className="mb-2">Regards.</p>
              <p className="font-semibold">For Livik Technologies</p>
              <div className="mt-10">
                <p className="font-semibold">Manager – HR</p>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body {
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OfferLetterSimple;
