import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MessageAndModuleSelection from './MessageAndModuleSelection';
import QuotationTermsModal from './QuotationTermsModal';
import { X } from 'lucide-react';
import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../CustomAlertForm';

const QuotationModal = ({
  isOpen,
  onClose,
  onSelectClient, // Called with the FINAL quotation data
  clients = [],
  initialData = null, // For editing
  showHeader = true,
  nextQuotationNumber,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [displayClients, setDisplayClients] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [subject, setSubject] = useState('');
  const [greeting, setGreeting] = useState('');
  const [items, setItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);

  const clientData = useMemo(() => clients, [clients]);

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
    (client) => getClientName(client).charAt(0).toUpperCase(),
    [getClientName]
  );

  const getAvatarColor = useCallback(
    (client) => {
      const char = getClientInitial(client);
      const colors = {
        A: 'bg-blue-100 text-blue-600',
        B: 'bg-indigo-100 text-indigo-600',
        C: 'bg-sky-100 text-sky-600',
        D: 'bg-cyan-100 text-cyan-600',
      };
      return colors[char] || 'bg-gray-100 text-gray-600';
    },
    [getClientInitial]
  );

  // Initialization
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setDisplayClients(clientData);

      if (initialData) {
        const targetCustomerId =
          initialData.customerId || initialData.customer?.id;
        const targetClientName =
          initialData.client?.name ||
          (typeof initialData.client === 'string' ? initialData.client : null) ||
          '';

        const clientToSelect = clientData.find((c) => {
          const cId = getClientId(c);
          if (
            targetCustomerId &&
            cId &&
            String(cId) === String(targetCustomerId)
          ) {
            return true;
          }
          const cName = getClientName(c);
          return (
            targetClientName &&
            cName &&
            cName.trim().toLowerCase() === targetClientName.trim().toLowerCase()
          );
        });

        setSelectedClient(clientToSelect || initialData.customer || null);
        setSubject(initialData.subject || '');
        setGreeting(initialData.greeting || '');

        const initItems = (initialData.items || []).map((item, index) => ({
          id: item.id || `edit-${index}`,
          serialNumber: item.serialNumber ?? index + 1,
          moduleName: item.moduleName || '',
          amount: Number(item.amount || 0),
        }));
        setItems(initItems);
        setSubTotal(Number(initialData.subTotal || 0));

        setShowModuleModal(false);
        setShowTermsModal(false);
      } else {
        setSelectedClient(null);
        setSubject('');
        setGreeting('');
        setItems([]);
        setSubTotal(0);
        setShowModuleModal(false);
        setShowTermsModal(false);
      }
    }
  }, [isOpen, clientData, initialData, getClientId, getClientName]);

  // Filter clients
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayClients(clientData);
      return;
    }
    const lowered = searchTerm.toLowerCase().trim();
    setDisplayClients(
      clientData.filter((client) => {
        const name = getClientName(client).toLowerCase();
        const city = (client.city || '').toLowerCase();
        const gst = (
          client.gst ||
          client.gstin ||
          client.gstnNumber ||
          ''
        ).toLowerCase();
        const mobile = (client.mobile || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        return (
          name.includes(lowered) ||
          city.includes(lowered) ||
          gst.includes(lowered) ||
          mobile.includes(lowered) ||
          email.includes(lowered)
        );
      })
    );
  }, [searchTerm, clientData, getClientName]);

  const handleToggleSelectClient = useCallback(
    (client) => {
      setSelectedClient((prev) =>
        getClientId(prev) === getClientId(client) ? null : client
      );
    },
    [getClientId]
  );

  const handleNext = useCallback(() => {
    if (selectedClient) setShowModuleModal(true);
  }, [selectedClient]);

  const handleModuleModalClose = useCallback(() => {
    setShowModuleModal(false);
  }, []);

  const handleModuleModalNext = useCallback(
    (subjectVal, greetingVal, itemsVal, subTotalVal) => {
      setSubject(subjectVal);
      setGreeting(greetingVal);
      setItems(itemsVal);
      setSubTotal(subTotalVal);
      setShowModuleModal(false);
      setShowTermsModal(true);
    },
    []
  );

  const handleTermsModalBack = useCallback(() => {
    setShowTermsModal(false);
    setShowModuleModal(true);
  }, []);

  const handleCreateQuotation = useCallback(
    async (quotationData) => {
      try {
        await onSelectClient(quotationData);
        onClose();
      } catch (error) {
        console.error('Failed to create quotation:', error);
        throw error;
      }
    },
    [onSelectClient, onClose]
  );

  const handleCloseFlow = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  const confirmCloseFlow = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  const modalContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm z-10 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          Select Client
        </span>
        <div className="w-full max-w-sm ml-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients by name, city, GST, mobile, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none pr-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {displayClients.length > 0 ? (
          <div className="space-y-3">
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
                <div className="flex items-center flex-1">
                  <div className="flex items-center gap-4 min-w-0 w-1/4 pr-4">
                    <input
                      type="radio"
                      checked={getClientId(selectedClient) === getClientId(client)}
                      onChange={() => handleToggleSelectClient(client)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer flex-shrink-0"
                    />
                    <div
                      className={`w-10 h-10 ${getAvatarColor(client)} rounded flex items-center justify-center flex-shrink-0 text-sm font-bold`}
                    >
                      {getClientInitial(client)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-gray-900 truncate uppercase">
                        {getClientName(client)}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {client.mobile || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 w-1/4 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      City
                    </div>
                    <div className="font-bold text-sm text-gray-700 truncate">
                      {client.city || '—'}
                    </div>
                  </div>

                  <div className="min-w-0 w-1/4 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      Email
                    </div>
                    <div className="font-bold text-[13px] text-gray-700 truncate lowercase">
                      {client.email || '—'}
                    </div>
                  </div>

                  <div className="min-w-0 w-1/4 px-2 border-l border-gray-100 text-center">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">
                      GST
                    </div>
                    <div className="font-bold text-sm text-gray-700 truncate">
                      {client.gst || client.gstin || client.gstnNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-100">
            <p className="text-base font-bold text-gray-900">
              {searchTerm ? 'No clients found' : 'No clients available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {showHeader ? (
        <CustomModalForm
          open={isOpen && !showModuleModal && !showTermsModal}
          onClose={handleCloseFlow}
          title="Step 1: Select Client"
          widthClass="max-w-6xl"
          disableOutsideClick={true}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500">
                {displayClients.length} clients
              </span>
              <PrimaryButton
                disabled={!selectedClient}
                onClick={handleNext}
                className="px-8 py-2 font-bold disabled:bg-gray-200 disabled:text-gray-700 disabled:cursor-not-allowed"
              >
                Next
              </PrimaryButton>
            </div>
          }
        >
          {modalContent}
        </CustomModalForm>
      ) : (
        <div
          style={{ display: showModuleModal || showTermsModal ? 'none' : 'block' }}
        >
          {modalContent}
        </div>
      )}

      <MessageAndModuleSelection
        isOpen={showModuleModal}
        onBack={handleModuleModalClose}
        onCloseFlow={handleCloseFlow}
        onNext={handleModuleModalNext}
        selectedClient={selectedClient}
        initialSubject={subject}
        initialGreeting={greeting}
        initialItems={items}
      />

      <QuotationTermsModal
        isOpen={showTermsModal}
        onBack={handleTermsModalBack}
        onCloseFlow={handleCloseFlow}
        onCreateQuotation={handleCreateQuotation}
        selectedClient={selectedClient}
        subject={subject}
        greeting={greeting}
        items={items}
        subTotal={subTotal}
        initialData={initialData}
        nextQuotationNumber={nextQuotationNumber}
      />

      <CustomAlertForm
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseFlow}
        title="Close Quotation Creation"
        message="Are you sure you want to close the modal? Any unsaved progress will be lost."
        confirmText="Yes, Close"
        cancelText="Cancel"
      />
    </>
  );
};

export default QuotationModal;
