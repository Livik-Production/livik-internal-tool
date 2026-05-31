'use client';

import { useMemo, useState } from 'react';
import { Trash, SquarePen, X } from 'lucide-react';
import CustomAlertForm from '../CustomAlertForm';
import Pagination from '../Pagination';
import CustomTable from '../CustomTable';
import IconButton from '../Buttons/IconButton';
import HyperlinkButton from '../Buttons/HyperlinkButton';

const assetTypes = ['All', 'Laptop', 'Mobile', 'Tablet', 'Printer', 'Other'];
const statusOptions = ['All', 'Assigned', 'Unassigned', 'In Repair'];

export default function AssetsForm({
  assets = [],
  onViewDetail,
  onEdit,
  onAssign,
  onDelete,
  isViewOnly = false,
}) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getAssetProperty = (asset, property) => {
    if (property === 'tag' && asset.tag) return asset.tag;
    if (property === 'assetTag' && asset.assetTag) return asset.assetTag;
    if (property === 'type' && asset.deviceType) return asset.deviceType;
    if (property === 'type' && asset.type) return asset.type;
    if (property === 'brand' && asset.brand) return asset.brand;
    if (property === 'model' && asset.model) return asset.model;
    if (property === 'modelName' && asset.modelName) return asset.modelName;
    if (property === 'serial' && asset.serial) return asset.serial;
    if (property === 'serialNo' && asset.serialNo) return asset.serialNo;
    if (property === 'status' && asset.__raw?.status) return asset.__raw.status;
    if (property === 'status' && asset.status) return asset.status;
    if (property === 'warrantyUntil' && asset.warrantyUntil)
      return asset.warrantyUntil;
    if (property === 'notes' && asset.notes) return asset.notes;
    if (property === 'location' && asset.location) return asset.location;
    if (property === 'location' && asset.__raw?.location)
      return asset.__raw.location;
    if (property === 'assignedTo' && asset.assignedTo) return asset.assignedTo;
    if (property === 'assignedTo' && asset.__raw?.assignedTo)
      return asset.__raw.assignedTo;

    return '';
  };

  const filtered = useMemo(() => {
    const searchQuery = query.toLowerCase().trim();

    return assets.filter((asset) => {
      const assetType = getAssetProperty(asset, 'type');
      const assetStatus = getAssetProperty(asset, 'status') || 'Unassigned';

      const matchesType = filterType === 'All' || assetType === filterType;
      const matchesStatus =
        filterStatus === 'All' || assetStatus === filterStatus;

      if (!searchQuery) {
        return matchesType && matchesStatus;
      }

      const searchableText = `
        ${getAssetProperty(asset, 'tag') || getAssetProperty(asset, 'assetTag')}
        ${assetType}
        ${
          getAssetProperty(asset, 'model') ||
          getAssetProperty(asset, 'modelName')
        }
        ${
          getAssetProperty(asset, 'brand') ||
          getAssetProperty(asset, 'brandName')
        }
        ${
          getAssetProperty(asset, 'serial') ||
          getAssetProperty(asset, 'serialNo')
        }
        ${assetStatus}
        ${getAssetProperty(asset, 'location')}
        ${getAssetProperty(asset, 'notes')}
        ${getAssetProperty(asset, 'assignedTo')?.empId || ''}
        ${getAssetProperty(asset, 'assignedTo')?.name || ''}
      `.toLowerCase();

      const matchesQuery = searchableText.includes(searchQuery);
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [assets, query, filterType, filterStatus]);

  const getWarrantyDisplay = (warrantyUntil) => {
    if (!warrantyUntil) return { text: '—', isExpired: false };

    const warrantyDate = new Date(warrantyUntil);
    const today = new Date();
    const isExpired = warrantyDate < today;

    const formattedDate = warrantyDate.toLocaleDateString('en-GB');
    return { text: formattedDate, isExpired };
  };

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const confirmDelete = () => {
    if (onDelete && assetToDelete) {
      onDelete(assetToDelete.id);
    }
    setShowDeleteConfirm(false);
    setAssetToDelete(null);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'assetTag',
      label: 'ASSET TAG',
      render: (asset) => (
        <HyperlinkButton
          onClick={() => onViewDetail && onViewDetail(asset)}
          title="view asset details"
        >
          {getAssetProperty(asset, 'tag') ||
            getAssetProperty(asset, 'assetTag') ||
            'N/A'}
        </HyperlinkButton>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (asset) => getAssetProperty(asset, 'type') || 'N/A',
    },
    {
      key: 'brand',
      label: 'BRAND',
      render: (asset) => getAssetProperty(asset, 'brand') || 'N/A',
    },
    {
      key: 'model',
      label: 'MODEL',
      render: (asset) =>
        getAssetProperty(asset, 'model') ||
        getAssetProperty(asset, 'modelName') ||
        'N/A',
    },
    {
      key: 'serial',
      label: 'SERIAL',
      render: (asset) =>
        getAssetProperty(asset, 'serial') ||
        getAssetProperty(asset, 'serialNo') ||
        'N/A',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (asset) => {
        const status = getAssetProperty(asset, 'status') || 'Unassigned';
        return (
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${
              status === 'Assigned'
                ? 'bg-green-100 text-green-800'
                : status === 'Unassigned'
                  ? 'bg-yellow-100 text-yellow-800'
                  : status === 'In Repair'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'warranty',
      label: 'WARRANTY',
      render: (asset) => {
        const warrantyUntil = getAssetProperty(asset, 'warrantyUntil');
        const warrantyInfo = getWarrantyDisplay(warrantyUntil);
        return (
          <div className="flex items-center justify-center">
            <span>{warrantyInfo.text}</span>
          </div>
        );
      },
    },
  ];

  const renderActions = (asset) => (
    <div className="flex justify-end gap-3">
      <IconButton
        onClick={() => onEdit && onEdit(asset)}
        title="Edit Asset"
        disabled={isViewOnly}
      >
        <SquarePen size={16} />
      </IconButton>

      <IconButton
        onClick={() => {
          setAssetToDelete(asset);
          setShowDeleteConfirm(true);
        }}
        title="Delete Asset"
        disabled={isViewOnly}
      >
        <Trash size={16} />
      </IconButton>
    </div>
  );

  return (
    <div className="bg-white rounded-lg">
      <div className="">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all fields..."
                className="px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      setCurrentPage(1);
                    }}
                    title="Clear search"
                    className="p-1"
                  >
                    <X size={14} />
                  </IconButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={currentData}
        rowKey="id"
        actions={renderActions}
        actionsHeader="ACTIONS"
        actionsAlign="right"
        className="mt-2.5"
      />

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </div>

      <div className="mt-6 p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
        <div>
          Showing <span className="font-semibold">{currentData.length}</span> of{' '}
          <span className="font-semibold">{filtered.length}</span> assets
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span>
              Assigned:{' '}
              {
                assets.filter(
                  (a) => getAssetProperty(a, 'status') === 'Assigned'
                ).length
              }
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
            <span>
              Unassigned:{' '}
              {
                assets.filter(
                  (a) => getAssetProperty(a, 'status') === 'Unassigned'
                ).length
              }
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            <span>
              In Repair:{' '}
              {
                assets.filter(
                  (a) => getAssetProperty(a, 'status') === 'In Repair'
                ).length
              }
            </span>
          </div>
        </div>
      </div>

      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete asset ${assetToDelete?.assetTag || assetToDelete?.tag}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Keep Asset"
      />
    </div>
  );
}
