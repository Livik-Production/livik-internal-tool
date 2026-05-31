'use client';

import { useState, useEffect } from 'react';
import CustomTable from '../../CustomTable';
import IconButton from '../../Buttons/IconButton';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { showSuccessToast, showErrorToast } from '../../Toast';
import ConfirmDialog from '../../ConfirmDialog';
import { fetchEmployees } from '../../../../store/slices/employeesSlice';

export default function DocumentApprovalsTable() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [authUser]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // HR sees EMPLOYEE requests, Admin sees HR requests
      const userRole = (
        authUser?.role?.name ||
        authUser?.role?.roleName ||
        ''
      ).toUpperCase();
      const roleFilter =
        userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' ? 'HR' : 'EMPLOYEE';

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-500 font-medium">
              Fetching pending approvals...
            </span>
          </div>
        ) : requests.length > 0 ? (
          <CustomTable
            columns={columns}
            data={requests}
            rowKey="id"
            actions={tableActions}
            actionsHeader="Review"
            actionsAlign="center"
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
