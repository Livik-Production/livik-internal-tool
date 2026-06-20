'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  Award,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import CustomTable from '../../../../components/CustomTable';
import Pagination from '../../../../components/Pagination';
import Loader from '../../../../components/Loader';
import PrimaryButton from '../../../../components/Buttons/PrimaryButton';

function CustomerDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id;

  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!customerId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch customer details
        const customerRes = await fetch(`/api/customers/${customerId}`);
        if (!customerRes.ok) throw new Error('Customer not found');
        const customerData = await customerRes.json();
        setCustomer(customerData);

        // Fetch all invoices
        const invoicesRes = await fetch('/api/invoices');
        if (invoicesRes.ok) {
          const allInvoices = await invoicesRes.json();
          // Filter invoices for this customer
          const filteredInvoices = allInvoices.filter(
            (inv) => inv.customer?.id === customerId
          );
          setInvoices(filteredInvoices);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const handleItemsPerPageChange = (newVal) => {
    setItemsPerPage(newVal);
    setCurrentPage(1);
  };

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return invoices.slice(start, start + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount || inv.total || 0),
      0
    );
    const paidAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount || 0),
      0
    );
    const remainingAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.remainingAmount || 0),
      0
    );

    return {
      totalCount,
      totalAmount: totalAmount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      }),
      paidAmount: paidAmount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      }),
      remainingAmount: remainingAmount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      }),
    };
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader label="Loading customer details..." size="md" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-white rounded-2xl shadow-sm m-0.5 min-h-[400px] gap-4">
        <ShieldAlert size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">
          Error Loading Customer
        </h2>
        <p className="text-gray-600">{error || 'Customer not found'}</p>
        <PrimaryButton
          onClick={() => router.push('/dashboard/admin?tab=customers')}
        >
          <ArrowLeft size={16} /> Back to Customers
        </PrimaryButton>
      </div>
    );
  }

  // Invoices table columns
  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice Number',
      className: 'font-semibold text-gray-900',
    },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      render: (row) =>
        row.invoiceDate
          ? new Date(row.invoiceDate).toLocaleDateString('en-IN')
          : '-',
      className: 'text-center',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) =>
        row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN') : '-',
      className: 'text-center',
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (row) =>
        `₹${Number(row.totalAmount || row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      className: 'text-center font-semibold text-gray-900',
    },
    {
      key: 'paidAmount',
      label: 'Paid Amount',
      render: (row) =>
        `₹${Number(row.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      className: 'text-center text-green-600 font-medium',
    },
    {
      key: 'remainingAmount',
      label: 'Remaining Balance',
      render: (row) =>
        `₹${Number(row.remainingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      className: 'text-center text-red-600 font-semibold',
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      className: 'text-center',
      render: (row) => {
        const status = String(row.paymentStatus || 'pending').toLowerCase();
        const badgeStyles = {
          paid: 'bg-green-100 text-green-800 border-green-200',
          partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          pending: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
          <span
            className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border ${badgeStyles[status] || badgeStyles.pending}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-1.5 min-h-0 animate-dashboard-reveal text-left">
      {/* ===== HEADER & BACK BUTTON ===== */}
      <div className="bg-white shadow-sm rounded-2xl px-4 py-3 m-0.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <PrimaryButton
            onClick={() => router.push('/dashboard/admin?tab=customers')}
            className="!bg-gray-100 hover:!bg-gray-200 text-gray-700 p-2 border border-gray-200 shadow-none rounded-xl"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </PrimaryButton>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer File</h1>
            <p className="text-sm text-gray-600 mt-1">
              Detailed metrics, profile details and billing history for{' '}
              {customer.name}.
            </p>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTAINER ===== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
        {/* Left panel - Customer Details Card */}
        <div className="w-full lg:w-1/3 bg-white shadow-sm rounded-2xl p-4 m-0.5 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
            <Award className="text-[#33a8d9]" size={20} />
            Customer Profile
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                ID
              </span>
              <span className="text-sm font-mono text-gray-900 font-bold break-all bg-gray-50 px-2 py-0.5 rounded border border-gray-100 inline-block">
                {customer.id}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Company Name
              </span>
              <span className="text-sm font-bold text-gray-900">
                {customer.name}
              </span>
            </div>

            {customer.email && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Email
                </span>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Mail size={14} /> {customer.email}
                </a>
              </div>
            )}

            {customer.mobile && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Phone Number
                </span>
                <a
                  href={`tel:${customer.mobile}`}
                  className="text-sm font-medium text-gray-900 flex items-center gap-1.5"
                >
                  <Phone size={14} /> {customer.mobile}
                </a>
              </div>
            )}

            {customer.website && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Website
                </span>
                <a
                  href={
                    customer.website.startsWith('http')
                      ? customer.website
                      : `https://${customer.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Globe size={14} /> {customer.website}
                </a>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Address
              </span>
              <span className="text-sm text-gray-700 flex items-start gap-1.5 mt-0.5">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <span>
                  {customer.address1}
                  {customer.address2 && <>, {customer.address2}</>}
                  <br />
                  {customer.city}, {customer.state} - {customer.pincode}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  GSTN Number
                </span>
                <span className="text-sm font-mono font-medium text-gray-900">
                  {customer.gstnNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  CIN Number
                </span>
                <span className="text-sm font-mono font-medium text-gray-900">
                  {customer.cinNumber || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Payment Terms
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {customer.paymentTerms || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Payment Method
                </span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-gray-400" />{' '}
                  {customer.preferredPaymentMethod || 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Status
                </span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {customer.status || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Invoice Cycle Days
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {customer.invoiceFromDay && customer.invoiceToDay 
                    ? `${customer.invoiceFromDay} - ${customer.invoiceToDay}` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {customer.uploads && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Uploads
                </span>
                <span className="text-sm font-medium text-gray-900 mt-1 block">
                  {typeof customer.uploads === 'string' ? customer.uploads : 'File Uploaded'}
                </span>
              </div>
            )}

            {customer.remarks && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Remarks
                </span>
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100 mt-1 whitespace-pre-wrap">
                  {customer.remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Financial Summary & Invoices Table */}
        <div className="flex-1 bg-white shadow-sm rounded-2xl p-4 m-0.5 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          {/* Financial Metrics Summary */}
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2 shrink-0">
            <FileCode className="text-[#33a8d9]" size={20} />
            Billing Summary
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 shrink-0">
            <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center">
              <span className="text-xs font-bold text-blue-900/60 uppercase block">
                Total Invoiced
              </span>
              <span className="text-lg font-extrabold text-blue-950 block mt-1 font-mono">
                {metrics.totalAmount}
              </span>
            </div>
            <div className="bg-green-50/50 p-3 rounded-2xl border border-green-100/50 text-center">
              <span className="text-xs font-bold text-green-900/60 uppercase block">
                Total Paid
              </span>
              <span className="text-lg font-extrabold text-green-950 block mt-1 font-mono">
                {metrics.paidAmount}
              </span>
            </div>
            <div className="bg-red-50/50 p-3 rounded-2xl border border-red-100/50 text-center">
              <span className="text-xs font-bold text-red-900/60 uppercase block">
                Unpaid Balance
              </span>
              <span className="text-lg font-extrabold text-red-950 block mt-1 font-mono">
                {metrics.remainingAmount}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">
                Invoices Count
              </span>
              <span className="text-lg font-extrabold text-slate-800 block mt-1">
                {metrics.totalCount}
              </span>
            </div>
          </div>

          {/* Invoices List */}
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2 shrink-0">
            <FileText size={18} className="text-gray-500" />
            Invoices History
          </h3>

          <div className="flex-1 min-h-0 flex flex-col">
            {invoices.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">
                  No invoices generated for this customer.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <CustomTable
                    columns={columns}
                    data={paginatedInvoices}
                    rowKey="id"
                    className="border border-gray-200 rounded-xl"
                    smartAlignment={true}
                  />
                </div>
                <div className="shrink-0 pt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={invoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    rowsPerPageOptions={[5, 10, 20]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

  export default function CustomerDetailsPage() {
    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-20 min-h-[400px]">
            <Loader label="Loading page..." size="md" />
          </div>
        }
      >
        <CustomerDetailsContent />
      </Suspense>
    );
  }
