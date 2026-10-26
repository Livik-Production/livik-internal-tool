'use client';

import React, { useState, useMemo, useEffect } from 'react';
import CustomModalForm from '../../CustomModalForm';
import CustomTable from '../../CustomTable';
import Button from '../../Buttons/Button';
import FilterDropdown from '../../Buttons/FilterDropdown';
import {
  Printer,
  FileText,
  Calendar,
  Check,
} from 'lucide-react';

const MONTH_NAMES = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
};

const ALL_MONTH_OPTIONS = [
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

export default function ExpenseCategorySummaryModal({
  isOpen = false,
  onClose,
  expenses = [],
  initialFromMonth = '',
  initialToMonth = '',
  initialYear = '',
  monthOptions = ALL_MONTH_OPTIONS,
  yearOptions = [],
}) {
  const now = new Date();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYearStr = now.getFullYear().toString();

  // Compute available years from data and defaults
  const computedYearOptions = useMemo(() => {
    const yearsSet = new Set(yearOptions || []);
    yearsSet.add(currentYearStr);
    yearsSet.add('2025');
    (expenses || []).forEach((e) => {
      const d = new Date(e.expenseDate || e.date);
      if (!isNaN(d.getTime())) {
        yearsSet.add(d.getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [yearOptions, expenses, currentYearStr]);

  // Helper to calculate date ranges for presets
  const getPresetRange = (type) => {
    const nowD = new Date();
    const currM = (nowD.getMonth() + 1).toString().padStart(2, '0');
    const currY = nowD.getFullYear().toString();

    if (type === 'thisMonth') {
      return {
        fromMonth: currM,
        fromYear: currY,
        toMonth: currM,
        toYear: currY,
      };
    } else if (type === 'lastMonth') {
      const lastMonthDate = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1);
      const lM = (lastMonthDate.getMonth() + 1).toString().padStart(2, '0');
      const lY = lastMonthDate.getFullYear().toString();
      return {
        fromMonth: lM,
        fromYear: lY,
        toMonth: lM,
        toYear: lY,
      };
    } else if (type === 'last3Months') {
      const threeMonthsAgo = new Date(nowD.getFullYear(), nowD.getMonth() - 2, 1);
      const fM = (threeMonthsAgo.getMonth() + 1).toString().padStart(2, '0');
      const fY = threeMonthsAgo.getFullYear().toString();
      return {
        fromMonth: fM,
        fromYear: fY,
        toMonth: currM,
        toYear: currY,
      };
    }
    return null;
  };

  // Default active badge: 'last3Months'
  const [activeBadge, setActiveBadge] = useState('last3Months');

  // Input states for custom From and To month / year selection
  const initialDefaultRange = getPresetRange('last3Months');
  const [fromMonth, setFromMonth] = useState(initialDefaultRange.fromMonth);
  const [fromYear, setFromYear] = useState(initialDefaultRange.fromYear);
  const [toMonth, setToMonth] = useState(initialDefaultRange.toMonth);
  const [toYear, setToYear] = useState(initialDefaultRange.toYear);

  // Applied range state that actually drives the table filtering
  const [appliedRange, setAppliedRange] = useState(initialDefaultRange);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('all');

  // Available categories list
  const availableCategories = useMemo(() => {
    const cats = new Set();
    (expenses || []).forEach((e) => {
      if (e.category) cats.add(e.category.trim());
    });
    return ['all', ...Array.from(cats).sort()];
  }, [expenses]);

  // Available payment modes list
  const availablePaymentModes = useMemo(() => {
    const modes = new Set();
    (expenses || []).forEach((e) => {
      const mode = e.paymentMode || e.paymentMethod;
      if (mode && typeof mode === 'string' && mode.trim()) {
        modes.add(mode.trim());
      }
    });
    return ['all', ...Array.from(modes).sort()];
  }, [expenses]);

  // Default to 'last3Months' whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultRange = getPresetRange('last3Months');
      setActiveBadge('last3Months');
      setAppliedRange(defaultRange);
      setFromMonth(defaultRange.fromMonth);
      setFromYear(defaultRange.fromYear);
      setToMonth(defaultRange.toMonth);
      setToYear(defaultRange.toYear);
      setSelectedCategory('all');
      setSelectedPaymentMode('all');
    }
  }, [isOpen]);

  // Helper to filter months based on year (e.g. current year 2026 cannot show future months like Nov/Dec)
  const getMonthOptionsForYear = (yearVal) => {
    const yInt = parseInt(yearVal || currentYearStr, 10);
    const currYInt = now.getFullYear();
    const currMInt = now.getMonth() + 1;

    return ALL_MONTH_OPTIONS.filter((m) => {
      const mInt = parseInt(m.value, 10);
      if (yInt === 2025) {
        return mInt >= 9;
      }
      if (yInt === currYInt) {
        return mInt <= currMInt;
      }
      if (yInt > currYInt) {
        return false;
      }
      return true;
    });
  };

  const fromMonthOptions = useMemo(() => {
    return getMonthOptionsForYear(fromYear);
  }, [fromYear, currentYearStr]);

  const toMonthOptions = useMemo(() => {
    return getMonthOptionsForYear(toYear);
  }, [toYear, currentYearStr]);

  // Ensure selected month stays valid if year changes
  useEffect(() => {
    if (fromMonth) {
      const isValid = fromMonthOptions.some((m) => m.value === fromMonth);
      if (!isValid && fromMonthOptions.length > 0) {
        setFromMonth(fromMonthOptions[fromMonthOptions.length - 1].value);
      }
    }
  }, [fromMonthOptions, fromMonth]);

  useEffect(() => {
    if (toMonth) {
      const isValid = toMonthOptions.some((m) => m.value === toMonth);
      if (!isValid && toMonthOptions.length > 0) {
        setToMonth(toMonthOptions[toMonthOptions.length - 1].value);
      }
    }
  }, [toMonthOptions, toMonth]);

  // Month change handlers for Custom picker
  const handleFromMonthChange = (val) => {
    setFromMonth(val);
    if (val && !fromYear) {
      setFromYear(currentYearStr);
    }
  };

  const handleToMonthChange = (val) => {
    setToMonth(val);
    if (val && !toYear) {
      setToYear(currentYearStr);
    }
  };

  // Badge click handler
  const handleBadgeClick = (badgeKey) => {
    if (badgeKey === 'custom') {
      setActiveBadge('custom');
      // When opening custom, if fromMonth or toMonth is missing, prefill with current appliedRange
      if (!fromMonth || !toMonth) {
        const current = appliedRange || getPresetRange('last3Months');
        setFromMonth(current.fromMonth);
        setFromYear(current.fromYear);
        setToMonth(current.toMonth);
        setToYear(current.toYear);
      }
    } else {
      setActiveBadge(badgeKey);
      const newRange = getPresetRange(badgeKey);
      setAppliedRange(newRange);
      setFromMonth(newRange.fromMonth);
      setFromYear(newRange.fromYear);
      setToMonth(newRange.toMonth);
      setToYear(newRange.toYear);
    }
  };

  // Apply custom date range
  const handleApplyCustomDate = () => {
    if (!fromMonth || !toMonth) return;
    const fY = fromYear || currentYearStr;
    const tY = toYear || currentYearStr;
    setAppliedRange({
      fromMonth,
      fromYear: fY,
      toMonth,
      toYear: tY,
    });
  };

  // Range calculation keys based on appliedRange
  const { startKey, endKey, rangeLabel } = useMemo(() => {
    if (!appliedRange || !appliedRange.fromMonth || !appliedRange.toMonth) {
      return { startKey: null, endKey: null, rangeLabel: 'All Records' };
    }

    const fYear = parseInt(appliedRange.fromYear || currentYearStr, 10);
    const fMonth = parseInt(appliedRange.fromMonth, 10);
    const tYear = parseInt(appliedRange.toYear || currentYearStr, 10);
    const tMonth = parseInt(appliedRange.toMonth, 10);

    const fKey = fYear * 100 + fMonth;
    const tKey = tYear * 100 + tMonth;

    const minKey = Math.min(fKey, tKey);
    const maxKey = Math.max(fKey, tKey);

    const fromLabel = `${MONTH_NAMES[appliedRange.fromMonth] || appliedRange.fromMonth} ${fYear}`;
    const toLabel = `${MONTH_NAMES[appliedRange.toMonth] || appliedRange.toMonth} ${tYear}`;
    const label =
      minKey === maxKey ? fromLabel : `${fromLabel} — ${toLabel}`;

    return { startKey: minKey, endKey: maxKey, rangeLabel: label };
  }, [appliedRange, currentYearStr]);

  // Filter expenses matching the applied date range, category, and payment mode
  const { filteredExpenses, grandTotal } = useMemo(() => {
    let total = 0;
    const list = [];

    (expenses || []).forEach((exp) => {
      const dateVal = exp.expenseDate || exp.date;
      if (!dateVal) return;

      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;

      const expYear = d.getFullYear();
      const expMonth = d.getMonth() + 1;
      const expKey = expYear * 100 + expMonth;

      const matchesDate =
        startKey === null ||
        endKey === null ||
        (expKey >= startKey && expKey <= endKey);

      if (matchesDate) {
        const matchesCategory =
          selectedCategory === 'all' || exp.category === selectedCategory;
        const expMode = (exp.paymentMode || exp.paymentMethod || '').trim();
        const matchesPaymentMode =
          selectedPaymentMode === 'all' || expMode === selectedPaymentMode;

        if (matchesCategory && matchesPaymentMode) {
          const amt =
            typeof exp.amount === 'number'
              ? exp.amount
              : parseFloat(exp.amount || 0);

          total += amt;
          list.push({
            ...exp,
            parsedAmount: amt,
            parsedDate: d,
          });
        }
      }
    });

    list.sort((a, b) => b.parsedDate - a.parsedDate);

    return {
      filteredExpenses: list,
      grandTotal: total,
    };
  }, [expenses, startKey, endKey, selectedCategory, selectedPaymentMode]);

  // Preset Badges: This Month, Last Month, Last 3 Months (default), Custom
  const PRESET_BUTTONS = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last3Months', label: 'Last 3 Months' },
    { key: 'custom', label: 'Custom' },
  ];

  // Currency Formatter
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Columns for reusable CustomTable component: Expense Name, Date, remarks, amount with equal 25% spaces
  const columns = [
    {
      key: 'expenseName',
      label: 'Expense Name',
      className: 'w-1/4 text-left font-semibold text-gray-900',
      render: (row) => (
        <span
          className="font-semibold text-gray-900 text-sm block truncate"
          title={row.itemName || row.expenseName || row.description || 'Expense'}
        >
          {row.itemName || row.expenseName || row.description || 'Expense'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      className: 'w-1/4 text-center font-medium text-gray-900',
      render: (row) => {
        const dVal = row.expenseDate || row.date;
        return (
          <span className="font-medium text-gray-900 text-sm">
            {dVal
              ? new Date(dVal).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'remarks',
      label: 'Remarks',
      className: 'w-1/4 text-left font-medium text-gray-900',
      render: (row) => (
        <span
          className="font-medium text-gray-900 text-sm block truncate"
          title={row.remarks || row.notes || '—'}
        >
          {row.remarks || row.notes || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'w-1/4 text-right font-bold text-gray-900',
      render: (row) => (
        <span className="font-bold text-gray-900 text-sm">
          {formatINR(row.amount)}
        </span>
      ),
    },
  ];

  // Print Report Handler
  const handlePrint = () => {
    const printDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const printTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const rowsHtml = filteredExpenses
      .map((exp) => {
        const dVal = exp.expenseDate || exp.date;
        const formattedDate = dVal
          ? new Date(dVal).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'N/A';
        const name = exp.itemName || exp.expenseName || exp.description || 'Expense';
        const remarks = exp.remarks || exp.notes || '—';

        return `
          <tr>
            <td style="width: 25%; text-align: left; font-weight: 500; color: #0f172a;">${name}</td>
            <td style="width: 25%; text-align: center; color: #0f172a;">${formattedDate}</td>
            <td style="width: 25%; text-align: left; color: #0f172a;">${remarks}</td>
            <td style="width: 25%; text-align: right; font-weight: 700; color: #004475;">${formatINR(exp.amount)}</td>
          </tr>
        `;
      })
      .join('');

    const emptyRowHtml = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 24px; color: #64748b;">
          No expense records found for the selected period.
        </td>
      </tr>
    `;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Expense Summary - ${rangeLabel}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #004475;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .company-title {
              font-size: 22px;
              font-weight: 800;
              color: #004475;
              margin: 0;
            }
            .company-subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 2px;
            }
            .report-badge {
              text-align: right;
            }
            .report-title {
              font-size: 15px;
              font-weight: 700;
              color: #1e293b;
              text-transform: uppercase;
              margin: 0;
            }
            .period-badge {
              display: inline-block;
              background-color: #f1f5f9;
              color: #004475;
              font-weight: 700;
              font-size: 12px;
              padding: 3px 8px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 9px 12px;
            }
            th {
              background-color: #f8fafc !important;
              color: #334155 !important;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .total-row {
              background-color: #f1f5f9 !important;
              font-weight: 800;
              border-top: 2px solid #004475;
              border-bottom: 2px solid #004475;
            }
            .total-row td {
              font-size: 13px;
              padding: 10px 12px;
            }
            .signatures {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 20px;
            }
            .sig-line {
              width: 180px;
              border-top: 1px dashed #94a3b8;
              text-align: center;
              padding-top: 6px;
              font-size: 11px;
              color: #475569;
              font-weight: 600;
            }
            .footer-info {
              margin-top: 25px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="company-title">Livik Tech</h1>
              <div class="company-subtitle">Expense Management Module</div>
            </div>
            <div class="report-badge">
              <h2 class="report-title">Expense Report</h2>
              <div class="period-badge">${rangeLabel}</div>
              ${selectedCategory !== 'all' ? `<div class="period-badge" style="margin-left: 4px;">Category: ${selectedCategory}</div>` : ''}
              ${selectedPaymentMode !== 'all' ? `<div class="period-badge" style="margin-left: 4px;">Mode: ${selectedPaymentMode}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25%; text-align: left;">Expense Name</th>
                <th style="width: 25%; text-align: center;">Date</th>
                <th style="width: 25%; text-align: left;">Remarks</th>
                <th style="width: 25%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.length > 0 ? rowsHtml : emptyRowHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="text-transform: uppercase; font-weight: 800; color: #004475;">
                  Total Amount (${filteredExpenses.length} Items)
                </td>
                <td style="text-align: right; font-weight: 800; color: #004475;">
                  ${formatINR(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div class="signatures">
            <div class="sig-line">Prepared By</div>
            <div class="sig-line">Verified By</div>
            <div class="sig-line">Authorized Signatory</div>
          </div>

          <div class="footer-info">
            <span>Generated on: ${printDate} at ${printTime}</span>
            <span>Internal Use Only</span>
          </div>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=950,height=750,scrollbars=yes');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.onload = () => {
        setTimeout(() => {
          printWin.focus();
          printWin.print();
          setTimeout(() => printWin.close(), 600);
        }, 300);
      };
    } else {
      window.print();
    }
  };

  // Common Modal Footer
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="text-xs text-gray-500 font-medium">
        Total <span className="font-bold text-gray-800">{filteredExpenses.length}</span> expenses recorded
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#004475] hover:bg-[#00335a] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Printer size={15} />
          <span>Print</span>
        </Button>
        <Button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      onClose={onClose}
      title="Summary"
      widthClass="max-w-5xl"
      icon={<FileText size={20} className="text-[#004475]" />}
      footer={footer}
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Filters Container */}
        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200 space-y-3">
          {/* Top Row: Category & Payment Mode dropdowns + Badges (moved to top) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
            {/* Category and Payment Mode */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category */}
              <div className="flex items-center gap-1.5">
                <FilterDropdown
                  options={availableCategories.map((c) => ({
                    value: c,
                    label: c === 'all' ? 'All Categories' : c,
                  }))}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="All Categories"
                  className="w-40"
                />
              </div>
            </div>

            {/* Badges on the top line: This Month, Last Month, Last 3 Months (default), Custom */}
            <div className="flex items-center p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 gap-1 flex-wrap">
              {PRESET_BUTTONS.map((preset) => {
                const isActive = activeBadge === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleBadgeClick(preset.key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#004475] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-[#004475] border border-gray-200/80 shadow-2xs'
                    }`}
                  >
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Selection: Hidden by default, appears when Custom badge is clicked */}
          {activeBadge === 'custom' && (
            <div className="flex items-center justify-center w-full bg-white p-3 rounded-lg border border-gray-200/80 transition-all">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {/* From Selection */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#004475]" />
                    From:
                  </span>
                  <FilterDropdown
                    options={fromMonthOptions}
                    value={fromMonth}
                    onChange={handleFromMonthChange}
                    placeholder="Month"
                    className="w-36"
                    showScrollbar={true}
                  />
                  <FilterDropdown
                    options={computedYearOptions.map((y) => ({ value: y, label: y }))}
                    value={fromYear}
                    onChange={setFromYear}
                    placeholder="Year"
                    className="w-28"
                  />
                </div>

                {/* To Selection */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                    To:
                  </span>
                  <FilterDropdown
                    options={toMonthOptions}
                    value={toMonth}
                    onChange={handleToMonthChange}
                    placeholder="Month"
                    className="w-36"
                    showScrollbar={true}
                  />
                  <FilterDropdown
                    options={computedYearOptions.map((y) => ({ value: y, label: y }))}
                    value={toYear}
                    onChange={setToYear}
                    placeholder="Year"
                    className="w-28"
                  />
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  disabled={!fromMonth || !toMonth}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    !fromMonth || !toMonth
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#004475] hover:bg-[#00335a] text-white cursor-pointer shadow-xs'
                  }`}
                  title="Apply selected custom date range to display"
                >
                  <span>Apply</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Normal Reusable CustomTable showing strictly: Expense Name, Date, remarks and amount with equal spacing */}
        <CustomTable
          columns={columns}
          data={filteredExpenses}
          rowKey="id"
          className="border border-gray-200 rounded-lg"
          tableClassName="w-full !table-fixed divide-y divide-gray-200"
          maxHeight="50vh"
          showScrollbar={false}
          headerAlignment={{
            expenseName: 'left',
            date: 'center',
            remarks: 'left',
            amount: 'right',
          }}
          cellAlignment={{
            expenseName: 'left',
            date: 'center',
            remarks: 'left',
            amount: 'right',
          }}
        />

        {/* Bottom Total Amount Summary */}
        {filteredExpenses.length > 0 && (
          <div className="bg-gray-50 border border-gray-300 rounded-xl px-5 py-3.5 flex items-center justify-between text-sm">
            <span className="font-bold text-gray-800 uppercase tracking-wider">
              Total Amount
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                {filteredExpenses.length} Total Expenses
              </span>
              <span className="text-base font-extrabold text-[#004475]">
                {formatINR(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </CustomModalForm>
  );
}
