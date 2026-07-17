'use client';

import React from 'react';
import LetterPadLayout from './LetterPadLayout';

const AppointmentLetter = ({
  employeeData = {},
  letterPad = 'with',
  letterPadType = 'type1',
}) => {
  const isWithPad = letterPad === 'with';
  const companyName = letterPadType === 'type2' ? 'Livik Software Solutions Private Limited' : 'Livik Technologies';

  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="flex justify-center bg-gray-100 p-4 print:bg-white print:p-0 mt-6">
      <div
        id="appointment-letter-print"
        className={`relative w-[794px] h-[1123px] bg-white pdf-safe flex flex-col ${
          isWithPad ? 'letterpad-print' : 'no-letterpad-print'
        }`}
      >
        <LetterPadLayout isWithPad={isWithPad} letterPadType={letterPadType}>
          {/* COMPANY NAME AND DATE - USING GRID */}
          <div className="grid grid-cols-2 items-center px-16 pt-[36px] w-full">
            <div className="flex justify-end col-span-2">
              <h1 className="text-md font-semibold text-gray-900">
                Date : {getCurrentDate()}
              </h1>
            </div>
          </div>

          {/* COMPANY DETAILS AND EMPLOYEE DETAILS - USING GRID */}
          <div className="grid grid-cols-2 items-start px-16 pt-2 w-full">
            <div className="col-start-2 text-sm text-gray-900 flex flex-col items-end">
              <div className="text-left">
                <p className="font-bold">{employeeData?.name || 'Mr. XXX'}</p>
                <p>{employeeData?.address || '[Address]'}</p>
                <p>{employeeData?.email || '[Email]'}</p>
                <p>{employeeData?.phone || '[Phone]'}</p>
              </div>
            </div>
          </div>

          <div className="px-16 pt-10 text-sm text-gray-800 flex-grow">
            <h2 className="text-lg font-bold text-center text-blue-800 mb-6 underline">
              APPOINTMENT LETTER
            </h2>

            <p className="mb-6">
              Dear
              <span className="font-semibold px-1">
                {employeeData?.name || 'Mr. XXX'}
              </span>
              ,
            </p>

            <div className="space-y-5 text-justify leading-relaxed">
              <p>
                With reference to your application and subsequent interview, we
                are pleased to appoint you as{' '}
                <strong>
                  {employeeData?.role || employeeData?.designation || '[Designation]'}
                </strong>{' '}
                in our organization, <strong>{companyName}</strong>,
                effective from <strong>{getCurrentDate()}</strong>.
              </p>

              <p>The terms and conditions of your appointment are as follows:</p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  You will be on probation for a period of <strong>three (3) months</strong>{' '}
                  from the date of joining.
                </li>
                <li>
                  Your compensation and benefits will be as per the company's
                  policies and as communicated to you separately.
                </li>
                <li>
                  You are expected to maintain strict confidentiality regarding
                  all company proprietary information.
                </li>
                <li>
                  You shall abide by the rules, regulations, and policies of the
                  company as amended from time to time.
                </li>
                <li>
                  Either party may terminate this appointment by providing{' '}
                  <strong>one (1) month</strong> written notice or salary in lieu
                  thereof.
                </li>
              </ul>

              <p>
                Please sign and return a copy of this letter as your acceptance
                of the above terms and conditions.
              </p>

              <p>
                We welcome you to the {companyName} family and look forward
                to a mutually rewarding association.
              </p>
            </div>

            <div className="mt-12">
              <p className="mb-2">Regards.</p>
              <p className="font-semibold">For {companyName}</p>
              <div className="mt-10">
                <p className="font-semibold">Manager – HR</p>
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

export default AppointmentLetter;
