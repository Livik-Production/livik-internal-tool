import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ProductSelectionModal from './ProductSelection';
import GSTCalculationModal from './GSTCalculationModal';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../CustomAlertForm';

const ClientSelectionModal = ({
  isOpen,
  onClose,
  onSelectClient, // This will be called with the FINAL invoice data
  clients = [],
  invoices = [], // Added invoices array
  initialData = null, // New prop for editing
  showHeader = true,
  nextInvoiceNumber,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [displayClients, setDisplayClients] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false); // Close confirmation state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoiceType, setInvoiceType] = useState('actual'); // 'actual' or 'proforma'

  // Only use the clients passed as prop, no default clients
  const clientData = useMemo(() => {
    return clients;
  }, [clients]);

  const getClientId = useCallback((client) => client?.id || client?._id, []);

  const getClientName = useCallback((client) => {
    if (!client) return 'N/A';

    return (
      client.name ||
      client.clientName ||
      client.client_name ||
      client.customerName ||
      client.customer_name ||
      client.companyName ||
      client.company_name ||
      client.fullName ||
      client.full_name ||
      (client.firstName && client.lastName
        ? `${client.firstName} ${client.lastName}`
        : client.firstName) ||
      'Unnamed Client'
    );
  }, []);

  const getClientInitial = useCallback(
    (client) => {
      const name = getClientName(client);
      return name.charAt(0).toUpperCase();
    },
    [getClientName]
  );

  const getLastInvoice = useCallback(
    (client) => {
      if (!client || !invoices || invoices.length === 0) return null;
      const clientId = getClientId(client);
      const clientName = getClientName(client);

      const clientInvoices = invoices.filter((inv) => {
        const invClientId =
          inv.customer?.id || inv.customer?._id || inv.clientId;
        const invClientName =
          typeof inv.client === 'string'
            ? inv.client
            : inv.customer?.name || inv.clientName;

        return (
          (clientId && invClientId === clientId) ||
          (clientName && clientName !== 'N/A' && invClientName === clientName)
        );
      });

      if (clientInvoices.length === 0) return null;
      return clientInvoices.sort(
        (a, b) => new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0)
      )[0];
    },
    [invoices, getClientId, getClientName]
  );

  const getAvatarColor = useCallback(
    (client) => {
      const char = getClientInitial(client);
      const colors = {
        A: 'bg-blue-100 text-blue-600',
        B: 'bg-indigo-100 text-indigo-600',
        C: 'bg-sky-100 text-sky-600',
        D: 'bg-cyan-100 text-cyan-600',
        E: 'bg-blue-100 text-blue-600',
        F: 'bg-indigo-100 text-indigo-600',
        G: 'bg-sky-100 text-sky-600',
        H: 'bg-cyan-100 text-cyan-600',
        I: 'bg-blue-100 text-blue-600',
        J: 'bg-indigo-100 text-indigo-600',
        K: 'bg-sky-100 text-sky-600 border border-sky-200',
        L: 'bg-blue-100 text-blue-600 border border-blue-200',
        M: 'bg-indigo-100 text-indigo-600 border border-indigo-200',
        N: 'bg-blue-50 text-blue-400 border border-blue-100',
        O: 'bg-blue-100 text-blue-600',
        P: 'bg-indigo-100 text-indigo-600',
        Q: 'bg-sky-100 text-sky-600',
        R: 'bg-cyan-100 text-cyan-600',
        S: 'bg-blue-100 text-blue-600',
        T: 'bg-indigo-100 text-indigo-600',
        U: 'bg-sky-100 text-sky-600',
        V: 'bg-cyan-100 text-cyan-600',
        W: 'bg-blue-100 text-blue-600',
        X: 'bg-indigo-100 text-indigo-600',
        Y: 'bg-sky-100 text-sky-600',
        Z: 'bg-cyan-100 text-cyan-600',
      };
      return colors[char] || 'bg-gray-100 text-gray-600';
    },
    [getClientInitial]
  );

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No invoice';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Initialization
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setDisplayClients(clientData);

      // Set invoice type from initialData if editing, otherwise default to 'actual'
      if (initialData?.invoiceType) {
        setInvoiceType(initialData.invoiceType);
      } else {
        setInvoiceType('actual');
      }

      if (initialData) {
        // Pre-fill data for editing

        // Find the full client object from the list to ensure we have all details
        const targetCustomerId =
          initialData.customerId ||
          initialData.customer?.id ||
          initialData.client?.id;
        const targetClientName =
          initialData.client?.name ||
          initialData.clientName ||
          (typeof initialData.client === 'string' ? initialData.client : null) ||
          initialData.companyName ||
          '';

        const clientToSelect = clientData.find((c) => {
          const cId = getClientId(c);
          // Check ID match
          if (targetCustomerId && cId && String(cId) === String(targetCustomerId)) {
            return true;
          }

          // Fallback to Name match
          const cName = getClientName(c);
          if (
            targetClientName &&
            typeof targetClientName === 'string' &&
            cName &&
            cName.trim().toLowerCase() === targetClientName.trim().toLowerCase()
          ) {
            return true;
          }

          return false;
        });

        setSelectedClient(
          clientToSelect || initialData.customer || initialData.client
        ); // Fallback to passed customer object

        // Pre-fill products
        const products =
          initialData.items?.map((item, index) => {
            const rawDescription = item.description || '';
            const parts = rawDescription.split('||CUR:');
            const description = parts[0] || '';
            const currency = parts[1] || 'INR';
            return {
              id: item.id || `edit-${index}`,
              hsnCode: item.hsnSacCode || '',
              productName: item.particular || '',
              amount: item.amount || 0,
              description: description,
              currency: currency,
            };
          }) || [];

        setSelectedProducts(products);
        setTotalAmount(initialData.subTotal || 0); // Use subTotal from invoice

        // If initialData is present (editing or duplicating), start at Step 1
        setShowProductModal(false);
        setShowGSTModal(false);
      } else {
        // Reset for new invoice
        setSelectedClient(null);
        setSelectedProducts([]);
        setTotalAmount(0);
        setShowProductModal(false);
        setShowGSTModal(false);
      }
    }
  }, [isOpen, clientData, initialData, getClientId, getClientName]);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayClients(clientData);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase().trim();

    const filtered = clientData.filter((client) => {
      const clientName = getClientName(client).toLowerCase();
      const clientCity = (client.city || '').toLowerCase();
      const clientGST = (
        client.gst ||
        client.gstin ||
        client.gstnNumber ||
        ''
      ).toLowerCase();
      const clientMobile = (client.mobile || '').toLowerCase();
      const clientEmail = (client.email || '').toLowerCase();

      return (
        clientName.includes(lowercasedSearch) ||
        clientCity.includes(lowercasedSearch) ||
        clientGST.includes(lowercasedSearch) ||
        clientMobile.includes(lowercasedSearch) ||
        clientEmail.includes(lowercasedSearch)
      );
    });

    setDisplayClients(filtered);
  }, [searchTerm, clientData, getClientName]);

  // Handle client selection
  const handleToggleSelectClient = useCallback(
    (client) => {
      setSelectedClient((prev) =>
        getClientId(prev) === getClientId(client) ? null : client
      );
    },
    [getClientId]
  );

  // Handle next button click to open product modal
  const handleNext = useCallback(() => {
    if (selectedClient) {
      setShowProductModal(true);
    }
  }, [selectedClient]);

  // Handle invoice type change
  const handleInvoiceTypeChange = useCallback((type) => {
    setInvoiceType(type);
  }, []);

  // Handle product modal close
  const handleProductModalClose = useCallback(() => {
    setShowProductModal(false);
  }, []);

  // Handle product modal next
  const handleProductModalNext = useCallback((products, amount) => {
    setSelectedProducts(products);
    setTotalAmount(amount);
    setShowProductModal(false);
    setShowGSTModal(true);
  }, []);

  // Handle GST modal back
  const handleGSTModalBack = useCallback(() => {
    setShowGSTModal(false);
    setShowProductModal(true);
  }, []);

  // Handle GST modal create invoice - FINAL STEP
  const handleCreateInvoice = useCallback(
    async (invoiceData, keepOpen = false) => {
      // Add invoice type to the invoice data
      const finalInvoiceData = {
        ...invoiceData,
        invoiceType: invoiceType,
      };

      try {
        // Pass complete invoice data to parent
        await onSelectClient(finalInvoiceData);
        if (!keepOpen) {
          onClose();
        }
      } catch (error) {
        console.error('Failed to create invoice:', error);
        throw error;
      }
    },
    [onSelectClient, onClose, invoiceType]
  );

  // Handle flow closing
  const handleCloseFlow = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  const forceCloseFlow = useCallback(() => {
    onClose();
  }, [onClose]);

  const confirmCloseFlow = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  const modalContent = (
    <div className="flex flex-col h-full">
      {/* Header Actions: Invoice Type & Search */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm z-10 flex items-center justify-between">
        {/* Invoice Type Selection */}
        <div className="flex justify-between gap-x-5">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-semibold text-gray-900">
                Invoice Type:
              </span>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="actual"
                    checked={invoiceType === 'actual'}
                    onChange={(e) => handleInvoiceTypeChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    Actual Invoice
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="invoiceType"
                    value="proforma"
                    checked={invoiceType === 'proforma'}
                    onChange={(e) => handleInvoiceTypeChange(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                    Proforma Invoice
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-900 italic text-bold mt-0.5">
              {invoiceType === 'actual'
                ? '( Actual invoice for tax purposes )'
                : '( Pre-bill for quotation purposes )'}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="w-full max-w-sm ml-4">
          <input
            type="text"
            placeholder="Search clients by name, city, GST, mobile, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
          />
          {searchTerm && (
            <div className="mt-1 text-xs text-blue-600 font-medium ml-1">
              Found {displayClients.length} client
              {displayClients.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Client List */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {displayClients.length > 0 ? (
          <div className="space-y-4">
            {displayClients.map((client) => (
              <div
                key={getClientId(client)}
                className={`flex items-center justify-between p-3 bg-white border rounded-lg cursor-pointer transition-colors ${
                  getClientId(selectedClient) === getClientId(client)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToggleSelectClient(client)}
              >
                {/* Left side - All client details */}
                <div className="flex items-center flex-1">
                  {/* Initial & Name */}
                  <div className="flex items-center gap-4 min-w-0 w-1/5 pr-4">
                    <input
                      type="radio"
                      checked={getClientId(selectedClient) === getClientId(client)}
                      onChange={() => handleToggleSelectClient(client)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer flex-shrink-0"
                    />
                    <div
                      onClick={() => handleToggleSelectClient(client)}
                      className={`w-10 h-10 ${getAvatarColor(client)} rounded flex items-center justify-center cursor-pointer flex-shrink-0 text-sm font-bold`}
                    >
                      {getClientInitial(client)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-gray-900 truncate uppercase">
                        {getClientName(client)}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        {client.mobile || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* City */}
                  <div className="min-w-0 w-1/5 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      City
                    </div>
                    <div className="font-bold text-sm text-gray-700 truncate">
                      {client.city || '—'}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="min-w-0 w-1/5 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      Email
                    </div>
                    <div className="font-bold text-[13px] text-gray-700 truncate lowercase">
                      {client.email || '—'}
                    </div>
                  </div>

                  {/* GST */}
                  <div className="min-w-0 w-1/5 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      GST
                    </div>
                    <div className="font-bold text-sm text-gray-700 truncate">
                      {client.gst || client.gstin || client.gstnNumber || 'N/A'}
                    </div>
                  </div>

                  {/* Last Invoice */}
                  <div className="min-w-0 w-1/5 pl-2 border-l border-gray-100 flex flex-col items-center text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      Last Invoice
                    </div>
                    <div className="font-bold text-sm text-gray-700 truncate">
                      {(() => {
                        const lastInvoice = getLastInvoice(client);
                        if (!lastInvoice)
                          return <span className="text-gray-400">—</span>;
                        return (
                          <div className="flex flex-col leading-tight items-center text-center">
                            <span>{lastInvoice.invoiceNumber || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                              {formatDate(lastInvoice.invoiceDate)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-900">
              {searchTerm ? 'No clients found' : 'No clients available'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm
                ? 'Try a different search term or add a new client'
                : 'Add clients to your database to start generating invoices'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Client Selection Modal - Step 1 */}
      {showHeader ? (
        <CustomModalForm
          open={isOpen && !showProductModal && !showGSTModal}
          onClose={handleCloseFlow}
          title="Step 1: Select Client"
          widthClass="max-w-6xl"
          disableOutsideClick={true}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {displayClients.length} clients
                </span>
                {selectedClient && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold text-xs uppercase tracking-wider">
                      ✓ {getClientName(selectedClient)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase border border-gray-200">
                      {invoiceType === 'actual'
                        ? 'Actual Invoice'
                        : 'Proforma Invoice'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mr-2">
                <PrimaryButton
                  disabled={!selectedClient}
                  onClick={handleNext}
                  className="px-8 py-2 font-bold disabled:bg-gray-200 disabled:text-gray-700 disabled:cursor-not-allowed"
                >
                  Next
                </PrimaryButton>
              </div>
            </div>
          }
        >
          {modalContent}
        </CustomModalForm>
      ) : (
        <div
          style={{
            display: showProductModal || showGSTModal ? 'none' : 'block',
          }}
        >
          {modalContent}
        </div>
      )}

      {/* Product Selection Modal - Step 2 */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onBack={handleProductModalClose}
        onCloseFlow={handleCloseFlow}
        onNext={handleProductModalNext}
        selectedClient={selectedClient}
        initialProducts={selectedProducts} // Pass selectedProducts which are pre-filled from initialData
        invoiceType={invoiceType} // Pass invoice type to product modal if needed
      />

      {/* GST Calculation Modal - Step 3 (Final) */}
      <GSTCalculationModal
        isOpen={showGSTModal}
        onBack={handleGSTModalBack}
        onCloseFlow={handleCloseFlow}
        forceCloseFlow={forceCloseFlow}
        onCreateInvoice={handleCreateInvoice}
        selectedProducts={selectedProducts}
        totalAmount={totalAmount}
        selectedClient={selectedClient}
        initialData={initialData} // Pass initialData primarily for GST/Discount values
        invoiceType={invoiceType} // Pass invoice type to GST modal
        nextInvoiceNumber={nextInvoiceNumber}
      />

      {/* Confirmation dialog for closing the flow */}
      <CustomAlertForm
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseFlow}
        title="Close Invoice Creation"
        message="Are you sure you want to close the modal? Any unsaved progress will be lost."
        confirmText="Yes, Close"
        cancelText="Cancel"
      />
    </>
  );
};

export default ClientSelectionModal;
