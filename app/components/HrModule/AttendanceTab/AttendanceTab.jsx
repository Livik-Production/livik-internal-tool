import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import { showSuccessToast, showErrorToast } from '../../Toast';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CustomTable from '../../CustomTable';
import Pagination from '../../Pagination';
import {
  SquarePen,
  Trash,
  CalendarPlus,
  Search,
  ChevronDown,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import MarkAttendanceModal from './MarkAttendanceModal';
import AttendanceDetailedModal from './AttendanceDetailedModal';
import Loader from '../../Loader';
import ConfirmDialog from '../../ConfirmDialog';

export default function AttendanceTab({
  canControlAllEmployees,
  employees = [],
  isAdmin = false,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailedModalOpen, setIsDetailedModalOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initialize with current month and year
  const now = new Date();
  const [selectedMonthNum, setSelectedMonthNum] = useState(
    (now.getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear().toString()
  );

  // selectedMonth (YYYY-MM) for data fetching sync
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  );

  // Update selectedMonth when year or monthNum changes
  useEffect(() => {
    setSelectedMonth(`${selectedYear}-${selectedMonthNum}`);
  }, [selectedYear, selectedMonthNum]);

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Dynamic year options from 2025 to current year
  const yearOptions = [];
  const startYear = 2025;
  const currentYear = now.getFullYear();
  for (let y = currentYear; y >= startYear; y--) {
    yearOptions.push(y.toString());
  }

  // Filter months based on range: Sep-2025 to Current Month
  const filteredMonthOptions = monthOptions.filter((m) => {
    const monthVal = parseInt(m.value);
    const selectedYearInt = parseInt(selectedYear);
    const currentMonthNum = now.getMonth() + 1;

    if (selectedYearInt === 2025) {
      return monthVal >= 9;
    }
    if (selectedYearInt === currentYear) {
      return monthVal <= currentMonthNum;
    }
    return true;
  });

  // Ensure selectedMonthNum is valid for the current selectedYear
  useEffect(() => {
    const isAvailable = filteredMonthOptions.some(
      (m) => m.value === selectedMonthNum
    );
    if (!isAvailable && filteredMonthOptions.length > 0) {
      // Default to the last available month in the list
      setSelectedMonthNum(
        filteredMonthOptions[filteredMonthOptions.length - 1].value
      );
    }
  }, [selectedYear, filteredMonthOptions, selectedMonthNum]);

  // Local Search State
  const [localSearch, setLocalSearch] = useState('');

  // Fetch available months for dropdown
  const fetchAvailableMonths = async () => {
    // Logic for dynamic months selection is replaced by static month/year filters
  };

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/attendance?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to fetch attendance data');
      const summary = await res.json();
      setData(summary);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when month changes
  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth]);

  // Listen for cross-component triggers to refresh attendance data
  useEffect(() => {
    const refreshHandler = () => fetchAttendanceData();
    window.addEventListener('refresh-attendance-data', refreshHandler);
    return () => {
      window.removeEventListener('refresh-attendance-data', refreshHandler);
    };
  }, [selectedMonth]); // Relies on selectedMonth to fetch correct data

  const handleSaveAttendance = async (date, newRecords) => {
    try {
      // Map records to API format
      const records = newRecords.map((r) => {
        // Find employee in props.employees (Redux uiRow objects)
        const emp = employees.find(
          (e) => e.id === r.empId || e.__raw?.empId === r.empId
        );
        return {
          employeeId: r.dbId || emp?.__raw?.id || emp?.id || r.empId,
          status: r.status.toUpperCase().replace(/ /g, '_'), // "Half Day" -> "HALF_DAY"
          remarks: r.remarks || null,
        };
      });

      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, records }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');

      const result = await res.json();
      showSuccessToast(result.message || 'Attendance marked successfully!');

      // Refresh data
      fetchAttendanceData();
      window.dispatchEvent(new CustomEvent('refresh-attendance-data'));
    } catch (err) {
      showErrorToast('Error saving attendance: ' + err.message);
    }
  };

  /* Edit Modal State */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [isDateOptionsOpen, setIsDateOptionsOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editApprovedLeaves, setEditApprovedLeaves] = useState([]);
  const [editDetailedData, setEditDetailedData] = useState([]);

  const [currentEditData, setCurrentEditData] = useState({
    empId: '',
    dbId: '',
    name: '',
    date: '',
    status: 'Present',
    remarks: '',
  });

  // Fetch approved leaves and detailed attendance when edit modal opens
  useEffect(() => {
    if (!isEditModalOpen || !selectedMonth) return;

    const fetchEditLeaves = async () => {
      try {
        const [year, monthNum] = selectedMonth.split('-').map(Number);
        const fromDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const toDate = `${year}-${monthNum.toString().padStart(2, '0')}-${new Date(year, monthNum, 0).getDate()}`;
        const res = await fetch(
          `/api/leave?status=APPROVED&fromDate=${fromDate}&toDate=${toDate}`
        );
        if (res.ok) {
          const leaves = await res.json();
          setEditApprovedLeaves(leaves);
        }
      } catch (error) {
        console.error('Error fetching approved leaves for edit modal:', error);
      }
    };

    const fetchEditDetailed = async () => {
      try {
        const res = await fetch(
          `/api/hr/attendance?month=${selectedMonth}&detailed=true`
        );
        if (res.ok) {
          const detail = await res.json();
          setEditDetailedData(detail);
        }
      } catch (error) {
        console.error(
          'Error fetching detailed attendance for edit modal:',
          error
        );
      }
    };

    fetchEditLeaves();
    fetchEditDetailed();
  }, [isEditModalOpen, selectedMonth]);

  // Helper: check if employee has approved leave on a given date
  const checkEmployeeLeave = (empId, dateStr) => {
    const emp = employees.find(
      (e) => e.id === empId || e.__raw?.empId === empId || e.empId === empId
    );
    const dbEmployeeId = emp?.__raw?.id || emp?.id;
    return editApprovedLeaves.find((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const current = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);
      return (
        leave.employeeId === dbEmployeeId && current >= start && current <= end
      );
    });
  };

  // Helper: get existing saved status for an employee on a date
  const getExistingStatus = (empId, dateStr) => {
    const existingEmp = editDetailedData.find((e) => e.empId === empId);
    if (
      existingEmp &&
      existingEmp.dailyAttendance &&
      existingEmp.dailyAttendance[dateStr]
    ) {
      const s = existingEmp.dailyAttendance[dateStr];
      if (s === 'P') return 'Present';
      if (s === 'A') return 'Absent';
      if (s === 'HD') return 'Half Day';
      if (s === 'CH') return 'Company Holiday';
    }
    return null; // No existing record
  };

  // Helper: get existing saved remarks for an employee on a date
  const getExistingRemarks = (empId, dateStr) => {
    const existingEmp = editDetailedData.find((e) => e.empId === empId);
    if (
      existingEmp &&
      existingEmp.dailyRemarks &&
      existingEmp.dailyRemarks[dateStr]
    ) {
      return existingEmp.dailyRemarks[dateStr];
    }
    return '';
  };

  // Update status when date changes — check existing attendance first, then approved leaves
  useEffect(() => {
    if (!isEditModalOpen || !currentEditData.date || !currentEditData.empId)
      return;

    const matchingLeave = checkEmployeeLeave(
      currentEditData.empId,
      currentEditData.date
    );

    if (matchingLeave) {
      // Approved leave takes top priority
      setCurrentEditData((prev) => ({
        ...prev,
        status: matchingLeave.isHalfDay ? 'Half Day' : 'Absent',
        remarks: 'Approved Leave',
      }));
      return;
    }

    // Check for existing saved attendance status
    const existingStatus = getExistingStatus(
      currentEditData.empId,
      currentEditData.date
    );
    const existingRemarks = getExistingRemarks(
      currentEditData.empId,
      currentEditData.date
    );
    if (existingStatus) {
      setCurrentEditData((prev) => ({
        ...prev,
        status: existingStatus,
        remarks:
          existingRemarks ||
          (prev.remarks === 'Approved Leave' ? '' : prev.remarks),
      }));
    } else {
      // No existing record and no leave — default to Present
      setCurrentEditData((prev) => ({
        ...prev,
        status: 'Present',
        remarks: prev.remarks === 'Approved Leave' ? '' : prev.remarks,
      }));
    }
  }, [
    currentEditData.date,
    currentEditData.empId,
    editApprovedLeaves,
    editDetailedData,
    isEditModalOpen,
  ]);

  const handleEdit = (id) => {
    const summaryRow = data.find((r) => r.id === id);
    if (summaryRow) {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const firstDayOfMonth = `${selectedMonth}-01`;
      const initialDate = today.startsWith(selectedMonth)
        ? today
        : firstDayOfMonth;

      // Determine initial status: approved leave > existing saved > default Present
      const matchingLeave = checkEmployeeLeave(summaryRow.empId, initialDate);
      let initialStatus = 'Present';
      let initialRemarks = '';

      if (matchingLeave) {
        initialStatus = matchingLeave.isHalfDay ? 'Half Day' : 'Absent';
        initialRemarks = 'Approved Leave';
      } else {
        const existingStatus = getExistingStatus(summaryRow.empId, initialDate);
        const existingRemarks = getExistingRemarks(
          summaryRow.empId,
          initialDate
        );
        if (existingStatus) {
          initialStatus = existingStatus;
          initialRemarks = existingRemarks || '';
        }
      }

      setCurrentEditData({
        empId: summaryRow.empId,
        dbId: summaryRow.id,
        name: summaryRow.name,
        date: initialDate,
        status: initialStatus,
        remarks: initialRemarks,
      });
      setDateSearchQuery('');
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!currentEditData.date) {
        showErrorToast('Please select a valid date');
        return;
      }

      setEditSaving(true);

      // Find original DB ID for the employee
      const emp = employees.find(
        (e) =>
          e.id === currentEditData.empId ||
          e.__raw?.empId === currentEditData.empId ||
          e.empId === currentEditData.empId
      );
      const dbEmployeeId = emp?.__raw?.id || emp?.id;

      if (!dbEmployeeId) {
        console.error('Employee not found in props:', currentEditData.empId);
      }

      const record = {
        employeeId:
          currentEditData.dbId || dbEmployeeId || currentEditData.empId,
        status: currentEditData.status.toUpperCase().replace(/ /g, '_'),
        remarks: currentEditData.remarks || null,
      };

      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: currentEditData.date,
          records: [record],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update attendance');
      }

      showSuccessToast('Attendance updated successfully!');
      setIsEditModalOpen(false);
      fetchAttendanceData();
    } catch (err) {
      showErrorToast('Error: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // Generate date options for the current selected month
  const getEditDateOptions = () => {
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const options = [];
    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = `${year}-${monthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      options.push({
        value: dateStr,
        label: `${day.toString().padStart(2, '0')}/${monthNum.toString().padStart(2, '0')}/${year} - ${dayName}`,
      });
    }
    return options;
  };

  // Confirm delete dialog state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = (id) => {
    const row = data.find((r) => r.id === id);
    setConfirmDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const performDelete = () => {
    setData((prev) => prev.filter((r) => r.id !== confirmDeleteId));
    showSuccessToast('Attendance record deleted successfully!');
    setConfirmDeleteOpen(false);
    setConfirmDeleteId(null);
  };

  // Filter based on search query
  const filteredData = data.filter((row) => {
    const query = localSearch.toLowerCase();
    return (
      row.name.toLowerCase().includes(query) ||
      row.empId.toLowerCase().includes(query)
    );
  });

  // Reset pagination when filtered data length or selected month changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length, selectedMonth]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const columns = [
    { key: 'empId', label: 'Emp ID', className: 'font-medium text-gray-900' },
    { key: 'name', label: 'Name', className: 'text-gray-700' },
    {
      key: 'workingDays',
      label: 'Actual Working Days',
      className: 'text-center',
    },
    {
      key: 'presentDays',
      label: 'No. of Present Days',
      className: 'text-center',
    },
    {
      key: 'absentDays',
      label: 'No. of Absent Days',
      className: 'text-center',
    },
    {
      key: 'lopDays',
      label: 'LOP',
      className: 'text-center font-semibold text-red-600',
    },
    {
      key: 'status',
      label: 'Status Counts',
      render: (row) => (
        <div className="flex gap-2 justify-center">
          <span
            className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
            title="Present"
          >
            P: {row.counts.P}
          </span>
          <span
            className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
            title="Absent"
          >
            A: {row.counts.A}
          </span>
          <span
            className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium"
            title="Half Day"
          >
            HD: {row.counts.HD}
          </span>
          <span
            className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium"
            title="Company Holiday"
          >
            CH: {row.counts.CH}
          </span>
        </div>
      ),
    },
  ];

  const Actions = (row) => {
    return (
      <div className="flex justify-end gap-2">
        <IconButton
          onClick={() => handleEdit(row.id)}
          className={`p-1.5 rounded-full transition-colors ${
            !canControlAllEmployees
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={
            !canControlAllEmployees ? 'Edit access required' : 'Edit Record'
          }
          disabled={!canControlAllEmployees}
        >
          <SquarePen />
        </IconButton>

        <IconButton
          onClick={() => isAdmin && handleDelete(row.id)}
          className={`p-1.5 rounded-full transition-colors ${
            !isAdmin
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
          }`}
          title={!isAdmin ? 'Delete access restricted for HR' : 'Delete Record'}
          disabled={!isAdmin}
        >
          <Trash />
        </IconButton>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-3">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          {localSearch && (
            <IconButton
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-2 shadow-none bg-transparent hover:bg-transparent"
              title="Clear search"
            >
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </IconButton>
          )}
        </div>

        {/* Month Dropdown - Custom */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Month :</span>
          <div className="relative min-w-[160px]">
            <div
              className={`w-full border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer flex justify-between items-center gap-2 ${
                isMonthDropdownOpen
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              <span>
                {filteredMonthOptions.find((m) => m.value === selectedMonthNum)
                  ?.label || 'Select Month'}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>
            {isMonthDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[998]"
                  onClick={() => setIsMonthDropdownOpen(false)}
                />
                <div className="absolute z-[999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[200px] overflow-y-auto no-scrollbar">
                  {filteredMonthOptions.map((m) => (
                    <div
                      key={m.value}
                      className={`px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedMonthNum === m.value
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedMonthNum(m.value);
                        setIsMonthDropdownOpen(false);
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Year Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Year :</span>
          <div className="relative min-w-[100px]">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer pr-10"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Summary View Button */}
        <button
          onClick={() => setIsDetailedModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition text-sm font-medium whitespace-nowrap"
        >
          <FileText size={18} />
          Summary View
        </button>

        {/* Mark Attendance Button */}
        {canControlAllEmployees && (
          <PrimaryButton
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#004475] text-white rounded-lg hover:bg-[#004475] shadow-sm transition text-sm font-medium whitespace-nowrap"
          >
            <CalendarPlus size={18} />
            Mark Attendance
          </PrimaryButton>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 shadow-inner bg-white">
        {loading ? (
          <div className="p-8">
            <Loader
              label="Loading attendance data..."
              size="md"
              fullScreen={false}
            />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-semibold">Error loading attendance</p>
            <p className="text-sm mt-2">{error}</p>
            <PrimaryButton
              onClick={fetchAttendanceData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </PrimaryButton>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm mt-2">Mark attendance to see summary here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CustomTable
              columns={columns}
              data={paginatedData}
              rowKey="id"
              actions={(row) => Actions(row)}
              actionsHeader="Actions"
              actionsAlign="right"
            />
            <Pagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newVal) => {
                setItemsPerPage(newVal);
                setCurrentPage(1);
              }}
              rowsPerPageOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        )}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex gap-6">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> P :
            Present
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div> A : Absent
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div> HD : Half
            Day
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>Company
            Holiday
          </span>
        </div>
      </section>

      <MarkAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={
          employees.length > 0
            ? employees
            : data.map((d) => ({ id: d.id, empId: d.empId, name: d.name }))
        }
        onSave={handleSaveAttendance}
        month={selectedMonth}
      />

      <AttendanceDetailedModal
        isOpen={isDetailedModalOpen}
        onClose={() => setIsDetailedModalOpen(false)}
        month={selectedMonth}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={performDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setConfirmDeleteId(null);
        }}
      />
      {/* Edit Record Modal */}
      {isEditModalOpen &&
        currentEditData &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Attendance Record
                </h3>
                <CloseButton onClick={() => setIsEditModalOpen(false)} />
              </div>

              <div className="p-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      value={currentEditData.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search or select date..."
                        value={
                          dateSearchQuery ||
                          getEditDateOptions().find(
                            (o) => o.value === currentEditData.date
                          )?.label ||
                          ''
                        }
                        onFocus={() => setIsDateOptionsOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setIsDateOptionsOpen(false), 200)
                        }
                        onChange={(e) => {
                          setDateSearchQuery(e.target.value);
                          setIsDateOptionsOpen(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      />
                      {isDateOptionsOpen && (
                        <div className="absolute z-[10000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {getEditDateOptions()
                            .filter((opt) =>
                              opt.label
                                .toLowerCase()
                                .includes(dateSearchQuery.toLowerCase())
                            )
                            .map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setCurrentEditData({
                                    ...currentEditData,
                                    date: opt.value,
                                  });
                                  setDateSearchQuery(opt.label);
                                  setIsDateOptionsOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${currentEditData.date === opt.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                              >
                                {opt.label}
                              </div>
                            ))}
                          {getEditDateOptions().filter((opt) =>
                            opt.label
                              .toLowerCase()
                              .includes(dateSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-400 text-center">
                              No dates found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Status
                    {checkEmployeeLeave(
                      currentEditData.empId,
                      currentEditData.date
                    ) && (
                      <span className="ml-2 text-xs text-red-500 font-normal">
                        (Locked — Approved Leave)
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Present', 'Absent', 'Half Day', 'Company Holiday'].map(
                      (status) => {
                        const hasLeave = checkEmployeeLeave(
                          currentEditData.empId,
                          currentEditData.date
                        );
                        const isDisabled = hasLeave;
                        return (
                          <label
                            key={status}
                            className={`inline-flex items-center ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <input
                              type="radio"
                              name="edit-status"
                              checked={currentEditData.status === status}
                              onChange={() =>
                                !isDisabled &&
                                setCurrentEditData({
                                  ...currentEditData,
                                  status,
                                })
                              }
                              disabled={isDisabled}
                              className="sr-only peer"
                            />
                            <span
                              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                                currentEditData.status === status
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
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    placeholder="Optional remarks..."
                    value={currentEditData.remarks}
                    onChange={(e) =>
                      setCurrentEditData({
                        ...currentEditData,
                        remarks: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
                  />
                </div>
              </div>

              <div className="px-4 py-3 flex justify-end gap-3 border-t border-gray-200">
                <PrimaryButton
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className={`px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 ${editSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#004475] hover:bg-[#004475]'} text-white`}
                >
                  {editSaving && <Loader2 size={16} className="animate-spin" />}
                  {editSaving ? 'Updating...' : 'Update Attendance'}
                </PrimaryButton>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
