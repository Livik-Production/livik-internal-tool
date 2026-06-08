// components/Finance/Payment.jsx
'use client';

import { useState, useMemo } from 'react';
import PaymentStats from './PaymentStats';
import PaymentTabs from './PaymentTabs';
import InvoiceDetailModal from './InvoiceDetailModal';
import PaymentModal from './PaymentModal';
// import { FullLoader, InlineLoader } from "./Loaders";

export default function PaymentTable({
  invoices,
  onMarkAsPaid,
  onViewDetail,
  isLoading = false,
  isProcessingPayment = false,
}) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Filter invoices by status - EXCLUDE PROFORMA INVOICES FROM PENDING
  const pendingInvoices = invoices.filter(
    (invoice) =>
      (invoice.paymentStatus === 'pending' ||
        invoice.paymentStatus === 'partial') &&
      invoice.invoiceType !== 'proforma' // Add this condition
  );

  const completedInvoices = invoices.filter(
    (invoice) => invoice.paymentStatus === 'paid'
    // You might want to keep proforma invoices in completed if they were actually paid
  );

  // For completed invoices, if you want to exclude proforma too:
  // const completedInvoices = invoices.filter(
  //   (invoice) =>
  //     invoice.paymentStatus === "paid" &&
  //     invoice.invoiceType !== "proforma"
  // );

  // Filter invoices based on search query
  const filteredPendingInvoices = useMemo(() => {
    if (!searchQuery) return pendingInvoices;
    const query = searchQuery.toLowerCase();
    return pendingInvoices.filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.client?.toLowerCase().includes(query) ||
        invoice.customer?.name?.toLowerCase().includes(query) ||
        invoice.vendor?.toLowerCase().includes(query) ||
        (invoice.clientCity || invoice.city || invoice.vendorCity || '')
          ?.toLowerCase()
          .includes(query) ||
        invoice.clientMobile?.toLowerCase().includes(query) ||
        invoice.description?.toLowerCase().includes(query)
    );
  }, [pendingInvoices, searchQuery]);

  const filteredCompletedInvoices = useMemo(() => {
    if (!searchQuery) return completedInvoices;
    const query = searchQuery.toLowerCase();
    return completedInvoices.filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(query) ||
        invoice.client?.toLowerCase().includes(query) ||
        invoice.customer?.name?.toLowerCase().includes(query) ||
        invoice.vendor?.toLowerCase().includes(query) ||
        (invoice.clientCity || invoice.city || invoice.vendorCity || '')
          ?.toLowerCase()
          .includes(query) ||
        invoice.clientMobile?.toLowerCase().includes(query) ||
        invoice.description?.toLowerCase().includes(query) ||
        invoice.paymentMethod?.toLowerCase().includes(query)
    );
  }, [completedInvoices, searchQuery]);

  // Calculate totals
  const totalFilteredPendingAmount = filteredPendingInvoices.reduce(
    (sum, invoice) => sum + (invoice.remainingAmount || invoice.totalAmount),
    0
  );

  const totalFilteredCompletedAmount = filteredCompletedInvoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );

  const filteredOverdueInvoices = filteredPendingInvoices.filter((invoice) => {
    if (!invoice.dueDate) return false;
    const due = new Date(invoice.dueDate);
    return due < new Date();
  });

  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);
    return filteredPendingInvoices.filter((invoice) => {
      if (!invoice.dueDate) return false;
      const dueDate = new Date(invoice.dueDate);
      return dueDate > today && dueDate <= oneWeekFromNow;
    });
  }, [filteredPendingInvoices]);

  const totalUpcomingAmount = useMemo(() => {
    return upcomingPayments.reduce(
      (sum, invoice) => sum + (invoice.remainingAmount || invoice.totalAmount),
      0
    );
  }, [upcomingPayments]);

  // Handlers
  const handleInvoiceDetailClick = (invoice) => {
    setInvoiceDetail(invoice);
  };

  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.remainingAmount || invoice.totalAmount);
    setPaymentMethod(invoice.paymentMethod || 'Bank Transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNote('');
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoice) return;

    try {
      let updatedInvoice = { ...selectedInvoice };
      const paymentValue = parseFloat(paymentAmount) || 0;
      const invoiceTotal = selectedInvoice.totalAmount;
      const alreadyPaid = selectedInvoice.partialAmount || 0;
      const referenceNumber = `REF-${Date.now().toString().slice(-6)}`;

      if (paymentValue >= invoiceTotal - alreadyPaid) {
        updatedInvoice = {
          ...selectedInvoice,
          paymentStatus: 'paid',
          paymentDate: paymentDate,
          paymentMethod: paymentMethod,
          partialAmount: null,
          remainingAmount: null,
          referenceNumber: referenceNumber,
          notes: `Paid via ${paymentMethod}. Reference: ${referenceNumber}. ${selectedInvoice.notes || ''}`,
        };
      } else {
        const totalPaid = alreadyPaid + paymentValue;
        const remainingAmount = invoiceTotal - totalPaid;
        updatedInvoice = {
          ...selectedInvoice,
          paymentStatus: 'partial',
          partialAmount: totalPaid,
          remainingAmount: remainingAmount,
          paymentDate: paymentDate,
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber,
          notes: `Partial payment of $${paymentValue}. Reference: ${referenceNumber}. Total paid: $${totalPaid}, Remaining: $${remainingAmount}. ${selectedInvoice.notes || ''}`,
        };
      }

      await onMarkAsPaid(updatedInvoice);
      setSelectedInvoice(null);
      setPaymentNote('');
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const handleUpdateFromDetail = (invoice) => {
    setInvoiceDetail(null);
    handlePaymentClick(invoice);
  };

  const showLoading = isProcessingPayment;

  if (isLoading) {
    return <FullLoader label="Loading invoices..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <PaymentStats
        pendingInvoices={pendingInvoices}
        filteredOverdueInvoices={filteredOverdueInvoices}
        completedInvoices={completedInvoices}
        upcomingPayments={upcomingPayments}
        totalFilteredPendingAmount={totalFilteredPendingAmount}
        totalFilteredCompletedAmount={totalFilteredCompletedAmount}
        totalUpcomingAmount={totalUpcomingAmount}
      />

      {/* Tabs and Tables Section */}
      <PaymentTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredPendingInvoices={filteredPendingInvoices}
        filteredCompletedInvoices={filteredCompletedInvoices}
        totalFilteredPendingAmount={totalFilteredPendingAmount}
        totalFilteredCompletedAmount={totalFilteredCompletedAmount}
        handleInvoiceDetailClick={handleInvoiceDetailClick}
        handlePaymentClick={handlePaymentClick}
        showLoading={showLoading}
      />

      {/* Modals */}
      {invoiceDetail && (
        <InvoiceDetailModal
          invoice={invoiceDetail}
          onClose={() => setInvoiceDetail(null)}
          onUpdatePayment={() => handleUpdateFromDetail(invoiceDetail)}
          showLoading={showLoading}
        />
      )}

      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentDate={paymentDate}
          setPaymentDate={setPaymentDate}
          paymentNote={paymentNote}
          setPaymentNote={setPaymentNote}
          onClose={() => setSelectedInvoice(null)}
          onSubmit={handleSubmitPayment}
          showLoading={showLoading}
        />
      )}
    </div>
  );
}
