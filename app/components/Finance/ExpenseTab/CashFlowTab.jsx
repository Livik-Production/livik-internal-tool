'use client';

import React, { useState, useEffect } from 'react';
import CustomTable from '../../../components/CustomTable';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import { Trash, Download, FileText, Eye, Plus, SquarePen } from 'lucide-react';
import CashFlowModal from './CashFlowModal';
import AddPettyCashModal from './AddPettyCashModal';
import CustomAlertForm from '../../../components/CustomAlertForm';
import Pagination from '../../../components/Pagination';
import FilterDropdown from '../../Buttons/FilterDropdown';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import { toast } from 'react-toastify';
import Loader from '../../Loader';

const CashFlowTab = ({ 
  inflows = [], 
  expenses = [], 
  onView, 
  onRefresh, 
  isLoading = false,
  selectedMonthNum,
  setSelectedMonthNum,
  selectedYear,
  setSelectedYear,
  monthOptions = [],
  yearOptions = []
}) => {
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInflowId, setSelectedInflowId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedInflowData, setSelectedInflowData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [paymentModes, setPaymentModes] = useState([
    { value: 'all', label: 'All Methods' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Petty Cash', label: 'Petty Cash' },
  ]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const handleItemsPerPageChange = (newCount) => {
    setItemsPerPage(newCount);
    setCurrentPage(1);
  };
  const transformData = () => {
    if (inflows && inflows.length > 0) {
      return inflows.map((item) => ({
        id: item.id,
        receiveId: item.id.slice(-6).toUpperCase(),
        receiveDate: item.receiveDate,
        fromWhom: item.receiveFrom,
        modeOfPayment: item.paymentMethod,
        category: 'Petty Cash Top-up',
        amount: parseFloat(item.receivedAmount),
        status: 'paid',
        description: `Top up via ${item.paymentMethod}`,
        approvedBy: 'System',
        originalData: item,
        isRealInflow: true,
      }));
    }
    return [];
  };

  const calculateSummary = () => {
    const totalTopUp = inflows.reduce(
      (sum, item) => sum + parseFloat(item.receivedAmount || 0),
      0
    );
    const totalSpending = expenses
      .filter(
        (exp) =>
          exp.paymentMode === 'Petty Cash' || exp.paymentMode === 'petty cash' || exp.paymentMode === 'petty_cash'
      )
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const cashInHand = totalTopUp - totalSpending;

    return { totalTopUp, totalSpending, cashInHand };
  };

  const { totalTopUp, totalSpending, cashInHand } = calculateSummary();

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await fetch('/api/dropdowns?type=payment_type');
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.length > 0) {
            const dynamicModes = json.data.map((d) => ({
              value: d.value,
              label: d.value,
            }));
            setPaymentModes([
              { value: 'all', label: 'All Methods' },
              ...dynamicModes,
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment types', err);
      }
    };
    fetchPaymentModes();
  }, []);

  useEffect(() => {
    const data = transformData();
    let filtered = data;

    if (paymentModeFilter !== 'all') {
      filtered = filtered.filter(
        (item) => item.modeOfPayment === paymentModeFilter
      );
    }

    if (selectedMonthNum && selectedMonthNum !== 'all') {
      filtered = filtered.filter((item) => {
        if (!item.receiveDate) return false;
        const itemDate = new Date(item.receiveDate);
        if (isNaN(itemDate.getTime())) return false;
        const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');
        return itemMonth === selectedMonthNum;
      });
    }

    if (selectedYear && selectedYear !== 'all') {
      filtered = filtered.filter((item) => {
        if (!item.receiveDate) return false;
        const itemDate = new Date(item.receiveDate);
        if (isNaN(itemDate.getTime())) return false;
        const itemYear = itemDate.getFullYear().toString();
        return itemYear === selectedYear;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [inflows, expenses, paymentModeFilter, selectedMonthNum, selectedYear]);

  // Pagination Logic
  const totalItems = filteredData.length;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (id) => {
    setSelectedInflowId(id);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    if (row.isRealInflow) {
      setSelectedInflowData(row.originalData);
      setModalMode('edit');
      setIsAddModalOpen(true);
    } else {
      onView && onView(row.originalExpense, 'edit');
    }
  };

  const handleDeleteClick = (row) => {
    setRecordToDelete(row);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    try {
      if (recordToDelete.isRealInflow) {
        const res = await fetch(
          `/api/expense/petty-cash/${recordToDelete.id}`,
          {
            method: 'DELETE',
          }
        );
        if (!res.ok) throw new Error('Failed to delete record');
      }

      toast.success('Record deleted successfully!');
      onRefresh && onRefresh();
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Error deleting record: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = true;
  const columns = [
    {
      key: 'receiveId',
      label: 'Receive ID',
      className: 'text-left',
      render: (row) => (
        <div className="text-left">
          <HyperlinkButton
            onClick={() =>
              row.isRealInflow
                ? handleOpenModal(row.id)
                : onView && onView(row.originalExpense)
            }
            title="click to view cash flow details"
          >
            {row.receiveId}
          </HyperlinkButton>
        </div>
      ),
    },
    {
      key: 'receiveDate',
      label: 'Receive Date',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {new Date(row.receiveDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(row.receiveDate).toLocaleDateString('en-US', {
              weekday: 'short',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'fromWhom',
      label: 'Received From',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">{row.fromWhom}</div>
        </div>
      ),
    },
    {
      key: 'modeOfPayment',
      label: 'Method',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
            {row.modeOfPayment}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-bold text-gray-900 text-base">
            ₹{row.amount.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton onClick={() => handleEdit(row)} title="Edit Record">
            <SquarePen size={16} />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteClick(row)}
            title="Delete Record"
            variant="danger"
          >
            <Trash size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-3">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-3 gap-3">
        {/* <div className="text-lg font-semibold text-gray-800 px-2">
          Cash Flow & Petty Cash
        </div> */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
          <PrimaryButton
            onClick={() => {
              setModalMode('add');
              setSelectedInflowData(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 text-sm font-semibold shadow-sm w-full md:w-auto px-4 py-2"
          >
            <Plus size={18} />
            Top Up Petty Cash
          </PrimaryButton>
          <FilterDropdown
            options={paymentModes}
            value={paymentModeFilter}
            onChange={setPaymentModeFilter}
            placeholder="All Methods"
            className="w-full md:w-auto"
          />
          <FilterDropdown
            options={[{ value: 'all', label: 'All Months' }, ...monthOptions]}
            value={selectedMonthNum}
            onChange={setSelectedMonthNum}
            placeholder="Month"
            className="w-full md:w-auto"
          />
          <FilterDropdown
            options={[
              { value: 'all', label: 'All Years' },
              ...yearOptions.map((y) => ({ value: y, label: y })),
            ]}
            value={selectedYear}
            onChange={setSelectedYear}
            placeholder="Year"
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm min-h-[400px]">
          <Loader label="Loading cash flow..." size="md" fullScreen={false} />
        </div>
      ) : (
        <>
          <CustomTable
            columns={columns}
            data={currentData}
            rowKey="id"
            className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
            maxHeight="none"
          />

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </>
      )}

      <CashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inflowId={selectedInflowId}
      />

      <AddPettyCashModal
        isOpen={isAddModalOpen}
        mode={modalMode}
        initialData={selectedInflowData}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => onRefresh && onRefresh()}
      />

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Record"
        message={`Are you sure you want to delete this ${
          recordToDelete?.isRealInflow ? 'petty cash top-up' : 'expense record'
        }?`}
        type="danger"
        confirmText="Yes, Delete"
        isSubmitting={isDeleting}
        details={
          recordToDelete && (
            <div className="text-sm">
              <p className="font-bold">
                {recordToDelete.receiveId} - ₹
                {recordToDelete.amount.toLocaleString()}
              </p>
              <p className="text-gray-500">{recordToDelete.fromWhom}</p>
            </div>
          )
        }
      />
    </div>
  );
};

export default CashFlowTab;
