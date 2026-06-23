'use client';

import React from 'react';

const TerminationLetter = ({
  employeeData = {},
  letterPad = 'with',
}) => {
  const isWithPad = letterPad === 'with';

  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Calculate last working day (30 days from now)
  const getLastWorkingDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="flex justify-center bg-gray-100 p-4 print:bg-white print:p-0 mt-6">
      <div
        id="termination-letter-print"
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
        {!isWithPad && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/asset/livik-watermark.png"
              alt="Livik Watermark"
              className="w-[420px] opacity-10"
            />
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col">
          {isWithPad && (
            <div className="flex justify-center pt-8">
              <img
                src="/asset/livik-logo.png"
                alt="Livik Technologies Logo"
                className="h-16 w-auto"
              />
            </div>
          )}

          <div className="grid grid-cols-2 items-center px-16 pt-[36px]">
            <h1 className="text-2xl font-bold text-gray-900">
              Livik Technologies
            </h1>
            <div className="flex justify-start pl-32">
              <h1 className="text-md font-semibold text-gray-900">
                Date : {getCurrentDate()}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 items-start px-16 pt-2">
            <div className="text-sm leading-5 text-gray-700">
              <p>HIG A-7, 2nd Street, 9th Cross</p>
              <p>R.M. Colony, Dindigul - 624001</p>
              <p>Tel: +91 8610470324</p>
              <p>Email: liviktechnologies@gmail.com</p>
            </div>
            <div className="text-sm text-gray-900 flex flex-col items-start pl-32">
              <p className="font-bold">{employeeData?.name || 'Mr. XXX'}</p>
              <p>{employeeData?.address || '[Address]'}</p>
              <p>{employeeData?.email || '[Email]'}</p>
              <p>{employeeData?.phone || '[Phone]'}</p>
            </div>
          </div>

          <div className="px-16 pt-10 text-sm text-gray-800 flex-grow">
            <h2 className="text-lg font-bold text-center text-red-800 mb-6 underline">
              TERMINATION LETTER
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
                We regret to inform you that your employment with{' '}
                <strong>Livik Technologies</strong> is hereby terminated
                effective <strong>{getLastWorkingDate()}</strong>. This decision
                has been made after careful consideration and review of the
                circumstances.
              </p>

              <p>
                The reasons for this termination are as follows:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Continued failure to meet performance expectations despite
                  prior warnings and support.
                </li>
                <li>Violation of company policies and code of conduct.</li>
                <li>
                  Inability to fulfill the responsibilities of the role as{' '}
                  <strong>
                    {employeeData?.role || employeeData?.designation || '[Designation]'}
                  </strong>
                  .
                </li>
              </ul>

              <p>
                You are required to complete all pending handover tasks and
                return any company property, including but not limited to ID
                cards, laptops, access cards, and any confidential documents, on
                or before your last working day.
              </p>

              <p>
                Your final settlement, including any pending dues, will be
                processed in accordance with the company's policies within 45
                working days of your last working day.
              </p>

              <p>
                We wish you all the best in your future endeavors.
              </p>
            </div>

            <div className="mt-16">
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

export default TerminationLetter;
