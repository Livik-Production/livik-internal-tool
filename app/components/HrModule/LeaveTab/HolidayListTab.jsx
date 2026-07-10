'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Info,
  ShieldCheck,
  ChevronDown,
  Eye,
  Search,
  X,
} from 'lucide-react';
import CustomTable from '../../CustomTable';
import Loader from '../../Loader';
import CustomModalForm from '../../CustomModalForm';
import IconButton from '../../Buttons/IconButton';
import FilterDropdown from '../../Buttons/FilterDropdown';

// Export static holiday list so other components can reuse it
export const HOLIDAYS = [
  {
    date: '2026-01-01',
    holiday: "New Year's Day",
    type: 'Public Holiday',
    description: 'Celebration of the new year',
  },
  {
    date: '2026-01-14',
    holiday: 'Pongal',
    type: 'Public Holiday',
    description: 'Harvest festival of Tamil Nadu',
  },
  {
    date: '2026-01-15',
    holiday: 'Mattu Pongal',
    type: 'Public Holiday',
    description: 'Cow worship day of Tamil Nadu',
  },
  {
    date: '2026-01-16',
    holiday: 'Kaanum Pongal',
    type: 'Public Holiday',
    description: 'Meet our relatives and friends in the day',
  },
  {
    date: '2026-01-26',
    holiday: 'Republic Day',
    type: 'Public Holiday',
    description: "Celebration of India's constitution",
  },
  {
    date: '2026-03-29',
    holiday: 'Good Friday',
    type: 'Public Holiday',
    description: 'Christian holiday commemorating crucifixion',
  },
  {
    date: '2026-04-14',
    holiday: 'Tamil New Year',
    type: 'Public Holiday',
    description: 'Tamil New Year celebration',
  },
  {
    date: '2026-05-01',
    holiday: 'May Day',
    type: 'Public Holiday',
    description: "International Workers' Day",
  },
  {
    date: '2026-08-15',
    holiday: 'Independence Day',
    type: 'Public Holiday',
    description: "India's Independence Day",
  },
  {
    date: '2026-10-02',
    holiday: 'Gandhi Jayanti',
    type: 'Public Holiday',
    description: 'Birthday of Mahatma Gandhi',
  },
  {
    date: '2026-10-25',
    holiday: 'Diwali',
    type: 'Public Holiday',
    description: 'Festival of Lights',
  },
  {
    date: '2026-12-25',
    holiday: 'Christmas',
    type: 'Public Holiday',
    description: 'Celebration of Christmas',
  },
];

const HolidayListTab = ({
  onAddHoliday, // ✅ Receive handler for modal
  canControlAllEmployees,
  hideAddButton = false,
}) => {
  const [holidayData, setHolidayData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Year filter logic
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  const yearOptions = [{ value: 'All', label: 'All Years' }];
  const startYear = 2025;
  const currentYear = now.getFullYear();
  for (let y = currentYear + 1; y >= startYear; y--) {
    yearOptions.push({ value: y.toString(), label: y.toString() });
  }

  // Month Selection State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(null);

  // Local Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal State
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/holidays');
      if (!res.ok) throw new Error('Failed to fetch holidays');
      const data = await res.json();

      // Map DB fields to component fields
      const mapped = data.map((h) => ({
        id: h.id,
        date: h.holidayDate,
        holiday: h.holidayName,
        type: h.holidayType,
        description: h.description,
      }));

      setHolidayData(mapped);
      setFilteredData(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    // Listen for refresh events (e.g. after upload)
    const handleRefresh = () => fetchHolidays();
    window.addEventListener('refreshHolidays', handleRefresh);
    return () => window.removeEventListener('refreshHolidays', handleRefresh);
  }, []);

  // Filter data based on search query, selected year, and selected month
  useEffect(() => {
    let filtered = holidayData.filter((item) => {
      if (selectedYear === 'All') return true;
      const itemYear = new Date(item.date).getFullYear().toString();
      return itemYear === selectedYear;
    });

    if (selectedMonthIndex !== null && selectedYear !== 'All') {
      filtered = filtered.filter((item) => {
        return new Date(item.date).getMonth() === selectedMonthIndex;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.holiday || '').toLowerCase().includes(query) ||
          (item.type || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          new Date(item.date)
            .toLocaleDateString('en-IN')
            .toLowerCase()
            .includes(query)
      );
    }

    if (selectedYear === 'All') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const yearDiff = dateB.getFullYear() - dateA.getFullYear(); // Descending year
        if (yearDiff !== 0) return yearDiff;
        return dateA - dateB; // Ascending date within the same year
      });
    } else {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    setFilteredData(filtered);
  }, [searchQuery, holidayData, selectedYear, selectedMonthIndex]);

  // Get upcoming holidays
  const upcomingHolidays = holidayData
    .filter((h) => {
      const isUpcoming = new Date(h.date) >= new Date();
      if (!isUpcoming) return false;
      if (selectedYear === 'All') return true;
      return new Date(h.date).getFullYear().toString() === selectedYear;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get the next upcoming holiday
  const nextHoliday = upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <div>
          <div className="font-medium text-left">
            {new Date(row.date).toLocaleDateString('en-IN')}
          </div>
          <div className="text-xs text-gray-500 text-left">
            {new Date(row.date).toLocaleDateString('en-US', {
              weekday: 'long',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'holiday',
      label: 'Holiday',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium">{row.holiday}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-[200px] mx-auto text-center">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium text-center${row.type === 'Public Holiday'
            ? 'bg-purple-100 text-purple-800'
            : row.type === 'Restricted Holiday'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
            }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Info',
      render: (row) => (
        <div className="flex justify-end">
          <IconButton
            onClick={() => handleViewHoliday(row)}
            title="View holiday details"
          >
            <Info size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  const handleViewHoliday = (holiday) => {
    setSelectedHoliday(holiday);
    setIsDetailModalOpen(true);
  };

  const yearToUse = selectedYear === 'All' ? currentYear : parseInt(selectedYear);

  // Generate 4 months: past 1 month, present month, and 2 future months
  const baseMonth = yearToUse === currentYear ? now.getMonth() : 0; // Use Jan for non-current years
  const generatedMonths = [-1, 0, 1, 2].map(offset => {
    const date = new Date(yearToUse, baseMonth + offset, 1);
    return {
      index: date.getMonth(),
      actualYear: date.getFullYear(),
      monthStr: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      yearStr: date.getFullYear().toString().slice(-2),
      fullYear: date.getFullYear(),
    };
  });

  const renderHeaderLayout = () => {

    return (
      <div>
        <h2 className="text-4xl font-extrabold text-[#004475] mb-3 flex justify-center py-2">
          Holiday Calendar {yearToUse}
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          {/* Left Side: Month Selector */}
          <div className="flex flex-col w-full md:w-auto overflow-hidden">

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 w-full md:max-w-[50vw]">
              {generatedMonths.map((m, idx) => {
                const isFilterActive = selectedMonthIndex !== null && m.index === selectedMonthIndex && (selectedYear === 'All' || m.actualYear.toString() === selectedYear);
                const isDefaultActive = selectedMonthIndex === null && m.index === now.getMonth() && m.actualYear === currentYear;
                const isActive = isFilterActive || isDefaultActive;
                const isPast = m.actualYear < currentYear || (m.actualYear === currentYear && m.index < now.getMonth());

                let bgClass = "bg-white border border-gray-100 text-gray-700 hover:border-blue-300 shadow-sm";
                if (isActive) {
                  bgClass = "bg-[#004475] text-white shadow-md border-[#004475]";
                } else if (isPast) {
                  bgClass = "bg-[#e0eaf5] text-gray-600 border-transparent";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (selectedYear !== 'All' && m.actualYear.toString() !== selectedYear) {
                        setSelectedYear(m.actualYear.toString());
                      }
                      setSelectedMonthIndex(isActive ? null : m.index);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-2xl cursor-pointer transition-all duration-200 shrink-0 ${bgClass}`}
                  >
                    <span className={`text-[11px] font-bold tracking-wider ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
                      {m.monthStr}
                    </span>
                    <span className={`text-xl font-bold mt-0.5 ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {isActive ? m.fullYear : m.yearStr}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 shadow-sm"></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Filters & Actions */}
          <div className="flex-1 flex items-center justify-end gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
            {/* Year Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Year :
              </span>
              <FilterDropdown
                options={yearOptions}
                value={selectedYear}
                onChange={(val) => {
                  setSelectedYear(val);
                  if (val === 'All') setSelectedMonthIndex(null);
                }}
                placeholder="Year"
                className="min-w-[110px]"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search holidays..."
                className="px-3 py-2 pl-10 pr-9 border border-gray-300 rounded-xl text-sm w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {searchQuery && (
                 <IconButton
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-0.5 shadow-none bg-transparent hover:bg-transparent"
              title="Clear search"
            >
              <X size={14} className="text-gray-400 hover:text-red-500" />
            </IconButton>

              )}
            </div>

            {/* Add Holiday Button */}
            {!hideAddButton && (
              <PrimaryButton
                onClick={onAddHoliday}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 ${canControlAllEmployees
                  ? 'bg-[#004475] text-white hover:bg-[#003358] hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                disabled={!canControlAllEmployees}
                title={
                  !canControlAllEmployees ? 'Permission required' : 'Add Holiday List'
                }
              >
                + Add Holiday List
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {renderHeaderLayout()}

        <section className="overflow-hidden rounded-xl border border-gray-300 shadow-inner min-h-[400px] flex items-center justify-center">
          <Loader label="Loading holiday list..." size="md" fullScreen={false} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {renderHeaderLayout()}

        <section className="overflow-hidden rounded-xl border border-gray-300 shadow-inner p-8">
          <div className="text-center text-red-500">
            <p className="font-semibold">Error loading holiday list</p>
            <p className="text-sm mt-2">{error}</p>
            <PrimaryButton
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </PrimaryButton>
          </div>
        </section>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="space-y-6">
        {renderHeaderLayout()}

        <section className="overflow-hidden rounded-xl border border-gray-300 shadow-inner p-8">
          <div className="text-center text-gray-500">
            <p className="font-medium">No holidays found</p>
            <p className="text-sm mt-2">
              {searchQuery
                ? `No holidays match "${searchQuery}". Try a different search term.`
                : 'No   records available.'}
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Compute banner visibility and active month
  let showBanner = false;
  let activeMonthForBanner = null;

  for (const m of generatedMonths) {
    const isFilterActive = selectedMonthIndex !== null && m.index === selectedMonthIndex && (selectedYear === 'All' || m.actualYear.toString() === selectedYear);
    const isDefaultActive = selectedMonthIndex === null && m.index === now.getMonth() && m.actualYear === currentYear;
    const isActive = isFilterActive || isDefaultActive;

    if (isActive) {
      showBanner = true;
      activeMonthForBanner = m;
      break;
    }
  }

  // Compute featured holiday for the active month
  let featuredHoliday = null;
  let bannerTitle = "HOLIDAY IN THIS MONTH";

  if (activeMonthForBanner) {
    const holidaysInActiveMonth = holidayData.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === activeMonthForBanner.index && d.getFullYear() === activeMonthForBanner.actualYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (holidaysInActiveMonth.length > 0) {
      const upcomingInMonth = holidaysInActiveMonth.filter(h => new Date(h.date).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0));
      if (upcomingInMonth.length > 0) {
        featuredHoliday = upcomingInMonth[0];
        bannerTitle = "UPCOMING HOLIDAY IN THIS MONTH";
      } else {
        featuredHoliday = holidaysInActiveMonth[0];
        bannerTitle = "SELECTED MONTH HOLIDAY";
      }
    }
  }

  const calculateDaysLeft = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {renderHeaderLayout()}

      {showBanner && (() => {
        if (!featuredHoliday) {
          return (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 md:p-8 flex flex-col items-center justify-center shadow-sm border border-blue-100 md:min-h-[160px] text-center">
              <div className="bg-blue-100/50 p-3 rounded-full mb-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900">No Holidays This Month</h3>
              <p className="text-sm text-blue-600/70 mt-1">There are no upcoming holidays scheduled for the current month.</p>
            </div>
          );
        }

        const daysLeft = calculateDaysLeft(featuredHoliday.date);
        return (
          <div
            className="relative rounded-xl overflow-hidden shadow-md border border-blue-900/20 min-h-[160px] md:min-h-[200px] flex items-end p-5 md:p-6"
            style={{
              backgroundColor: '#154b9a',
              backgroundImage: featuredHoliday.imageUrl ? `url(${featuredHoliday.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a254c] via-[#0a254c]/60 to-transparent"></div>

            <div className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4 text-white">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/90 mb-0.5">
                  {bannerTitle}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-md">{featuredHoliday.holiday}</h2>
                <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-blue-100 mt-1 drop-shadow-md">
                  <Calendar size={14} />
                  <span>
                    {new Date(featuredHoliday.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 self-start md:self-end">
                <div className="px-5 py-2.5 bg-black/30 border border-white/10 rounded-xl flex flex-col items-center justify-center min-w-[100px] backdrop-blur-md shadow-lg">
                  <span className="text-2xl font-bold leading-none mb-1 drop-shadow-md">{Math.abs(daysLeft)}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200/90 drop-shadow-md">
                    {daysLeft === 0 ? "TODAY" : (daysLeft < 0 ? "DAYS AGO" : "DAYS LEFT")}
                  </span>
                </div>
                <button
                  onClick={() => handleViewHoliday(featuredHoliday)}
                  className="text-[11px] font-bold text-white hover:text-blue-200 flex items-center gap-1 transition-colors mt-1 drop-shadow-md"
                >
                  View Details <span className="text-[14px]">→</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <section className="overflow-hidden rounded-xl border border-gray-300 shadow-inner">
        {/* <div className="p-4 bg-gray-50 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-700">
                Company Holiday Calendar{' '}
                {selectedYear === 'All' ? 'All Years' : selectedYear}
              </h3>
            </div>
            <div className="flex items-center gap-4 font-semibold">
              <div className="flex items-center gap-2">
                {nextHoliday ? (
                  <>
                    <div className="text-right flex flex-col-3 gap-3">
                      <p className="text-xs text-gray-600">Next holiday :</p>
                      <p className="text-xs font-semibold text-blue-700">
                        {nextHoliday.holiday}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold">
                        {new Date(nextHoliday.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">
                      No upcoming holidays
                    </p>
                    <PrimaryButton
                      onClick={() => {
                        alert('No upcoming holidays for the rest of the year!');
                      }}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      View Upcoming
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div> */}
        <div className="overflow-y-auto">
          <CustomTable
            maxHeight="60vh"
            columns={columns}
            data={filteredData}
            rowKey="date"
            // These props will align both headers and cells
            headerAlignment={{
              date: 'left',
              holiday: 'center',
              type: 'center',
              actions: 'right',
            }}
            cellAlignment={{
              date: 'left',
              holiday: 'center',
              type: 'center',
              actions: 'right',
            }}
          />
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <div>
              <p>
                📅{' '}
                <strong>
                  {selectedYear === 'All' ? 'All Years' : selectedYear} Holiday
                  Calendar:
                </strong>{' '}
                {
                  holidayData.filter((item) =>
                    selectedYear === 'All'
                      ? true
                      : new Date(item.date).getFullYear().toString() ===
                      selectedYear
                  ).length
                }{' '}
                official holidays
              </p>
              <p className="mt-1 text-xs">
                Click "Details" to see more information about each holiday.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs">
                {nextHoliday ? (
                  <>
                    <span className="font-semibold text-blue-600">
                      {nextHoliday.holiday}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({new Date(nextHoliday.date).toLocaleDateString('en-IN')})
                    </span>
                  </>
                ) : (
                  'No upcoming holidays'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Holiday Details Modal */}
      <CustomModalForm
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        title="Holiday Information"
        widthClass="max-w-4xl"
        icon={null}
        footer={
          <PrimaryButton
            onClick={() => setIsDetailModalOpen(false)}
            className="px-6 py-2 bg-[#004475] text-white rounded-xl font-bold shadow-lg hover:bg-[#004475] transition-all active:scale-95"
          >
            Got it
          </PrimaryButton>
        }
      >
        {selectedHoliday && (
          <div className="flex flex-col md:flex-row gap-6 p-3">
            {/* Left Side: Image / Icon Container */}
            <div className="md:w-1/2 bg-blue-50 rounded-4xl border border-blue-100 flex flex-col items-center justify-center text-center overflow-hidden min-h-[250px]">
              {selectedHoliday.holiday.toLowerCase().includes('new year') ? (
                <img
                  src="/images/holidays/new_year.png"
                  alt="New Year"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday
                .toLowerCase()
                .includes('mattu pongal') ? (
                <img
                  src="/images/holidays/mattu_pongal.png"
                  alt="Mattu Pongal"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday.toLowerCase().includes('pongal') ? (
                <img
                  src="/images/holidays/pongal.png"
                  alt="Pongal"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday.toLowerCase().includes('diwali') ? (
                <img
                  src="/images/holidays/diwali.png"
                  alt="Diwali"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday
                .toLowerCase()
                .includes('christmas') ? (
                <img
                  src="/images/holidays/christmas.png"
                  alt="Christmas"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday
                .toLowerCase()
                .includes('republic day') ? (
                <img
                  src="/images/holidays/republic_day.png"
                  alt="Republic Day"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday
                .toLowerCase()
                .includes('tamil new year') ? (
                <img
                  src="/images/holidays/tamil_new_year.png"
                  alt="Tamil New Year"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday.toLowerCase().includes('gandhi') ? (
                <img
                  src="/images/holidays/gandhi_jayathi.png"
                  alt="Gandhi Jayanti"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday.toLowerCase().includes('ganesh') ? (
                <img
                  src="/images/holidays/ganesh.png"
                  alt="Ganesh Chaturthi"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday
                .toLowerCase()
                .includes('saraswathi') ||
                selectedHoliday.holiday.toLowerCase().includes('ayudha') ? (
                <img
                  src="/images/holidays/saraswathi_pooja.png"
                  alt="Saraswathi Pooja"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : selectedHoliday.holiday.toLowerCase().includes('may day') ? (
                <img
                  src="/images/holidays/may_day.png"
                  alt="May Day"
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full py-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
                    <Calendar size={40} />
                  </div>
                  <div className="mt-2 text-sm font-bold text-blue-600 bg-blue-100 px-4 py-1.5 rounded-full uppercase tracking-widest">
                    {selectedHoliday.type}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Content Container */}
            <div className="md:w-1/2 flex flex-col justify-center space-y-5">
              <div className="text-center md:text-left">
                <h4 className="text-3xl font-bold text-gray-900 leading-tight">
                  {selectedHoliday.holiday}
                </h4>
                {
                  /* Only show type here if it's an image, as icon view shows it inside the left pane */
                  (selectedHoliday.holiday.toLowerCase().includes('new year') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('mattu pongal') ||
                    selectedHoliday.holiday.toLowerCase().includes('pongal') ||
                    selectedHoliday.holiday.toLowerCase().includes('diwali') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('christmas') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('republic day') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('tamil new year') ||
                    selectedHoliday.holiday.toLowerCase().includes('gandhi') ||
                    selectedHoliday.holiday.toLowerCase().includes('ganesh') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('saraswathi') ||
                    selectedHoliday.holiday.toLowerCase().includes('ayudha') ||
                    selectedHoliday.holiday
                      .toLowerCase()
                      .includes('may day')) && (
                    <div className="mt-3 inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      {selectedHoliday.type}
                    </div>
                  )
                }
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Date
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {new Date(selectedHoliday.date).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Day
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {new Date(selectedHoliday.date).toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Info size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    About this Holiday
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {selectedHoliday.description ||
                    'No additional notes for this holiday.'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <ShieldCheck
                  className="text-green-600 flex-shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-[11px] text-green-800 font-medium leading-relaxed">
                  The office will remain closed on this day. Please plan your
                  tasks accordingly.
                </p>
              </div>
            </div>
          </div>
        )}
      </CustomModalForm>
    </div>
  );
};

export default HolidayListTab;
