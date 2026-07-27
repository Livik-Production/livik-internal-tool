// components/EmployeeActions.jsx
'use client';

import React from 'react';
import { SquarePen, Trash } from 'lucide-react';
import IconButton from './Buttons/IconButton';

/**
 * EmployeeActions - renders Edit/Delete icon buttons for a row.
 *
 * Props:
 * - row: object (employee)
 * - onEdit: (row) => void
 * - onDelete: (rowId) => void
 */
export default function EmployeeActions({ row, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Edit Button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(row);
        }}
        className="p-2 hover:bg-blue-50 transition-colors"
        title="Edit Employee"
      >
        <SquarePen size={16} color="#003273ff" />
      </IconButton>

      {/* Delete Button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(row.id);
        }}
        className="p-2 hover:bg-red-50 transition-colors"
        title="Delete Employee"
      >
        <Trash size={16} color="#003273ff" />
      </IconButton>
    </div>
  );
}

