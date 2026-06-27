'use client';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';

import { useState, useEffect } from 'react';
import { Search, FileText, Download } from 'lucide-react';
import CustomModalForm from '../../CustomModalForm';
import Loader from '../../Loader';

export default function AttendanceDetailedModal({ isOpen, onClose, month }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const fetchDetailedAttendance = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/hr/attendance?month=${month}&detailed=true`
      );
      if (!res.ok) throw new Error('Failed to fetch detailed attendance');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedAttendance();

    // Listen for refresh event
    const refreshHandler = () => fetchDetailedAttendance();
    window.addEventListener('refresh-attendance-data', refreshHandler);
    return () => {
      window.removeEventListener('refresh-attendance-data', refreshHandler);
    };
  }, [isOpen, month]);

  if (!isOpen || !mounted) return null;

  // Generate dates for the month
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, monthNum - 1, day);
    const dayStr = day.toString().padStart(2, '0');
    const monthStrStr = monthNum.toString().padStart(2, '0');
    return {
      dateStr: `${year}-${monthStrStr}-${dayStr}`,
      display: `${dayStr}/${monthStrStr}/${year}`,
    };
  });

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.empId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'P':
        return 'text-green-600 bg-green-50';
      case 'A':
        return 'text-red-600 bg-red-50';
      case 'HD':
        return 'text-yellow-600 bg-yellow-50';
      case 'CH':
        return 'text-purple-600 bg-purple-50';
      // case "W":
      //   return "text-gray-500 bg-gray-100 font-medium";
      default:
        return 'text-gray-300';
    }
  };

  const titleContent = (
    <div className="font-normal text-base block w-full">
      <h2 className="text-xl font-bold text-gray-900">
        Monthly Attendance Summary View
      </h2>
      <p className="text-sm text-gray-500">
        Detailed view for{' '}
        {new Date(month + '-01').toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </div>
  );

  const iconContent = (
    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
      <FileText size={20} />
    </div>
  );

  return (
    <CustomModalForm
      open={isOpen}
      onCancel={onClose}
      title={titleContent}
      icon={iconContent}
      widthClass="w-[95vw] max-w-[95vw]"
      headerActions={
        <PrimaryButton
          title="Export"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
        >
          <Download size={16} color='blue'/>
          <span className="text-gray-700">Export</span>
        </PrimaryButton>
      }
    >
      <div className="flex flex-col h-[70vh]">
        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>{' '}
              P : Present
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>{' '}
              A : Absent
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>{' '}
              HD : Half Day
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>{' '}
              CH : Holiday
            </span>
            <span className="flex items-center gap-1 ml-2">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>{' '}
              W : Week Off
            </span>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader label="Loading detailed view..." size="lg" />
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 gap-4">
              <p className="font-semibold text-lg">Error: {error}</p>
              <PrimaryButton
                onClick={fetchDetailedAttendance}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </PrimaryButton>
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-gray-50 sticky top-0 z-20">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-50 px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-[100px] min-w-[100px]">
                      EmpID
                    </th>
                    <th className="sticky left-[100px] z-30 bg-gray-50 px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[180px]">
                      Name
                    </th>
                    {dates.map((d) => (
                      <th
                        key={d.dateStr}
                        className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[45px]"
                      >
                        {d.display.split('/')[0]}
                        <br />
                        {d.display.split('/')[1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-900 border-r border-gray-200 w-[100px] min-w-[100px]">
                        {row.empId}
                      </td>
                      <td className="sticky left-[100px] z-10 bg-white group-hover:bg-gray-50 px-6 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-200 min-w-[180px]">
                        {row.name}
                      </td>
                      {dates.map((d) => {
                        const status = row.dailyAttendance[d.dateStr];
                        return (
                          <td
                            key={d.dateStr}
                            className={`px-2 py-3 text-center text-xs font-bold border-r border-gray-200 ${getStatusColor(status)}`}
                          >
                            {status || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CustomModalForm>
  );
}
