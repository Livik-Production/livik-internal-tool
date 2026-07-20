'use client';

import React from 'react';
import LetterPadLayout from './LetterPadLayout';

const OfferLetterSimple = ({
  employeeData = {},
  letterPad = 'with', // "with" | "without"
  letterPadType = 'type1',
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
  const companyName = letterPadType === 'type2' ? 'Livik Software Solutions Private Limited' : 'Livik Technologies';

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
        className={`relative w-[794px] h-[1123px] bg-white pdf-safe flex flex-col ${isWithPad ? 'letterpad-print' : 'no-letterpad-print'}`}
      >
        <LetterPadLayout isWithPad={isWithPad} letterPadType={letterPadType}>
          <div className="px-16 w-full flex-grow flex flex-col">
            {/* TITLE */}
            <div className="w-full text-center mt-8 mb-6">
              <h2 className="text-[17px] font-bold text-gray-900">Offer Letter</h2>
            </div>

          {/* DATE */}
          <div className="w-full text-right mb-10">
            <p className="text-[15px] font-medium text-gray-900">Date:{getCurrentDate()}</p>
          </div>

          {/* TO ADDRESS */}
          <div className="w-full text-left mb-10 text-[15px] text-gray-900 leading-snug">
            <p className="font-bold mb-2">To:</p>
            <p className="font-bold">{employeeData?.name || 'Mr. XXX'}</p>
            <p>{employeeData?.address || '[Address]'}</p>
          </div>
          {/* LETTER CONTENT */}
          <div className="text-[15px] text-gray-900 flex-grow w-full">
            {/* SALUTATION */}
            <p className="mb-6">
              Dear <span className="font-bold">Mr. {employeeData?.name || 'XXX'}</span>,
            </p>

            {/* BODY */}
            <div className="space-y-6 text-justify leading-relaxed">
              <p>
                Thank you for exploring career opportunities with <span className="font-bold">{companyName}</span>. You have successfully completed our
                initial selection process and we are pleased to offer you a full-time position with our company as <span className="font-bold">{employee.position}</span>. Please report to HIG A-7,
                2nd Street, 9th Cross, R.M. Colony, Dindigul - 624001 for duty
                on <span className="font-bold">{employee.startDate}</span> at{' '}
                <span className="font-bold">{employee.startTime}</span>, along with all your
                testimonials for verification and return.
              </p>

              <p>
                You will undergo a probationary period of three (3) months,
                commencing from <span className="font-bold">{employee.startDate}</span>. During
                this probationary period, your salary will be <span className="font-bold">Rs. {employee.probationSalary} per month</span>. Upon
                successful completion of the probation and satisfactory
                performance evaluation, your salary will be revised to <span className="font-bold">Rs. {employee.permanentSalary} per month.</span>
              </p>

              <p>
                All other terms and employment benefits shall be in accordance
                with the company's policies and procedures.
              </p>

              <p className="pt-2">
                We look forward to a long-term and mutually beneficial
                relationship with you.
              </p>
            </div>

            {/* CLOSING */}
            <div className="mt-16">
              <p className="mb-6">Regards,</p>
              <p className="font-bold">For {companyName}</p>
              <div className="mt-20">
                <p className="font-bold">Authorized Signatory</p>
              </div>
            </div>
          </div>
          </div>
        </LetterPadLayout>

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
