'use client';

import React from 'react';

export default function CustomTable({
  columns = [],
  data = [],
  rowKey = 'id',
  actions,
  actionsHeader,
  className = '',
  tableClassName = 'min-w-full divide-y divide-gray-200',
  theadClassName = 'bg-gray-50',
  tbodyClassName = 'bg-white divide-y divide-gray-200',
  actionsAlign = 'right',
  maxHeight = '60vh',
  minHeight = 'auto',
  smartAlignment = true,
  rowClassName = '', // New prop: string or function (row) => string
  showScrollbar = false, // New prop to toggle scrollbar visibility
  headerAlignment = {}, // New prop: object mapping keys to alignment
  cellAlignment = {}, // New prop: object mapping keys to alignment
}) {
  // Helper function to get alignment class based on column index and key
  const getAlignmentClass = (index, key, alignmentConfig) => {
    if (alignmentConfig && alignmentConfig[key]) {
      return `text-${alignmentConfig[key]}`;
    }

    if (!smartAlignment) return '';

    const totalColumns = columns.length;

    // First column
    if (index === 0) return 'text-left';

    // Last column (if no actions column)
    if (index === totalColumns - 1 && !actions) return 'text-right';

    // Middle columns
    return 'text-center';
  };

  return (
    <div
      className={`relative w-full border border-gray-300 rounded-xl text-gray-900 overflow-hidden ${className}`}
    >
      <div
        // container handles both x and y overflow; y scroll hidden visually
        style={{
          maxHeight,
          minHeight,
          overflowX: 'auto',
          overflowY: 'auto',
          msOverflowStyle: showScrollbar ? 'auto' : 'none',
          scrollbarWidth: showScrollbar ? 'auto' : 'none',
        }}
      >
        {/* hide webkit scrollbar unless showScrollbar is true */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: ${showScrollbar ? 'block' : 'none'};
            width: ${showScrollbar ? '8px' : '0'};
            height: ${showScrollbar ? '8px' : '0'};
          }

          ${showScrollbar
            ? `
          div::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          `
            : ''}

          /* make the header sticky */
          thead th {
            position: sticky;
            top: 0;
            z-index: 10;
          }

          /* in case background isn't set, ensure header has solid background */
          thead tr {
            background: var(--thead-bg, #f9fafb);
          }

          /* Ensure text alignment classes work properly */
          .text-left {
            text-align: left !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
        `}</style>

        <table className={`${tableClassName} table-auto`}>
          <thead className={theadClassName}>
            <tr>
              {columns.map((col, index) => {
                const alignmentClass = getAlignmentClass(
                  index,
                  col.key,
                  headerAlignment
                );
                return (
                  <th
                    key={col.key || index}
                    className={`px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap ${
                      col.className || ''
                    } ${alignmentClass}`}
                    style={{ background: 'inherit' }}
                  >
                    {col.label}
                  </th>
                );
              })}
              {actionsHeader && (
                <th
                  className={`px-5 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap text-${headerAlignment.actions || actionsAlign}`}
                  style={{ background: 'inherit' }}
                >
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>

          <tbody className={tbodyClassName}>
            {data.length > 0 ? (
              data.map((row) => {
                const rowId =
                  row[rowKey] || Math.random().toString(36).substr(2, 9);
                const customRowClass =
                  typeof rowClassName === 'function'
                    ? rowClassName(row)
                    : rowClassName;
                return (
                  <tr
                    key={rowId}
                    className={`transition-colors select-none ${customRowClass || 'hover:bg-gray-50'}`}
                  >
                    {columns.map((col, index) => {
                      const alignmentClass = getAlignmentClass(
                        index,
                        col.key,
                        cellAlignment
                      );
                      return (
                        <td
                          key={col.key || index}
                          className={`px-5 py-3 text-sm text-gray-900 whitespace-nowrap ${
                            col.className || ''
                          } ${alignmentClass}`}
                        >
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      );
                    })}
                    {actions && (
                      <td
                        className={`px-5 py-3 whitespace-nowrap text-${cellAlignment.actions || actionsAlign}`}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-5 py-10 text-center text-gray-500 text-sm"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
