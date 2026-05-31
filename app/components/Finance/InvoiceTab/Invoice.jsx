import { useState, useEffect, useRef } from 'react';
import ClientSelectionModal from './InvoiceModal';
import PreviewForm from './PreviewForm';
import FollowUpModal from './FollowUpModal';
import Loader from '../../../components/Loader';
import CustomAlertForm from '../../CustomAlertForm';
import CustomTable from '../../CustomTable';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import FilterDropdown from '../../Buttons/FilterDropdown';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../Toast';
import {
  Printer,
  DownloadIcon,
  MailCheckIcon,
  RefreshCcw,
  History,
  X,
  Plus,
  SquarePen,
  Trash,
  MoreHorizontal,
  ArrowRightLeft
} from 'lucide-react';
import HyperlinkButton from '../../Buttons/HyperlinkButton';
import CustomModalForm from '../../CustomModalForm';
import { handleDownloadInvoicePDF } from './DownloadInvoicePDF';
import { handlePrint } from '../../HrModule/PrintForm';

import { createPortal } from 'react-dom';

const RowActions = ({ invoice, onFollowUp, onToggleType, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // true for capturing phase to catch table scroll
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4, // 4px margin
        left: rect.right - 192, // w-48 is 192px
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex items-center justify-end flex-nowrap gap-2">
      <IconButton onClick={() => onEdit(invoice)} title="Edit Invoice">
        <SquarePen size={16} />
      </IconButton>
      <div>
        <div ref={buttonRef}>
          <IconButton onClick={toggleMenu} title="More Actions">
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div 
            ref={menuRef}
            style={{ top: menuPos.top, left: menuPos.left }}
            className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1 text-sm"
          >
            <button
              onClick={() => { setIsOpen(false); onFollowUp(invoice); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <MailCheckIcon size={14} className="text-gray-600" />
              <span>Invoice Follow-up</span>
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => { setIsOpen(false); onToggleType(invoice); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
            >
              <ArrowRightLeft size={14} className="text-gray-600" />
              <span>Change Invoice Type</span>
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={() => { setIsOpen(false); onDelete(invoice.id); }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
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

const InvoiceTable = ({ onRefresh }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoicesData, setInvoicesData] = useState([]);
  const [clients, setClients] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTypeToggleConfirm, setShowTypeToggleConfirm] = useState(false);
  const [invoiceToToggleType, setInvoiceToToggleType] = useState(null);
  const [isTogglingType, setIsTogglingType] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpModalMode, setFollowUpModalMode] = useState('history');
  const [selectedInvoiceForFollowUp, setSelectedInvoiceForFollowUp] =
    useState(null);
  const [followUpsData, setFollowUpsData] = useState({}); // Local mock storage for follow-ups

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch Data on Mount
  useEffect(() => {
    fetchData();
  }, []);

  const getNextInvoiceNumber = () => {
    const currentYearStr = new Date().getFullYear().toString().slice(-2);
    const prefix = `INV-${currentYearStr}-`;

    const yearInvoices = invoicesData.filter(
      (inv) => inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
    );

    if (yearInvoices.length === 0) {
      return `${prefix}0001`;
    }

    let maxSeq = 0;
    yearInvoices.forEach((inv) => {
      const parts = inv.invoiceNumber.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    const nextSeqStr = String(maxSeq + 1).padStart(4, '0');
    return `${prefix}${nextSeqStr}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Invoices
      const invRes = await fetch('/api/invoices');
      const invData = await invRes.json();
      if (Array.isArray(invData)) {
        setInvoicesData(invData);
        // Extract follow-ups from the fetched invoices
        const followUpsMap = {};
        invData.forEach((inv) => {
          if (inv.followUps && inv.followUps.length > 0) {
            followUpsMap[inv.id] = inv.followUps.map((f) => ({
              ...f,
              date: f.date.split('T')[0], // Format date for input fields
            }));
          }
        });
        setFollowUpsData(followUpsMap);
      }

      // Fetch Customers (Clients)
      const custRes = await fetch('/api/customers');
      const custData = await custRes.json();
      if (Array.isArray(custData)) {
        setClients(custData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showErrorToast('Failed to load invoices or clients.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getClientName = (invoice) => {
    return (
      invoice.client ||
      invoice.clientName ||
      invoice.companyName ||
      'Unknown Client'
    );
  };
  const getClientMail = (invoice) => {
    return invoice.customer?.email || invoice.email || 'N/A';
  };

  const getPhoneNumber = (invoice) => {
    return (
      invoice.phone ||
      invoice.mobile ||
      invoice.contactNumber ||
      invoice.customer?.mobile ||
      null
    );
  };

  const getCity = (invoice) => {
    return invoice.city || invoice.location || invoice.customer?.city || 'N/A';
  };

  // Filter and sort data
  const filteredData = invoicesData.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
      getClientName(invoice)?.toLowerCase().includes(searchLower) ||
      getCity(invoice)?.toLowerCase().includes(searchLower) ||
      invoice.status?.toLowerCase().includes(searchLower);

    const matchesType =
      typeFilter === 'all' || (invoice.invoiceType || 'actual') === typeFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (invoice.status || 'pending').toLowerCase() ===
      statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const data = [...filteredData].sort(
    (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
  );

  // Pagination calculation
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Helper functions
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatCurrency = (amount, currencyCode = 'INR') => {
    const val = Number(amount);
    if (isNaN(val)) {
      const sym = currencyCode === 'INR' ? '₹' : currencyCode === '₹' ? '$' : currencyCode;
      return `${sym}0`;
    }
    const locales = {
      INR: 'en-IN',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      AED: 'ar-AE',
      SGD: 'en-SG',
      AUD: 'en-AU',
      CAD: 'en-CA',
      JPY: 'ja-JP',
    };
    return new Intl.NumberFormat(locales[currencyCode] || 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getInvoiceCurrency = (invoice) => {
    if (!invoice.items || invoice.items.length === 0) return 'INR';
    const firstItem = invoice.items[0];
    const rawDescription = firstItem.description || '';
    const parts = rawDescription.split('||CUR:');
    return parts[1] || 'INR';
  };

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

  // Modal Handlers
  const handleCreateButtonClick = () => {
    setShowClientModal(true);
  };

  // Handle Invoice Creation/Update from Modal
  const handleClientSelect = async (invoiceData) => {
    setIsCreatingInvoice(true);

    try {
      // 1. Construct Payload matching invoiceService expected structure
      const customerId = invoiceData.client?.id || invoiceData.client?._id;
      if (!customerId) {
        throw new Error('Client ID missing from selection');
      }

      // Use existing invoice number if editing, or generate new one
      const invoiceNumber =
        editingInvoice?.invoiceNumber || getNextInvoiceNumber();

      const payload = {
        invoiceNumber: invoiceNumber,
        invoiceDate: editingInvoice?.invoiceDate || new Date().toISOString(),
        dueDate:
          editingInvoice?.dueDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

        customerId: customerId, // FOR METADATA

        items: invoiceData.products.map((p, i) => {
          const desc = p.description || '';
          const currency = p.currency || 'INR';
          return {
            serialNumber: i + 1,
            particular: p.name || p.productName || 'Item',
            description: desc ? `${desc}||CUR:${currency}` : `||CUR:${currency}`,
            hsnSacCode: p.hsn || p.hsnCode || '',
            amount: Number(p.amount || p.price || 0),
          };
        }),

        taxPercent:
          Number(invoiceData.cgstRate || 0) + Number(invoiceData.sgstRate || 0),
        discountPercent:
          invoiceData.discountType === 'percentage'
            ? Number(invoiceData.discountValue || 0)
            : 0,
        invoiceType: invoiceData.invoiceType || 'actual',
        notes: invoiceData.notes || '',
      };

      let res;
      if (editingInvoice) {
        // UPDATE Existing Invoice
        res = await fetch(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE New Invoice
        res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save invoice');
      }

      // Refresh data
      await fetchData();
      if (onRefresh) onRefresh();
      showSuccessToast(
        `Invoice ${invoiceNumber} ${editingInvoice ? 'updated' : 'created'
        } successfully!`
      );
    } catch (error) {
      console.error('Save Invoice Error:', error);
      showErrorToast(`Error saving invoice: ${error.message}`);
      throw error;
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowClientModal(true);
  };

  const handleInvoiceNumberClick = (invoice) => {
    // Construct preview data
    const previewData = {
      id: invoice.id,
      client: {
        name: invoice.client || 'Client',
        address: invoice.customer?.address1 || invoice.address || 'Address', // Map from customer object
        city: invoice.customer?.city || invoice.city || 'City',
        state: invoice.customer?.state || invoice.state || 'State',
        gst: invoice.customer?.gstnNumber || invoice.gst || '',
        email: invoice.customer?.email || '',
        mobile: invoice.customer?.mobile || '',
      },
      products:
        invoice.items?.map((i) => {
          const rawDescription = i.description || '';
          const parts = rawDescription.split('||CUR:');
          const description = parts[0] || '';
          const currency = parts[1] || 'INR';
          return {
            name: i.particular,
            description: description,
            price: i.amount,
            hsn: i.hsnSacCode,
            currency: currency,
          };
        }) || [],
      totalAmount: Number(invoice.subTotal || 0),
      subtotalAfterDiscount: Number(invoice.total || 0) / (1 + Number(invoice.taxPercent || 0) / 100),
      discountAmount:
        Number(invoice.subTotal || 0) -
        Number(invoice.total || 0) /
        (1 + Number(invoice.taxPercent || 0) / 100), // Approximate back-calc or just use stored totals
      // Actually invoice object has totals
      totalAmountWithGST: Number(invoice.total || 0),

      // We don't have separated CGST/SGST amounts stored in DB easily accessible here unless we calc.
      cgstRate: Number(invoice.taxPercent || 0) / 2,
      sgstRate: Number(invoice.taxPercent || 0) / 2,
      cgstAmount: (Number(invoice.total || 0) - (Number(invoice.total || 0) / (1 + Number(invoice.taxPercent || 0) / 100))) / 2,
      sgstAmount: (Number(invoice.total || 0) - (Number(invoice.total || 0) / (1 + Number(invoice.taxPercent || 0) / 100))) / 2,

      date: invoice.invoiceDate,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
    };

    setPreviewInvoiceData(previewData);
    setShowPreview(true);
  };

  const handleDelete = (invoiceId) => {
    const invoice = invoicesData.find((i) => i.id === invoiceId);
    if (!invoice) return;
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      setInvoicesData((prev) =>
        prev.filter((inv) => inv.id !== invoiceToDelete.id)
      );
      if (onRefresh) onRefresh();
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      showErrorToast('Failed to delete invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleType = (invoice) => {
    setInvoiceToToggleType(invoice);
    setShowTypeToggleConfirm(true);
  };

  const confirmToggleType = async () => {
    if (!invoiceToToggleType) return;

    // Check if invoice is paid
    if (invoiceToToggleType.paymentStatus === 'paid') {
      setShowTypeToggleConfirm(false);
      setInvoiceToToggleType(null);
      return;
    }

    setIsTogglingType(true);
    try {
      const newType =
        (invoiceToToggleType.invoiceType || 'actual') === 'actual'
          ? 'proforma'
          : 'actual';

      const res = await fetch(`/api/invoices/${invoiceToToggleType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceType: newType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle invoice type');
      }

      await fetchData();
      if (onRefresh) onRefresh();
      setShowTypeToggleConfirm(false);
      setInvoiceToToggleType(null);
    } catch (error) {
      console.error('Toggle type error:', error);
      showErrorToast(`Error toggling invoice type: ${error.message}`);
    } finally {
      setIsTogglingType(false);
    }
  };

  // Preview modal handlers
  const handleDownloadInvoice = () => {
    showInfoToast(
      `Downloading invoice ${previewInvoiceData?.invoiceNumber}...`
    );
    handleDownloadInvoicePDF(previewInvoiceData, 'with');
  };

  const handleEmailInvoice = () => {
    showInfoToast(`Emailing invoice ${previewInvoiceData?.invoiceNumber}...`);
  };

  const handleFollowUpClick = (invoice, mode = 'history') => {
    setSelectedInvoiceForFollowUp(invoice);
    setFollowUpModalMode(mode);
    setShowFollowUpModal(true);
  };

  const handleAddFollowUp = async (invoiceId, newLog) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
      if (!res.ok) throw new Error('Failed to add follow-up');

      const savedLog = await res.json();
      savedLog.date = savedLog.date.split('T')[0]; // Format for UI

      setFollowUpsData((prev) => ({
        ...prev,
        [invoiceId]: [savedLog, ...(prev[invoiceId] || [])], // Put newest at top
      }));
      showSuccessToast('Follow-up log added successfully!');
    } catch (error) {
      console.error(error);
      showErrorToast('Failed to add follow-up');
    }
  };

  const handleDeleteFollowUp = async (invoiceId, logId) => {
    try {
      const res = await fetch(
        `/api/invoices/${invoiceId}/follow-ups/${logId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Failed to delete follow-up');

      setFollowUpsData((prev) => ({
        ...prev,
        [invoiceId]: (prev[invoiceId] || []).filter((log) => log.id !== logId),
      }));
      showInfoToast('Follow-up log removed.');
    } catch (error) {
      console.error(error);
      showErrorToast('Failed to delete follow-up');
    }
  };

  const handleEditFollowUp = async (invoiceId, logId, updatedLog) => {
    try {
      const res = await fetch(
        `/api/invoices/${invoiceId}/follow-ups/${logId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLog),
        }
      );
      if (!res.ok) throw new Error('Failed to update follow-up');

      const savedLog = await res.json();
      savedLog.date = savedLog.date.split('T')[0];

      setFollowUpsData((prev) => ({
        ...prev,
        [invoiceId]: (prev[invoiceId] || []).map((log) =>
          log.id === logId ? { ...log, ...savedLog } : log
        ),
      }));
      showSuccessToast('Follow-up log updated successfully!');
    } catch (error) {
      console.error(error);
      showErrorToast('Failed to update follow-up');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex items-center justify-center">
        <Loader label="Loading invoices..." size="lg" fullScreen={false} />
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Control Bar (Search, Filters, Create Button) */}
        <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center mb-3 gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm pr-10 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
              />
              {searchTerm && (
                <div className="absolute right-1 top-1">
                  <IconButton
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X size={16} />
                  </IconButton>
                </div>
              )}
            </div>

            <FilterDropdown
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'actual', label: 'Actual' },
                { value: 'proforma', label: 'Proforma' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
              className="w-full md:w-auto min-w-[120px]"
            />

            <FilterDropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              className="w-1/2 md:w-auto min-w-[130px]"
            />
          </div>

          <PrimaryButton
            onClick={() => {
              setEditingInvoice(null);
              handleCreateButtonClick();
            }}
            disabled={isCreatingInvoice}
          >
            {isCreatingInvoice ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Processing...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Create Invoice</span>
              </>
            )}
          </PrimaryButton>
        </div>

        {/* Table Body Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
          <CustomTable
            columns={[
              {
                key: 'invoiceNumber',
                label: 'Invoice No',
                render: (invoice) => (
                  <div className="text-left py-1">
                    <HyperlinkButton
                      onClick={() => handleInvoiceNumberClick(invoice)}
                      title="click to view invoice details"
                    >
                      {invoice.invoiceNumber || 'N/A'}
                    </HyperlinkButton>
                    <div className="text-[11px] text-gray-400 mt-0.5 ml-0">
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )
                        : 'N/A'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'client',
                label: 'Client Name',
                render: (invoice) => (
                  <div className="font-medium text-gray-900">
                    {getClientName(invoice)}
                  </div>
                ),
              },
              {
                key: 'customer email',
                label: 'Client Email',
                render: (invoice) => (
                  <div className="font-medium text-gray-900">
                    {getClientMail(invoice)}
                  </div>
                ),
              },
              {
                key: 'phone',
                label: 'Phone',
                render: (invoice) => (
                  <div>
                    {getPhoneNumber(invoice) ? (
                      <span className="text-sm text-gray-700 whitespace-nowrap font-medium">
                        {formatPhoneNumber(getPhoneNumber(invoice))}
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
                render: (invoice) => (
                  <div>
                    <span className="text-gray-600 font-medium">
                      {getCity(invoice)}
                    </span>
                  </div>
                ),
              },
              {
                key: 'type',
                label: 'Type',
                render: (invoice) => (
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(invoice.invoiceType || 'actual') === 'proforma'
                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                    >
                      {invoice.invoiceType || 'actual'}
                    </span>
                  </div>
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                render: (invoice) => {
                  const currencyCode = getInvoiceCurrency(invoice);
                  return (
                    <div className="font-bold text-gray-900 text-base">
                      {formatCurrency(invoice.total || invoice.totalAmount, currencyCode)}
                    </div>
                  );
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (invoice) => (
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {(invoice.status || 'UNKNOWN').toUpperCase()}
                    </span>
                  </div>
                ),
              },
            ]}
            data={paginatedData}
            rowKey="id"
            actionsHeader="Actions"
            actionsAlign="center"
            actions={(invoice) => (
              <RowActions
                invoice={invoice}
                onFollowUp={handleFollowUpClick}
                onToggleType={handleToggleType}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            maxHeight="none"
            minHeight="auto"
          />

          {/* Footer with Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-500">
            <div>
              Showing{' '}
              <span className="text-gray-900 font-bold">
                {data.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="text-gray-900 font-bold">
                {Math.min(data.length, currentPage * itemsPerPage)}
              </span>{' '}
              of <span className="text-gray-900 font-bold">{data.length}</span>{' '}
              invoices
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-1 px-2">
                {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => {
                  // Show a window of pages to avoid too many buttons
                  if (
                    totalPages > 7 &&
                    i !== 0 &&
                    i !== totalPages - 1 &&
                    Math.abs(currentPage - 1 - i) > 1
                  ) {
                    if (i === 1 || i === totalPages - 2) {
                      return (
                        <span key={i} className="px-1 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === i + 1
                        ? 'bg-[#004475] text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client Selection Modal */}
      <ClientSelectionModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setEditingInvoice(null);
        }}
        onSelectClient={handleClientSelect}
        clients={clients}
        invoices={invoicesData}
        initialData={editingInvoice} // Pass editing data
        nextInvoiceNumber={getNextInvoiceNumber()}
      />

      {/* Invoice Preview Modal (Professional Format) */}
      <CustomModalForm
        open={showPreview && !!previewInvoiceData}
        onClose={() => {
          setShowPreview(false);
          setPreviewInvoiceData(null);
        }}
        title={<span className="mr-6 px-4 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-md font-bold text-gray-800 shadow-sm uppercase">
                INVOICE - {previewInvoiceData?.invoiceNumber}</span>}
        widthClass="max-w-6xl text-lg"
        headerActions={
          previewInvoiceData && (
            <div className="flex items-center">
              <IconButton
                onClick={() => handlePrint('invoice')}
                className="mr-2"
                title="Print Invoice"
              >
                <Printer size={18} />
              </IconButton>

              <IconButton
                onClick={handleDownloadInvoice}
                className="mr-2"
                title="Download Invoice"
              >
                <DownloadIcon size={18} />
              </IconButton>

              <IconButton
                onClick={() => {
                  // Add email logic here if needed
                }}
                className="mr-4"
                title="Email Invoice"
              >
                <MailCheckIcon size={18} />
              </IconButton>

              <PrimaryButton
                onClick={() =>
                  handleFollowUpClick(
                    {
                      id: previewInvoiceData.id,
                      invoiceNumber: previewInvoiceData.invoiceNumber,
                    },
                    'full'
                  )
                }
                className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 shadow-sm mr-2"
              >
                <Plus size={14} /> Add Follow-up
              </PrimaryButton>
            </div>
          )
        }
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <PrimaryButton
              onClick={() => {
                const invoiceToEdit = invoicesData.find(
                  (inv) => inv.id === previewInvoiceData?.id
                );
                setShowPreview(false);
                setPreviewInvoiceData(null);
                if (invoiceToEdit) {
                  handleEdit(invoiceToEdit);
                }
              }}
              className="px-6 py-2 !bg-[#004d7a] shadow-none rounded-md text-white font-semibold"
            >
              Edit
            </PrimaryButton>
          </div>
        }
      >
        <div className="p-6 bg-gray-50/50 min-h-[400px]">
          <div 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-0 overflow-hidden printable"
            id="invoice-preview-print"
          >
            {previewInvoiceData && (
              <PreviewForm invoiceData={previewInvoiceData} letterPad="with" />
            )}
          </div>
        </div>
      </CustomModalForm>

      {/* Delete Confirmation Modal */}
      <CustomAlertForm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isSubmitting={isDeleting}
      />

      {/* Toggle Type Confirmation Modal */}
      <CustomAlertForm
        isOpen={showTypeToggleConfirm}
        onClose={() => setShowTypeToggleConfirm(false)}
        onConfirm={
          invoiceToToggleType?.paymentStatus === 'paid'
            ? () => setShowTypeToggleConfirm(false)
            : confirmToggleType
        }
        title={
          invoiceToToggleType?.paymentStatus === 'paid'
            ? 'Action Restricted'
            : 'Change Invoice Type'
        }
        message={
          invoiceToToggleType?.paymentStatus === 'paid'
            ? `Invoice ${invoiceToToggleType.invoiceNumber} is already PAID and cannot be converted back to proforma.`
            : `Are you sure you want to change invoice ${invoiceToToggleType?.invoiceNumber} to ${(invoiceToToggleType?.invoiceType || 'actual') === 'actual'
              ? 'PROFORMA'
              : 'ACTUAL'
            }?`
        }
        type={
          invoiceToToggleType?.paymentStatus === 'paid' ? 'info' : 'warning'
        }
        confirmText={
          invoiceToToggleType?.paymentStatus === 'paid'
            ? 'Got it'
            : 'Change Type'
        }
        cancelText={
          invoiceToToggleType?.paymentStatus === 'paid' ? '' : 'Cancel'
        }
        isSubmitting={isTogglingType}
      />

      <FollowUpModal
        open={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false);
          setSelectedInvoiceForFollowUp(null);
        }}
        invoice={selectedInvoiceForFollowUp}
        followUps={
          selectedInvoiceForFollowUp
            ? followUpsData[selectedInvoiceForFollowUp.id] || []
            : []
        }
        onAddFollowUp={handleAddFollowUp}
        onDeleteFollowUp={handleDeleteFollowUp}
        onEditFollowUp={handleEditFollowUp}
        mode={followUpModalMode}
      />
    </>
  );
};

export default InvoiceTable;
