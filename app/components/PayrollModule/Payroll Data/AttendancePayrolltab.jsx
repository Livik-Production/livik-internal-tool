'use client';

import { useState, useEffect } from 'react';
import CustomTable from '../../CustomTable';
import {
  SquarePen,
  Trash,
  CalendarPlus,
  Search,
  ChevronDown,
} from 'lucide-react';
import Loader from '../../Loader';
import { FileText } from 'lucide-react';
import CustomAlertForm from '../../CustomAlertForm';
import FilterDropdown from '../../Buttons/FilterDropdown';
import IconButton from '../../Buttons/IconButton';

export default function AttendanceTabContent({
  employees = [],
  canControlAllEmployees = true,
  selectedMonth,
  onMonthChange,
  onContinueToPayroll,
  onStatsCalculated,
  settings,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Alert / Confirm state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Close',
  });
  const showAlert = (title, message, type = 'info') =>
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: null,
      confirmText: 'OK',
      cancelText: 'Close',
    });
  const showConfirm = (title, message, onConfirm) =>
    setAlertModal({
      isOpen: true,
      title,
      message,
      type: 'danger',
      onConfirm,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  const [localSearch, setLocalSearch] = useState('');

  // Fetch attendance and calculated payroll data
  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          settings: settings,
        }),
      });

      if (!res.ok) throw new Error('Failed to calculate payroll data');

      const dataWithPayroll = await res.json();
      setData(dataWithPayroll);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when month changes
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, settings]);

  // Handle edit
  const handleEdit = (id) => {
    showAlert(
      'Edit Employee',
      `Edit functionality for employee ${id} will be available soon.`,
      'info'
    );
  };

  // Handle delete
  const handleDelete = (id) => {
    showConfirm(
      'Delete Record',
      'Are you sure you want to delete this attendance record?',
      () => {
        setData((prev) => prev.filter((r) => r.id !== id));
        closeAlert();
      }
    );
  };

  // Filter based on search query
  const filteredData = data.filter((row) => {
    const query = localSearch.toLowerCase();
    return (
      row.name.toLowerCase().includes(query) ||
      row.empId.toLowerCase().includes(query)
    );
  });

  // Calculate statistics including payroll totals
  const calculateStats = () => {
    if (data.length === 0)
      return {
        totalEmployees: 0,
        avgAttendance: 0,
        totalLopDays: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
      };

    const totalEmployees = data.length;
    const totalPresentDays = data.reduce(
      (acc, emp) => acc + (emp.presentDays || 0),
      0
    );
    const totalLopDays = data.reduce((acc, emp) => acc + (emp.lopDays || 0), 0);
    const avgAttendance = totalPresentDays / totalEmployees;

    // Calculate total payroll
    const totalGrossPay = data.reduce(
      (acc, emp) => acc + (emp._rawGrossPay || 0),
      0
    );
    const totalNetPay = data.reduce(
      (acc, emp) => acc + (emp._rawNetPay || 0),
      0
    );

    return {
      totalEmployees,
      avgAttendance: Math.round(avgAttendance * 100) / 100,
      totalLopDays,
      totalGrossPay,
      totalNetPay,
    };
  };

  // Notify parent of stats when they change
  useEffect(() => {
    if (onStatsCalculated && data.length > 0) {
      onStatsCalculated(calculateStats());
    }
  }, [data]);

  const stats = calculateStats();

  const columns = [
    { key: 'empId', label: 'Emp ID', className: 'font-medium text-gray-900' },
    { key: 'name', label: 'Name', className: 'text-gray-700' },
    { key: 'workingDays', label: 'Working Days', className: 'text-center' },
    { key: 'presentDays', label: 'Present Days', className: 'text-center' },
    { key: 'absentDays', label: 'Absent Days', className: 'text-center' },
    { key: 'lopDays', label: 'LOP Days', className: 'text-center' },
    {
      key: 'grossPay',
      label: 'Gross Pay',
      className: 'text-right font-semibold',
      render: (row) => (
        <div className="text-right">
          <div className="font-semibold">
            ₹
            {Number(row.grossPay || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'netPay',
      label: 'Net Pay',
      className: 'text-right font-bold ',
      render: (row) => (
        <div className="text-right">
          <div className="font-bold">
            ₹
            {Number(row.netPay || 0).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      ),
    },
  ];

  const Actions = (row) => {
    return (
      <div className="flex justify-end gap-2">
        <IconButton
          onClick={() => handleDelete(row.id)}
          className="p-2 hover:bg-blue-50"
          title={
            !canControlAllEmployees ? 'Delete access required' : 'Delete Record'
          }
          disabled={!canControlAllEmployees}
        >
          <Trash size={16} color="#003273ff" />
        </IconButton>
      </div>
    );
  };

  return (
    <>
      <div className="p-4">
        {/* Attendance Controls */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-3">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Month & Year Selectors */}
            <div className="flex gap-2 w-full md:w-auto">
              <FilterDropdown
                options={[
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
                ]
                  .map((m) => {
                    const y = parseInt(
                      selectedMonth?.split('-')[0] || new Date().getFullYear(),
                      10
                    );
                    const currentY = new Date().getFullYear();
                    const currentM = new Date().getMonth() + 1;
                    let disabled = false;
                    if (y === 2025 && parseInt(m.value, 10) < 9)
                      disabled = true;
                    if (y === currentY && parseInt(m.value, 10) > currentM)
                      disabled = true;
                    return { ...m, disabled };
                  })
                  .filter((m) => !m.disabled)}
                value={
                  selectedMonth?.split('-')[1] ||
                  String(new Date().getMonth() + 1).padStart(2, '0')
                }
                onChange={(newM) => {
                  const currYear =
                    selectedMonth?.split('-')[0] ||
                    String(new Date().getFullYear());
                  onMonthChange(`${currYear}-${newM}`);
                }}
                className="w-full md:w-40"
              />

              <FilterDropdown
                options={Array.from(
                  { length: Math.max(1, new Date().getFullYear() - 2025 + 1) },
                  (_, i) => 2025 + i
                ).map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
                value={
                  selectedMonth?.split('-')[0] ||
                  String(new Date().getFullYear())
                }
                onChange={(newY) => {
                  let currMonth =
                    selectedMonth?.split('-')[1] ||
                    String(new Date().getMonth() + 1).padStart(2, '0');

                  const currentY = new Date().getFullYear();
                  const currentM = new Date().getMonth() + 1;

                  if (
                    parseInt(newY, 10) === 2025 &&
                    parseInt(currMonth, 10) < 9
                  ) {
                    currMonth = '09';
                  }

                  if (
                    parseInt(newY, 10) === currentY &&
                    parseInt(currMonth, 10) > currentM
                  ) {
                    currMonth = String(currentM).padStart(2, '0');
                  }

                  onMonthChange(`${newY}-${currMonth}`);
                }}
                className="w-full md:w-32"
              />
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2"></div>
        </div>

        {/* Attendance & Payroll Table */}
        {loading ? (
          <div className="p-8">
            <Loader
              label="Loading attendance and payroll data..."
              size="md"
              fullScreen={false}
            />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-semibold">Error loading attendance data</p>
            <p className="text-sm mt-2">{error}</p>
            <button
              onClick={fetchAttendanceData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm mt-2">
              No attendance data available for the selected month.
            </p>
          </div>
        ) : (
          <>
            <CustomTable
              columns={columns}
              data={filteredData}
              rowKey="id"
              actions={(row) => Actions(row)}
              actionsHeader="Actions"
              actionsAlign="right"
              maxHeight="400px"
            />
          </>
        )}
      </div>

      <CustomAlertForm
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={alertModal.onConfirm || closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
      />
    </>
  );
}
