'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Printer, Download, Mail, ChevronDown, User, FileText } from 'lucide-react';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../CustomAlertForm';
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
  {
    id: 'warningLetter',
    label: 'Warning Letter',
    printId: 'warning-letter-print',
  },
  {
    id: 'terminationLetter',
    label: 'Termination Letter',
    printId: 'termination-letter-print',
  },
  {
    id: 'appointmentLetter',
    label: 'Appointment Letter',
    printId: 'appointment-letter-print',
  },
  {
    id: 'experienceLetter',
    label: 'Experience Letter',
    printId: 'experience-letter-print',
  },
  {
    id: 'relievingLetter',
    label: 'Relieving Letter',
    printId: 'relieving-letter-print',
  },
  { id: 'payslip', label: 'Payslip', printId: 'payslip' },
];

const mapToCanonicalId = (labelOrValue) => {
  const norm = (labelOrValue || '').toLowerCase().replace(/\s+/g, '');
  if (norm.includes('offer')) return 'offerLetter';
  if (norm.includes('warning')) return 'warningLetter';
  if (norm.includes('termination')) return 'terminationLetter';
  if (norm.includes('appointment')) return 'appointmentLetter';
  if (norm.includes('experience')) return 'experienceLetter';
  if (norm.includes('relieving')) return 'relievingLetter';
  if (norm.includes('payslip')) return 'payslip';
  return labelOrValue;
};

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
  const suggestionsRef = useRef(null);
  const [selectedLetterType, setSelectedLetterType] = useState('');
  const [dynamicLetterTypes, setDynamicLetterTypes] = useState([]);
  const [isLetterTypeOpen, setIsLetterTypeOpen] = useState(false);
  const letterTypeRef = useRef(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
  });

  const showAlert = (title, message, type = 'warning') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchLetterTypes = async () => {
      try {
        const res = await fetch('/api/dropdowns?type=letter_type');
        if (res.ok) {
          const data = await res.json();
          const active = (data.data || []).filter(
            (item) => item.status !== 'inactive'
          );
          if (active.length > 0) {
            setDynamicLetterTypes(active);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch dynamic letter types:', err);
      }
      setDynamicLetterTypes(LETTER_TYPES);
    };
    fetchLetterTypes();
  }, []);
  const [letterPadOption, setLetterPadOption] = useState('with');
  const [letterPadType, setLetterPadType] = useState('type1');
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
          empId: emp.empId || emp.__raw?.empId || '',
          name: emp.name || '',
          role: emp.designation || emp.role || '', // Map designation to role
          email: emp.email || '',
          phone: emp.mobile || '',
          address: emp.address || emp.__raw?.presentAddress || '', // fallback to present address
          dateOfJoining: emp.dateOfJoining || emp.__raw?.dateOfJoining || null,
          employeeExit: emp.employeeExit || emp.__raw?.employeeExit || null,
          __raw: emp.__raw || emp,
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

  // Handle click outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle click outside letter type dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        letterTypeRef.current &&
        !letterTypeRef.current.contains(event.target)
      ) {
        setIsLetterTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (empId.trim() === '') {
      setSuggestions(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.id.toLowerCase().includes(empId.toLowerCase()) ||
          emp.name.toLowerCase().includes(empId.toLowerCase())
      );
      setSuggestions(filtered);
    }
  };

  // Handle click outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle click outside letter type dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        letterTypeRef.current &&
        !letterTypeRef.current.contains(event.target)
      ) {
        setIsLetterTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  

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
      showAlert(
        'Selection Required',
        'Please select an employee first.',
        'warning'
      );
      return;
    }
    if (!selectedLetterType) {
      showAlert(
        'Selection Required',
        'Please select a letter type.',
        'warning'
      );
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
      showAlert(
        'Selection Required',
        'Please select an employee first.',
        'warning'
      );
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
      showAlert(
        'Selection Required',
        'Please select an employee first.',
        'warning'
      );
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
      showAlert(
        'Generation Error',
        'Error generating payslip: ' + err.message,
        'danger'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Get the current letter type label for display
  const getSelectedLetterLabel = () => {
    const found = dynamicLetterTypes.find(
      (lt) => mapToCanonicalId(lt.value || lt.label) === selectedLetterType
    );
    if (found) return found.label;
    const fallbackLt = LETTER_TYPES.find((lt) => lt.id === selectedLetterType);
    return fallbackLt ? fallbackLt.label : '';
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
            letterPadType={letterPadType}
          />
        );
      case 'warningLetter':
        return (
          <WarningLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
            letterPadType={letterPadType}
          />
        );
      case 'terminationLetter':
        return (
          <TerminationLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
            letterPadType={letterPadType}
          />
        );
      case 'appointmentLetter':
        return (
          <AppointmentLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
            letterPadType={letterPadType}
          />
        );
      case 'experienceLetter':
        return (
          <ExperienceLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
            letterPadType={letterPadType}
          />
        );
      case 'relievingLetter':
        return (
          <RelievingLetter
            employeeData={selectedEmployee}
            letterPad={letterPadOption}
            letterPadType={letterPadType}
          />
        );
      default:
        return null;
    }
  };

  // These functions now simply call the imported functions
  const handlePrintOfferLetter = () => {
    handlePrint(selectedLetterType);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-1">
            {/* LEFT COLUMN: Controls */}
            <div className="space-y-6 sticky top-2 self-start">
              {/* 1. Employee Selection with Suggestions */}
             
             

              {/* 3. Letter Type Selection Dropdown */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Select Letter Type
                </h3>
                <div className="relative w-80" ref={letterTypeRef}>
                  <div
                    onClick={() => setIsLetterTypeOpen(!isLetterTypeOpen)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center cursor-pointer shadow-sm"
                  >
                    <span className={selectedLetterType ? "text-gray-900" : "text-gray-500"}>
                      {selectedLetterType ? getSelectedLetterLabel() : "-- Select a letter type --"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-500 transition-transform ${isLetterTypeOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isLetterTypeOpen && (
                    <div className="absolute top-full left-0 z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scroll">
                      {dynamicLetterTypes.map((lt) => {
                        const canonicalId = mapToCanonicalId(lt.value || lt.label);
                        const isSelected = selectedLetterType === canonicalId;
                        return (
                          <div
                            key={lt.id || canonicalId}
                            onClick={() => {
                              setSelectedLetterType(canonicalId);
                              setIsLetterTypeOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors ${
                              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {lt.label}
                              </div>
                              <div className="text-xs text-gray-500 font-medium mt-0.5">
                                Letter Template
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                    <span className={selectedLetterType ? "text-gray-900" : "text-gray-500"}>
                      {selectedLetterType ? getSelectedLetterLabel() : "-- Select a letter type --"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-gray-500 transition-transform ${isLetterTypeOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isLetterTypeOpen && (
                    <div className="absolute top-full left-0 z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scroll">
                      {dynamicLetterTypes.map((lt) => {
                        const canonicalId = mapToCanonicalId(lt.value || lt.label);
                        const isSelected = selectedLetterType === canonicalId;
                        return (
                          <div
                            key={lt.id || canonicalId}
                            onClick={() => {
                              setSelectedLetterType(canonicalId);
                              setIsLetterTypeOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors ${
                              isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {lt.label}
                              </div>
                              <div className="text-xs text-gray-500 font-medium mt-0.5">
                                Letter Template
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Employee Details Display */}
              {selectedEmployee && (
                <div className="mt-3">
                  <h3 className="font-medium text-gray-700 mb-3">
                    Employee Details
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-5">
                    {/* Name */}
                    <div className="px-1">
                      <span className="text-sm text-gray-500 block mb-1">
                        Name:
                      </span>
                      <p className="font-medium text-left truncate">
                        {selectedEmployee.name}
                      </p>
                    </div>

                    {/* Role */}
                    <div className="px-1">
                      <span className="text-sm text-gray-500 block mb-1">
                        Role:
                      </span>
                      <p className="font-medium truncate">
                        {selectedEmployee.role}
                      </p>
                    </div>

                    {/* Email */}
                    <div className="px-1">
                      <span className="text-sm text-gray-500 block mb-1">
                        Email:
                      </span>
                      <p className="font-medium truncate">
                        {selectedEmployee.email}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="px-1">
                      <span className="text-sm text-gray-500 block mb-1">
                        Phone Number:
                      </span>
                      <p className="font-medium truncate">
                        {selectedEmployee.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
 <div className="relative w-80" ref={suggestionsRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Employee ID or Name
                </label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onClick={handleInputFocus}
                  placeholder="Type employee ID or name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scroll">
                    {suggestions.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 shrink-0">
                           <User size={20} />
                        </div>
                        <div>
                           <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
                           <div className="text-xs text-gray-500 font-medium mt-0.5">ID: {emp.id}</div>
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
              {/* 4. Letter Pad Type & Options */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">
                  Letter Pad Type
                </h3>
                <div className="flex space-x-6 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="type1"
                      checked={letterPadType === 'type1'}
                      onChange={(e) => setLetterPadType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Type 1</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="type2"
                      checked={letterPadType === 'type2'}
                      onChange={(e) => setLetterPadType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Type 2</span>
                  </label>
                </div>

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

            {/* RIGHT COLUMN: Live Preview */}
            <div className="border border-gray-300 rounded-lg bg-gray-50 p-6 overflow-y-auto h-[calc(100vh-200px)] shadow-inner relative flex justify-center">
              {!selectedLetterType ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Select a letter type to see preview
                </div>
              ) : (
                <div className="w-full flex justify-center origin-top" style={{ transform: 'scale(0.85)' }}>
                  {renderLetterComponent() || (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Preview not available for this letter type
                    </div>
                  )}
                </div>
              )}
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
                  onClick={() =>
                    handleSendEmail(selectedEmployee, letterContent)
                  }
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
                  This is a computer generated {getSelectedLetterLabel()}. No
                  signature is required.
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
                  <label className="text-sm font-medium text-gray-800">
                    Month :
                  </label>
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
                  <label className="text-sm font-medium text-gray-800">
                    Year :
                  </label>
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
                  This is a computer generated payslip. No signature is
                  required.
                </p>
                <p className="mt-1">
                  Generated on: {new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </CustomModalForm>

          <CustomAlertForm
            isOpen={alertState.isOpen}
            onClose={closeAlert}
            onConfirm={closeAlert}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            confirmText="OK"
            cancelText="Close"
          />
        </>
      )}
    </div>
  );
};

export default OfferLetterTab;
