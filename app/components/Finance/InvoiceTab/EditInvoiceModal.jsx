import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ClientSelectionModal from './InvoiceModal';
import ProductSelectionModal from './ProductSelection';
import GSTCalculationModal from './GSTCalculationModal';
import PreviewForm from './PreviewForm';
import Loader from '../../components/Loader';
import { X, Printer, DownloadIcon, MailCheckIcon } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import IconButton from '../../Buttons/IconButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';

const EditInvoiceModal = ({
  isOpen,
  onClose,
  onSave,
  invoice,
  clients = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoiceType, setInvoiceType] = useState('actual');
  const [gstData, setGstData] = useState({
    cgstRate: 9,
    sgstRate: 9,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    subtotalAfterDiscount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalAmountWithGST: 0,
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewCloseConfirm, setShowPreviewCloseConfirm] = useState(false);

  // Initialize with invoice data when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      setIsLoading(true);

      const client =
        clients.find((c) => c.name === invoice.client) ||
        clients.find((c) => c.id === invoice.clientId) ||
        invoice.client ||
        null;

      setSelectedClient(client);
      setSelectedProducts(invoice.products || []);
      setTotalAmount(invoice.amount || 0);
      setInvoiceType(invoice.invoiceType || 'actual');

      // Set GST data from invoice
      setGstData({
        cgstRate: invoice.cgstRate || 9,
        sgstRate: invoice.sgstRate || 9,
        discountType: invoice.discountType || 'percentage',
        discountValue: invoice.discountValue || 0,
        discountAmount: invoice.discountAmount || 0,
        subtotalAfterDiscount:
          invoice.subtotalAfterDiscount || invoice.amount || 0,
        cgstAmount: invoice.cgstAmount || 0,
        sgstAmount: invoice.sgstAmount || 0,
        totalAmountWithGST: invoice.totalAmount || 0,
        notes: invoice.notes || '',
      });

      setIsLoading(false);
    }
  }, [isOpen, invoice, clients]);

  // Handle client selection from step 1
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setCurrentStep(2);
  };

  // Handle product selection from step 2
  const handleProductSelect = (products, amount) => {
    setSelectedProducts(products);
    setTotalAmount(amount);
    setCurrentStep(3);
  };

  // Handle GST calculation from step 3
  const handleGSTUpdate = (data) => {
    setGstData(data);
  };

  // Handle save invoice
  const handleSaveInvoice = (invoiceData) => {
    const updatedInvoice = {
      ...invoice,
      client: selectedClient?.name || invoice.client,
      city: selectedClient?.city || invoice.city,
      phone: selectedClient?.mobile || invoice.phone,
      amount: totalAmount,
      tax: gstData.cgstAmount + gstData.sgstAmount,
      totalAmount: gstData.totalAmountWithGST,
      products: selectedProducts.map((p) => ({
        ...p,
        particular: p.particular || p.productName || p.name,
        hsnSacCode: p.hsnSacCode || p.hsnCode || p.hsn,
      })),
      paymentStatus: invoice.paymentStatus,
      category: invoice.category,
      serviceType: invoice.serviceType,
      state: selectedClient?.state || invoice.state,
      address: selectedClient?.address || invoice.address,
      gst: selectedClient?.gst || invoice.gst,
      invoiceType: invoiceType,
      ...gstData,
    };

    onSave(updatedInvoice);
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <CustomModalForm open={isOpen} onClose={onClose} title="Edit Invoice">
        <div className="flex flex-col items-center justify-center p-20">
          <Loader label="Loading invoice data..." size="lg" />
        </div>
      </CustomModalForm>
    );
  }

  return (
    <>
      <CustomModalForm
        open={isOpen}
        onClose={onClose}
        title={`Edit Invoice: ${invoice?.invoiceNumber}`}
        widthClass="max-w-5xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <Button
              onClick={() => {
                if (currentStep === 1) onClose();
                else setCurrentStep(currentStep - 1);
              }}
              className="px-6"
            >
              {currentStep === 1 ? 'Cancel' : '← Back'}
            </Button>

            <div className="flex gap-3">
              {currentStep < 3 ? (
                <PrimaryButton
                  onClick={() => {
                    if (currentStep === 1 && selectedClient) {
                      setCurrentStep(2);
                    } else if (
                      currentStep === 2 &&
                      selectedProducts.length > 0
                    ) {
                      setCurrentStep(3);
                    }
                  }}
                  disabled={
                    (currentStep === 1 && !selectedClient) ||
                    (currentStep === 2 && selectedProducts.length === 0)
                  }
                  className="px-8 shadow-md shadow-blue-100"
                >
                  Next
                </PrimaryButton>
              ) : (
                <>
                  <Button
                    onClick={() => setShowPreview(true)}
                    className="px-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    Preview
                  </Button>
                  <PrimaryButton
                    onClick={() => handleSaveInvoice()}
                    className="px-8 shadow-md shadow-blue-100"
                  >
                    Save Changes
                  </PrimaryButton>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full">
          {/* Step Indicator Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                      currentStep >= step
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    } text-xs`}
                  >
                    {step}
                  </div>
                  <div className="ml-2 text-sm font-medium">
                    {step === 1 ? 'Client' : step === 2 ? 'Items' : 'Summary'}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-px mx-2 ${
                        currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentStep === 1 && (
              <ClientSelectionModal
                isOpen={true}
                onClose={() => {}}
                onSelectClient={handleClientSelect}
                clients={clients}
                showHeader={false}
                selectedClientId={selectedClient?.id}
                initialData={{ ...invoice, invoiceType }}
              />
            )}

            {currentStep === 2 && (
              <ProductSelectionModal
                isOpen={true}
                onBack={() => setCurrentStep(1)}
                onNext={handleProductSelect}
                selectedClient={selectedClient}
                initialProducts={selectedProducts}
                showHeader={false}
              />
            )}

            {currentStep === 3 && (
              <GSTCalculationModal
                isOpen={true}
                onBack={() => setCurrentStep(2)}
                onCreateInvoice={handleSaveInvoice}
                selectedProducts={selectedProducts}
                totalAmount={totalAmount}
                selectedClient={selectedClient}
                initialGSTData={gstData}
                onUpdateGST={handleGSTUpdate}
                onPreview={() => setShowPreview(true)}
                invoiceType={invoiceType}
                showHeader={false}
              />
            )}
          </div>
        </div>
      </CustomModalForm>

      {/* Preview Modal */}
      <CustomModalForm
        open={showPreview}
        onClose={() => setShowPreviewCloseConfirm(true)}
        title={`Invoice Preview${invoice?.invoiceNumber ? ` — ${invoice.invoiceNumber}` : ''} (Edit Mode)`}
        widthClass="max-w-6xl"
        headerActions={
          <>
            <IconButton
              onClick={() => window.print()}
              className="mr-2"
              title="Print Invoice"
            >
              <Printer size={18} />
            </IconButton>

            <IconButton
              onClick={() => {
                // handle download
              }}
              className="mr-2"
              title="Download Invoice"
            >
              <DownloadIcon size={18} />
            </IconButton>

            <IconButton
              onClick={() => {
                // handle email
              }}
              className="mr-2"
              title="Email Invoice"
            >
              <MailCheckIcon size={18} />
            </IconButton>
          </>
        }
        footer={
          <div className="flex justify-end space-x-3 w-full">
            <Button
              onClick={() => setShowPreview(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg shadow-none"
            >
              Back
            </Button>
            <PrimaryButton
              onClick={() => handleSaveInvoice()}
              className="px-8 py-2 !bg-[#004d7a] shadow-none text-white font-semibold"
            >
              Save Changes
            </PrimaryButton>
          </div>
        }
      >
        <div className="p-4 bg-gray-50">
          <div className="bg-white rounded border border-gray-200 p-0 overflow-hidden">
            <PreviewForm
              invoiceData={{
                client: selectedClient,
                products: selectedProducts,
                totalAmount: totalAmount,
                discountType: gstData.discountType,
                discountValue: gstData.discountValue,
                discountAmount: gstData.discountAmount,
                subtotalAfterDiscount: gstData.subtotalAfterDiscount,
                cgstRate: gstData.cgstRate,
                sgstRate: gstData.sgstRate,
                cgstAmount: gstData.cgstAmount,
                sgstAmount: gstData.sgstAmount,
                totalAmountWithGST: gstData.totalAmountWithGST,
                notes: gstData.notes,
                date: invoice.date || new Date().toISOString().split('T')[0],
                invoiceNumber: invoice.invoiceNumber,
                invoiceType: invoiceType,
              }}
            />
          </div>
        </div>
      </CustomModalForm>

      {/* Confirmation dialog for closing the preview modal */}
      <CustomAlertForm
        isOpen={showPreviewCloseConfirm}
        onClose={() => setShowPreviewCloseConfirm(false)}
        onConfirm={() => {
          setShowPreviewCloseConfirm(false);
          setShowPreview(false);
          if (onClose) onClose();
        }}
        title="Close Edit Invoice"
        message="Are you sure you want to close the modal? Any unsaved progress will be lost."
        confirmText="Yes, Close"
        cancelText="Cancel"
      />
    </>
  );
};

export default EditInvoiceModal;
