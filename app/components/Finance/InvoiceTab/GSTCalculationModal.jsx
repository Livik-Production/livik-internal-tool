import React, { useState, useEffect } from 'react';
import PreviewForm from './PreviewForm';
import {
  DownloadIcon,
  MailCheckIcon,
  Printer,
  SquareXIcon,
  CheckCircle,
  X,
} from 'lucide-react';

import Button from '../../Buttons/Button';
import PrimaryButton from '../../Buttons/PrimaryButton';
import CloseButton from '../../Buttons/CloseButton';
import IconButton from '../../Buttons/IconButton';
import CustomModalForm from '../../CustomModalForm';
import CustomAlertForm from '../../CustomAlertForm';

const GSTCalculationModal = ({
  isOpen,
  onBack,
  onCloseFlow,
  forceCloseFlow,
  onCreateInvoice,
  selectedProducts = [],
  totalAmount = 0,
  selectedClient,
  initialData, // New prop
  invoiceType,
  showHeader = true,
  nextInvoiceNumber,
}) => {
  const [cgstRate, setCgstRate] = useState(2);
  const [sgstRate, setSgstRate] = useState(2);
  const [discountType, setDiscountType] = useState('percentage'); // "percentage" or "fixed"
  const [discountValue, setDiscountValue] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [subtotalAfterDiscount, setSubtotalAfterDiscount] = useState(0);
  const [totalAmountWithGST, setTotalAmountWithGST] = useState(0);
  const [cgstAmount, setCgstAmount] = useState(0);
  const [sgstAmount, setSgstAmount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');

  const primaryCurrency = selectedProducts?.[0]?.currency || 'INR';

  const CURRENCIES = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AED', symbol: 'د.إ' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'JPY', symbol: '¥' },
  ];

  const getCurrencySymbol = (code) =>
    CURRENCIES.find((c) => c.code === code)?.symbol || '₹';

  const currencySymbol = getCurrencySymbol(primaryCurrency);

  const formatCurrency = (amount, currencyCode = primaryCurrency) => {
    const num = parseFloat(amount) || 0;
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
    }).format(num);
  };

  // Initialize from initialData if present
  useEffect(() => {
    if (initialData) {
      if (initialData.taxPercent !== undefined) {
        const rate = Number(initialData.taxPercent) / 2;
        setCgstRate(rate);
        setSgstRate(rate);
      }

      if (initialData.discountPercent !== undefined) {
        setDiscountType('percentage');
        setDiscountValue(Number(initialData.discountPercent));
      }

      if (initialData.notes !== undefined) {
        setNotes(initialData.notes || '');
      }
    }
  }, [initialData]);

  // Calculate all amounts whenever rates, total amount, or discount changes
  useEffect(() => {
    if (totalAmount > 0) {
      // Calculate discount amount
      let discount = 0;
      if (discountType === 'percentage') {
        discount = (totalAmount * discountValue) / 100;
      } else {
        discount = Math.min(discountValue, totalAmount); // Ensure discount doesn't exceed total
      }

      const subtotalAfterDisc = totalAmount - discount;
      const cgst = (subtotalAfterDisc * cgstRate) / 100;
      const sgst = (subtotalAfterDisc * sgstRate) / 100;
      const totalWithGST = subtotalAfterDisc + cgst + sgst;

      setDiscountAmount(discount);
      setSubtotalAfterDiscount(subtotalAfterDisc);
      setCgstAmount(cgst);
      setSgstAmount(sgst);
      setTotalAmountWithGST(totalWithGST);
    }
  }, [totalAmount, cgstRate, sgstRate, discountValue, discountType]);

  const handleCgstRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setCgstRate(value);
  };

  const handleSgstRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setSgstRate(value);
  };

  const handleDiscountTypeChange = (e) => {
    setDiscountType(e.target.value);
    setDiscountValue(0); // Reset discount value when type changes
  };

  const handleDiscountValueChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscountValue(value);
  };

  const handleDownloadClick = async () => {
    // Generate a proper invoice number
    const invoiceNumber =
      initialData?.invoiceNumber ||
      nextInvoiceNumber ||
      `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const currentDate =
      initialData?.date || new Date().toISOString().split('T')[0];

    // Prepare invoice data using available state variables
    const invoiceData = {
      invoiceNumber: invoiceNumber,
      date: currentDate,
      client: {
        name: selectedClient?.name || 'Client Name',
        address: selectedClient?.address || 'No. 8 , Round Road',
        city: selectedClient?.city || 'Dindigul',
        gst:
          selectedClient?.gstnNumber ||
          selectedClient?.gst ||
          selectedClient?.gstin ||
          '',
        cin: selectedClient?.cinNumber || selectedClient?.cin || '',
        state: selectedClient?.state || 'Tamil Nadu',
      },
      products: selectedProducts.map((product, index) => ({
        name: product.productName || product.name || `Product ${index + 1}`,
        description: product.description || product.name || '',
        hsn: product.hsnCode || product.hsn || '12345',
        price: product.amount || product.price || 0,
        quantity: product.quantity || 1,
        currency: product.currency || 'INR',
      })),
      totalAmount: totalAmount || 0,
      discountType: discountType,
      discountValue: discountValue || 0,
      discountAmount: discountAmount || 0,
      subtotalAfterDiscount: subtotalAfterDiscount || totalAmount || 0,
      cgstRate: cgstRate || 0,
      sgstRate: sgstRate || 0,
      cgstAmount: cgstAmount || 0,
      sgstAmount: sgstAmount || 0,
      totalAmountWithGST: totalAmountWithGST || 0,
      amountInWords: convertToWords(totalAmountWithGST || 0, primaryCurrency),
      notes: notes || '', // Add notes to invoice data
      invoiceType: invoiceType,
    };

    await handleDownloadInvoicePDF(invoiceData);
  };

  const handleCreateInvoice = async () => {
    const invoiceData = {
      client: selectedClient,
      products: selectedProducts,
      totalAmount,
      discountType,
      discountValue,
      discountAmount,
      subtotalAfterDiscount,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      totalAmountWithGST,
      notes: notes, // Add notes to invoice data
      invoiceType: invoiceType,
    };

    setIsSaving(true);
    try {
      await onCreateInvoice(invoiceData, false); // keepOpen = false, it will close
      setShowPreview(false); // Close preview
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded border border-gray-100 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                Subtotal
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-white p-5 rounded border border-gray-100 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-bold text-red-400 mb-2">
                Discount
              </p>
              <p className="text-2xl font-bold text-red-500">
                - {formatCurrency(discountAmount)}
              </p>
            </div>
            <div className="bg-white p-5 rounded border border-gray-100 shadow-sm">
              <p className="text-[11px] uppercase tracking-wider font-bold text-green-500 mb-2">
                Final Total
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAmountWithGST)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discount Section */}
            <div className="bg-white p-6 rounded border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <h4 className="text-lg font-bold text-gray-800">Discount</h4>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-3">
                    Discount Type
                  </label>
                  <div className="flex gap-6">
                    {['percentage', 'fixed'].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          value={type}
                          checked={discountType === type}
                          onChange={handleDiscountTypeChange}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                          {type === 'percentage'
                            ? 'Percentage (%)'
                            : `Fixed Amount (${currencySymbol})`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-3">
                    Discount{' '}
                    {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={handleDiscountValueChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50/30"
                    placeholder={
                      discountType === 'percentage'
                        ? '0%'
                        : `${currencySymbol} 0.00`
                    }
                  />
                </div>
              </div>
            </div>

            {/* GST Rates */}
            <div className="bg-white p-6 rounded border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <h4 className="text-lg font-bold text-gray-800">GST Rates</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-3">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={cgstRate}
                    onChange={handleCgstRateChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50/30"
                  />
                  <p className="text-xs text-blue-500 mt-2 font-bold">
                    Tax: {formatCurrency(cgstAmount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-3">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={sgstRate}
                    onChange={handleSgstRateChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 bg-gray-50/30"
                  />
                  <p className="text-xs text-green-500 mt-2 font-bold">
                    Tax: {formatCurrency(sgstAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
              Additional Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm text-gray-700 resize-none"
              placeholder="Terms and conditions, payment details, etc..."
              maxLength="500"
            />
            <div className="flex justify-end mt-2">
              <span
                className={`text-[10px] font-bold ${notes.length > 450 ? 'text-red-400' : 'text-gray-300'}`}
              >
                {notes.length}/500
              </span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-4 rounded border border-gray-200">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Calculation Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                <span>Items Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-red-500">
                  <span>
                    Discount{' '}
                    {discountType === 'percentage' ? `(${discountValue}%)` : ''}
                  </span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-blue-600 py-2 border-y border-gray-50">
                <span>Subtotal After Discount</span>
                <span>{formatCurrency(subtotalAfterDiscount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                <span>Tax Breakdown (CGST + SGST)</span>
                <span>{formatCurrency(cgstAmount + sgstAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Total Payable Amount
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(totalAmountWithGST)}
                </span>
              </div>
            </div>
          </div>
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
          title="Step 3: GST Calculation"
          widthClass="max-w-4xl"
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg shadow-none flex items-center gap-2"
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
                onClick={() => setShowPreview(true)}
                className="px-8 py-2 !bg-[#004d7a] shadow-none font-bold"
              >
                Preview Invoice
              </PrimaryButton>
            </div>
          }
        >
          {modalContent}
        </CustomModalForm>
      ) : (
        <div className="h-full">{modalContent}</div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <CustomModalForm
          open={showPreview}
          onClose={() => {
            if (onCloseFlow) onCloseFlow();
          }}
          title={
            <span className="text-2xl">{`Invoice Preview — ${initialData?.invoiceNumber || nextInvoiceNumber || 'New Invoice'}`}</span>
          }
          widthClass="max-w-[1000px]"
          headerActions={null}
          disableOutsideClick={true}
          footer={
            <div className="flex justify-end space-x-3 w-full items-center text-sm font-medium">
              <Button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-none flex items-center gap-2 font-bold"
              >
                Back
              </Button>
              <PrimaryButton
                onClick={handleCreateInvoice}
                disabled={isSaving}
                className="px-6 py-2 !bg-[#004d7a] shadow-none rounded-md text-white font-semibold flex items-center gap-2 font-bold"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </PrimaryButton>
            </div>
          }
        >
          <div className="w-full no-scrollbar relative bg-white">
            <div className="bg-white w-full p-0 printable">
              <PreviewForm
                invoiceData={{
                  client: selectedClient,
                  products: selectedProducts.map((p, index) => ({
                    name: p.productName || p.name || `Product ${index + 1}`,
                    description: p.description || '',
                    hsn: p.hsnCode || p.hsn || '12345',
                    price: p.amount || p.price || 0,
                    quantity: p.quantity || 1,
                    currency: p.currency || 'INR',
                  })),
                  totalAmount: totalAmount,
                  discountType: discountType,
                  discountValue: discountValue,
                  discountAmount: discountAmount,
                  subtotalAfterDiscount: subtotalAfterDiscount,
                  cgstRate: cgstRate,
                  sgstRate: sgstRate,
                  cgstAmount: cgstAmount,
                  sgstAmount: sgstAmount,
                  totalAmountWithGST: totalAmountWithGST,
                  notes: notes,
                  date:
                    initialData?.date || new Date().toISOString().split('T')[0],
                  invoiceNumber:
                    initialData?.invoiceNumber ||
                    nextInvoiceNumber ||
                    `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                  invoiceType: invoiceType,
                }}
              />
            </div>
          </div>
        </CustomModalForm>
      )}
    </>
  );
};

const convertToWords = (num, currencyCode = 'INR') => {
  if (num === 0) return 'Zero';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
      );
    return (
      ones[Math.floor(n / 100)] +
      ' Hundred' +
      (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
    );
  };

  const convert = (n) => {
    if (n === 0) return '';
    if (n < 1000) return convertLessThanThousand(n);
    if (n < 100000)
      return (
        convertLessThanThousand(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + convertLessThanThousand(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        convertLessThanThousand(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + convert(Math.floor(n % 100000)) : '')
      );
    return (
      convertLessThanThousand(Math.floor(n / 10000000)) +
      ' Crore' +
      (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '')
    );
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = `${currencyCode} ${convert(rupees)}`;
  if (paise > 0) {
    result += ` and ${convert(paise)} Paise`;
  }
  result += ' Only';

  return result;
};

export default GSTCalculationModal;
