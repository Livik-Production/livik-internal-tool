'use client';
import Button from '../../Buttons/Button';
import HyperlinkButton from '../../Buttons/HyperlinkButton';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import CustomTable from '../../CustomTable';
import Loader from '../../Loader';
import FilterDropdown from '../../Buttons/FilterDropdown';
import IconButton from '../../Buttons/IconButton';
import Pagination from '../../Pagination';

const ApprovalsTab = ({ onViewLeaveDetails }) => {
  const [approvalsData, setApprovalsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      // Fetch both Leave and Permission requests concurrently
      const [leaveRes, permRes] = await Promise.all([
        fetch('/api/leave'),
        fetch('/api/permission'),
      ]);

      if (!leaveRes.ok || !permRes.ok)
        throw new Error('Failed to fetch requests');

      const [leaveData, permData] = await Promise.all([
        leaveRes.json(),
        permRes.json(),
      ]);

      // Map Leave Requests
      const mappedLeaves = leaveData.map((req) => ({
        id: req.id.slice(-4).toUpperCase(),
        requestId: req.id,
        empid: req.employee?.empId || 'N/A',
        name: `${req.employee?.firstName} ${req.employee?.lastName}`,
        days: req.totalDays,
        date: new Date(req.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        type: (() => {
          const t = req.leaveType || '';
          const clean = t.replace(/-LOP$/, '');
          let name = clean;
          if (clean === 'SL') name = 'Sick Leave';
          else if (clean === 'CL') name = 'Casual Leave';

          if (req.isHalfDay) {
            const half =
              req.halfDayPeriod === 'FIRST_HALF' ? '1st Half' : '2nd Half';
            name = `Half Day ${name} (${half})`;
          }

          return name;
        })(),
        status:
          req.status.charAt(0).toUpperCase() +
          req.status.slice(1).toLowerCase(),
        appliedDate: req.createdAt,
        category: 'leave',
        __raw: {
          ...req,
          startDate: req.startDate
            ? new Date(req.startDate).toISOString().split('T')[0]
            : null,
          endDate: req.endDate
            ? new Date(req.endDate).toISOString().split('T')[0]
            : null,
        },
      }));

      // Map Permission Requests
      const mappedPermissions = permData.map((req) => ({
        id: req.id.slice(-4).toUpperCase(),
        requestId: req.id,
        empid: req.employee?.empId || 'N/A',
        name: `${req.employee?.firstName} ${req.employee?.lastName}`,
        days: (req.durationHours || 0) + ' hrs',
        date: new Date(req.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        type: 'Permission',
        status:
          req.status === 'APPROVED' && !req.isConfirmed
            ? 'Pending Confirmation'
            : req.status.charAt(0).toUpperCase() +
              req.status.slice(1).toLowerCase(),
        appliedDate: req.createdAt,
        category: 'permission',
        __raw: {
          ...req,
          startDate: req.date
            ? new Date(req.date).toISOString().split('T')[0]
            : null,
          endDate: req.date
            ? new Date(req.date).toISOString().split('T')[0]
            : null,
        },
      }));

      // Combine and sort by created date (newest first)
      const combined = [...mappedLeaves, ...mappedPermissions].sort(
        (a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)
      );

      setApprovalsData(combined);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Filter data based on search query and status filter
  useEffect(() => {
    let filtered = [...approvalsData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.empid.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.date.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, approvalsData]);

  // Calculate counts and pagination
  const totalCount = approvalsData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Handle opening Leave Request Form
  const handleOpenLeaveForm = (row) => {
    // Format data for the modal/view
    const formData = {
      ...row.__raw, // Pass all raw database fields (actualHours, remarks, startTime, etc.)
      id: row.requestId || row.id,
      leave_id: row.id,
      employeeId: row.__raw?.employeeId,
      type:
        row.category === 'permission'
          ? 'Permission'
          : row.type === 'Sick Leave'
            ? 'sl'
            : row.type === 'Earned Leave'
              ? 'el'
              : row.type === 'Casual Leave'
                ? 'cl'
                : 'sl',
      from: row.__raw?.startDate,
      to: row.__raw?.endDate,
      reason: row.__raw?.reason || row.__raw?.details,
      document: row.__raw?.attachment,
      status: row.status,
      isHalfDay: row.__raw?.isHalfDay || false,
      halfDayPeriod: row.__raw?.halfDayPeriod || '',
      employee: row.name,
      days: row.days,
      applied_date: row.date,
      category: row.category,
      // Add profile info for the header
      empId: row.empid,
      employeePhoto: row.__raw?.employee?.photo || null,
      employeeDesignation: row.__raw?.employee?.designation || '',
      employeeDepartment: row.__raw?.employee?.department || '',
    };

    // Call parent handler
    if (onViewLeaveDetails) {
      onViewLeaveDetails(formData);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Request ID',
      render: (row) => (
        <HyperlinkButton
          onClick={() => handleOpenLeaveForm(row)}
          title="View leave request details"
        >
          {row.id}
        </HyperlinkButton>
      ),
    },
    { key: 'empid', label: 'Employee ID' },
    { key: 'name', label: 'Employee Name' },
    {
      key: 'from',
      label: 'From Date',
      render: (row) => row.__raw?.startDate || 'N/A',
    },
    {
      key: 'to',
      label: 'To Date',
      render: (row) => row.__raw?.endDate || 'N/A',
    },
    { key: 'days', label: 'Days' },
    { key: 'date', label: 'Created date' },
    { key: 'type', label: 'Leave Type' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : row.status === 'Pending Confirmation'
                ? 'bg-orange-100 text-orange-800 animate-pulse'
                : row.status === 'Approved'
                  ? 'bg-green-100 text-green-800'
                  : row.status === 'Rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* LOCAL CONTROLS */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1"></div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approvals..."
              className="px-3 py-2 pl-10 pr-9 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Status:
            </span>
            <FilterDropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Status"
              className="min-w-[140px]"
            />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 shadow-inner">
        <div className="overflow-y-auto">
          {actionLoading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader
                label="Processing action..."
                size="sm"
                fullScreen={false}
              />
            </div>
          )}

          {loading ? (
            <div className="p-8">
              <Loader
                label="Loading approvals data..."
                size="md"
                fullScreen={false}
              />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8">
              <p className="font-semibold">Error loading approvals</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              <p className="font-medium">No approvals found</p>
              <p className="text-sm mt-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try changing your search or filter criteria.'
                  : 'No approval records available.'}
              </p>
            </div>
          ) : (
            <CustomTable
              columns={columns}
              data={paginatedData}
              rowKey="id"
            />
          )}
        </div>
        {!loading && !error && filteredData.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 py-2">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              itemsPerPage={rowsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(limit) => {
                setRowsPerPage(limit);
                setCurrentPage(1);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </section>
    </>
  );
};

export default ApprovalsTab;
