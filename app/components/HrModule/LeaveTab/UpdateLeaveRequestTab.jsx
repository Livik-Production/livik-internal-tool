'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CustomTable from '../../CustomTable';
import CustomAlertForm from '../../CustomAlertForm';
import Loader from '../../Loader';
import Pagination from '../../Pagination';
import { showSuccessToast, showErrorToast } from '../../Toast';
import {
  ChevronDown,
  Eye,
  Plus,
  Search,
  SquarePen,
  Trash,
  X,
  CalendarCheck,
  Loader2,
} from 'lucide-react';
import BalanceDetailModal from './BalanceDetailModal';
import FilterDropdown from '../../Buttons/FilterDropdown';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';

const UpdateLeaveRequestTab = ({
  onViewLeaveDetails,
  onDelete,
  canControlAllEmployees,
  isAdmin = false,
}) => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // Local State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState({
    cl_balance: '',
    sl_balance: '',
    monthYear: '',
    remarks: '',
  });
  const [balanceDetailModalOpen, setBalanceDetailModalOpen] = useState(false);
  const [selectedBalanceData, setSelectedBalanceData] = useState(null);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [companyHolidays, setCompanyHolidays] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(`/api/hr/holidays?year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyHolidays(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch holidays:', err);
      }
    };
    fetchHolidays();
  }, [selectedYear]);

  const fetchBalances = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/hr/leave-balances?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error('Failed to fetch leave balances');
      const balances = await res.json();
      setData(balances);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [selectedMonth, selectedYear]);

  const getLeaveInfo = (balances, type) => {
    const b = balances?.find(
      (item) => item.leaveType.toLowerCase() === type.toLowerCase()
    );
    if (!b) return { available: 0, used: 0, allocated: 0 };
    return {
      available: b.allocated - b.used,
      used: b.used,
      allocated: b.allocated,
    };
  };

  const handleUpdateClick = (row) => {
    const cl = getLeaveInfo(row.leaveBalances, 'CL');
    const sl = getLeaveInfo(row.leaveBalances, 'SL');

    setSelectedRow(row);
    setFormData({
      cl_balance: '0',
      sl_balance: '0',
      monthYear: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
      remarks: '',
    });

    // Fetch balance history for this employee
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `/api/leave/balance-history?employeeId=${row.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setBalanceHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch balance history:', err);
        setBalanceHistory([]);
      }
    };
    fetchHistory();

    setIsEditMode(false);
    setShowModal(true);
  };

  // Sync formData with balanceHistory when monthYear changes inside the modal
  useEffect(() => {
    if (!showModal || !selectedRow || !formData.monthYear) return;

    const [month, year] = formData.monthYear.split('/').map(Number);
    const existingRecord = balanceHistory.find(
      (h) => h.month === month && h.year === year
    );

    if (existingRecord) {
      // If data exists for this month, sync it and set edit mode
      setFormData((prev) => {
        // Only update if values actually differ to avoid infinite loops
        if (
          prev.cl_balance === String(existingRecord.cl || 0) &&
          prev.sl_balance === String(existingRecord.sl || 0) &&
          prev.remarks === (existingRecord.remarks || '')
        ) {
          return prev;
        }
        return {
          ...prev,
          cl_balance: String(existingRecord.cl || 0),
          sl_balance: String(existingRecord.sl || 0),
          remarks: existingRecord.remarks || '',
        };
      });
      setIsEditMode(true);
    } else {
      // If no data exists, reset to "Add" mode defaults (requested to be 0)
      setFormData((prev) => {
        if (
          prev.cl_balance === '0' &&
          prev.sl_balance === '0' &&
          prev.remarks === ''
        ) {
          return prev;
        }
        return {
          ...prev,
          cl_balance: '0',
          sl_balance: '0',
          remarks: '',
        };
      });
      setIsEditMode(false);
    }
  }, [formData.monthYear, balanceHistory, showModal, selectedRow]);

  // commeny
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Validate required fields
      if (!selectedRow || !selectedRow.id) {
        throw new Error('Employee not selected');
      }

      const clValue = parseFloat(formData.cl_balance);
      const slValue = parseFloat(formData.sl_balance);

      if (isNaN(clValue) || isNaN(slValue)) {
        throw new Error('Please enter valid numbers for CL and SL');
      }

      // Parse monthYear (MM/YYYY format)
      const [month, year] = formData.monthYear.split('/');
      if (!month || !year) {
        throw new Error('Invalid month/year selection');
      }

      // Save balance history
      const historyRes = await fetch('/api/leave/balance-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedRow.id,
          month: parseInt(month),
          year: parseInt(year),
          cl: clValue,
          sl: slValue,
          lop: 0,
          remarks: formData.remarks,
        }),
      });

      if (!historyRes.ok) {
        try {
          const errorData = await historyRes.json();
          throw new Error(
            errorData.error ||
              `Failed to save balance history (${historyRes.status})`
          );
        } catch (parseErr) {
          throw new Error(
            `Failed to save balance history (${historyRes.status})`
          );
        }
      }

      // Update current balances
      const res = await fetch(`/api/hr/leave-balances/${selectedRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balances: [
            { leaveType: 'CL', allocated: clValue, used: 0 },
            { leaveType: 'SL', allocated: slValue, used: 0 },
          ],
        }),
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Failed to update balances (${res.status})`
          );
        } catch (parseErr) {
          throw new Error(`Failed to update balances (${res.status})`);
        }
      }

      // Close modal immediately for better UX
      setShowModal(false);

      // Update data in background
      await fetchBalances(true);

      // Notify success
      showSuccessToast('Balances updated successfully');
    } catch (err) {
      console.error('Form submission error:', err);
      showErrorToast(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredData = data.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || emp.empId.toLowerCase().includes(query);
  });

  // Reset pagination when filtered data length, selectedMonth, or selectedYear changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length, selectedMonth, selectedYear]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const renderBalance = (row, type) => {
    const { available, used } = getLeaveInfo(row.leaveBalances, type);
    return (
      <div className="flex flex-col items-center">
        <span
          className="text-sm font-bold text-green-600"
          title={`Available ${type}`}
        >
          {available}
        </span>
        <span
          className="text-[10px] font-semibold text-red-500 uppercase"
          title={`Used ${type}`}
        >
          {used} Used
        </span>
      </div>
    );
  };

  const columns = [
    {
      key: 'empId',
      label: 'Emp ID',
      render: (row) => (
        <HyperlinkButton
          onClick={() => {
            setSelectedBalanceData(row);
            setBalanceDetailModalOpen(true);
          }}
          title="View balance details"
        >
          {row.empId}
        </HyperlinkButton>
      ),
    },
    {
      key: 'name',
      label: 'Emp Name',
      render: (row) => (
        <div className="font-medium text-gray-900">
          {row.firstName} {row.lastName}
        </div>
      ),
    },
    {
      key: 'cl',
      label: 'CL',
      className: 'text-center',
      render: (row) => renderBalance(row, 'CL'),
    },
    {
      key: 'sl',
      label: 'SL',
      className: 'text-center',
      render: (row) => renderBalance(row, 'SL'),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <IconButton
            onClick={() => handleUpdateClick(row)}
            disabled={!canControlAllEmployees}
            title={
              !canControlAllEmployees
                ? 'Update access required'
                : 'Update Balances'
            }
          >
            <SquarePen size={16} />
          </IconButton>

          <IconButton
            onClick={() => isAdmin && onDelete && onDelete(row.id)}
            disabled={!isAdmin}
            className={
              !isAdmin
                ? 'opacity-50 cursor-not-allowed'
                : 'text-red-500 hover:bg-red-50'
            }
            title={
              !isAdmin ? 'Delete access restricted for HR' : 'Delete employee'
            }
          >
            <Trash size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) return <Loader label="Loading balances..." fullScreen={false} />;

  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      {/* LOCAL SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-3"></div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-900" />
          </div>
          {/* Month Selector */}
          <div className="w-40 ">
            <FilterDropdown
              options={Array.from({ length: 12 }, (_, i) => {
                const monthIndex = i + 1;
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                // Disable if year is 2025 and month < 9 (Sept)
                const isDisabled = selectedYear === 2025 && monthIndex < 9;

                const date = new Date(2000, i, 1);
                const monthName = date.toLocaleString('default', {
                  month: 'long',
                });
                return {
                  value: monthIndex.toString(),
                  label: monthName,
                  disabled: isDisabled,
                };
              })}
              value={selectedMonth.toString()}
              onChange={(val) => setSelectedMonth(parseInt(val))}
              placeholder="Month"
            />
          </div>

          {/* Year Selector */}
          <div className="w-32 mr-0.5">
            <FilterDropdown
              options={(() => {
                const now = new Date();
                const currentYear = now.getFullYear();
                const years = [];
                for (let y = 2025; y <= currentYear; y++) {
                  years.push({ value: y.toString(), label: y.toString() });
                }
                return years;
              })()}
              value={selectedYear.toString()}
              onChange={(val) => {
                const year = parseInt(val);
                setSelectedYear(year);
                // If switching to 2025 and current selection is before Sept, reset to Sept
                if (year === 2025 && selectedMonth < 9) {
                  setSelectedMonth(9);
                }
              }}
              placeholder="Year"
            />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 shadow-inner">
        <div
          className="overflow-x-auto w-full"
          style={{
            maxHeight: '60vh',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <table className="min-w-full table-auto border-separate border-spacing-0">
            <thead className="bg-gray-50">
              <tr>
                <th
                  rowSpan="2"
                  className="px-5 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-50"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Emp ID
                </th>
                <th
                  rowSpan="2"
                  className="px-5 py-3 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-50"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Emp Name
                </th>
                <th
                  rowSpan="2"
                  className="px-5 py-3 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-50"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Email ID
                </th>
                <th
                  rowSpan="2"
                  className="px-5 py-3 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-50"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Mobile Number
                </th>
                <th
                  colSpan="2"
                  className="px-5 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-100"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Casual Leave (CL)
                </th>
                <th
                  colSpan="2"
                  className="px-5 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-r border-gray-200 bg-gray-100"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Sick Leave (SL)
                </th>
                <th
                  rowSpan="2"
                  className="px-5 py-3 text-center text-sm font-semibold text-gray-900 whitespace-nowrap border-b border-gray-200 bg-gray-50"
                  style={{ position: 'sticky', top: 0, zIndex: 20 }}
                >
                  Actions
                </th>
              </tr>
              <tr>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-900 bg-gray-50 border-b border-r border-gray-200"
                  style={{ position: 'sticky', top: '33px', zIndex: 20 }}
                >
                  Avail
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-900 bg-gray-50 border-b border-r border-gray-200"
                  style={{ position: 'sticky', top: '33px', zIndex: 20 }}
                >
                  Used
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-900 bg-gray-50 border-b border-r border-gray-200"
                  style={{ position: 'sticky', top: '33px', zIndex: 20 }}
                >
                  Avail
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-900 bg-gray-50 border-b border-r border-gray-200"
                  style={{ position: 'sticky', top: '33px', zIndex: 20 }}
                >
                  Used
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                paginatedData.map((row) => {
                  const cl = getLeaveInfo(row.leaveBalances, 'CL');
                  const sl = getLeaveInfo(row.leaveBalances, 'SL');

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm whitespace-nowrap border-r border-gray-100">
                        <HyperlinkButton
                          onClick={() => {
                            setSelectedBalanceData(row);
                            setBalanceDetailModalOpen(true);
                          }}
                          title="View balance details"
                        >
                          {row.empId}
                        </HyperlinkButton>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-center whitespace-nowrap border-r border-gray-100">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-center whitespace-nowrap border-r border-gray-100">
                        {row.email || '-'}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-center whitespace-nowrap border-r border-gray-100">
                        {row.phoneNumber || '-'}
                      </td>

                      {/* CL Data */}
                      <td className="px-3 py-3 text-sm text-center font-bold text-green-600 border-r border-gray-100">
                        {cl.available}
                      </td>
                      <td className="px-3 py-3 text-sm text-center font-semibold text-red-500 border-r border-gray-100">
                        {cl.used}
                      </td>

                      {/* SL Data */}
                      <td className="px-3 py-3 text-sm text-center font-bold text-green-600 border-r border-gray-100">
                        {sl.available}
                      </td>
                      <td className="px-3 py-3 text-sm text-center font-semibold text-red-500 border-r border-gray-100">
                        {sl.used}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <IconButton
                            onClick={() => handleUpdateClick(row)}
                            title="Update Balances"
                          >
                            <CalendarCheck size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="px-5 py-10 text-center text-gray-900 text-sm"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {filteredData.length > 0 && (
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
      )}

      {/* Update Balances Modal */}
      <CustomModalForm
        open={showModal}
        onCancel={() => setShowModal(false)}
        widthClass="max-w-lg"
        title={
          selectedRow ? (
            <div className="font-normal text-base block w-full">
              <h3 className="text-xl font-bold text-gray-900">
                {isEditMode
                  ? 'Edit Leave Balances'
                  : 'Add Leave Balances'}
              </h3>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {selectedRow.firstName} {selectedRow.lastName}
                <span className="text-xs text-gray-900 font-bold uppercase tracking-widest bg-gray-100 px-3 py-0.5 ml-2 rounded">
                  {selectedRow.empId}
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <div className="text-sm text-gray-900">
                  <span className="font-semibold">Balance Leaves : </span>
                  <span className="text-green-600 font-medium">
                    {(() => {
                      const selectedYear =
                        parseInt(formData.monthYear.split('/')[1]) ||
                        2025;
                      const yearData = balanceHistory.filter(
                        (item) => item.year === selectedYear
                      );
                      const clTotal = yearData.reduce(
                        (sum, item) => sum + (item.cl || 0),
                        0
                      );
                      const slTotal = yearData.reduce(
                        (sum, item) => sum + (item.sl || 0),
                        0
                      );
                      const clUsed = yearData.reduce(
                        (sum, item) => sum + (item.clUsed || 0),
                        0
                      );
                      const slUsed = yearData.reduce(
                        (sum, item) => sum + (item.slUsed || 0),
                        0
                      );
                      return (
                        Math.max(0, clTotal - clUsed) +
                        Math.max(0, slTotal - slUsed)
                      );
                    })()}{' '}
                    days
                  </span>
                </div>
                <div className="text-xs text-gray-900 flex items-center h-5 mt-0.5">
                  SL:{' '}
                  {(() => {
                    const selectedYear =
                      parseInt(formData.monthYear.split('/')[1]) || 2025;
                    const yearData = balanceHistory.filter(
                      (item) => item.year === selectedYear
                    );
                    const slTotal = yearData.reduce(
                      (sum, item) => sum + (item.sl || 0),
                      0
                    );
                    const slUsed = yearData.reduce(
                      (sum, item) => sum + (item.slUsed || 0),
                      0
                    );
                    return Math.max(0, slTotal - slUsed);
                  })()}{' '}
                  | CL:{' '}
                  {(() => {
                    const selectedYear =
                      parseInt(formData.monthYear.split('/')[1]) || 2025;
                    const yearData = balanceHistory.filter(
                      (item) => item.year === selectedYear
                    );
                    const clTotal = yearData.reduce(
                      (sum, item) => sum + (item.cl || 0),
                      0
                    );
                    const clUsed = yearData.reduce(
                      (sum, item) => sum + (item.clUsed || 0),
                      0
                    );
                    return Math.max(0, clTotal - clUsed);
                  })()}
                </div>
              </div>
            </div>
          ) : null
        }
      >
        <form onSubmit={handleFormSubmit} className="p-3">
          <div className="space-y-6">
                  {/* Year and Month Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Year Selector */}
                    <div className="ml-2">
                      <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        Select Year
                      </label>
                      <FilterDropdown
                        options={(() => {
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const years = [];
                          for (let y = 2025; y <= currentYear; y++) {
                            years.push({
                              value: y.toString(),
                              label: y.toString(),
                            });
                          }
                          return years;
                        })()}
                        value={(
                          parseInt(formData.monthYear.split('/')[1]) || 2025
                        ).toString()}
                        onChange={(val) => {
                          const year = parseInt(val);
                          const currentMonth = parseInt(
                            formData.monthYear.split('/')[0]
                          );
                          let newMonth = currentMonth;
                          if (year === 2025 && currentMonth < 9) newMonth = 9;
                          setFormData({
                            ...formData,
                            monthYear: `${String(newMonth).padStart(2, '0')}/${year}`,
                          });
                        }}
                        placeholder="Select Year"
                      />
                    </div>

                    {/* Month Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        Select Month
                      </label>
                      <FilterDropdown
                        options={Array.from({ length: 12 }, (_, i) => {
                          const monthIndex = i + 1;
                          const currentYear = parseInt(
                            formData.monthYear.split('/')[1]
                          );
                          // Disable if year is 2025 and month < 9 (Sept)
                          const isDisabled =
                            currentYear === 2025 && monthIndex < 9;

                          const date = new Date(2000, i, 1);
                          const monthName = date.toLocaleString('default', {
                            month: 'long',
                          });
                          return {
                            value: monthIndex.toString(),
                            label: monthName,
                            disabled: isDisabled,
                          };
                        }).filter((opt) => !opt.disabled)}
                        value={(
                          parseInt(formData.monthYear.split('/')[0]) || 1
                        ).toString()}
                        onChange={(val) => {
                          const monthIndex = parseInt(val);
                          const currentYear = parseInt(
                            formData.monthYear.split('/')[1]
                          );
                          setFormData({
                            ...formData,
                            monthYear: `${String(monthIndex).padStart(2, '0')}/${currentYear}`,
                          });
                        }}
                        placeholder="Select Month"
                      />
                    </div>
                  </div>

                  {/* CL & SL Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* CL */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        Casual Leave (CL)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.cl_balance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cl_balance: e.target.value,
                          })
                        }
                        placeholder="Enter Balance"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* SL */}
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        Sick Leave (SL)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.sl_balance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sl_balance: e.target.value,
                          })
                        }
                        placeholder="Enter Balance"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Remarks Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          remarks: e.target.value,
                        })
                      }
                      placeholder="Enter remarks or reason for update"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-20"
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-3">
                  <PrimaryButton
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
                    disabled={isUpdating}
                  >
                    Cancel
                  </PrimaryButton>
                  <PrimaryButton
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#004475] text-white font-bold uppercase tracking-wide rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        {isEditMode
                          ? 'Update Leave Balance'
                          : 'Add Leave Balance'}
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </form>
      </CustomModalForm>

      {/* Balance Detail Modal */}
      {balanceDetailModalOpen && selectedBalanceData && (
        <BalanceDetailModal
          employee={selectedBalanceData}
          getLeaveInfo={getLeaveInfo}
          onClose={() => setBalanceDetailModalOpen(false)}
          companyHolidays={companyHolidays}
          isAdmin={isAdmin}
          onEditMonth={(emp, month, year, cl, sl, remarks) => {
            setSelectedRow(emp);
            setFormData({
              cl_balance: String(cl || 0),
              sl_balance: String(sl || 0),
              monthYear: `${String(month).padStart(2, '0')}/${year}`,
              remarks: remarks || '',
            });
            const fetchHistory = async () => {
              try {
                const res = await fetch(
                  `/api/leave/balance-history?employeeId=${emp.id}`
                );
                if (res.ok) {
                  const data = await res.json();
                  setBalanceHistory(Array.isArray(data) ? data : []);
                }
              } catch (err) {
                console.error('Failed to fetch balance history:', err);
                setBalanceHistory([]);
              }
            };
            fetchHistory();
            setIsEditMode(true);
            setShowModal(true);
          }}
        />
      )}
    </>
  );
};

export default UpdateLeaveRequestTab;
