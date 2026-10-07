import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../../../store/slices/authSlice';
import QuotationModal from './QuotationModal';
import QuotationPreviewForm from './QuotationPreviewForm';
import Loader from '../../../components/Loader';
import CustomAlertForm from '../../CustomAlertForm';
import CustomTable from '../../CustomTable';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../Toast';
import {
  Printer,
  DownloadIcon,
  MailCheckIcon,
  X,
  Plus,
  SquarePen,
  Trash,
  MoreHorizontal,
  Search,
  Copy,
} from 'lucide-react';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import FilterDropdown from '../../Buttons/FilterDropdown';
import CustomModalForm from '../../CustomModalForm';
import Pagination from '../../Pagination';
import { handlePrint } from '../../HrModule/PrintForm';

import { createPortal } from 'react-dom';

const RowActions = ({ quotation, onEdit, onDelete, onDuplicate }) => {
  const user = useSelector(selectAuthUser);
  const userRole = (
    user?.role?.roleName ||
    user?.role?.name ||
    ''
  ).toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex items-center justify-end flex-nowrap gap-2">
      <IconButton onClick={() => onEdit(quotation)} title="Edit Quotation">
        <SquarePen size={16} />
      </IconButton>
      <div>
        <div ref={buttonRef}>
          <IconButton onClick={toggleMenu} title="More Actions">
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
        {isOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1 text-sm"
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDuplicate(quotation);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Copy size={14} className="text-gray-600" />
                <span>Duplicate Quotation</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                disabled={!isSuperAdmin}
                onClick={() => {
                  if (!isSuperAdmin) return;
                  setIsOpen(false);
                  onDelete(quotation.id);
                }}
                title={
                  !isSuperAdmin
                    ? 'Delete access restricted (Super Admin only)'
                    : 'Delete'
                }
                className={`w-full text-left px-4 py-2 flex gap-2 items-center text-red-600 transition-colors ${
                  !isSuperAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50'
                }`}
              >
                <Trash size={14} className="text-red-600" />
                <span className="text-red-600">Delete</span>
              </button>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

const QuotationTable = ({ onRefresh }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [duplicateSource, setDuplicateSource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quotationsData, setQuotationsData] = useState([]);
  const [clients, setClients] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuotationData, setPreviewQuotationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const statusTypes = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
  ];

  const [quotationFormat, setQuotationFormat] = useState({
    prefix: 'QTN-',
    nextNumber: '1001',
    padding: 4,
    suffix: '-2026',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getNextQuotationNumber = () => {
    const prefix = quotationFormat.prefix || 'QTN-';
    const padding = quotationFormat.padding ?? 4;
    const suffix = quotationFormat.suffix || '';

    const relevant = quotationsData.filter(
      (q) =>
        q.quotationNumber &&
        q.quotationNumber.startsWith(prefix) &&
        q.quotationNumber.endsWith(suffix)
    );

    if (relevant.length === 0) {
      const startNum = parseInt(quotationFormat.nextNumber, 10) || 1001;
      return `${prefix}${String(startNum).padStart(padding, '0')}${suffix}`;
    }

    let maxSeq = 0;
    relevant.forEach((q) => {
      let temp = q.quotationNumber;
      if (prefix && temp.startsWith(prefix)) temp = temp.slice(prefix.length);
      if (suffix && temp.endsWith(suffix)) temp = temp.slice(0, -suffix.length);
      const seq = parseInt(temp, 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    });

    const nextSeqStr = String(maxSeq + 1).padStart(padding, '0');
    return `${prefix}${nextSeqStr}${suffix}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      try {
        const formatRes = await fetch('/api/number-formats');
        if (formatRes.ok) {
          const formats = await formatRes.json();
          if (formats.quotation) setQuotationFormat(formats.quotation);
        }
      } catch (err) {
        console.error('Error loading number formats:', err);
      }

      const quoRes = await fetch('/api/quotations');
      const quoData = await quoRes.json();
      if (Array.isArray(quoData)) setQuotationsData(quoData);

      const custRes = await fetch('/api/customers');
      const custData = await custRes.json();
      if (Array.isArray(custData)) setClients(custData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showErrorToast('Failed to load quotations or clients.');
    } finally {
      setIsLoading(false);
    }
  };

  const getClientName = (quotation) =>
    quotation.client || quotation.customer?.name || 'Unknown Client';
  const getClientMail = (quotation) => quotation.customer?.email || 'N/A';
  const getPhoneNumber = (quotation) => quotation.customer?.mobile || null;
  const getCity = (quotation) => quotation.customer?.city || 'N/A';

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return digits.replace(/(\d{5})(\d{5})/, '$1 $2');
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return digits.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3');
    }
    return phone;
  };

  const filteredData = quotationsData.filter((quotation) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      quotation.quotationNumber?.toLowerCase().includes(searchLower) ||
      getClientName(quotation)?.toLowerCase().includes(searchLower) ||
      getClientMail(quotation)?.toLowerCase().includes(searchLower) ||
      getCity(quotation)?.toLowerCase().includes(searchLower) ||
      String(quotation.subTotal || '')
        .toLowerCase()
        .includes(searchLower);

    const matchesStatus =
      statusFilter === 'all' ||
      (quotation.status || 'draft').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const data = [...filteredData].sort(
    (a, b) => new Date(b.quotationDate) - new Date(a.quotationDate)
  );

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const handleCreateButtonClick = () => setShowClientModal(true);

  const handleClientSelect = async (quotationData) => {
    setIsCreatingQuotation(true);
    try {
      const customerId = quotationData.client?.id || quotationData.client?._id;
      if (!customerId) throw new Error('Client ID missing from selection');

      const quotationNumber =
        editingQuotation?.quotationNumber || getNextQuotationNumber();

      const payload = {
        quotationNumber,
        quotationDate:
          editingQuotation?.quotationDate || new Date().toISOString(),
        customerId,
        gstPercent: quotationData.gstPercent || 0,
        discountAmount: quotationData.discountAmount || 0,
        termsAndConditions: quotationData.termsAndConditions || '',
        items: quotationData.items.map((item, i) => ({
          serialNumber: i + 1,
          moduleName: item.moduleName,
          amount: Number(item.amount || 0),
        })),
      };

      let res;
      if (editingQuotation) {
        res = await fetch(`/api/quotations/${editingQuotation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save quotation');
      }

      await fetchData();
      if (onRefresh) onRefresh();
      showSuccessToast(
        `Quotation ${quotationNumber} ${
          editingQuotation ? 'updated' : 'created'
        } successfully!`
      );
    } catch (error) {
      console.error('Save Quotation Error:', error);
      showErrorToast(`Error saving quotation: ${error.message}`);
      throw error;
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    setShowClientModal(true);
  };

  const handleDuplicate = (quotation) => {
    setDuplicateSource(quotation);
    setShowClientModal(true);
  };

  const handleQuotationNumberClick = (quotation) => {
    const items = (quotation.items || []).map((i) => ({
      serialNumber: i.serialNumber,
      moduleName: i.moduleName,
      amount: i.amount,
    }));

    const previewData = {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      date: quotation.quotationDate,
      client: {
        name: getClientName(quotation),
        city: quotation.customer?.city,
        state: quotation.customer?.state,
      },
      subject: quotation.subject,
      greeting: quotation.greeting,
      items,
      subTotal: quotation.subTotal,
      gstPercent: quotation.gstPercent,
      discountAmount: quotation.discountAmount,
      termsAndConditions: quotation.termsAndConditions,
    };

    setPreviewQuotationData(previewData);
    setShowPreview(true);
  };

  const handleDelete = (quotationId) => {
    const quotation = quotationsData.find((q) => q.id === quotationId);
    if (!quotation) return;
    setQuotationToDelete(quotation);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!quotationToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${quotationToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      setQuotationsData((prev) =>
        prev.filter((q) => q.id !== quotationToDelete.id)
      );
      showSuccessToast('Quotation deleted successfully!');
      if (onRefresh) onRefresh();
      setShowDeleteConfirm(false);
      setQuotationToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      showErrorToast('Failed to delete quotation.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadQuotation = () => {
    showInfoToast(
      `Downloading quotation ${previewQuotationData?.quotationNumber}...`
    );
    const quotationId = previewQuotationData?.id;
    window.open(`/api/quotation-pdf?id=${quotationId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex items-center justify-center">
        <Loader label="Loading quotations..." size="lg" fullScreen={false} />
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center mb-3 gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
              />
              {searchTerm && (
                <div className="absolute right-1 top-0.5">
                  <IconButton onClick={() => setSearchTerm('')} title="Clear search">
                    <X size={16} />
                  </IconButton>
                </div>
              )}
            </div>

            <FilterDropdown
              options={statusTypes}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              className="w-full md:w-auto min-w-[130px]"
            />
          </div>

          <PrimaryButton
            onClick={() => {
              setEditingQuotation(null);
              setDuplicateSource(null);
              handleCreateButtonClick();
            }}
            disabled={isCreatingQuotation}
          >
            {isCreatingQuotation ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Processing...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Create Quotation</span>
              </>
            )}
          </PrimaryButton>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
          <CustomTable
            columns={[
              {
                key: 'quotationNumber',
                label: 'SL. no.',
                render: (quotation) => (
                  <div className="text-left py-1">
                    <HyperlinkButton
                      onClick={() => handleQuotationNumberClick(quotation)}
                      title="click to view quotation details"
                    >
                      {quotation.quotationNumber || 'N/A'}
                    </HyperlinkButton>
                    <div className="text-[11px] text-gray-400 mt-0.5 ml-0">
                      {quotation.quotationDate
                        ? new Date(quotation.quotationDate).toLocaleDateString(
                            'en-IN',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )
                        : 'N/A'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'client',
                label: 'Client Name',
                render: (quotation) => (
                  <div className="font-medium text-gray-900">
                    {getClientName(quotation)}
                  </div>
                ),
              },
              {
                key: 'customer email',
                label: 'Client Email',
                render: (quotation) => (
                  <div className="font-medium text-gray-900">
                    {getClientMail(quotation)}
                  </div>
                ),
              },
              {
                key: 'phone',
                label: 'Phone',
                render: (quotation) => (
                  <div>
                    {getPhoneNumber(quotation) ? (
                      <span className="text-sm text-gray-700 whitespace-nowrap font-medium">
                        {formatPhoneNumber(getPhoneNumber(quotation))}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">N/A</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'city',
                label: 'City',
                render: (quotation) => (
                  <span className="text-gray-600 font-medium">
                    {getCity(quotation)}
                  </span>
                ),

              },
              {
                key: 'amount',
                label: 'Amount',
                render: (quotation) => (
                  <div className="font-bold text-gray-900 text-base">
                    {formatCurrency(quotation.subTotal)}
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (quotation) => (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                    {(quotation.status || 'DRAFT').toUpperCase()}
                  </span>
                ),
              },
            ]}
            data={paginatedData}
            rowKey="id"
            actionsHeader="Actions"
            actionsAlign="center"
            actions={(quotation) => (
              <RowActions
                quotation={quotation}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            )}
            maxHeight="none"
            minHeight="auto"
          />

          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <Pagination
              currentPage={currentPage}
              totalItems={data.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              rowsPerPageOptions={[5, 10, 20, 50, 100]}
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Quotation Modal */}
      <QuotationModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setEditingQuotation(null);
          setDuplicateSource(null);
        }}
        onSelectClient={handleClientSelect}
        clients={clients}
        initialData={
          editingQuotation ||
          (duplicateSource
            ? {
                ...duplicateSource,
                quotationNumber: null,
                id: null,
                quotationDate: new Date().toISOString(),
              }
            : null)
        }
        nextQuotationNumber={getNextQuotationNumber()}
      />

      {/* Quotation Preview Modal */}
      <CustomModalForm
        open={showPreview && !!previewQuotationData}
        onClose={() => {
          setShowPreview(false);
          setPreviewQuotationData(null);
        }}
        title={
          <span className="mr-6 px-4 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-md font-bold text-gray-800 shadow-sm uppercase">
            PROFORMA INVOICE - {previewQuotationData?.quotationNumber}
          </span>
        }
        widthClass="max-w-6xl text-lg"
        headerActions={
          previewQuotationData && (
            <div className="flex items-center">
              <IconButton
                onClick={() => handlePrint('quotation')}
                className="mr-2"
                title="Print Quotation"
              >
                <Printer size={18} />
              </IconButton>

              <IconButton
                onClick={handleDownloadQuotation}
                className="mr-2"
                title="Download Quotation"
              >
                <DownloadIcon size={18} />
              </IconButton>

              <IconButton
                onClick={() => {}}
                className="mr-4"
                title="Email Quotation"
              >
                <MailCheckIcon size={18} />
              </IconButton>
            </div>
          )
        }
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <PrimaryButton
              onClick={() => {
                const quotationToEdit = quotationsData.find(
                  (q) => q.id === previewQuotationData?.id
                );
                setShowPreview(false);
                setPreviewQuotationData(null);
                if (quotationToEdit) handleEdit(quotationToEdit);
              }}
              className="px-6 py-2 !bg-[#004d7a] shadow-none rounded-md text-white font-semibold"
            >
              Edit
            </PrimaryButton>
          </div>
        }
      >
        <div className="p-6 bg-gray-50/50 min-h-[400px] flex justify-center">
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0 overflow-hidden printable w-full"
            id="quotation-print"
          >
            {previewQuotationData && (
              <QuotationPreviewForm quotationData={previewQuotationData} />
            )}
          </div>
        </div>
      </CustomModalForm>

      {/* Delete Confirmation Modal */}
      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${quotationToDelete?.quotationNumber}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
      />
    </>
  );
};

export default QuotationTable;
