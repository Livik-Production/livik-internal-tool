'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import CustomModalForm from '../../CustomModalForm';

export default function MarkAttendanceModal({
  isOpen,
  onClose,
  employees = [],
  onSave,
  month = new Date().toISOString().slice(0, 7),
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [dateOptions, setDateOptions] = useState([]);
  const [isDateListOpen, setIsDateListOpen] = useState(false);
  const [existingDetailedData, setExistingDetailedData] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Generate date options when month changes (exclude future dates)
  useEffect(() => {
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const options = [];

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, monthNum - 1, day);
      // Skip future dates
      if (date > today) continue;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = `${year}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      options.push({
        value: dateStr,
        label: `${day.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year} - ${dayName}`,
      });
    }
    setDateOptions(options);

    // Default to today if in current month, else last available day
    const n = new Date();
    const todayStr = `${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}`;
    if (options.some((o) => o.value === todayStr)) {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(options[options.length - 1]?.value || '');
    }
  }, [month, isOpen]);

  // Client-side mounting check for Portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch detailed attendance for the month when isOpen
  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!isOpen || !month) return;
      setFetchingData(true);
      try {
        const res = await fetch(
          `/api/hr/attendance?month=${month}&detailed=true`
        );
        if (res.ok) {
          const detail = await res.json();
          setExistingDetailedData(detail);
        }
      } catch (error) {
        console.error('Error fetching detailed attendance for modal:', error);
      } finally {
        setFetchingData(false);
      }
    };
    fetchDetailedData();

    // Listen for refresh event
    const refreshHandler = () => fetchDetailedData();
    window.addEventListener('refresh-attendance-data', refreshHandler);
    return () => {
      window.removeEventListener('refresh-attendance-data', refreshHandler);
    };
  }, [isOpen, month]);

  // Fetch approved leaves for the month when isOpen
  useEffect(() => {
    const fetchLeaves = async () => {
      if (!isOpen || !month) return;
      try {
        // Fetch leaves for the entire month
        const [year, monthNum] = month.split('-').map(Number);
        const fromDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const toDate = `${year}-${monthNum.toString().padStart(2, '0')}-${new Date(year, monthNum, 0).getDate()}`;

        const res = await fetch(
          `/api/leave?status=APPROVED&fromDate=${fromDate}&toDate=${toDate}`
        );
        if (res.ok) {
          const leaves = await res.json();
          setApprovedLeaves(leaves);
        }
      } catch (error) {
        console.error('Error fetching approved leaves for modal:', error);
      }
    };
    fetchLeaves();

    // Listen for refresh event
    const refreshHandler = () => fetchLeaves();
    window.addEventListener('refresh-attendance-data', refreshHandler);
    return () => {
      window.removeEventListener('refresh-attendance-data', refreshHandler);
    };
  }, [isOpen, month]);

  // Initialize attendance data when employees change, modal opens, or selected date/fetched data changes
  useEffect(() => {
    if (isOpen && employees.length > 0 && selectedDate) {
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      const filteredByJoining = employees.filter((emp) => {
        const joiningStr = emp.__raw?.dateOfJoining;
        if (!joiningStr) return true;

        const joiningDate = new Date(joiningStr);
        joiningDate.setHours(0, 0, 0, 0);

        return joiningDate <= selected;
      });

      const initialData = filteredByJoining.map((emp) => {
        const empId = emp.empId || emp.id;
        const dbId = emp.__raw?.id || emp.id;

        // 1. Check for approved leaves (Leave takes precedence)
        const matchingLeave = approvedLeaves.find((leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const current = new Date(selectedDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          current.setHours(0, 0, 0, 0);
          return (
            leave.employeeId === dbId && current >= start && current <= end
          );
        });

        // 2. Check for existing attendance in fetched data (Persistence)
        const existingEmp = existingDetailedData.find((e) => e.empId === empId);
        let status = 'Present'; // Default
        let remarks = '';

        if (matchingLeave) {
          status = matchingLeave.isHalfDay ? 'Half Day' : 'Absent';
          remarks = 'Approved Leave';
        } else if (existingEmp && existingEmp.dailyAttendance[selectedDate]) {
          const s = existingEmp.dailyAttendance[selectedDate];
          if (s === 'P') status = 'Present';
          else if (s === 'A') status = 'Absent';
          else if (s === 'HD') status = 'Half Day';
          else if (s === 'CH') status = 'Company Holiday';

          if (
            existingEmp.dailyRemarks &&
            existingEmp.dailyRemarks[selectedDate]
          ) {
            remarks = existingEmp.dailyRemarks[selectedDate];
          }
        }

        return {
          empId,
          dbId,
          name: emp.name || `${emp.firstName} ${emp.lastName}`,
          status,
          remarks,
        };
      });
      setAttendanceData(initialData);
    } else if (isOpen && employees.length === 0) {
      setAttendanceData([]);
    }
  }, [isOpen, employees, selectedDate, existingDetailedData, approvedLeaves]);

  const handleStatusChange = (empId, status) => {
    setAttendanceData((prev) => {
      const newData = prev.map((item) => {
        if (item.empId === empId) {
          return { ...item, status };
        }
        return item;
      });

      // Special logic for February 14, 2026: if Absent is selected, save and close
      if (selectedDate === '2026-02-14' && status === 'Absent') {
        // Delaying slightly to allow state update to reflect or just call onSave with updated array
        const updatedRecord = newData.find((item) => item.empId === empId);
        if (updatedRecord) {
          // We call handleSave with the NEW data directly to avoid waiting for state sync
          onSave(selectedDate, newData);
          onClose();
        }
      }

      return newData;
    });
  };

  const handleMarkAllPresent = () => {
    const filteredIds = new Set(filteredData.map((item) => item.empId));
    setAttendanceData((prev) =>
      prev.map((item) => {
        if (filteredIds.has(item.empId)) {
          // Check if this employee has an approved leave for the selected date
          const hasLeave = approvedLeaves.some((leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const current = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            current.setHours(0, 0, 0, 0);
            return (
              leave.employeeId === item.dbId &&
              current >= start &&
              current <= end
            );
          });

          if (hasLeave) {
            return item; // Skip those on leave
          }
          return { ...item, status: 'Present' };
        }
        return item;
      })
    );
  };

  const handleChange = (index, field, value) => {
    const newData = [...attendanceData];
    newData[index][field] = value;
    setAttendanceData(newData);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSave(selectedDate, attendanceData);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const filteredData = attendanceData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.empId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const footerContent = (
    <div className="flex justify-end gap-3 w-full">
      <Button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium bg-white hover:bg-gray-50"
      >
        Cancel
      </Button>
      <PrimaryButton
        onClick={handleSave}
        disabled={submitting}
        className={`px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 ${submitting ? 'bg-[#004475] cursor-not-allowed' : 'bg-[#004475] hover:bg-[#004475]'} text-white`}
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? 'Saving...' : 'Save Attendance'}
      </PrimaryButton>
    </div>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      title="Mark Daily Attendance"
      widthClass="max-w-5xl"
      footer={footerContent}
    >
      <div className="flex flex-col h-full">
        {/* Controls */}
        <div className="px-4 py-2.5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-300 shrink-0">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <div
              className={`w-full appearance-none border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer flex justify-between items-center ${
                isDateListOpen
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsDateListOpen(!isDateListOpen)}
            >
              <span className="truncate">
                {dateOptions.find((o) => o.value === selectedDate)?.label ||
                  'Select Date'}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform flex-shrink-0 ${isDateListOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {isDateListOpen && (
              <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                {dateOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedDate === opt.value
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedDate(opt.value);
                      setIsDateListOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative pt-6">
            {' '}
            {/* pt-6 to align with input label */}
            <Search className="absolute left-3 top-8 h-4 w-4 mt-1.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchQuery && (
              <IconButton
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-8 shadow-none bg-transparent hover:bg-transparent"
                title="Clear search"
              >
                <X size={14} className="text-red-400 hover:text-red-600" />
              </IconButton>
            )}
          </div>
          <div className="text-right pt-6">
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-0 no-scrollbar min-h-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((row, index) => (
                <tr key={row.empId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {row.name}
                    </div>
                    <div className="text-xs text-gray-500">{row.empId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {['Present', 'Absent', 'Half Day', 'Company Holiday'].map(
                        (status) => (
                          <label
                            key={status}
                            className="inline-flex items-center cursor-pointer"
                          >
                            <input
                              type="radio"
                              name={`status-${row.empId}`}
                              checked={row.status === status}
                              onChange={() =>
                                handleStatusChange(row.empId, status)
                              }
                              className="sr-only peer"
                            />
                            <span
                              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                row.status === status
                                  ? status === 'Present'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : status === 'Absent'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : status === 'Company Holiday'
                                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {status}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Optional remarks"
                      value={row.remarks || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttendanceData((prev) =>
                          prev.map((item) =>
                            item.empId === row.empId
                              ? { ...item, remarks: val }
                              : item
                          )
                        );
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CustomModalForm>
  );
}
