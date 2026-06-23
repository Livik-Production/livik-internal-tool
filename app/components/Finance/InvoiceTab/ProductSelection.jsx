import { Trash2Icon, X, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import CustomAlertForm from '../../CustomAlertForm';
import CustomTable from '../../CustomTable';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import IconButton from '../../Buttons/IconButton';

import CustomModalForm from '../../CustomModalForm';

const DEFAULT_PRODUCTS = [];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

const getCurrencyInfo = (code) =>
  CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

const SAMPLE_HSN_CODES = ['998313', '9983', '998314', '998319'];

const SAMPLE_ITEM_NAMES = [
  'Information technology consulting and suppert services',
  'Other professional, technical and business services',
  'Information technology design and development services',
  'Other information technology services nowhere else classified',
];

const SAMPLE_PRODUCTS = SAMPLE_HSN_CODES.map((code, i) => ({
  hsn: code,
  name: SAMPLE_ITEM_NAMES[i] || '',
}));

// Currency Selector Dropdown Component
const CurrencySelector = ({ currency, onSelect, disabled }) => {
  return (
    <div
      className="relative flex items-center select-none"
      style={{ minWidth: '40px' }}
    >
      <select
        value={currency}
        disabled={disabled}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(e.target.value);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="appearance-none w-full pr-4.5 pl-1.5 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all text-blue-700 font-bold text-xs cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
        title="Change currency"
        style={{ colorScheme: 'light' }}
      >
        {CURRENCIES.map((curr) => (
          <option
            key={curr.code}
            value={curr.code}
            className="bg-white text-gray-900 font-medium py-1"
          >
            {curr.symbol} {curr.code}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-1 text-blue-700 flex items-center">
        <ChevronDown size={10} />
      </div>
    </div>
  );
};

const ProductSelectionModal = ({
  isOpen,
  onBack,
  onCloseFlow,
  onNext,
  selectedClient,
  initialProducts = DEFAULT_PRODUCTS,
  showHeader = true,
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [focusField, setFocusField] = useState(null); // { rowId, field }
  const [rowToRemove, setRowToRemove] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const autoSaveTimeouts = useRef({});

  // Initialize with initial products if provided
  useEffect(() => {
    if (isOpen) {
      if (initialProducts && initialProducts.length > 0) {
        // Convert initial products to table rows format
        const initialRows = initialProducts.map((product, index) => ({
          id: product.id || `product-${Date.now()}-${index}`,
          sno: index + 1,
          hsnCode: product.hsnCode || product.hsn || '',
          productName: product.productName || product.name || '',
          description: product.description || '',
          amount: product.amount || product.price || '',
          currency: product.currency || 'INR',
          isEditable: false, // Keep non-editable initially
          isNew: false,
        }));

        setTableRows(initialRows);
        setSelectedProducts(initialProducts);

        // Calculate initial total amount
        const initialTotal = initialProducts.reduce((sum, product) => {
          const amount = parseFloat(product.amount || product.price || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        setTotalAmount(initialTotal);
      } else {
        // Original empty row logic
        const emptyRow = {
          id: Date.now(),
          sno: 1,
          hsnCode: '',
          productName: '',
          description: '',
          amount: '',
          currency: 'INR',
          isEditable: true, // This should be editable
          isNew: true,
        };
        setTableRows([emptyRow]);
        setSelectedProducts([]);
        setTotalAmount(0);
      }
    }
    // Only run when the modal opens/closes, ignoring initialProducts changes while open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update total amount whenever selected products change
  useEffect(() => {
    const total = selectedProducts.reduce((sum, product) => {
      const amount = parseFloat(product.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    setTotalAmount(total);
  }, [selectedProducts]);

  // Schedule auto-save for a row
  const scheduleAutoSave = (rowId) => {
    if (autoSaveTimeouts.current[rowId]) {
      clearTimeout(autoSaveTimeouts.current[rowId]);
    }

    autoSaveTimeouts.current[rowId] = setTimeout(() => {
      autoSaveRow(rowId);
      delete autoSaveTimeouts.current[rowId];
    }, 2000);
  };

  const autoSaveRow = (rowId) => {
    setTableRows((prevRows) => {
      const rowToSave = prevRows.find((row) => row.id === rowId);

      if (!rowToSave || !rowToSave.isEditable) return prevRows;

      // Check if all required fields are filled
      if (
        !rowToSave.hsnCode.trim() ||
        !rowToSave.productName.trim() ||
        !rowToSave.amount
      ) {
        return prevRows;
      }

      const amountValue = parseFloat(rowToSave.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        return prevRows;
      }

      const newProduct = {
        id: rowToSave.id,
        hsnCode: rowToSave.hsnCode.trim(),
        productName: rowToSave.productName.trim(),
        description: rowToSave.description?.trim() || '',
        amount: amountValue,
        currency: rowToSave.currency || 'INR',
      };

      // Update selected products
      setSelectedProducts((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === rowToSave.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newProduct;
          return updated;
        } else {
          return [...prev, newProduct];
        }
      });

      // Update the row to be non-editable
      return prevRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            isEditable: false,
            isNew: false,
            hsnCode: rowToSave.hsnCode,
            productName: rowToSave.productName,
            description: rowToSave.description,
            amount: rowToSave.amount,
            currency: rowToSave.currency || 'INR',
          };
        }
        return row;
      });
    });
  };

  // Handle field change with auto-save scheduling
  const handleFieldChange = (rowId, field, value) => {
    let newHsnCode = field === 'hsnCode' ? value : undefined;
    let newProductName = field === 'productName' ? value : undefined;

    // Check if the user selected a combined suggestion from the datalist
    if (typeof value === 'string' && value.includes(' - ')) {
      const parts = value.split(' - ');
      const possibleHsn = parts[0].trim();
      const possibleName = parts.slice(1).join(' - ').trim();

      const matched = SAMPLE_PRODUCTS.find(
        (p) => p.hsn === possibleHsn && p.name === possibleName
      );
      if (matched) {
        newHsnCode = matched.hsn;
        newProductName = matched.name;
      }
    }

    setTableRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const updatedRow = {
            ...row,
          };

          if (newHsnCode !== undefined) updatedRow.hsnCode = newHsnCode;
          if (newProductName !== undefined)
            updatedRow.productName = newProductName;
          if (field !== 'hsnCode' && field !== 'productName') {
            updatedRow[field] = value;
          }

          // Ensure the row becomes editable when user starts typing
          if (!row.isEditable) {
            updatedRow.isEditable = true;
          }

          return updatedRow;
        }
        return row;
      })
    );

    // Schedule auto-save
    scheduleAutoSave(rowId);
  };

  // Handle currency change for a row
  const handleCurrencyChange = (rowId, currencyCode) => {
    setTableRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, currency: currencyCode };
        }
        return row;
      })
    );
    // Also update in selectedProducts if present
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === rowId ? { ...p, currency: currencyCode } : p))
    );
    scheduleAutoSave(rowId);
  };

  // Handle double-click on row to make it editable
  const handleRowDoubleClick = (rowId) => {
    setTableRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            isEditable: true,
          };
        }
        return row;
      })
    );
  };

  // Handle click on input fields to make row editable
  const handleInputClick = (rowId, field, e) => {
    e.stopPropagation(); // Prevent double-click event from triggering

    setTableRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId && !row.isEditable) {
          return {
            ...row,
            isEditable: true,
          };
        }
        return row;
      })
    );

    // Set focus target for the clicked field
    setFocusField({ rowId, field });
  };

  // Handle adding a new empty row
  const handleAddNewRow = () => {
    const nextSno = tableRows.length + 1;
    const newRowId = `new-${Date.now()}-${Math.random()}`;

    const emptyRow = {
      id: newRowId,
      sno: nextSno,
      hsnCode: '',
      productName: '',
      description: '',
      amount: '',
      currency: 'INR',
      isEditable: true,
      isNew: true,
    };

    setTableRows((prev) => [...prev, emptyRow]);

    // Automatically focus the first field of the new row
    setFocusField({ rowId: newRowId, field: 'hsnCode' });
  };

  // Remove a product from table
  const handleRemoveProduct = (rowId) => {
    const row = tableRows.find((r) => r.id === rowId);
    if (!row) return;

    // If row is empty, just remove it without confirmation
    const isEmpty =
      !row.hsnCode.trim() && !row.productName.trim() && !row.amount;
    if (isEmpty) {
      confirmRemoveProduct(rowId);
      return;
    }

    setRowToRemove(rowId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveProduct = (rowId) => {
    // Don't remove if it's the only row
    if (tableRows.length === 1) {
      // Just clear the row instead of removing it
      setTableRows([
        {
          id: Date.now(),
          sno: 1,
          hsnCode: '',
          productName: '',
          description: '',
          amount: '',
          currency: 'INR',
          isEditable: true,
          isNew: true,
        },
      ]);
      setSelectedProducts([]);

      // Focus on the cleared row
      // We need the new ID, but here it's Date.now(), which is hard to predict for focus.
      // Let's just reset focusField
      setFocusField(null);
    } else {
      const updatedRows = tableRows.filter((row) => row.id !== rowId);

      const renumberedRows = updatedRows.map((row, index) => ({
        ...row,
        sno: index + 1,
      }));

      setTableRows(renumberedRows);

      // Remove from selected products
      setSelectedProducts((prev) => prev.filter((p) => p.id !== rowId));
    }

    setShowRemoveConfirm(false);
    setRowToRemove(null);

    // Clear any pending auto-save for this row
    if (autoSaveTimeouts.current[rowId]) {
      clearTimeout(autoSaveTimeouts.current[rowId]);
      delete autoSaveTimeouts.current[rowId];
    }
  };

  // Handle next button click
  const handleNext = () => {
    // First, force save all editable rows that have data
    const updatedRows = tableRows.map((row) => {
      if (row.isEditable) {
        const hasData =
          row.hsnCode.trim() !== '' ||
          row.productName.trim() !== '' ||
          row.amount !== '';

        if (hasData) {
          // Check if all required fields are filled
          if (row.hsnCode.trim() && row.productName.trim() && row.amount) {
            const amountValue = parseFloat(row.amount);
            if (!isNaN(amountValue) && amountValue > 0) {
              const newProduct = {
                id: row.id,
                hsnCode: row.hsnCode.trim(),
                productName: row.productName.trim(),
                description: row.description?.trim() || '',
                amount: amountValue,
                currency: row.currency || 'INR',
              };

              // Update selected products
              setSelectedProducts((prev) => {
                const existingIndex = prev.findIndex((p) => p.id === row.id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = newProduct;
                  return updated;
                } else {
                  return [...prev, newProduct];
                }
              });

              return {
                ...row,
                isEditable: false,
                isNew: false,
              };
            }
          }
        }
      }
      return row;
    });

    setTableRows(updatedRows);

    // Clear any remaining timeouts
    Object.values(autoSaveTimeouts.current).forEach((timeout) => {
      clearTimeout(timeout);
    });
    autoSaveTimeouts.current = {};

    if (selectedProducts.length > 0) {
      onNext(selectedProducts, totalAmount);
    } else {
      alert('Please add at least one product before proceeding.');
    }
  };

  const modalContent = (
    <div className="flex flex-col h-full">
      <datalist id="hsn-suggestions" className="bg-white text-gray-900">
        {SAMPLE_PRODUCTS.map((prod, i) => (
          <option
            key={i}
            value={`${prod.hsn} - ${prod.name}`}
            className="bg-white text-gray-900"
          />
        ))}
      </datalist>
      <datalist id="item-suggestions" className="bg-white text-gray-900">
        {SAMPLE_PRODUCTS.map((prod, i) => (
          <option
            key={i}
            value={`${prod.hsn} - ${prod.name}`}
            className="bg-white text-gray-900"
          />
        ))}
      </datalist>

      {/* Header and Quick Info */}
      <div className="px-6 py-2 border-b border-gray-100 bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-400">Client:</span>
            <span className="text-lg font-bold text-blue-600 flex items-center gap-1.5">
              <span>{selectedClient?.name || 'Select a client'}</span>
              {selectedClient?.city && (
                <span className="text-gray-500 font-medium text-lg  px-1.5 py-0.5 rounded ml-1">
                  - {selectedClient.city}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton
            onClick={handleAddNewRow}
            className="flex items-center gap-2 px-6 py-2 !bg-[#004d7a] shadow-none rounded-lg"
          >
            <span className="text-lg">+</span>
            <span className="font-bold text-sm">Add New Row</span>
          </PrimaryButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <CustomTable
            columns={[
              {
                key: 'sno',
                label: 'S.No',
                className: 'w-14',
                render: (row) => (
                  <div className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded text-[10px] font-bold text-gray-400 border border-gray-100 mx-auto">
                    {row.sno}
                  </div>
                ),
              },
              {
                key: 'hsnCode',
                label: 'HSN Code',
                className: 'min-w-[140px] w-40',
                render: (row, index) =>
                  row.isEditable ? (
                    <input
                      type="text"
                      list="hsn-suggestions"
                      value={row.hsnCode}
                      onChange={(e) =>
                        handleFieldChange(row.id, 'hsnCode', e.target.value)
                      }
                      onClick={(e) => handleInputClick(row.id, 'hsnCode', e)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      style={{ colorScheme: 'light' }}
                      autoFocus={
                        (row.isNew &&
                          index === tableRows.length - 1 &&
                          !focusField) ||
                        (focusField?.rowId === row.id &&
                          focusField?.field === 'hsnCode')
                      }
                      placeholder="HSN"
                    />
                  ) : (
                    <div
                      onClick={(e) => handleInputClick(row.id, 'hsnCode', e)}
                      className="cursor-text py-2"
                    >
                      <span className="font-medium text-xs text-gray-900">
                        {row.hsnCode || '—'}
                      </span>
                    </div>
                  ),
              },
              {
                key: 'productName',
                label: 'Item Name',
                className: 'min-w-[250px]',
                render: (row) =>
                  row.isEditable ? (
                    <input
                      type="text"
                      list="item-suggestions"
                      value={row.productName}
                      onChange={(e) =>
                        handleFieldChange(row.id, 'productName', e.target.value)
                      }
                      onClick={(e) =>
                        handleInputClick(row.id, 'productName', e)
                      }
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      style={{ colorScheme: 'light' }}
                      autoFocus={
                        focusField?.rowId === row.id &&
                        focusField?.field === 'productName'
                      }
                      placeholder="Product Name"
                    />
                  ) : (
                    <div
                      onClick={(e) =>
                        handleInputClick(row.id, 'productName', e)
                      }
                      className="cursor-text py-2"
                    >
                      <span className="font-semibold text-sm text-gray-800">
                        {row.productName || '—'}
                      </span>
                    </div>
                  ),
              },
              {
                key: 'description',
                label: 'Description',
                className: 'min-w-[350px]',
                render: (row) =>
                  row.isEditable ? (
                    <textarea
                      value={row.description}
                      onChange={(e) =>
                        handleFieldChange(row.id, 'description', e.target.value)
                      }
                      onClick={(e) =>
                        handleInputClick(row.id, 'description', e)
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:border-blue-500 outline-none"
                      placeholder="Description"
                      rows="1"
                      style={{ minHeight: '34px' }}
                      autoFocus={
                        focusField?.rowId === row.id &&
                        focusField?.field === 'description'
                      }
                    />
                  ) : (
                    <div
                      onClick={(e) =>
                        handleInputClick(row.id, 'description', e)
                      }
                      className="cursor-text py-2"
                    >
                      <span className="text-xs text-gray-500 leading-relaxed">
                        {row.description || '—'}
                      </span>
                    </div>
                  ),
              },
              {
                key: 'amount',
                label: 'Amount',
                className: 'min-w-[240px] w-60',
                render: (row) => {
                  const currInfo = getCurrencyInfo(row.currency || 'INR');
                  return row.isEditable ? (
                    <div className="flex items-center justify-center gap-1.5 mx-auto max-w-[220px]">
                      <CurrencySelector
                        currency={row.currency || 'INR'}
                        onSelect={(code) => handleCurrencyChange(row.id, code)}
                      />
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) =>
                            handleFieldChange(row.id, 'amount', e.target.value)
                          }
                          onClick={(e) => handleInputClick(row.id, 'amount', e)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-center font-medium text-gray-900 focus:border-blue-500 outline-none"
                          placeholder="0.00"
                          autoFocus={
                            focusField?.rowId === row.id &&
                            focusField?.field === 'amount'
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => handleInputClick(row.id, 'amount', e)}
                      className="cursor-text flex justify-center items-center gap-1.5 py-2"
                    >
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded">
                        {currInfo.code}
                      </span>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">
                        {currInfo.symbol}
                        {parseFloat(row.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: 'actions',
                label: '',
                className: 'w-16 pr-4',
                render: (row) => (
                  <div className="flex justify-center">
                    <IconButton
                      onClick={() => handleRemoveProduct(row.id)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                      title="Remove Item"
                    >
                      <Trash2Icon size={16} />
                    </IconButton>
                  </div>
                ),
              },
            ]}
            data={tableRows}
            rowKey="id"
            maxHeight="none"
            headerAlignment={{ amount: 'center', actions: 'center' }}
            cellAlignment={{ amount: 'center', actions: 'center' }}
            rowClassName={(row) =>
              `border-b border-gray-100 ${
                row.isEditable
                  ? 'bg-blue-50/30 [&>td]:!py-1.5'
                  : 'hover:bg-gray-50/50 cursor-pointer'
              }`
            }
            onRowDoubleClick={(row) => handleRowDoubleClick(row.id)}
          />
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {showHeader ? (
        <CustomModalForm
          open={isOpen}
          onClose={onCloseFlow || onBack}
          title="Step 2: Select Products"
          widthClass="max-w-7xl"
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-none flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-bold">Back</span>
              </Button>
              <PrimaryButton
                disabled={selectedProducts.length === 0}
                onClick={handleNext}
                className="px-8 py-2 !bg-[#004d7a] shadow-none"
              >
                <span className="font-bold">Next</span>
              </PrimaryButton>
            </div>
          }
        >
          {modalContent}
        </CustomModalForm>
      ) : (
        <div className="h-full">{modalContent}</div>
      )}

      <CustomAlertForm
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => confirmRemoveProduct(rowToRemove)}
        title="Remove Item"
        message="Are you sure you want to remove this item from the invoice?"
        type="danger"
        confirmText="Remove"
        cancelText="Cancel"
        details={
          rowToRemove && (
            <div className="text-sm">
              <p className="font-bold">
                {tableRows.find((r) => r.id === rowToRemove)?.productName ||
                  'Untitled Item'}
              </p>
              {tableRows.find((r) => r.id === rowToRemove)?.amount && (
                <p className="text-gray-500">
                  {
                    getCurrencyInfo(
                      tableRows.find((r) => r.id === rowToRemove)?.currency ||
                        'INR'
                    ).symbol
                  }
                  {parseFloat(
                    tableRows.find((r) => r.id === rowToRemove).amount
                  ).toLocaleString()}
                </p>
              )}
            </div>
          )
        }
      />
    </>
  );
};

export default ProductSelectionModal;
