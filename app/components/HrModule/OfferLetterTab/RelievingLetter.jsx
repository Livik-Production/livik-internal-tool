'use client';

import React from 'react';
import LetterPadLayout from './LetterPadLayout';

const RelievingLetter = ({
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
        id="relieving-letter-print"
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
            <h2 className="text-lg font-bold text-center text-indigo-800 mb-6 underline">
              RELIEVING LETTER
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
                This is to inform you that your resignation from the position of{' '}
                <strong>
                  {employeeData?.role || employeeData?.designation || '[Designation]'}
                </strong>{' '}
                at <strong>{companyName}</strong> has been accepted and you
                are hereby relieved from your duties effective{' '}
                <strong>{getCurrentDate()}</strong>.
              </p>

              <p>
                We confirm that you have completed all the necessary handover
                formalities, returned all company property and assets in your
                possession, and have no outstanding obligations towards the
                company.
              </p>

              <p>
                Your final settlement will be processed in accordance with the
                company's policies and any applicable statutory requirements.
              </p>

              <p>
                We sincerely appreciate your contributions during your tenure
                with us and thank you for your dedicated service to {companyName}. Your efforts have been valuable to the
                organization.
              </p>

              <p>
                We wish you all the very best in your future career and personal
                endeavors.
              </p>
            </div>

            <div className="mt-16">
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

export default RelievingLetter;
