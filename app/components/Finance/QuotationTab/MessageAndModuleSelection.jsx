import { Trash2Icon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import CustomAlertForm from '../../CustomAlertForm';
import CustomTable from '../../CustomTable';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CustomModalForm from '../../CustomModalForm';
import RichTextEditor from './RichTextEditor';
const DEFAULT_GREETING =
  'Dear Sir/Madam,\n\nThank you for giving us the opportunity to provide our ERP solution for your business. Based on our discussion, we are pleased to submit the following quotation.';

const MessageAndModuleSelection = ({
  isOpen,
  onBack,
  onCloseFlow,
  onNext,
  selectedClient,
  initialSubject = '',
  initialGreeting = '',
  initialItems = [],
  showHeader = true,
}) => {
  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [tableRows, setTableRows] = useState([]);
  const [rowToRemove, setRowToRemove] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject || '');
      setGreeting(initialGreeting || DEFAULT_GREETING);

      if (initialItems && initialItems.length > 0) {
        setTableRows(
          initialItems.map((item, index) => ({
            id: item.id || `module-${Date.now()}-${index}`,
            sno: index + 1,
            moduleName: item.moduleName || item.name || '',
            amount: item.amount ?? '',
          }))
        );
      } else {
        setTableRows([
          { id: Date.now(), sno: 1, moduleName: '', amount: '' },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFieldChange = (rowId, field, value) => {
    setTableRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleAddNewRow = () => {
    const nextSno = tableRows.length + 1;
    setTableRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${Math.random()}`,
        sno: nextSno,
        moduleName: '',
        amount: '',
      },
    ]);
  };

  const handleRemoveRow = (rowId) => {
    const row = tableRows.find((r) => r.id === rowId);
    if (!row) return;

    const isEmpty = !row.moduleName.trim() && !row.amount;
    if (isEmpty) {
      confirmRemoveRow(rowId);
      return;
    }
    setRowToRemove(rowId);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveRow = (rowId) => {
    if (tableRows.length === 1) {
      setTableRows([{ id: Date.now(), sno: 1, moduleName: '', amount: '' }]);
    } else {
      const updated = tableRows
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, sno: index + 1 }));
      setTableRows(updated);
    }
    setShowRemoveConfirm(false);
    setRowToRemove(null);
  };

  const handleNext = () => {
    const items = tableRows
      .filter((row) => row.moduleName.trim() && row.amount !== '')
      .map((row, index) => ({
        serialNumber: index + 1,
        moduleName: row.moduleName.trim(),
        amount: parseFloat(row.amount) || 0,
      }));

    if (items.length === 0) {
      alert('Please add at least one module before proceeding.');
      return;
    }

    const subTotal = items.reduce((sum, i) => sum + i.amount, 0);
    onNext(subject, greeting, items, subTotal);
  };

  const modalContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-2 border-b border-gray-100 bg-white shadow-sm flex justify-between items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-400">Client:</span>
          <span className="text-lg font-bold text-blue-600">
            {selectedClient?.name || 'Select a client'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-white space-y-6">

        {/* Section 2: Module Selection */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Modules
            </h3>
            <PrimaryButton
              onClick={handleAddNewRow}
              className="flex items-center gap-2 px-4 py-1.5 !bg-[#004d7a] shadow-none rounded-lg text-sm"
            >
              <span className="text-lg leading-none">+</span>
              <span className="font-bold text-sm">Add Module</span>
            </PrimaryButton>
          </div>

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
                key: 'moduleName',
                label: 'Description for service',
                render: (row) => (
                  <input
                    type="text"
                    value={row.moduleName}
                    onChange={(e) =>
                      handleFieldChange(row.id, 'moduleName', e.target.value)
                    }
                    placeholder="Module name"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                className: 'w-48',
                render: (row) => (
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      handleFieldChange(row.id, 'amount', e.target.value)
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-center font-medium text-gray-900 focus:border-blue-500 outline-none"
                  />
                ),
              },
              {
                key: 'actions',
                label: '',
                className: 'w-16 pr-4',
                render: (row) => (
                  <div className="flex justify-center">
                    <IconButton
                      onClick={() => handleRemoveRow(row.id)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                      title="Remove Module"
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
          title="Step 2: Description of Services"
          widthClass="max-w-6xl"
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-none"
              >
                <span className="font-bold">Back</span>
              </Button>
              <PrimaryButton
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
        onConfirm={() => confirmRemoveRow(rowToRemove)}
        title="Remove Module"
        message="Are you sure you want to remove this module from the quotation?"
        type="danger"
        confirmText="Remove"
        cancelText="Cancel"
      />
    </>
  );
};

export default MessageAndModuleSelection;
