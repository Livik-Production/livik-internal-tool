'use client';

import React from 'react';
import LetterPadLayout from './LetterPadLayout';

const ExperienceLetter = ({
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
        id="experience-letter-print"
        className={`relative w-[794px] h-[1123px] bg-white pdf-safe flex flex-col ${
          isWithPad ? 'letterpad-print' : 'no-letterpad-print'
        }`}
      >
        <LetterPadLayout isWithPad={isWithPad} letterPadType={letterPadType}>

          <div className="flex justify-end px-16 pt-[36px]">
            <h1 className="text-[15px] font-medium text-gray-900">
              Date:{getCurrentDate()}
            </h1>
          </div>

          <div className="px-16 pt-20 text-[15px] text-gray-800 flex-grow">
            <h2 className="text-xl font-bold text-center text-gray-900 mb-16">
              Experience cum Relieving Letter
            </h2>

            <div className="space-y-6 text-justify leading-relaxed">
              <p>
                This is to certify that <strong>{employeeData?.name || 'Mr. XXX'}</strong> (Emp ID: {employeeData?.empId || employeeData?.__raw?.empId || '[Emp ID]'}) was employed
                with <strong>{companyName}</strong> as an <strong>&quot;{employeeData?.role || employeeData?.designation || employeeData?.__raw?.designation || '[Designation]'}&quot;</strong> from <strong>{employeeData?.dateOfJoining || employeeData?.__raw?.dateOfJoining ? new Date(employeeData?.dateOfJoining || employeeData?.__raw?.dateOfJoining).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Start Date]'}</strong> to <strong>{employeeData?.employeeExit?.lastWorkingDay || employeeData?.__raw?.employeeExit?.lastWorkingDay ? new Date(employeeData?.employeeExit?.lastWorkingDay || employeeData?.__raw?.employeeExit?.lastWorkingDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[End Date]'}</strong>.
              </p>

              <p>
                He has been relieved of his duties and responsibilities with effect from the close of business on <strong>{employeeData?.employeeExit?.lastWorkingDay || employeeData?.__raw?.employeeExit?.lastWorkingDay ? new Date(employeeData?.employeeExit?.lastWorkingDay || employeeData?.__raw?.employeeExit?.lastWorkingDay).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '[End Date]'}</strong>.
              </p>

              <p>
                We thank him for his services and wish him every success in his future endeavors.
              </p>
            </div>

            <div className="mt-20">
              <p className="mb-4">Regards,</p>
              <p className="font-semibold mb-20">For {companyName}</p>
              <p className="font-semibold">Authorized Signatory</p>
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

export default ExperienceLetter;
