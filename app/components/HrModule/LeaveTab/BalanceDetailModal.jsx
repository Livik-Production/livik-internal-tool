'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SquarePen, Trash, CalendarCheck, PlusCircle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../Toast';
import CustomAlertForm from '../../CustomAlertForm';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';

/* ───────── Balance Detail Modal (month-wise) ───────── */
const BalanceDetailModal = ({
  employee,
  getLeaveInfo,
  onClose,
  onEditMonth,
  pendingLeave = null, // Optional: for previewing impact
  isAdmin = false,
  onOpenEdit,
  onOpenAdd,
}) => {
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => {
    // If pending leave provided, default to its year
    if (pendingLeave) {
      const d = new Date(pendingLeave.startDate || pendingLeave.from);
      return d.getFullYear();
    }
    return new Date().getFullYear();
  });
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    row: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Note: ensure we handle employee structure variants (raw vs wrapper)
  const leaveBalances = employee.leaveBalances || [];

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/leave/balance-history?employeeId=${employee.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setBalanceHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch balance history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [employee.id]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(`/api/hr/holidays?year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyHolidays(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch holidays for modal:', err);
      }
    };
    fetchHolidays();
  }, [selectedYear]);

  const handleDeleteClick = (row) => {
    setDeleteConfirm({ open: true, row });
  };

  const handleConfirmDelete = async () => {
    const row = deleteConfirm.row;
    if (!row) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/leave/balance-history?employeeId=${employee.id}&month=${row.month}&year=${row.year}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        // Refresh history
        const updatedRes = await fetch(
          `/api/leave/balance-history?employeeId=${employee.id}`
        );
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setBalanceHistory(Array.isArray(data) ? data : []);
        }
        showSuccessToast('History record deleted successfully');
      } else {
        const error = await res.json();
        showErrorToast(error.error || 'Failed to delete history record');
      }
    } catch (err) {
      console.error('Failed to delete history record:', err);
      showErrorToast('An error occurred while deleting the history record');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ open: false, row: null });
    }
  };

  // Helper: count working days of a leave that fall in a specific month/year (excludes Sundays + holidays)
  const countUsageInMonth = (leave, targetMonth, targetYear) => {
    const isHalf = leave.duration === 'half' || leave.isHalfDay === true;
    if (isHalf) {
      const d = new Date(leave.startDate || leave.from);
      if (d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear) {
        return parseFloat(leave.calculatedDays || leave.totalDays || 0.5);
      }
      return 0;
    }

    const start = new Date(leave.startDate || leave.from);
    const end = new Date(leave.endDate || leave.to);
    if (isNaN(start) || isNaN(end)) return 0;

    const holidaySet = new Set(
      companyHolidays.map((h) => {
        const d = new Date(h.holidayDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let count = 0;
    for (
      let dt = new Date(start.getTime());
      dt <= end;
      dt.setDate(dt.getDate() + 1)
    ) {
      if (
        dt.getMonth() + 1 === targetMonth &&
        dt.getFullYear() === targetYear
      ) {
        const isSunday = dt.getDay() === 0;
        const dtNorm = new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate()
        ).getTime();
        const isHoliday = holidaySet.has(dtNorm);
        if (!isSunday && !isHoliday) {
          count++;
        }
      }
    }
    return count;
  };

  // Build month-wise breakdown from balance history
  const getMonthWiseData = () => {
    const filtered = balanceHistory
      .filter((item) => item.year === selectedYear)
      .sort((a, b) => b.month - a.month)
      .map((item) => {
        const date = new Date(item.year, item.month - 1, 1);
        const label = date.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });

        // Backend now returns pre-calculated clUsed, slUsed, lopUsed
        let clUsed = item.clUsed || 0;
        let slUsed = item.slUsed || 0;
        let lop = (item.lop || 0) + (item.lopUsed || 0);
        let isProjected = false;

        // If this month covers the pendingLeave, calculate the PROJECTED impact
        if (pendingLeave) {
          const usage = countUsageInMonth(pendingLeave, item.month, item.year);

          if (usage > 0) {
            isProjected = true;
            const type = String(
              pendingLeave.leaveType || pendingLeave.type || ''
            ).toUpperCase();

            if (/CL|CASUAL/i.test(type)) {
              const remainingCl = Math.max(0, (item.cl || 0) - clUsed);
              const deduct = Math.min(remainingCl, usage);
              clUsed += deduct;
              lop += usage - deduct;
            } else if (/SL|SICK/i.test(type)) {
              const remainingSl = Math.max(0, (item.sl || 0) - slUsed);
              const deduct = Math.min(remainingSl, usage);
              slUsed += deduct;
              lop += usage - deduct;
            } else if (/LOP/i.test(type)) {
              lop += usage;
            }
          }
        }

        const total = clUsed + slUsed + lop;

        return {
          key: `${item.year}-${String(item.month).padStart(2, '0')}`,
          label,
          year: item.year,
          month: item.month,
          cl: Math.max(0, (item.cl || 0) - clUsed),
          sl: Math.max(0, (item.sl || 0) - slUsed),
          lop,
          clUsed,
          slUsed,
          remarks: item.remarks || '',
          total,
          isProjected,
          createdAt: item.createdAt || item.created_at,
          updatedAt: item.updatedAt || item.updated_at,
          createdBy: item.createdBy || item.createBy || item.created_by,
          updatedBy: item.updatedBy || item.UpdatedBy || item.updated_by,
        };
      });

    return filtered;
  };

  // Get all available years from balance history
  const getAvailableYears = () => {
    const years = new Set();
    balanceHistory.forEach((item) => {
      years.add(item.year);
    });

    // Ensure current year and beyond (2025+) are always available
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2025; year--) {
      years.add(year);
    }

    return Array.from(years).sort((a, b) => b - a);
  };

  const monthData = getMonthWiseData();
  const availableYears = getAvailableYears();

  // Calculate year-wise summary
  const getYearlySummary = () => {
    const summary = {
      cl: 0,
      sl: 0,
      lop: 0,
      clUsed: 0,
      slUsed: 0,
    };
    monthData.forEach((month) => {
      summary.cl += month.cl || 0;
      summary.sl += month.sl || 0;
      summary.lop += month.lop || 0;
      summary.clUsed += month.clUsed || 0;
      summary.slUsed += month.slUsed || 0;
    });
    return summary;
  };

  const yearlySummary = getYearlySummary();

  const customTitle = (
    <div className="font-normal text-base block w-full justify-start items-start">
      <h3 className="text-xl font-bold text-gray-900">
        Leave Balance Details
      </h3>
      <div className="flex justify-start gap-4">
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-600 font-semibold">
            {employee.firstName} {employee.lastName}
          </span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
            ID: {employee.empId}
          </span>
          |<span> </span>
        </div>
        <div className="flex flex-wrap flex-row gap-4 mt-1.5">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Balance Leaves : </span>
            <span className="text-green-600 font-medium">
              {Math.max(0, yearlySummary.cl - yearlySummary.clUsed) +
                Math.max(
                  0,
                  yearlySummary.sl - yearlySummary.slUsed
                )}{' '}
              days
            </span>
          </div>
          <div className="text-xs text-gray-500 flex items-center h-5 mt-0.5">
            SL: {Math.max(0, yearlySummary.sl - yearlySummary.slUsed)} |
            CL: {Math.max(0, yearlySummary.cl - yearlySummary.clUsed)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CustomModalForm
        open={true}
        onCancel={onClose}
        title={customTitle}
        widthClass="max-w-3xl"
      >
        <div className="p-3 px-4">
          {/* Year Filter */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                Filter by Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))
                ) : (
                  <option value={new Date().getFullYear()}>
                    {new Date().getFullYear()}
                  </option>
                )}
              </select>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && onOpenAdd && (
                <button
                  onClick={() => onOpenAdd(selectedYear)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 hover:scale-110 rounded-full transition-all cursor-pointer"
                  title="Add New Month/Year Balance"
                >
                  <PlusCircle size={18} />
                </button>
              )}
              {/* {isAdmin && onOpenEdit && (
                <button
                  onClick={() => onOpenEdit(selectedYear)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 rounded-full transition-all cursor-pointer"
                  title="Update Current Selected Month/Year Balance"
                >
                  <SquarePen size={18} />
                </button>
              )} */}
            </div>
          </div>

          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
            Month-Wise Leave Balance{' '}
          </h4>

          {loadingHistory ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Loading balance history...
            </div>
          ) : monthData.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No balance records found for the selected year.
            </div>
          ) : (
            <div
              className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-widest sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Month</th>
                    <th className="px-5 py-3 text-center">CL</th>
                    <th className="px-5 py-3 text-center">SL</th>
                    <th className="px-5 py-3 text-center">LOP</th>
                    <th className="px-5 py-3 text-center">CL Used</th>
                    <th className="px-5 py-3 text-center">SL Used</th>
                    <th className="px-5 py-3 text-center">Total</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {monthData.map((row) => (
                    <tr
                      key={row.key}
                      className={`hover:bg-gray-50/50 transition-colors ${row.isProjected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="px-5 py-3 font-semibold text-gray-700">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {row.label}
                            {row.isProjected && (
                              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                <CalendarCheck size={10} />
                                Projected
                              </span>
                            )}
                          </div>
                          {(row.createdAt || row.updatedAt || row.createdBy) && (
                            <div className="flex flex-col text-[9px] text-gray-400 font-medium whitespace-nowrap mt-0.5 leading-tight">
                              <span>Created: {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ''} {row.createdBy ? `by ${row.createdBy}` : ''}</span>
                              {row.updatedAt && (
                                <span>Updated: {new Date(row.updatedAt).toLocaleDateString()} {row.updatedBy ? `by ${row.updatedBy}` : ''}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-blue-600 font-bold">
                        {row.cl || '-'}
                      </td>
                      <td className="px-5 py-3 text-center text-green-600 font-bold">
                        {row.sl || '-'}
                      </td>
                      <td className="px-5 py-3 text-center text-orange-500 font-bold">
                        {row.lop || '-'}
                      </td>
                      <td className="px-5 py-3 text-center text-red-500 font-bold">
                        {row.clUsed || '-'}
                      </td>
                      <td className="px-5 py-3 text-center text-red-500 font-bold">
                        {row.slUsed || '-'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="bg-gray-100 text-gray-700 font-black text-xs px-2.5 py-1 rounded-full">
                            {row.total}
                          </span>
                          {row.isProjected && (
                            <span className="text-[8px] text-blue-500 font-bold mt-1 uppercase">
                              Incl. Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {!row.isProjected ? (
                          <>
                            <IconButton
                              onClick={() => {
                                onClose();
                                if (onEditMonth) {
                                  onEditMonth(
                                    employee,
                                    row.month,
                                    row.year,
                                    row.cl,
                                    row.sl,
                                    row.remarks
                                  );
                                }
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors inline-block"
                              title="Edit Leave Balance"
                            >
                              <SquarePen size={16} />
                            </IconButton>
                            {isAdmin && (
                              <IconButton
                                onClick={() => handleDeleteClick(row)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors inline-block ml-1"
                                title="Delete Leave Balance"
                              >
                                <Trash size={16} />
                              </IconButton>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-medium italic pr-2">
                            Pending request preview
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500 italic">
            Note: In the table leave balance updated for the employee monthly.
          </div>
        </div>
      </CustomModalForm>
      {/* Delete Confirmation Dialog */}
      <CustomAlertForm
        isOpen={deleteConfirm.open}
        onClose={() =>
          !isDeleting && setDeleteConfirm({ open: false, row: null })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Balance Record"
        message={`Are you sure you want to delete the balance history for ${deleteConfirm.row?.label || ''}?`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
      />
    </>
  );
};

export default BalanceDetailModal;
