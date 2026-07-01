'use client';

import { toast } from 'react-toastify';

import { useState, useMemo } from 'react';
import RepairForm from './CreateRepairForm';
import CustomAlertForm from '../CustomAlertForm';
import Pagination from '../Pagination';
import FilterDropdown from '../Buttons/FilterDropdown';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import CustomTable from '../CustomTable';
import { CheckCircle, Plus, Search, SquarePen, Trash } from 'lucide-react';
import HyperlinkButton from '../Buttons/HyperlinkButton';

export default function RepairHistoryTable({
  repairs = [],
  assetId = 'LAP-011',
  assetSpecs = {},
  assetTag = 'LAP-011',
  assetModel = 'Dell Latitude 5420',
  onEditRepair,
  onDeleteRepair,
  onRepairAdded,
  onRepairUpdated,
  onCreateRepair,
  canEdit = true,
  isLoading = false,
}) {
  const [deletingRepair, setDeletingRepair] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairFormMode, setRepairFormMode] = useState('add');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formattedRepairs = useMemo(() => {
    return (repairs || []).map((repair) => ({
      ...repair,
      id: repair.id,
      requestId: repair.requestId || 'REP-???',
      date:
        repair.dateOfGivingtoRepair ||
        repair.date ||
        new Date().toISOString().split('T')[0],
      vendor: repair.vendorName || repair.vendor || 'Unknown Vendor',
      estimatedCost: repair.estimatedCost || 0,
      shortDescription: repair.description || 'Repair',
      issue: repair.description || 'No description',
      status: repair.status || 'Reported',
      issueType: repair.issueType || 'Hardware',
      cost: repair.estimatedCost || 0,
      reportDate:
        repair.dateOfGivingtoRepair ||
        repair.date ||
        new Date().toISOString().split('T')[0],
      completedDate: repair.completedOn || null,
      actualCost: repair.actualCost || null,
    }));
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    return formattedRepairs.filter((repair) => {
      const statusMatch =
        statusFilter === 'All' || repair.status === statusFilter;
      const searchMatch =
        !searchTerm ||
        repair.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.shortDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        repair.issue.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [formattedRepairs, statusFilter, searchTerm]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRepairs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRepairs, currentPage, itemsPerPage]);

  const generateNextRequestId = () => {
    const maxId = (repairs || []).reduce((max, repair) => {
      const match = repair.requestId?.match(/REP-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `REP-${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleRepairSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      let url = `/api/assets/${assetId}/repairs`;
      let method = 'POST';

      if (repairFormMode === 'edit' || repairFormMode === 'update') {
        url = `/api/assets/repairs/${formData.id}`;
        method = 'PUT';
      }

      // Map frontend fields to backend schema fields
      const payload = {
        requestId: formData.requestId || generateNextRequestId(),
        dateOfGivingtoRepair: formData.reportDate || formData.date,
        vendorName: formData.vendor,
        issueType: formData.issueType,
        estimatedCost: formData.cost,
        description: formData.issue,
        status:
          repairFormMode === 'update'
            ? 'Completed'
            : formData.status || 'Reported',
        completedOn: formData.completedDate,
        actualCost: formData.actualCost,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save repair record');
      }

      if (onRepairUpdated) await onRepairUpdated();
      if (repairFormMode === 'add' && onRepairAdded) await onRepairAdded();

      toast.success(
        repairFormMode === 'add'
          ? 'Repair record created successfully!'
          : 'Repair record updated successfully!'
      );
      setShowRepairForm(false);
      setSelectedRepair(null);
    } catch (error) {
      console.error('Error saving repair:', error);
      toast.error(error.message || 'Failed to save repair. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRepair) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assets/repairs/${deletingRepair.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete repair record');
      }

      if (onRepairUpdated) await onRepairUpdated();
      if (onDeleteRepair) await onDeleteRepair(deletingRepair.id);

      toast.success('Repair record deleted successfully!');
      setDeletingRepair(null);
    } catch (error) {
      console.error('Error deleting repair:', error);
      toast.error('Failed to delete record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (repair) => {
    setSelectedRepair(repair);
    setRepairFormMode('edit');
    setShowRepairForm(true);
  };

  const handleUpdateStatus = (repair) => {
    setSelectedRepair(repair);
    setRepairFormMode('update');
    setShowRepairForm(true);
  };

  const handleViewDetails = (repair) => {
    setSelectedRepair(repair);
    setRepairFormMode('view');
    setShowRepairForm(true);
  };

  const handleCreateRepair = () => {
    setSelectedRepair(null);
    setRepairFormMode('add');
    setShowRepairForm(true);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Reported':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = ['All', 'Reported', 'In Progress', 'Completed'];

  return (
    <>
      <div className="bg-white rounded-lg ">
        <div className="flex justify-end pb-3 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FilterDropdown
                label="Status"
                className="px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                options={statusOptions.map((status) => ({
                  value: status,
                  label: status,
                }))}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>

            <div className="flex-grow md:max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search repairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <PrimaryButton
                onClick={handleCreateRepair}
                className="flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Create Repair
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <CustomTable
            data={currentData}
            rowKey="id"
            maxHeight="none"
            columns={[
              {
                key: 'requestId',
                label: 'Request ID',
                render: (repair) => (
                  <HyperlinkButton onClick={() => handleViewDetails(repair)}>
                    {repair.requestId}
                  </HyperlinkButton>
                ),
              },
              {
                key: 'date',
                label: 'Date',
                render: (repair) => formatDate(repair.date),
              },
              {
                key: 'vendor',
                label: 'Vendor',
              },
              {
                key: 'estimatedCost',
                label: 'Est. Cost',
                render: (repair) => repair.estimatedCost.toFixed(2),
              },
              {
                key: 'shortDescription',
                label: 'Description',
                render: (repair) => (
                  <div>
                    <div className="font-medium">{repair.shortDescription}</div>
                    {repair.issueType && (
                      <span className="text-xs text-gray-500 mt-0.5 block">
                        Type: {repair.issueType}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (repair) => (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(repair.status)}`}
                  >
                    {repair.status}
                  </span>
                ),
              },
            ]}
            actionsHeader="Actions"
            actionsAlign="center"
            actions={(repair) => (
              <div className="flex items-center justify-center gap-2">
                <IconButton
                  onClick={() => handleEdit(repair)}
                  title="Edit Repair"
                >
                  <SquarePen size={16} />
                </IconButton>
                {repair.status !== 'Completed' && (
                  <IconButton
                    onClick={() => handleUpdateStatus(repair)}
                    title="Mark as Completed"
                  >
                    <CheckCircle size={16} />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => setDeletingRepair(repair)}
                  title="Delete Repair"
                >
                  <Trash size={16} />
                </IconButton>
              </div>
            )}
          />
        </div>

        <div className="mt-4 p-4">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRepairs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>

      <CustomAlertForm
        isOpen={!!deletingRepair}
        onClose={() => setDeletingRepair(null)}
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
        title="Delete Repair Record"
        message={`Are you sure you want to delete repair record ${deletingRepair?.requestId}? This action cannot be undone.`}
        details={
          deletingRepair && (
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">
                {deletingRepair.shortDescription}
              </p>
              <p className="mt-1">
                {deletingRepair.vendor} • {formatDate(deletingRepair.date)}
              </p>
            </div>
          )
        }
        type="danger"
        confirmText="Delete Record"
        cancelText="Cancel"
      />

      {showRepairForm && (
        <RepairForm
          mode={repairFormMode}
          assetId={assetId}
          assetTag={assetTag}
          assetModel={assetModel}
          repairData={selectedRepair}
          onSubmit={handleRepairSubmit}
          onCancel={() => {
            setShowRepairForm(false);
            setSelectedRepair(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
