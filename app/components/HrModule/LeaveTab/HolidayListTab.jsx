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
  for (let y = currentYear; y >= startYear; y--) {
    yearOptions.push({ value: y.toString(), label: y.toString() });
  }

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

  // Filter data based on search query and selected year
  useEffect(() => {
    let filtered = holidayData.filter((item) => {
      if (selectedYear === 'All') return true;
      const itemYear = new Date(item.date).getFullYear().toString();
      return itemYear === selectedYear;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.holiday.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
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
  }, [searchQuery, holidayData, selectedYear]);

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
          className={`px-2 py-1 rounded text-xs font-medium text-center${
            row.type === 'Public Holiday'
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

  const renderHeaderLayout = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1"></div>
      <div className="flex items-center gap-3">
        {/* Year Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Year :
          </span>
          <FilterDropdown
            options={yearOptions}
            value={selectedYear}
            onChange={(val) => setSelectedYear(val)}
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
            className="px-3 py-2 pl-10 pr-9 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {searchQuery && (
            <IconButton
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 shadow-none bg-transparent hover:bg-transparent"
              title="Clear search"
            >
              <X size={14} className="text-gray-400 hover:text-[#004475]" />
            </IconButton>
          )}
        </div>

        {/* Add Holiday Button */}
        <PrimaryButton
          onClick={onAddHoliday}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canControlAllEmployees
              ? 'bg-[#004475] text-white hover:bg-[#004475]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!canControlAllEmployees}
          title={
            !canControlAllEmployees ? 'Permission required' : 'Add Holiday List'
          }
        >
          + Add Holiday List
        </PrimaryButton>
      </div>
    </div>
  );

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
                : 'No holiday records available.'}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {renderHeaderLayout()}

      <section className="overflow-hidden rounded-xl border border-gray-300 shadow-inner">
        <div className="p-4 bg-gray-50 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-700">
                Company Holiday Calendar{' '}
                {selectedYear === 'All' ? 'All Years' : selectedYear}
              </h3>
            </div>
            <div className="flex items-center gap-4 font-semibold">
              {/* Upcoming Holiday Display */}
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
        </div>
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
                <h4 className="text-3xl font-black text-gray-900 leading-tight">
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
