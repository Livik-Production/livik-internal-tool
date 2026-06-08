// app/components/Payslip.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  Download,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MoreVertical,
  Search,
  Printer,
  Mail,
} from 'lucide-react';

import Loader from '../../Loader';
import { showSuccessToast } from '../../Toast';
import FilterDropdown from '../../Buttons/FilterDropdown';
import PrimaryButton from '../../Buttons/PrimaryButton';

const EmployeePayslipTab = ({
  employeeName = '',
  initialPayslipYear = new Date().getFullYear(),
  processedMonths = [],
  onViewPayslip,
  onDownloadPayslip,
  isLoading = false,
  selectedYear: propSelectedYear,
  onYearChange,
  years: propYears,
}) => {
  // Generate years list (since 2025)
  const currentYear = new Date().getFullYear();
  const years = propYears || ['All Years'];
  if (!propYears) {
    for (let y = currentYear; y >= 2025; y--) {
      years.push(y);
    }
  }

  // Month names
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Filter options
  const months = [
    'All Months',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Pagination settings
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters state
  const getCurrentMonthName = () => {
    const d = new Date();
    return months[d.getMonth() + 1];
  };

  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [internalSelectedYear, setInternalSelectedYear] = useState(
    propSelectedYear || new Date().getFullYear()
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Use prop if available, otherwise internal state
  const selectedYear =
    propSelectedYear !== undefined ? propSelectedYear : internalSelectedYear;

  const handleYearChange = (val) => {
    setInternalSelectedYear(val);
    onYearChange?.(val);
  };

  // Sample payslip data
  const payslips = useMemo(() => {
    const list = processedMonths.map((monthStr) => {
      // Handle multiple formats: "2026-04", "JAN-2026", "April 2026"
      let year = new Date().getFullYear();
      let monthIdx = 0;

      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        const parts = monthStr.split('-');
        year = parseInt(parts[0], 10);
        monthIdx = parseInt(parts[1], 10) - 1;
      } else if (/^[A-Za-z]+-\d{4}$/.test(monthStr)) {
        const parts = monthStr.split('-');
        year = parseInt(parts[1], 10);
        monthIdx = monthNames.findIndex((m) =>
          m.toUpperCase().startsWith(parts[0].toUpperCase())
        );
      } else if (/^[A-Za-z]+\s\d{4}$/.test(monthStr)) {
        const parts = monthStr.split(' ');
        year = parseInt(parts[1], 10);
        monthIdx = monthNames.findIndex((m) =>
          m.toUpperCase().startsWith(parts[0].toUpperCase())
        );
      }

      if (monthIdx === -1 || isNaN(monthIdx)) monthIdx = 0;
      if (isNaN(year)) year = new Date().getFullYear();

      const fullName = months[monthIdx + 1];
      const short = monthNames[monthIdx];

      return {
        id: `${year}-${monthIdx + 1}`,
        year: year,
        monthIdx: monthIdx,
        monthName: fullName,
        shortMonth: short, // "Jan"
        status: 'Available',
        issuedDate: `01/${monthIdx + 1}/${year}`,
        paymentDate: `05/${monthIdx + 1}/${year}`,
      };
    });

    // Sort by Date descending (newest first)
    list.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthIdx - a.monthIdx;
    });

    return list;
  }, [processedMonths]);

  // Filter payslips based on month and year
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      if (selectedYear !== 'All Years' && p.year !== Number(selectedYear))
        return false;
      if (selectedMonth !== 'All Months' && p.monthName !== selectedMonth)
        return false;
      return true;
    });
  }, [payslips, selectedYear, selectedMonth]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayslips.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayslips = filteredPayslips.slice(startIndex, endIndex);

  // Grouped payslips for rendering
  const displayGroups = useMemo(() => {
    const groups = {};
    currentPayslips.forEach((p) => {
      if (!groups[p.year]) groups[p.year] = [];
      groups[p.year].push(p);
    });
    // Sort years descending
    return Object.keys(groups)
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        payslips: groups[year],
      }));
  }, [currentPayslips]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, searchQuery]);

  // Calculate totals for current page
  const pageTotals = currentPayslips.reduce(
    (acc, payslip) => {
      acc.totalGross += payslip.gross || 0;
      acc.totalDeductions += payslip.deductions || 0;
      acc.totalNet += payslip.net || 0;
      return acc;
    },
    { totalGross: 0, totalDeductions: 0, totalNet: 0 }
  );

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
  };

  const handleViewPayslip = (payslip) => {
    if (onViewPayslip) {
      onViewPayslip(payslip);
    } else {
      showSuccessToast(
        `Viewing payslip for ${payslip.monthName} ${payslip.year}`
      );
    }
  };

  const handleDownloadPayslip = (payslip) => {
    if (onDownloadPayslip) {
      onDownloadPayslip(payslip);
    } else {
      showSuccessToast(
        `Downloading payslip for ${payslip.monthName} ${payslip.year}`
      );
    }
  };

  const handleSendEmail = (payslip) => {
    showSuccessToast(
      `Sending payslip for ${payslip.monthName} ${payslip.year} via email`
    );
  };

  const handlePrint = (payslip) => {
    showSuccessToast(
      `Printing payslip for ${payslip.monthName} ${payslip.year}`
    );
  };

  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('...');

      if (totalPages > 1) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div key={isLoading} className="bg-transparent animate-dashboard-reveal">
      {isLoading ? (
        <div className="p-12 flex justify-center items-center bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
          <Loader label="Fetching payslips..." size="md" fullScreen={false} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              {/* Title and Stats */}
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#004475] rounded-xl shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                    Payslips
                  </h2>
                </div>
              </div>

              {/* Controls: Filters + Download */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Custom Month Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Month:
                  </span>
                  <FilterDropdown
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={months.map((m) => ({ label: m, value: m }))}
                    placeholder="Month"
                    className="min-w-[160px]"
                  />
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Year:
                  </span>
                  <FilterDropdown
                    value={selectedYear}
                    onChange={(val) => {
                      const finalVal = val === 'All Years' ? val : Number(val);
                      handleYearChange(finalVal);
                    }}
                    options={years.map((y) => ({ label: String(y), value: y }))}
                    placeholder="Year"
                    className="min-w-[120px]"
                  />
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                {/* Download Button */}
                <PrimaryButton
                  onClick={() =>
                    showSuccessToast('Downloading all payslips...')
                  }
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#004475] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download All
                </PrimaryButton>
              </div>
            </div>
          </div>

          <div className="p-6">
            {displayGroups.length > 0 ? (
              <div className="space-y-12">
                {displayGroups.map((group) => (
                  <div key={group.year}>
                    {/* Year Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {group.year} Records
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {group.payslips.map((payslip) => (
                        <div
                          key={payslip.id}
                          className="group relative bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex items-center justify-between gap-4 overflow-hidden"
                        >
                          {/* Subtle Background Accent */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-blue-50/0 group-hover:from-indigo-50/30 group-hover:to-blue-50/30 transition-all duration-500"></div>

                          {/* Left Side: Icon & Month */}
                          <div className="relative flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                              <Calendar className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 leading-none">
                                {payslip.monthName}
                              </h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">
                                {payslip.year}
                              </p>
                            </div>
                          </div>

                          {/* Right Side: Actions */}
                          <div className="relative flex items-center gap-2">
                            <PrimaryButton
                              onClick={() => handleViewPayslip(payslip)}
                              className="px-3 py-1.5 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </PrimaryButton>
                            <button
                              onClick={() => handleDownloadPayslip(payslip)}
                              className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 border border-slate-100"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Status Indicator (Subtle dot) */}
                          <div className="absolute top-1.5 right-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-2 px-4 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full opacity-50"></div>
                  <div className="relative w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No Payslips Found
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-10 leading-relaxed font-medium">
                  We couldn't find any payslips matching your current filters
                  for{' '}
                  <span className="text-slate-900 font-bold">
                    {selectedMonth} {selectedYear}
                  </span>
                  .
                </p>
                <PrimaryButton
                  onClick={() => {
                    setSelectedMonth('All Months');
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 bg-[#004475] text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg shadow-slate-900/10 active:scale-95"
                >
                  <Filter className="w-4 h-4" />
                  View All Records
                </PrimaryButton>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredPayslips.length > ITEMS_PER_PAGE && (
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-sm font-bold text-slate-500">
                    Showing{' '}
                    <span className="text-slate-900">{startIndex + 1}</span> to{' '}
                    <span className="text-slate-900">
                      {Math.min(endIndex, filteredPayslips.length)}
                    </span>{' '}
                    of{' '}
                    <span className="text-slate-900">
                      {filteredPayslips.length}
                    </span>{' '}
                    Results
                  </p>

                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) =>
                        page === '...' ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4 rotate-90" />
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                              currentPage === page
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayslipTab;
