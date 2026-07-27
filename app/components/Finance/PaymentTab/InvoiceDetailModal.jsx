import React from 'react';
import { SquarePen, X } from 'lucide-react';
import CustomTable from '../../CustomTable';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import CustomModalForm from '../../CustomModalForm';

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onUpdatePayment,
  showLoading,
}) {
  const formatCurrency = (amount) => {
    return `$${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getClientCity = (invoice) => {
    return (
      invoice.clientCity ||
      invoice.customer?.city ||
      invoice.city ||
      'Not specified'
    );
  };

  const getClientMobile = (invoice) => {
    return (
      invoice.clientMobile ||
      invoice.customer?.mobile ||
      invoice.mobile ||
      invoice.phone ||
      'Not specified'
    );
  };

  const getInvoiceParticulars = (invoice) => {
    if (
      invoice.items &&
      Array.isArray(invoice.items) &&
      invoice.items.length > 0
    ) {
      return invoice.items.map((item) => ({
        ...item,
        particulars:
          item.particular || item.particulars || item.productName || 'Item',
        hsnSacCode: item.hsnSacCode || item.hsnCode || '-',
      }));
    }

    if (invoice.particulars && Array.isArray(invoice.particulars)) {
      return invoice.particulars;
    }

    return [
      {
        id: 1,
        serialNumber: 1,
        particulars: invoice.description || 'Service/Product',
        hsnSacCode: invoice.hsnSacCode || '-',
        amount: invoice.amount || invoice.totalAmount,
      },
    ];
  };

  const calculateTotalAmount = (invoice) => {
    const particulars = getInvoiceParticulars(invoice);
    return particulars.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
  };

  return (
    <CustomModalForm
      open={true}
      onClose={onClose}
      title={invoice.client || invoice.customer?.name || 'Unknown Client'}
      widthClass="max-w-5xl"
    >
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center justify-between m-2">
              <div className="flex items-center gap-6 text-sm text-gray-600 ml-4">
                <div className="flex items-center gap-1 font-bold">
                  <span>{getClientCity(invoice)}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>{getClientMobile(invoice)}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>{formatDate(invoice.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-120px)] no-scroll">
        <div className="p-3">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Items
            </h3>
            <CustomTable
              columns={[
                {
                  key: 'serialNumber',
                  label: 'S.No',
                  render: (item, index) => item.serialNumber || index + 1,
                },
                {
                  key: 'particulars',
                  label: 'Particulars',
                  render: (item) => item.particulars,
                },
                {
                  key: 'hsnSacCode',
                  label: 'HSN/SAC Code',
                  render: (item) => item.hsnSacCode,
                },
                {
                  key: 'amount',
                  label: 'Amount (₹)',
                  className: 'text-right',
                  render: (item) => item.amount,
                },
              ]}
              data={getInvoiceParticulars(invoice)}
              rowKey={(item, index) => item.id || index}
              maxHeight="40vh"
              smartAlignment={true}
            />
            <div className="mt-4 border-t border-gray-200">
              <table className="min-w-full">
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 w-full">
                      Subtotal:
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900 min-w-[120px]">
                      ₹{calculateTotalAmount(invoice)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      Tax ({invoice.taxRate || 10}%):
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      ₹{invoice.tax?.toFixed(2) || 0}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-200">
                    <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                      Total Amount:
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-lg font-bold text-gray-900">
                      ₹{invoice.totalAmount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end items-center mb-4">
              {(invoice.paymentStatus === 'pending' ||
                invoice.paymentStatus === 'partial') && (
                <PrimaryButton
                  onClick={onUpdatePayment}
                  className="flex items-center justify-center gap-2 min-w-[150px]"
                  disabled={showLoading}
                >
                  {showLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <SquarePen size={16} />
                      Update Payment
                    </>
                  )}
                </PrimaryButton>
              )}
            </div>

            <div
              className={`rounded-lg p-6 ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-green-50 border border-green-200'
                  : invoice.paymentStatus === 'partial'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-4 h-4 rounded-full mr-3 ${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-green-500'
                      : invoice.paymentStatus === 'partial'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                  }`}
                ></div>
                <h4
                  className={`text-lg font-semibold ${
                    invoice.paymentStatus === 'paid'
                      ? 'text-green-800'
                      : invoice.paymentStatus === 'partial'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                  }`}
                >
                  {invoice.paymentStatus === 'paid'
                    ? 'Payment Completed'
                    : invoice.paymentStatus === 'partial'
                      ? 'Partial Payment'
                      : 'Payment Pending'}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {invoice.paymentMethod || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Reference Number
                  </p>
                  <p className="font-medium text-gray-900 font-mono text-sm">
                    {invoice.referenceNumber || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {invoice.paymentStatus === 'paid' ||
                    invoice.paymentStatus === 'partial'
                      ? 'Payment Date'
                      : 'Due Date'}
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDate(
                      invoice.paymentStatus === 'paid' ||
                        invoice.paymentStatus === 'partial'
                        ? invoice.paymentDate
                        : invoice.dueDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {invoice.paymentStatus === 'paid'
                      ? 'Amount Paid'
                      : invoice.paymentStatus === 'partial'
                        ? 'Amount Paid'
                        : 'Amount Due'}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      invoice.paymentStatus === 'paid'
                        ? 'text-green-700'
                        : invoice.paymentStatus === 'partial'
                          ? 'text-gray-900'
                          : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(
                      invoice.paymentStatus === 'paid'
                        ? invoice.totalAmount
                        : invoice.paymentStatus === 'partial'
                          ? invoice.partialAmount || 0
                          : invoice.totalAmount
                    )}
                  </p>
                  {invoice.paymentStatus === 'partial' && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">
                        Remaining Balance
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        ₹{invoice.remainingAmount || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomModalForm>
  );
}
