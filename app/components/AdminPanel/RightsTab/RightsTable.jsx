'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SquarePen, Trash, X, Plus, Search } from 'lucide-react';
import Pagination from '../../Pagination';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import FilterDropdown from '../../Buttons/FilterDropdown';

export default function RightsTable({
  rights,
  onEditRight,
  onDeleteRight,
  onViewRight,
  searchTerm,
  onSearchChange,
  selectedModule,
  onModuleChange,
  moduleOptions,
  onAddRight,
  totalRights,
  filteredCount,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to first page when data changes (search or filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [rights.length, searchTerm, selectedModule]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rights.slice(startIndex, startIndex + itemsPerPage);
  }, [rights, currentPage, itemsPerPage]);
  return (
    <div className="bg-white rounded-xl mt-3">
      {/* ===== HEADER CONTROLS ===== */}
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search rights..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-10 py-2 rounded-md border border-gray-300 w-full sm:w-64 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-[38px]"
            />
            {searchTerm && (
              <div className="absolute right-2 top-1.5">
                <IconButton
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                  className="p-1"
                >
                  <X size={14} />
                </IconButton>
              </div>
            )}
          </div>

          {/* Module Filter */}
          <FilterDropdown
            options={moduleOptions.map((opt) => ({
              label:
                opt === 'all' || opt === 'select the options'
                  ? 'All Modules'
                  : opt,
              value: opt === 'select the options' ? 'all' : opt,
            }))}
            value={selectedModule}
            onChange={onModuleChange}
            placeholder="Select Module"
            className="w-full sm:w-48"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <PrimaryButton onClick={onAddRight} className="text-sm px-4 py-1.5">
            <Plus size={16} className="mr-1" /> Add Right
          </PrimaryButton>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 ">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RIGHT ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MODULE
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DISPLAY NAME
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RIGHT NAME
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CREATED AT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No rights found. Click "Add Right" to create one.
                  </td>
                </tr>
              ) : (
                currentData.map((right) => (
                  <tr key={right.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm text-gray-900">
                        {right.id.slice(0, 10)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {right.module}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 ">
                        {right.displayName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 ">
                        {right.rightName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {right.createdAt
                          ? new Date(right.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            onClick={() => onEditRight(right.id, right)}
                            title="Edit Right"
                          >
                            <SquarePen size={16} />
                          </IconButton>
                          <IconButton
                            onClick={() => onDeleteRight(right.id)}
                            title="Delete Right"
                            variant="danger"
                          >
                            <Trash size={16} />
                          </IconButton>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={rights.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </div>
  );
}
