'use client';

import { useState, useEffect, useMemo } from 'react';
import CustomTable from '../../CustomTable';
import IconButton from '../../Buttons/IconButton';
import PrimaryButton from '../../Buttons/PrimaryButton';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { showSuccessToast, showErrorToast } from '../../Toast';
import ConfirmDialog from '../../ConfirmDialog';
import { fetchEmployees } from '../../../../store/slices/employeesSlice';
import Pagination from '../../Pagination';
import Loader from '../../Loader'

export default function DocumentApprovalsTable({
  searchElement = null,
  searchQuery = '',
}) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // default to 10
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isApproveAllOpen, setIsApproveAllOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [authUser]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;
    const lowerQuery = searchQuery.toLowerCase();
    return requests.filter(
      (req) =>
        req.employee?.firstName?.toLowerCase().includes(lowerQuery) ||
        req.employee?.lastName?.toLowerCase().includes(lowerQuery) ||
        req.employee?.empId?.toLowerCase().includes(lowerQuery) ||
        req.documentType?.toLowerCase().includes(lowerQuery) ||
        req.proofLabel?.toLowerCase().includes(lowerQuery)
    );
  }, [requests, searchQuery]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // Only Super Admin sees HR (Admin/Super Admin/HR) requests
      const userRole = (
        authUser?.role?.name ||
        authUser?.role?.roleName ||
        ''
      ).toUpperCase();
      const isTrueSuperAdmin =
        userRole === 'SUPER_ADMIN' ||
        userRole === 'SUPER ADMIN' ||
        userRole === 'SUPERADMIN';
      
      let roleFilter = 'EMPLOYEE';
      if (isTrueSuperAdmin) {
        roleFilter = 'SUPER_ADMIN,ADMIN,HR_ADMIN,HR,EMPLOYEE';
      } else if (userRole === 'ADMIN') {
        roleFilter = 'HR_ADMIN,HR,EMPLOYEE';
      } else if (userRole === 'HR_ADMIN') {
        roleFilter = 'HR,EMPLOYEE';
      }

      const res = await fetch(
        `/api/document-requests?status=PENDING&requestedByRole=${roleFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch document requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (status) => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      const res = await fetch('/api/document-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status,
          processedBy: authUser.id,
          remarks,
        }),
      });

      if (res.ok) {
        showSuccessToast(`Document ${status.toLowerCase()} successfully`);
        fetchRequests();
        if (status === 'APPROVED') {
          dispatch(fetchEmployees());
        }
        setIsApproveOpen(false);
        setIsRejectOpen(false);
        setSelectedRequest(null);
        setRemarks('');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process request');
      }
    } catch (err) {
      showErrorToast(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAllClick = () => {
    if (filteredRequests.length > 0) {
      setIsApproveAllOpen(true);
    }
  };

  const handleApproveAllConfirm = async () => {
    setIsApproveAllOpen(false);
    setIsProcessing(true);
    try {
      let approvedCount = 0;
      for (const req of filteredRequests) {
        const res = await fetch('/api/document-requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: req.id,
            status: 'APPROVED',
            processedBy: authUser.id,
            remarks: 'Bulk approved',
          }),
        });
        if (res.ok) approvedCount++;
      }
      
      if (approvedCount > 0) {
        showSuccessToast(`${approvedCount} document(s) approved successfully`);
        fetchRequests();
        dispatch(fetchEmployees());
      }
    } catch (err) {
      showErrorToast('Error processing bulk approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      key: 'empId',
      label: 'EmpID',
      render: (row) => (
        <span className="font-medium text-gray-900">{row.employee?.empId}</span>
      ),
    },
    {
      key: 'employee',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-gray-900 line-clamp-1">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      key: 'documentType',
      label: 'Document Type',
      render: (row) => (
        <div className="flex flex-col text-center">
          <span className="font-bold text-gray-700 capitalize">
            {row.documentType === 'aadhaarCard'
              ? 'Aadhaar Card'
              : row.documentType === 'panCard'
                ? 'PAN Card'
                : row.proofLabel || 'Proof'}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
            {row.requestedByRole} REQUEST
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'view',
      label: 'Document',
      align: 'center',
      render: (row) => (
        <a
          href={row.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#33a8d9] rounded-lg transition-all text-xs font-bold border border-blue-100"
        >
          <Eye size={14} />
          View
        </a>
      ),
    },
  ];

  const tableActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      <IconButton
        onClick={() => {
          setSelectedRequest(row);
          setIsApproveOpen(true);
        }}
        title="Approve"
      >
        <CheckCircle size={18} />
      </IconButton>
      <IconButton
        onClick={() => {
          setSelectedRequest(row);
          setIsRejectOpen(true);
        }}
        title="Reject"
      >
        <XCircle size={18} />
      </IconButton>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center mb-2 gap-3 min-h-[56px]">
        {searchElement && <div>{searchElement}</div>}
        <PrimaryButton
          onClick={handleApproveAllClick}
          disabled={isProcessing || filteredRequests.length === 0}
          className={`px-4 py-2 m-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
            filteredRequests.length > 0 ? '' : 'invisible'
          }`}
          title="Approve All"
        >
          <CheckCircle size={16} />
          Approve All ({filteredRequests.length})
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader />
              <span className="text-sm text-gray-500 font-medium">
              Fetching pending approvals...
            </span>
          </div>
        ) : filteredRequests.length > 0 ? (
          <CustomTable
            columns={columns}
            data={paginatedRequests}
            rowKey="id"
            actions={tableActions}
            actionsHeader="Review"
            actionsAlign="center"
            maxHeight="none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">
              All caught up! No pending approvals.
            </p>
          </div>
        )}
      </div>

      {!isLoading && filteredRequests.length > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            rowsPerPageOptions={[5, 10, 20, 50, 100]}
          />
        </div>
      )}

      {/* Approve All Dialog */}
      <ConfirmDialog
        open={isApproveAllOpen}
        onClose={() => setIsApproveAllOpen(false)}
        title="Approve All Documents"
        confirmLabel={isProcessing ? 'Approving...' : 'Yes, Approve All'}
        onConfirm={handleApproveAllConfirm}
        description={
          <div className="space-y-4">
            <p>
              Are you sure you want to approve all <strong>{filteredRequests.length}</strong> pending document requests?
            </p>
          </div>
        }
      />

      {/* Approve Dialog */}
      <ConfirmDialog
        open={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Approve Document"
        confirmLabel={isProcessing ? 'Approving...' : 'Yes, Approve'}
        onConfirm={() => handleProcess('APPROVED')}
        description={
          <div className="space-y-4">
            <p>
              Are you sure you want to approve this document for{' '}
              <span className="font-bold">
                {selectedRequest?.employee?.firstName}{' '}
                {selectedRequest?.employee?.lastName}
              </span>
              ?
            </p>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Remarks (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="Add any notes here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        }
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Document"
        confirmLabel={isProcessing ? 'Rejecting...' : 'Reject Document'}
        destructive={true}
        onConfirm={() => handleProcess('REJECTED')}
        description={
          <div className="space-y-4">
            <p>Please provide a reason for rejecting this document upload.</p>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                Rejection Reason
              </label>
              <textarea
                className="w-full p-3 border border-red-100 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
                rows={3}
                placeholder="Explain why this document was rejected..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
