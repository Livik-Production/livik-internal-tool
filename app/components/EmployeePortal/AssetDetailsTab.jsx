'use client';

import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import CustomTable from '../CustomTable';
import Pagination from '../Pagination';
import AssetViewModal from './AssetViewModal';
import HyperlinkButton from '../Buttons/HyperlinkButton';

export default function AssetDetailsTab({ assignments = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const columns = [
    {
      key: 'assetTag',
      label: 'ASSET TAG',
      render: (assignment) => (
        <HyperlinkButton
          onClick={() => handleViewDetails(assignment.asset)}
          title="view asset details"
        >
          {assignment.asset?.assetTag || 'N/A'}
        </HyperlinkButton>
      ),
    },

    {
      key: 'category',
      label: 'CATEGORY',
      render: (assignment) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {assignment.asset?.category?.name ||
            assignment.asset?.deviceType ||
            'N/A'}
        </span>
      ),
    },
    {
      key: 'brand',
      label: 'BRAND',
      render: (assignment) => assignment.asset?.brand || 'N/A',
    },
    {
      key: 'model',
      label: 'MODEL',
      render: (assignment) => assignment.asset?.modelName || 'N/A',
    },
    {
      key: 'assignedDate',
      label: 'ASSIGNED DATE',
      render: (assignment) =>
        assignment.assignedDate
          ? new Date(assignment.assignedDate).toLocaleDateString('en-IN')
          : 'N/A',
    },
    {
      key: 'serialNumber',
      label: 'SERIAL NO.',
      render: (assignment) => assignment.asset?.serialNumber || 'N/A',
    },
    {
      key: 'warranty',
      label: 'WARRANTY',
      render: (assignment) => {
        const warrantyUntil = assignment.asset?.warrantyUntil;
        if (!warrantyUntil) return <span className="text-gray-400">—</span>;

        const warrantyDate = new Date(warrantyUntil);
        const isExpired = warrantyDate < new Date();

        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${
              isExpired
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-green-50 text-green-700 border-green-100'
            }`}
          >
            {warrantyDate.toLocaleDateString('en-IN')}
          </span>
        );
      },
    },
  ];

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = assignments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-semibold text-gray-800">Assigned Assets</h3>
      </div>

      <CustomTable columns={columns} data={paginatedData} rowKey="id" />

      <div className="p-4 border-t border-gray-100">
        <Pagination
          currentPage={currentPage}
          totalItems={assignments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {isModalOpen && selectedAsset && (
        <AssetViewModal
          asset={selectedAsset}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}
