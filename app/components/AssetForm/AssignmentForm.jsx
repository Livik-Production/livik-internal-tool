'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  selectEmployeesItems,
} from '../../../store/slices/employeesSlice';
import { SquarePen, LogOut, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import TabButton from '../Buttons/TabButton';
import PrimaryButton from '../Buttons/PrimaryButton';
import IconButton from '../Buttons/IconButton';
import AddAssignForm from '../AssignForms/AddAssignForm';
import ViewForm from '../AssignForms/ViewForm';
import CustomAlertForm from '../CustomAlertForm';
import Pagination from '../Pagination';
import CustomTable from '../CustomTable';
import HyperlinkButton from '../Buttons/HyperlinkButton';

export default function AssignmentForm({
  assets = [],
  onUnassign,
  onAssign,
  onUpdateAssignment,
  onViewDetail,
  isViewOnly = false,
}) {
  const dispatch = useDispatch();
  const employees = useSelector(selectEmployeesItems);

  const [innerTab, setInnerTab] = useState('assigned');
  const [query, setQuery] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [assetToUnassign, setAssetToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedAssetForView, setSelectedAssetForView] = useState(null);
  const [viewFormDefaultTab, setViewFormDefaultTab] = useState('assigned');
  const [assignedCurrentPage, setAssignedCurrentPage] = useState(1);
  const [unassignedCurrentPage, setUnassignedCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const filterAssets = (assets) => {
    if (!query.trim()) return assets;

    const searchText = query.toLowerCase();
    return assets.filter(
      (asset) =>
        (asset.assetTag || asset.tag || '')
          .toLowerCase()
          .includes(searchText) ||
        (asset.type || asset.deviceType || '')
          .toLowerCase()
          .includes(searchText) ||
        (asset.modelName || asset.model || '')
          .toLowerCase()
          .includes(searchText) ||
        (asset.serialNumber || asset.serial || '')
          .toLowerCase()
          .includes(searchText) ||
        (asset.assignedTo?.name &&
          asset.assignedTo.name.toLowerCase().includes(searchText)) ||
        (asset.assignedTo?.empId &&
          asset.assignedTo.empId.toLowerCase().includes(searchText)) ||
        (asset.location && asset.location.toLowerCase().includes(searchText)) ||
        (asset.status && asset.status.toLowerCase().includes(searchText))
    );
  };

  const assignedAssets = assets.filter(
    (asset) =>
      (asset.status === 'Assigned' || asset.assignedTo) &&
      asset.status !== 'In Repair'
  );

  const unassignedAssets = assets.filter(
    (asset) =>
      (asset.status === 'Unassigned' || !asset.assignedTo) &&
      asset.status !== 'In Repair'
  );
  const filteredAssigned = filterAssets(assignedAssets);
  const filteredUnassigned = filterAssets(unassignedAssets);

  const assignedCurrentData = useMemo(() => {
    const startIndex = (assignedCurrentPage - 1) * itemsPerPage;
    return filteredAssigned.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssigned, assignedCurrentPage, itemsPerPage]);

  const unassignedCurrentData = useMemo(() => {
    const startIndex = (unassignedCurrentPage - 1) * itemsPerPage;
    return filteredUnassigned.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUnassigned, unassignedCurrentPage, itemsPerPage]);

  const handleTabChange = (tab) => {
    setInnerTab(tab);
    if (tab === 'assigned') {
      setAssignedCurrentPage(1);
    } else {
      setUnassignedCurrentPage(1);
    }
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setAssignedCurrentPage(1);
    setUnassignedCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setAssignedCurrentPage(1);
    setUnassignedCurrentPage(1);
  };

  const handleAddAssignClick = (asset = null) => {
    if (asset) {
      setSelectedAssignment({
        assetId: asset.id,
        assetTag: asset.assetTag || asset.tag,
        assetDetails: {
          id: asset.id,
          assetTag: asset.assetTag || asset.tag,
          serialNo: asset.serialNumber || asset.serial || '',
          productName: asset.modelName || asset.model || '',
          modelName: asset.modelName || asset.model || '',
        },
      });
      setShowAssignForm(true);
    } else {
      setSelectedAssignment(null);
      setShowAssignForm(true);
    }
  };

  const handleCloseAssignForm = () => {
    setShowAssignForm(false);
    setSelectedAssignment(null);
  };

  const handleCloseViewForm = () => {
    setShowViewForm(false);
    setSelectedAssetForView(null);
    setViewFormDefaultTab('assigned');
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedAssignment(null);
  };

  const handleAssignFromForm = async (
    assetId,
    empId,
    empName,
    assignDate,
    notes,
    assignmentId = null
  ) => {
    try {
      if (assignmentId) {
        if (onUpdateAssignment) {
          await onUpdateAssignment(assignmentId, {
            assetId,
            employeeId: empId,
            employeeName: empName,
            assignmentDate: assignDate,
            assignmentNotes: notes,
          });
        }
        handleCloseEditForm();
        toast.success('Assignment updated successfully!');
      } else {
        if (onAssign) {
          await onAssign(assetId, empId, empName, assignDate, notes);
        }

        setInnerTab('assigned');
        setQuery('');
        handleCloseAssignForm();
        setSelectedAssignment(null);
        setAssignedCurrentPage(1);
      }
    } catch (error) {
      console.error('Error in assignment:', error);
      toast.error('Failed to process assignment. Please try again.');
    }
  };

  const handleViewAsset = (asset) => {
    if (onViewDetail) {
      onViewDetail(asset);
    } else {
      setSelectedAssetForView({
        asset: asset,
        isAssigned: asset.status === 'Assigned',
        employee: asset.assignedTo,
        assignmentData: {
          assignmentDate: asset.assignmentDate,
          assignmentNotes: asset.assignmentNotes,
          assignedFrom: asset.assignedFrom,
        },
      });
      setViewFormDefaultTab(
        asset.status === 'Assigned' ? 'assigned' : 'unassigned'
      );
      setShowViewForm(true);
    }
  };

  const handleEditAssignment = (asset) => {
    setSelectedAssignment({
      id: asset.id,
      assetId: asset.id,
      assetTag: asset.assetTag || asset.tag,
      employeeId: asset.assignedTo?.empId || '',
      employeeName: asset.assignedTo?.name || '',
      assignmentDate:
        asset.assignmentDate || new Date().toISOString().split('T')[0],
      assignmentNotes: asset.assignmentNotes || '',
      assignedFrom: asset.assignedFrom || 'IT Department',
    });
    setShowEditForm(true);
  };

  const handleUnassignClick = (asset) => {
    setAssetToUnassign(asset);
    setShowUnassignConfirm(true);
  };

  const confirmUnassign = async () => {
    try {
      if (assetToUnassign && onUnassign) {
        setIsUnassigning(true);
        await onUnassign(assetToUnassign.assignmentId);
      }
      setShowUnassignConfirm(false);
      setAssetToUnassign(null);
      setUnassignedCurrentPage(1);
    } catch (error) {
      console.error('Error unassigning:', error);
      toast.error('Failed to unassign asset. Please try again.');
    } finally {
      setIsUnassigning(false);
    }
  };

  const cancelUnassign = () => {
    setShowUnassignConfirm(false);
    setAssetToUnassign(null);
  };

  const getWarrantyInfo = (asset) => {
    if (!asset.warrantyUntil && !asset.warrantyDate) {
      return {
        text: 'No warranty',
        daysRemaining: null,
        isExpired: false,
        isNearExpiry: false,
      };
    }

    const warrantyDateStr = asset.warrantyUntil || asset.warrantyDate;
    const warrantyDate = new Date(warrantyDateStr);
    const today = new Date();
    const timeDiff = warrantyDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      text: warrantyDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      daysRemaining,
      isExpired: daysRemaining < 0,
      isNearExpiry: daysRemaining >= 0 && daysRemaining <= 30,
    };
  };

  // --- UNASSIGNED COLUMNS ---
  const unassignedColumns = [
    {
      key: 'assetTag',
      label: 'ASSET TAG',
      render: (asset) => (
        <HyperlinkButton
          onClick={() => handleViewAsset(asset)}
          title="view unassigned asset details"
        >
          {asset.assetTag || asset.tag}
        </HyperlinkButton>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (asset) => asset.type || asset.deviceType,
    },
    {
      key: 'brand',
      label: 'BRAND',
      render: (asset) => asset.brand || asset.brand,
    },

    {
      key: 'model',
      label: 'MODEL',
      render: (asset) => asset.modelName || asset.model,
    },
    {
      key: 'serial',
      label: 'SERIAL',
      render: (asset) => asset.serialNumber || asset.serial || 'N/A',
    },
    {
      key: 'warranty',
      label: 'WARRANTY DATE',
      render: (asset) => {
        const warrantyInfo = getWarrantyInfo(asset);
        return (
          <div className="flex flex-col items-center space-y-1">
            <div className="font-medium text-gray-700">{warrantyInfo.text}</div>
            {warrantyInfo.daysRemaining !== null && (
              <div
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  warrantyInfo.isExpired
                    ? 'bg-red-100 text-red-800'
                    : warrantyInfo.isNearExpiry
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                {warrantyInfo.isExpired
                  ? `Expired ${Math.abs(warrantyInfo.daysRemaining)} days ago`
                  : warrantyInfo.daysRemaining === 0
                    ? 'Expires today'
                    : `${warrantyInfo.daysRemaining} days remaining`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: () => (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Unassigned
        </span>
      ),
    },
  ];

  const renderUnassignedActions = (asset) => (
    <div className="flex items-center justify-end gap-2">
      <PrimaryButton
        onClick={() => handleAddAssignClick(asset)}
        disabled={isViewOnly}
        className="px-3 py-1.5 text-xs font-medium"
      >
        Assign
      </PrimaryButton>
    </div>
  );

  // --- ASSIGNED COLUMNS ---
  const assignedColumns = [
    {
      key: 'assetTag',
      label: 'ASSET TAG',
      render: (asset) => (
        <HyperlinkButton
          onClick={() => handleViewAsset(asset)}
          title="click to view assigned asset details"
        >
          {asset.assetTag || asset.tag}
        </HyperlinkButton>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (asset) => asset.type || asset.deviceType,
    },

    {
      key: 'model',
      label: 'MODEL',
      render: (asset) => asset.modelName || asset.model,
    },
    {
      key: 'serial',
      label: 'SERIAL',
      render: (asset) => asset.serialNumber || asset.serial || 'N/A',
    },
    {
      key: 'assignedTo',
      label: 'ASSIGNED TO',
      render: (asset) =>
        asset.assignedTo ? (
          <span className="font-medium">
            {asset.assignedTo.name} ({asset.assignedTo.empId})
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'assignedFrom',
      label: 'ASSIGNED FROM',
      render: (asset) =>
        asset.__raw?.updatedAt ? (
          new Date(asset.__raw.updatedAt).toLocaleDateString('en-GB')
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (asset) => (
        <span
          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            asset.status === 'Assigned'
              ? 'bg-green-100 text-green-800'
              : asset.status === 'In Repair'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {asset.status}
        </span>
      ),
    },
  ];

  const renderAssignedActions = (asset) => (
    <div className="flex space-x-2 justify-end items-center">
      <IconButton
        onClick={() => handleEditAssignment(asset)}
        title="Edit Assignment"
        disabled={isViewOnly}
      >
        <SquarePen size={16} />
      </IconButton>
      <span className="text-gray-300">|</span>
      <IconButton
        onClick={() => handleUnassignClick(asset)}
        title="Unassign"
        disabled={isViewOnly}
      >
        <LogOut size={16} />
      </IconButton>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-2 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-300 w-full mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scroll w-full sm:w-auto">
            <TabButton
              isActive={innerTab === 'assigned'}
              onClick={() => handleTabChange('assigned')}
            >
              Assigned
              {filteredAssigned.length > 0 && (
                <span className="ml-1.5 bg-blue-900 text-white text-[10px] font-bold px-2 py-1 rounded-full leading-none min-w-[18px] text-center">
                  {filteredAssigned.length}
                </span>
              )}
            </TabButton>
            <TabButton
              isActive={innerTab === 'unassigned'}
              onClick={() => handleTabChange('unassigned')}
            >
              Unassigned
              {filteredUnassigned.length > 0 && (
                <span className="ml-1.5 bg-blue-900 text-white text-[10px] font-bold px-2 py-1 rounded-full leading-none min-w-[18px] text-center">
                  {filteredUnassigned.length}
                </span>
              )}
            </TabButton>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end px-1">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search assets..."
              className="px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {query && (
              <div className="absolute right-2 top-1.5">
                <IconButton
                  onClick={() => {
                    setQuery('');
                    setAssignedCurrentPage(1);
                    setUnassignedCurrentPage(1);
                  }}
                  title="Clear search"
                  className="p-1"
                >
                  <X size={14} />
                </IconButton>
              </div>
            )}
          </div>

          <PrimaryButton
            onClick={() => handleAddAssignClick()}
            disabled={isViewOnly}
          >
            + Add Assign
          </PrimaryButton>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={innerTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            duration: 0.25,
            ease: 'easeInOut',
          }}
          className="p-2.5"
        >
          {innerTab === 'unassigned' ? (
            <>
              <CustomTable
                columns={unassignedColumns}
                data={unassignedCurrentData}
                rowKey="id"
                actions={renderUnassignedActions}
                actionsHeader="ACTIONS"
                actionsAlign="right"
                className="mt-1"
              />
              <div className="mt-4">
                <Pagination
                  currentPage={unassignedCurrentPage}
                  totalItems={filteredUnassigned.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setUnassignedCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                />
              </div>
            </>
          ) : (
            <>
              <CustomTable
                columns={assignedColumns}
                data={assignedCurrentData}
                rowKey="id"
                actions={renderAssignedActions}
                actionsHeader="ACTIONS"
                actionsAlign="right"
                className="mt-1"
              />
              <div className="mt-4">
                <Pagination
                  currentPage={assignedCurrentPage}
                  totalItems={filteredAssigned.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setAssignedCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  rowsPerPageOptions={[5, 10, 20, 50, 100]}
                />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="px-6 py-2 border-t border-gray-200 bg-gray-50 rounded-xl">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            Total {innerTab === 'assigned' ? 'Assigned' : 'Unassigned'}:{' '}
            <span className="font-semibold">
              {innerTab === 'assigned'
                ? filteredAssigned.length
                : filteredUnassigned.length}
            </span>
          </div>
          <div>
            Showing{' '}
            <span className="font-semibold">
              {innerTab === 'assigned'
                ? Math.min(itemsPerPage, assignedCurrentData.length)
                : Math.min(itemsPerPage, unassignedCurrentData.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold">
              {innerTab === 'assigned'
                ? filteredAssigned.length
                : filteredUnassigned.length}
            </span>{' '}
            asset
            {(innerTab === 'assigned'
              ? filteredAssigned.length
              : filteredUnassigned.length) !== 1 && 's'}{' '}
            on page{' '}
            <span className="font-semibold">
              {innerTab === 'assigned'
                ? assignedCurrentPage
                : unassignedCurrentPage}
            </span>
          </div>
        </div>
      </div>

      {showAssignForm && (
        <AddAssignForm
          assets={assets}
          employees={employees}
          onAssign={handleAssignFromForm}
          onClose={handleCloseAssignForm}
          mode="add"
          assignmentData={selectedAssignment}
        />
      )}

      {showViewForm && selectedAssetForView && (
        <ViewForm
          onClose={handleCloseViewForm}
          isAssigned={selectedAssetForView.isAssigned}
          assetData={selectedAssetForView.asset}
          employeeData={selectedAssetForView.employee}
          assignmentData={selectedAssetForView.assignmentData}
          defaultTab={viewFormDefaultTab}
        />
      )}

      {showEditForm && selectedAssignment && (
        <AddAssignForm
          assets={assets}
          employees={employees}
          onAssign={handleAssignFromForm}
          onClose={handleCloseEditForm}
          mode="edit"
          assignmentData={selectedAssignment}
        />
      )}

      <CustomAlertForm
        isOpen={showUnassignConfirm}
        onClose={cancelUnassign}
        onConfirm={confirmUnassign}
        title="Confirm Unassign"
        message="Are you sure you want to unassign this asset? This will make it available for re-assignment."
        type="danger"
        confirmText="Yes, Unassign"
        isSubmitting={isUnassigning}
        details={
          assetToUnassign && (
            <div className="text-sm">
              <p className="font-bold">
                {assetToUnassign.assetTag || assetToUnassign.tag} -{' '}
                {assetToUnassign.modelName || assetToUnassign.model}
              </p>
              <p className="text-gray-600 mt-1">
                Currently assigned to:{' '}
                <span className="font-medium">
                  {assetToUnassign.assignedTo?.name} (
                  {assetToUnassign.assignedTo?.empId})
                </span>
              </p>
            </div>
          )
        }
      />
    </div>
  );
}
