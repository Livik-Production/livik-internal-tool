'use client';

import React from 'react';

const AppointmentLetter = ({
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

  return (
    <div className="flex justify-center bg-gray-100 p-4 print:bg-white print:p-0 mt-6">
      <div
        id="appointment-letter-print"
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
            <div className="flex justify-end pr-12.5">
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
            <div className="text-sm text-gray-900 flex flex-col items-start pl-38">
              <p className="font-bold">{employeeData?.name || 'Mr. XXX'}</p>
              <p>{employeeData?.address || '[Address]'}</p>
              <p>{employeeData?.email || '[Email]'}</p>
              <p>{employeeData?.phone || '[Phone]'}</p>
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
                in our organization, <strong>Livik Technologies</strong>,
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
                We welcome you to the Livik Technologies family and look forward
                to a mutually rewarding association.
              </p>
            </div>

            <div className="mt-12">
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

export default AppointmentLetter;
