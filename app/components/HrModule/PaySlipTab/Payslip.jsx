// components/PaySlip.jsx
import React from 'react';

const PaySlip = ({
  employeeData = {},
  payslipData = null, // Add this prop
  letterPad = 'with', // "with" | "without"
  month = 'December', // Add month prop
  year = '2025', // Add year prop
}) => {
  // Default salary + payroll data
  const data = {
    bankName: payslipData?.bankName || '—',
    department: payslipData?.department || employeeData?.department || '—',
    accountNo: payslipData?.accountNo || '—',
    panNo: payslipData?.panNo || '—',
    nod: payslipData?.nod || '0',
    lopDays: payslipData?.lopDays || '0',

    // Current month and year
    month: payslipData?.month || month,
    year: payslipData?.year || year,

    // Earnings
    basicSalary: payslipData?.earnings?.basicSalary || '0',
    hra: payslipData?.earnings?.hra || '0',
    medicalAllowance: payslipData?.earnings?.medicalAllowance || '0',
    otherAllowances: payslipData?.earnings?.otherAllowances || '0',

    // Deductions
    lopDeduction: payslipData?.deductions?.lopDeduction || '0',

    grossSalary: payslipData?.grossSalary || '0',
    totalDeductions: payslipData?.totalDeductions || '0',
    netSalary: payslipData?.netSalary || '0',
  };

  // 🔥 DYNAMIC MAPPING FROM OfferLetterTab
  const employee = {
    ...data,
    employeeName: payslipData?.employeeName || employeeData.name || '—',
    employeeId: payslipData?.employeeId || employeeData.id || '—',
    designation:
      payslipData?.designation || employeeData.role || 'Frontend Developer',
    location: payslipData?.location || employeeData.address || '—',
    phone: employeeData.phone || '—',
  };

  const isWithPad = letterPad === 'with';

  // Number to words function
  const numberToWords = (num) => {
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

    if (!num || num === 0) return 'Zero';
    if (num < 20) return a[num];
    if (num < 100)
      return b[Math.floor(num / 10)] + (num % 10 ? '-' + a[num % 10] : '');
    return 'Rupees ' + num + ' Only';
  };

  // Helper component for info rows
  const Info = ({ label, value }) => (
    <div className="flex justify-between border-b pb-2">
      <span className="font-semibold text-gray-700">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <div className="flex justify-center bg-gray-100 p-4 print:bg-white print:p-0 mt-6">
      {/* A4 PAGE */}
      <div
        id="payslip-print"
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
              className="w-[420px] opacity-10"
            />
          </div>
        )}

        {/* CONTENT LAYER */}
        <div className="relative z-10 h-full flex flex-col">
          {/* HEADER - Company Details */}
          {isWithPad && (
            <div className="flex px-10 pt-7">
              <div className="">
                <img
                  src="/asset/livik-logo.png"
                  alt="Livik Technologies Logo"
                  className="h-24 w-auto"
                />
              </div>

              {/* Company Details */}
              <div className="flex-grow flex justify-end">
                <div className="text-sm leading-5 text-gray-700 text-left">
                  <p className="font-semibold text-gray-900">
                    Livik Technologies
                  </p>
                  <p>HIG A-7, 2nd Street, 9th Cross</p>
                  <p>R.M. Colony, Dindigul - 624001</p>
                  <p>Tel: +91 8610470324</p>
                  <p>Email: liviktechnologies@gmail.com</p>
                </div>
              </div>
            </div>
          )}
          {/* PAYSLIP TITLE */}
          <div className="px-12 pt-10 text-center">
            <h1 className="text-2xl font-bold text-blue-600">
              PAYSLIP FOR THE MONTH - {month} {year}
            </h1>
          </div>
          {/* EMPLOYEE DETAILS */}
          {/* Employee Information Section */}
          <div className="flex-grow">
            <div className="mb-4 pt-4 p-4 text-sm">
              <div className="grid grid-cols-2 gap-0 border border-gray-700">
                {/* Left Column */}
                <div className="space-y-0 border-r border-gray-300">
                  {/* Added border-right */}
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    {/* Changed to p-3 */}
                    <span className="font-semibold text-gray-700">
                      Employee Name
                    </span>
                    <span className="font-medium">{employee.employeeName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      Employee ID
                    </span>
                    <span className="font-medium">{employee.employeeId}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      Designation
                    </span>
                    <span className="font-medium">{employee.designation}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      Department
                    </span>
                    <span className="font-medium capitalize">
                      {employee.department &&
                      typeof employee.department === 'string'
                        ? employee.department
                        : employee.department}
                    </span>
                  </div>
                  <div className="flex justify-between p-3">
                    {' '}
                    {/* Last row */}
                    <span className="font-semibold text-gray-700">
                      Location
                    </span>
                    <span className="font-medium">{employee.location}</span>
                  </div>
                </div>
                {/* Right Column */}
                <div className="space-y-0">
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      Bank Name
                    </span>
                    <span className="font-medium">{employee.bankName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      Account No
                    </span>
                    <span className="font-medium">{employee.accountNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">PAN No</span>
                    <span className="font-medium">{employee.panNo}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 p-3">
                    <span className="font-semibold text-gray-700">
                      No.of Days{' '}
                    </span>
                    <span className="font-medium">{employee.nod}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    {' '}
                    {/* Last row */}
                    <span className="font-semibold text-gray-700">
                      LOP Days
                    </span>
                    <span className="font-medium">{employee.lopDays}</span>
                  </div>
                </div>
              </div>

              {/* EARNINGS & DEDUCTIONS TABLE */}
              <div className="mb-4 mt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                        Earnings
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border border-gray-300">
                        Amount (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-gray-300">
                        Deductions
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border border-gray-300">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic Salary & LOP */}
                    <tr>
                      <td className="px-4 py-3 border border-gray-300">
                        Basic Salary
                      </td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.basicSalary).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 border border-gray-300">LOP</td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.lopDeduction).toLocaleString(
                          'en-IN'
                        )}
                      </td>
                    </tr>

                    {/* HRA */}
                    <tr>
                      <td className="px-4 py-3 border border-gray-300">HRA</td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.hra).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 border border-gray-300"></td>
                      <td className="px-4 py-3 text-right border border-gray-300"></td>
                    </tr>

                    {/* Medical Allowance */}
                    {/* <tr>
                      <td className="px-4 py-3 border border-gray-300">
                        Medical Allowance
                      </td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.medicalAllowance).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-4 py-3 border border-gray-300"></td>
                      <td className="px-4 py-3 text-right border border-gray-300"></td>
                    </tr> */}

                    {/* Other Allowances */}
                    <tr>
                      <td className="px-4 py-3 border border-gray-300">
                        Other Allowances
                      </td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.otherAllowances).toLocaleString(
                          'en-IN'
                        )}
                      </td>
                      <td className="px-4 py-3 border border-gray-300"></td>
                      <td className="px-4 py-3 text-right border border-gray-300"></td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 border border-gray-300">
                        Gross Salary
                      </td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.grossSalary).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 border border-gray-300">
                        Total Deductions
                      </td>
                      <td className="px-4 py-3 text-right border border-gray-300">
                        {parseInt(employee.totalDeductions).toLocaleString(
                          'en-IN'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* NET SALARY SECTION */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-sm mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  NET SALARY
                </h2>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  ₹{parseInt(employee.netSalary).toLocaleString('en-IN')}
                </div>
                <div className="text-sm italic text-gray-700">
                  (In words: {numberToWords(parseInt(employee.netSalary))})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT SETTINGS */}
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

            #payslip-print {
              box-shadow: none;
              margin: 0;
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PaySlip;
