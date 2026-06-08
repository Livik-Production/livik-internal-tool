'use client';

import React, { useState, useEffect } from 'react';
import CustomTable from '../../../components/CustomTable';
import Button from '../../../components/Buttons/Button';
import Loader from '../../../components/Loader'; // ✅ ADD THIS
import { SquarePen, Trash, Plus, Search, X } from 'lucide-react';
import CustomerFormModal from './CustomerFormModal';
import CustomAlertForm from '../../../components/CustomAlertForm';
import Pagination from '../../../components/Pagination';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import IconButton from '../../../components/Buttons/IconButton';
import { useMemo } from 'react';
import HyperlinkButton from '../../../components/Buttons/HyperlinkButton';

const CustomersTable = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ START AS true
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    let mounted = true;

    const fetchCustomers = async () => {
      try {
        setIsLoading(true); // ✅ SHOW LOADER
        const res = await fetch('/api/customers');
        if (!res.ok) throw new Error('Failed to fetch customers');

        const data = await res.json();
        if (mounted) {
          setCustomers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Fetch customers failed:', err);
        if (mounted) setCustomers([]);
      } finally {
        if (mounted) setIsLoading(false); // ✅ HIDE LOADER
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, customers.length]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.website?.toLowerCase().includes(term) ||
      customer.cinNumber?.toLowerCase().includes(term) ||
      customer.mobile?.toLowerCase().includes(term) ||
      customer.id?.toLowerCase().includes(term) ||
      customer.city?.toLowerCase().includes(term) ||
      customer.state?.toLowerCase().includes(term) ||
      customer.gstnNumber?.toLowerCase().includes(term) ||
      customer.preferredPaymentMethod?.toLowerCase().includes(term)
    );
  });

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Modal handlers
  const openAddModal = () => {
    setModalType('add');
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setModalType('edit');
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const openViewModal = (customer) => {
    setModalType('view');
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleFormSuccess = (savedCustomer) => {
    setCustomers((prev) => {
      const index = prev.findIndex((c) => c.id === savedCustomer.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = savedCustomer;
        return updated;
      }
      return [savedCustomer, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete customer');
      }

      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Delete customer failed:', err);
      alert(err.message || 'Unable to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'id',
      label: 'Customer ID',
      className: 'text-left',
      render: (row) => (
        <HyperlinkButton
          onClick={() => openViewModal(row)}
          title="click to view customer details"
        >
          {row.id.slice(0, 6)}
        </HyperlinkButton>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'mobile',
      label: 'Mobile',
      className: 'text-center',
      render: (row) => (
        <div className="text-center font-medium text-gray-900">
          {row.mobile}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {row.city}, {row.state}
          </div>
          <div className="text-xs text-gray-500">{row.address1}</div>
        </div>
      ),
    },
    {
      key: 'gstnNumber',
      label: 'GSTN/CIN Number',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="font-mono text-sm px-2 py-1 rounded">
            {row.gstnNumber || row.cinNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'preferredPaymentMethod',
      label: 'Payment Method',
      className: 'text-center',
      render: (row) => (
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">
            {row.preferredPaymentMethod || 'Not specified'}
          </div>
        </div>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton onClick={() => openEditModal(row)} title="Edit Customer">
        <SquarePen size={16} />
      </IconButton>
      <IconButton
        onClick={() => handleDeleteCustomer(row.id)}
        title="Delete Customer"
      >
        <Trash size={16} />
      </IconButton>
    </div>
  );

  return (
    <div className="bg-transparent p-2 no-scroll">
      {/* Header */}
      <div className="flex justify-end items-center mb-3">
        <div className="flex items-center gap-3">
          {/* Global Search Input */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#33a8d9]/20 focus:border-[#33a8d9] outline-none transition-all w-64 h-[42px] bg-gray-50/50 hover:bg-white"
            />
            {searchTerm && (
              <div className="absolute right-2 top-1.5">
                <IconButton
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  className="p-1"
                >
                  <X size={14} />
                </IconButton>
              </div>
            )}
          </div>

          <PrimaryButton onClick={openAddModal}>
            <Plus size={16} />
            Add Customer
          </PrimaryButton>
        </div>
      </div>

      <div key={isLoading} className="animate-dashboard-reveal">
        {/* ✅ LOADER INTEGRATION */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
            <Loader label="Loading customers..." fullScreen={false} />
          </div>
        ) : (
          <CustomTable
            className="border border-gray-300 rounded-2xl"
            columns={columns}
            data={currentData}
            rowKey="id"
            actions={actions}
            actionsHeader="Actions"
            actionsAlign="right"
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </div>

      {/* Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        type={modalType}
        customer={selectedCustomer}
        onSuccess={handleFormSuccess}
        onEdit={() => setModalType('edit')}
      />

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
        details={
          customerToDelete && (
            <div className="text-sm">
              <p className="font-bold">{customerToDelete.email}</p>
              <p className="text-gray-500">ID: {customerToDelete.id}</p>
            </div>
          )
        }
      />
    </div>
  );
};

export default CustomersTable;
