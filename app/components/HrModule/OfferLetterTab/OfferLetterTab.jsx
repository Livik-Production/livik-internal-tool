'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Printer, Download, Mail, SquareX, ChevronDown } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import TabButton from '../../Buttons/TabButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import Loader from '../../Loader'; // Add this import
import '../../../globals.css';
import { handlePrint } from '../PrintForm';
import { handleDownloadPDF, handleDownloadPayslipPDF } from '../DownloadForm';
import { handleSendEmail, handleSendPayslipEmail } from '../EmailForm';
import OfferLetterSimple from './OfferLetter';
import WarningLetter from './WarningLetter';
import TerminationLetter from './TerminationLetter';
import AppointmentLetter from './AppointmentLetter';
import ExperienceLetter from './ExperienceLetter';
import RelievingLetter from './RelievingLetter';
import PaySlip from '../PaySlipTab/Payslip';
import { selectEmployeesItems } from '../../../../store/slices/employeesSlice';

// Letter type options configuration
const LETTER_TYPES = [
  { id: 'offerLetter', label: 'Offer Letter', printId: 'offer-letter-print' },
  { id: 'warningLetter', label: 'Warning Letter', printId: 'warning-letter-print' },
  { id: 'terminationLetter', label: 'Termination Letter', printId: 'termination-letter-print' },
  { id: 'appointmentLetter', label: 'Appointment Letter', printId: 'appointment-letter-print' },
  { id: 'experienceLetter', label: 'Experience Letter', printId: 'experience-letter-print' },
  { id: 'relievingLetter', label: 'Relieving Letter', printId: 'relieving-letter-print' },
  { id: 'payslip', label: 'Payslip', printId: 'payslip' },
];

const OfferLetterTab = ({ isViewOnly = false }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current month and year for initial values
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // States
  const [activeTab, setActiveTab] = useState('offerLetter');
  const [empId, setEmpId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedLetterType, setSelectedLetterType] = useState('');
  const [letterPadOption, setLetterPadOption] = useState('with');
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipMonth, setPayslipMonth] = useState(currentMonth);
  const [payslipYear, setPayslipYear] = useState(currentYear);
  const [showPreview, setShowPreview] = useState(false);
  const [payslipData, setPayslipData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [letterContent, setLetterContent] = useState({
    name: 'MR. DOE',
    position: 'Marketing Manager',
    startDate: 'XXXX-XX-XX',
    salary: '$20/hr',
    reportingTo: 'Richard Hall',
    hrManager: 'Kylie Hayden',
    responseDate: 'XX-XX-XXXX',
  });

  // Get employees from Redux store
  const employeesFromRedux = useSelector(selectEmployeesItems);

  // Transform Redux employee data to match the expected structure - Filter for ACTIVE only
  const employees =
    employeesFromRedux && employeesFromRedux.length > 0
      ? employeesFromRedux
          .filter((emp) => emp.status?.toUpperCase() === 'ACTIVE')
          .map((emp) => ({
            id: emp.id || '',
            name: emp.name || '',
            role: emp.designation || emp.role || '', // Map designation to role
            email: emp.email || '',
            phone: emp.mobile || '',
            address: emp.address || emp.__raw?.presentAddress || '', // fallback to present address
            // Add any other fields you need
          }))
      : [];

  // Refs for modals
  const modalRef = useRef(null);
  const payslipModalRef = useRef(null); // Add this ref

  const tabs = [{ id: 'offerLetter', label: 'Offer Letter' }];

  // Simulate loading on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Simulate 0.8 second loading time

    return () => clearTimeout(timer);
  }, []);

  // Handle click outside modal for Offer Letter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowLetterModal(false);
      }
    };

    if (showLetterModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [showLetterModal]);

  // Handle click outside modal for Payslip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        payslipModalRef.current &&
        !payslipModalRef.current.contains(event.target)
      ) {
        setShowPayslipModal(false);
      }
    };

    if (showPayslipModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [showPayslipModal]);

  // Handle input change and suggestions - FIXED VERSION
  const handleInputChange = (value) => {
    setEmpId(value);

    if (value.trim() === '') {
      setSuggestions([]);
      // Also clear selected employee if input is empty
      if (selectedEmployee) {
        setSelectedEmployee(null);
      }
      return;
    }

    // Clear employee selection if user types something different
    if (
      selectedEmployee &&
      selectedEmployee.id !== value &&
      selectedEmployee.name !== value
    ) {
      setSelectedEmployee(null);
    }

    // Don't show suggestions if we have a selected employee with matching ID/name
    if (
      selectedEmployee &&
      (selectedEmployee.id === value || selectedEmployee.name === value)
    ) {
      setSuggestions([]);
      return;
    }

    const filtered = employees.filter(
      (emp) =>
        emp.id.toLowerCase().includes(value.toLowerCase()) ||
        emp.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmpId(employee.id);
    setLetterContent((prev) => ({
      ...prev,
      name: `MR./MRS. ${employee.name.split(' ')[0].toUpperCase()}`,
      position: employee.role,
    }));
    // Clear suggestions immediately
    setSuggestions([]);
  };

  // Unified view handler — opens the correct modal based on selectedLetterType
  const handleViewLetter = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee first');
      return;
    }
    if (!selectedLetterType) {
      alert('Please select a letter type');
      return;
    }

    if (selectedLetterType === 'payslip') {
      // Payslip needs an API call
      await handleViewPayslip();
    } else {
      // All other letters open the generic letter modal
      setShowLetterModal(true);
    }
  };

  const handleViewOfferLetter = () => {
    if (!selectedEmployee) {
      alert('Please select an employee first');
      return;
    }
    setShowLetterModal(true);
  };

  // Re-fetch payslip data when month or year changes while modal is open
  useEffect(() => {
    if (showPayslipModal && selectedEmployee) {
      handleViewPayslip();
    }
  }, [payslipMonth, payslipYear]);

  // Add this function for viewing payslip
  const handleViewPayslip = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee first');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch('/api/hr/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          month: payslipMonth,
          year: payslipYear,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setPayslipData(data);
      setShowPayslipModal(true);
    } catch (err) {
      console.error(err);
      alert('Error generating payslip: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get the current letter type label for display
  const getSelectedLetterLabel = () => {
    const found = LETTER_TYPES.find((lt) => lt.id === selectedLetterType);
    return found ? found.label : '';
  };

  // Get the modal title based on selected letter type
  const getModalTitle = () => {
    return getSelectedLetterLabel() || 'Letter Preview';
  };

  // Render the correct letter component based on selectedLetterType
  const renderLetterComponent = () => {
    switch (selectedLetterType) {
      case 'offerLetter':
        return (
          <OfferLetterSimple
            letterPadOption={letterPadOption}
            employee={selectedEmployee}
            letterContent={letterContent}
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      case 'warningLetter':
        return (
          <WarningLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      case 'terminationLetter':
        return (
          <TerminationLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      case 'appointmentLetter':
        return (
          <AppointmentLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      case 'experienceLetter':
        return (
          <ExperienceLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      case 'relievingLetter':
        return (
          <RelievingLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
          />
        );
      default:
        return null;
    }
  };

  // These functions now simply call the imported functions
  const handlePrintOfferLetter = () => {
    handlePrint('offerLetter');
  };

  const handlePrintPayslip = () => {
    handlePrint('payslip');
  };

  const handleDownloadOfferLetter = () => {
    handleDownloadPDF(selectedEmployee, letterPadOption);
  };

  const handleDownloadPayslip = () => {
    handleDownloadPayslipPDF(selectedEmployee, letterPadOption);
  };

  // Your existing handlers
  const handleEmailOfferLetter = () => {
    handleSendEmail(selectedEmployee, letterContent);
  };

  // New handler for payslip
  const handleEmailPayslip = () => {
    handleSendPayslipEmail(selectedEmployee);
  };

  const handleGeneratePayslip = () => {
    // This function can be used to fetch or generate payslip data
    // based on selected month and year
    // You can update the payslip data here based on the selected month/year
    // For example, you might fetch from an API or update local state
  };

  const handleLetterContentChange = (field, value) => {
    setLetterContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      key={isLoading}
      className="px-1 no-scroll text-gray-900 animate-dashboard-reveal"
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader
            label="Loading offer letter module..."
            size="md"
            fullScreen={false}
          />
        </div>
      ) : (
        <>
          {/* Offer Letter Content */}
            <div className="space-y-6 mt-4">
          {/* 1. Employee Selection with Suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Employee ID or Name
            </label>
            <input
              type="text"
              value={empId}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type employee ID or name..."
              className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto no-scroll">
                {suggestions.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{emp.id}</div>
                    <div className="text-sm text-gray-600">
                      {emp.name} - {emp.role}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {employees.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No employees found. Make sure your Redux store is populated.
              </p>
            )}
          </div>

          {/* 2. Employee Details Display */}
          {selectedEmployee && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-3">
                Employee Details
              </h3>
              <div className="flex ">
                {/* Name - Label centered, value left-aligned */}
                <div className="flex-1 px-4 py-3">
                  <span className="text-sm text-gray-500 block mb-1">
                    Name:
                  </span>
                  <p className="font-medium text-left truncate">
                    {selectedEmployee.name}
                  </p>
                </div>

                {/* Role - Label centered, value centered */}
                <div className="flex-1 px-4 py-3">
                  <span className="text-sm text-gray-500 block mb-1">
                    Role:
                  </span>
                  <p className="font-medium truncate">
                    {selectedEmployee.role}
                  </p>
                </div>

                {/* Email - Label centered, value centered */}
                <div className="flex-1 px-4 py-3">
                  <span className="text-sm text-gray-500 block mb-1">
                    Email:
                  </span>
                  <p className="font-medium truncate">
                    {selectedEmployee.email}
                  </p>
                </div>

                {/* Phone - Label centered, value left-aligned */}
                <div className="flex-1 px-4 py-3">
                  <span className="text-sm text-gray-500 block mb-1">
                    Phone:
                  </span>
                  <p className="font-medium truncate">
                    {selectedEmployee.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Letter Type Selection Dropdown */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">
              Select Letter Type
            </h3>
            <div className="relative w-80">
              <select
                value={selectedLetterType}
                onChange={(e) => setSelectedLetterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer pr-10"
              >
                <option value="" disabled>
                  -- Select a letter type --
                </option>
                {LETTER_TYPES.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>

          {/* 4. Radio Buttons for Letter Pad */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">
              Letter Pad Options
            </h3>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="with"
                  checked={letterPadOption === 'with'}
                  onChange={(e) => setLetterPadOption(e.target.value)}
                  className="mr-2"
                />
                <span>With Letter Pad (Company Logo)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="without"
                  checked={letterPadOption === 'without'}
                  onChange={(e) => setLetterPadOption(e.target.value)}
                  className="mr-2"
                />
                <span>Without Letter Pad (No Logo)</span>
              </label>
            </div>
          </div>

          {/* 5. Single View Button */}
          <div className="pt-4 gap-4 flex">
            <PrimaryButton
              onClick={handleViewLetter}
              disabled={isGenerating || !selectedLetterType}
              className="px-6 py-3 bg-[#004475] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                `View ${getSelectedLetterLabel() || 'Letter'}`
              )}
            </PrimaryButton>
          </div>
        </div>
      <CustomModalForm
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        title="Invoice Preview"
        widthClass="max-w-6xl"
        headerActions={
          <>
            <IconButton
              onClick={() => window.print()}
              className="bg-gray-600 hover:bg-blue-500"
              title="Print Invoice"
            >
              <Printer size={18} />
            </IconButton>

            <IconButton
              onClick={() => {
                // Handle download logic here
              }}
              className="bg-gray-600 hover:bg-green-500"
              title="Download Invoice"
            >
              <Download size={18} />
            </IconButton>

            <IconButton
              onClick={() => {
                // Handle email logic here
              }}
              className="bg-gray-600 hover:bg-purple-500"
              title="Email Invoice"
            >
              <Mail size={18} />
            </IconButton>
          </>
        }
      >
        <div className="flex-1 overflow-auto p-6 printable">
          {/* Preview Content would go here */}
        </div>
      </CustomModalForm>

      {/* Generic Letter Modal (for all letter types except payslip) */}
      <CustomModalForm
        open={showLetterModal}
        onCancel={() => setShowLetterModal(false)}
        title={null}
        widthClass="max-w-4xl"
        headerActions={
          <>
            <IconButton
              onClick={handlePrintOfferLetter}
              className="hover:bg-blue-400"
              title={`Print ${getSelectedLetterLabel()}`}
            >
              <Printer size={18} />
            </IconButton>

            <IconButton
              onClick={handleDownloadOfferLetter}
              className="hover:bg-green-400"
              title={`Download ${getSelectedLetterLabel()}`}
            >
              <Download size={18} />
            </IconButton>

            <IconButton
              onClick={() => handleSendEmail(selectedEmployee, letterContent)}
              className="hover:bg-purple-400"
              title={`Email ${getSelectedLetterLabel()}`}
            >
              <Mail size={18} />
            </IconButton>
          </>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 no-scroll">
          <div className="flex justify-center">
            {renderLetterComponent()}
          </div>
          <div className="pt-4 text-center text-sm text-gray-600 print:hidden">
            <p>
              This is a computer generated {getSelectedLetterLabel()}. No signature is required.
            </p>
            <p className="mt-1">
              Generated on: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </CustomModalForm>

      {/* Payslip Modal */}
      <CustomModalForm
        open={showPayslipModal}
        onCancel={() => setShowPayslipModal(false)}
        widthClass="max-w-4xl"
        title={
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 font-normal text-base">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-800">Month :</label>
              <select
                value={payslipMonth}
                onChange={(e) => setPayslipMonth(e.target.value)}
                className="px-1 py-2 border border-gray-300 text-black rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-800">Year :</label>
              <select
                value={payslipYear}
                onChange={(e) => setPayslipYear(Number(e.target.value))}
                className="px-1 py-2 border border-gray-300 rounded-md text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        }
        headerActions={
          <>
            <IconButton
              onClick={handlePrintPayslip}
              className="hover:bg-blue-500"
              title="Print Payslip"
            >
              <Printer size={18} />
            </IconButton>

            <IconButton
              onClick={handleDownloadPayslip}
              className="hover:bg-green-500"
              title="Download Payslip"
            >
              <Download size={18} />
            </IconButton>

            <IconButton
              onClick={handleEmailPayslip}
              className="hover:bg-purple-500"
              title="Email Payslip"
            >
              <Mail size={18} />
            </IconButton>
          </>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 no-scroll">
          <div className="flex justify-center">
            <PaySlip
              employeeData={selectedEmployee}
              payslipData={payslipData}
              letterPad={letterPadOption}
              month={payslipMonth}
              year={payslipYear}
            />
          </div>
          <div className="pt-4 text-center text-sm text-gray-600 print:hidden">
            <p>
              This is a computer generated payslip. No signature is required.
            </p>
            <p className="mt-1">
              Generated on: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
      </CustomModalForm>
    </>
  )}
</div>
  );
};

export default OfferLetterTab;
