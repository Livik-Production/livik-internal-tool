'use client';

import React from 'react';
import LetterPadLayout from './LetterPadLayout';

const WarningLetter = ({
  employeeData = {},
  letterPad = 'with', // "with" | "without"
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
        id="warning-letter-print"
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
            <h2 className="text-lg font-bold text-center text-red-700 mb-6 underline">
              WARNING LETTER
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
                This letter serves as a formal warning regarding your conduct /
                performance at {companyName}. It has been brought to our
                attention that you have been in violation of company policies
                and/or have not met the expected performance standards.
              </p>

              <p>
                Specifically, the following issues have been observed:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Repeated tardiness and unauthorized absences.</li>
                <li>Failure to meet assigned deadlines and deliverables.</li>
                <li>Non-compliance with company rules and regulations.</li>
              </ul>

              <p>
                We expect immediate improvement in your conduct and performance.
                Failure to show significant improvement within the next{' '}
                <strong>30 days</strong> may result in further disciplinary
                action, up to and including termination of employment.
              </p>

              <p>
                Please treat this matter with the seriousness it deserves. We
                encourage you to discuss any concerns or difficulties with your
                reporting manager or the HR department.
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

export default WarningLetter;
