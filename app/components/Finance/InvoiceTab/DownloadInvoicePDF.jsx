'use client';

export const handleDownloadInvoicePDF = async (
  invoiceData = null,
  letterPad = 'with'
) => {
  // Ensure browser-only execution
  if (typeof window === 'undefined') {
    console.warn('handleDownloadInvoicePDF can only run in browser');
    return;
  }

  const element = document.getElementById('invoice-preview-print');
  if (!element) {
    alert(
      'Invoice content not found. Please make sure the invoice modal is open.'
    );
    return;
  }

  try {
    // ✅ Dynamic import (fixes SSR error)
    const html2pdf = (await import('html2pdf.js')).default;

    const fileName = `Invoice_${invoiceData?.invoiceNumber || invoiceData?.client?.name || 'Invoice'}_${Date.now()}.pdf`;

    const options = {
      margin: 0,
      filename: fileName,
      image: {
        type: 'png',
        quality: 1,
      },
      html2canvas: {
        scale: 8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              /* Fallback to prevent html2canvas crashing on oklch/lab */
              border-color: rgba(229, 231, 235, 1);
            }
            #invoice-preview-print .border-gray-800 { border-color: rgb(31, 41, 55) !important; }
            #invoice-preview-print .border-gray-300 { border-color: rgb(209, 213, 219) !important; }
            #invoice-preview-print .border-b { border-bottom-color: rgb(209, 213, 219) !important; }
            #invoice-preview-print .border-t { border-top-color: rgb(209, 213, 219) !important; }
            #invoice-preview-print .border-r { border-right-color: rgb(209, 213, 219) !important; }
            #invoice-preview-print .border { border-color: rgb(209, 213, 219) !important; }
            #invoice-preview-print .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
            #invoice-preview-print .text-gray-900 { color: rgb(17, 24, 39) !important; }
            #invoice-preview-print .text-gray-800 { color: rgb(31, 41, 55) !important; }
            #invoice-preview-print .text-gray-700 { color: rgb(55, 65, 81) !important; }
            #invoice-preview-print .text-gray-600 { color: rgb(75, 85, 99) !important; }
            #invoice-preview-print .text-gray-500 { color: rgb(107, 114, 128) !important; }
            #invoice-preview-print .text-red-600 { color: rgb(220, 38, 38) !important; }
            #invoice-preview-print .text-green-600 { color: rgb(22, 163, 74) !important; }
            #invoice-preview-print .bg-white { background-color: rgb(255, 255, 255) !important; }
            #invoice-preview-print .bg-transparent { background-color: transparent !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123], // A4 exact dimensions (at 96 DPI)
        orientation: 'portrait',
        compress: false,
      },
    };

    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
};

// Helper function to generate invoice HTML with safe defaults
// const generateInvoiceHTML = (invoiceData = {}, letterPad, compData = {}) => {
//   // Provide safe defaults for all properties
//   const data = {
//     // Invoice details
//     invoiceNumber:
//       invoiceData.invoiceNumber ||
//       `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
//     date: invoiceData.date || new Date().toISOString().split('T')[0],
//     dueDate: invoiceData.dueDate,

//     // Client details
//     client: invoiceData.client || {
//       name: 'Buyers Company Name',
//       address: 'No. 8 , Round Road',
//       city: 'Dindigul',
//       gstin: '123456',
//       state: '12334456',
//     },

//     // Products
//     products: invoiceData.products || [
//       {
//         name: 'Information technology (IT) consulting and support services',
//         description: 'Web Development Services',
//         hsn: '12345',
//         price: 12345.0,
//         quantity: 1,
//       },
//     ],

//     // Financial details
//     totalAmount: invoiceData.totalAmount || 12345.0,
//     discountType: invoiceData.discountType,
//     discountValue: invoiceData.discountValue || 0,
//     discountAmount: invoiceData.discountAmount || 0,
//     subtotalAfterDiscount: invoiceData.subtotalAfterDiscount || 12345.0,
//     cgstRate: invoiceData.cgstRate || 9,
//     sgstRate: invoiceData.sgstRate || 9,
//     cgstAmount: invoiceData.cgstAmount || 1111.05,
//     sgstAmount: invoiceData.sgstAmount || 1111.05,
//     totalAmountWithGST: invoiceData.totalAmountWithGST || 14567.1,
//     amountInWords: invoiceData.amountInWords || 'INR Two Lakh Six Hundred Only',
//   };

//   // Extract client data with safe access
//   const clientName =
//     typeof data.client === 'string' ? data.client : data.client.name;
//   const clientAddress =
//     typeof data.client === 'object'
//       ? data.client.address
//       : 'No. 8 , Round Road';
//   const clientCity =
//     typeof data.client === 'object' ? data.client.city : 'Dindigul';
//   const clientGstin =
//     typeof data.client === 'object' ? data.client.gstin : '123456';
//   const clientState =
//     typeof data.client === 'object' ? data.client.state : '12334456';

//   // Helper function for number formatting
//   const formatCurrency = (amount) => {
//     const num = parseFloat(amount) || 0;
//     return num.toLocaleString('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   // Helper for calculating tax amounts
//   const calculateProductTax = (price, taxRate) => {
//     const amount = parseFloat(price) || 0;
//     const rate = parseFloat(taxRate) || 0;
//     return ((amount * rate) / 100).toFixed(2);
//   };

//   // Create a simple, clean HTML structure
//   return `
//     <div style="background: white; padding: 20px; font-family: Arial, sans-serif; width: 794px; color: black;">
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 20px;
//           background: white;
//           color: black;
//           font-size: 12px;
//           line-height: 1.4;
//         }

//         .invoice-container {
//           width: 100%;
//           max-width: 794px;
//           margin: 0 auto;
//           border: 1px solid #000;
//           background: white;
//         }

//         .invoice-header {
//           display: flex;
//           border-bottom: 1px solid #ccc;
//         }

//         .company-info {
//           width: 40%;
//           padding: 12px;
//           border-right: 1px solid #ccc;
//         }

//         .invoice-details {
//           width: 60%;
//           padding: 12px;
//         }

//         .company-name {
//           font-size: 18px;
//           font-weight: bold;
//           margin-bottom: 4px;
//           color: #111;
//         }

//         .company-address {
//           font-size: 12px;
//           color: #374151;
//           margin-bottom: 8px;
//         }

//         .section-title {
//           font-size: 12px;
//           font-weight: 600;
//           color: #1f2937;
//           margin-bottom: 4px;
//         }

//         .section-content {
//           font-size: 12px;
//           color: #374151;
//           margin-bottom: 8px;
//         }

//         .items-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 16px;
//         }

//         .items-table th {
//           background: #f9fafb;
//           padding: 4px;
//           text-align: left;
//           font-weight: 600;
//           border: 1px solid #ccc;
//           font-size: 11px;
//         }

//         .items-table td {
//           padding: 8px 4px;
//           border: 1px solid #ccc;
//           font-size: 11px;
//         }

//         .amount-in-words {
//           padding: 12px;
//           border: 1px solid #ccc;
//           border-top: none;
//           margin-bottom: 16px;
//         }

//         .tax-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 16px;
//         }

//         .tax-table th {
//           background: #f9fafb;
//           padding: 4px;
//           text-align: center;
//           font-weight: 600;
//           border: 1px solid #ccc;
//           font-size: 11px;
//         }

//         .tax-table td {
//           padding: 4px;
//           border: 1px solid #ccc;
//           font-size: 11px;
//         }

//         .footer-section {
//           padding: 0 8px;
//         }

//         .footer-columns {
//           display: flex;
//           margin-top: 36px;
//         }

//         .footer-left {
//           width: 50%;
//           padding-right: 12px;
//         }

//         .footer-right {
//           width: 50%;
//           padding-left: 12px;
//         }

//         .bold-text {
//           font-weight: 700;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .text-center {
//           text-align: center;
//         }

//         .text-green {
//           color: #16a34a;
//         }

//         .text-red {
//           color: #dc2626;
//         }
//       </style>
//       <div class="invoice-container">
//         <!-- HEADER SECTION -->
//         <div class="invoice-header">
//           <!-- Left Column - Company Info -->
//           <div class="company-info">
//             <!-- 1. LIVIK TECH and address -->
//             <div style="margin-bottom: 16px;">
//               <div class="company-name" style="text-transform: uppercase;">${compData.companyName || 'LIVIK SOFTWARE SOLUTIONS'}</div>
//               <div class="company-address">${compData.address || '9th Croas St, R.M Colony'}</div>
//               <div class="company-address">${compData.city ? `${compData.city}${compData.state ? ` - ${compData.state}` : ''}` : 'Dindigul - 624001'}</div>
//             </div>

//             <!-- 2. Buyer section -->
//             <div style="margin-bottom: 16px;">
//               <div class="section-title">Buyer ( Bill To)</div>
//               <div class="section-content">${clientName}</div>
//               <div class="section-content">${clientAddress}</div>
//               <div class="section-content">${clientCity}</div>
//             </div>

//             <!-- 4. GSTIN -->
//             <div>
//               <div class="section-content">GSTN/UIN : ${clientGstin}</div>
//               <div class="section-content">State Name : ${clientState}</div>
//             </div>
//           </div>

//           <!-- Right Column - Invoice Details -->
//           <div class="invoice-details">
//             <!-- Right side with 2 columns -->
//             <div style="display: flex;">
//               <!-- Left column of right side -->
//               <div style="width: 50%; padding-right: 16px;">
//                 <div style="display: flex; flex-direction: column; gap: 8px;">
//                   <div>
//                     <span class="section-content">Invoice No:</span>
//                     <span class="section-content" style="margin-left: 8px;">${data.invoiceNumber}</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Delivery Note :</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Reference No & Date :</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Buyer's Order No:</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Dated:</span>
//                     <span class="section-content" style="margin-left: 8px;">${data.date}</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Mode / Terms of Payment:</span>
//                   </div>
//                 </div>
//               </div>

//               <!-- Right column of right side -->
//               <div style="width: 50%;">
//                 <div style="display: flex; flex-direction: column; gap: 8px;">
//                   <div>
//                     <span class="section-content">Other Reference:</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Dispatched Doc No:</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Delivery Note Date:</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Dispatched Through</span>
//                   </div>
//                   <div>
//                     <span class="section-content">Destination:</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <!-- ITEMS TABLE -->
//         <table class="items-table">
//           <thead>
//             <tr>
//               <th style="width: 40px; text-align: center;">SNo</th>
//               <th>Particulars</th>
//               <th style="width: 96px; text-align: center;">HSN/SAC</th>
//               <th style="width: 112px; text-align: right;">Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${data.products
//               .map(
//                 (product, index) => `
//               <tr>
//                 <td style="text-align: center;">${index + 1}</td>
//                 <td>
//                   <div style="font-weight: 600; font-size: 11px;">${product.name || 'Product Name'}</div>
//                   ${product.description ? `<div style="font-size: 10px; color: #4b5563;">${product.description}</div>` : ''}
//                 </td>
//                 <td style="text-align: center;">${product.hsn || '12345'}</td>
//                 <td style="text-align: right;">₹${formatCurrency(product.price)}</td>
//               </tr>
//             `
//               )
//               .join('')}
//           </tbody>
//           <tfoot>
//             <tr style="background: #f9fafb;">
//               <td colspan="2"></td>
//               <td style="text-align: right; font-weight: 700;">Subtotal</td>
//               <td style="text-align: right; font-weight: 700;">₹${formatCurrency(data.totalAmount)}</td>
//             </tr>

//             ${
//               data.discountAmount > 0
//                 ? `
//               <tr>
//                 <td colspan="2"></td>
//                 <td style="text-align: right; font-weight: 700;">
//                   Discount ${data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}
//                 </td>
//                 <td style="text-align: right; font-weight: 700; color: #dc2626;">- ₹${formatCurrency(data.discountAmount)}</td>
//               </tr>

//               <tr style="background: #f9fafb;">
//                 <td colspan="2"></td>
//                 <td style="text-align: right; font-weight: 700;">Subtotal After Discount</td>
//                 <td style="text-align: right; font-weight: 700;">₹${formatCurrency(data.subtotalAfterDiscount)}</td>
//               </tr>
//             `
//                 : ''
//             }
//           </tfoot>
//         </table>

//         <!-- AMOUNT IN WORDS -->
//         <div class="amount-in-words">
//           <div style="font-weight: 600; font-size: 12px;">Amount Chargeable (in words)</div>
//           <div style="margin-top: 4px; font-weight: 700; font-size: 12px;">${data.amountInWords}</div>
//         </div>

//         <!-- TAX TABLE -->
//         <table class="tax-table">
//           <thead>
//             <tr>
//               <th style="width: 14.28%;">HSN/SAC</th>
//               <th style="width: 14.28%;">Taxable Value</th>
//               <th style="width: 28.56%;" colspan="2">CGST</th>
//               <th style="width: 28.56%;" colspan="2">SGST/UTGST</th>
//               <th style="width: 14.28%;">Total Tax</th>
//             </tr>
//             <tr>
//               <th></th>
//               <th></th>
//               <th style="width: 14.28%;">Rate</th>
//               <th style="width: 14.28%;">Amount</th>
//               <th style="width: 14.28%;">Rate</th>
//               <th style="width: 14.28%;">Amount</th>
//               <th></th>
//             </tr>
//           </thead>
//           <tbody>
//             ${data.products
//               .map((product, index) => {
//                 const price = parseFloat(product.price) || 0;
//                 const cgst = calculateProductTax(price, data.cgstRate);
//                 const sgst = calculateProductTax(price, data.sgstRate);
//                 const totalTax = (parseFloat(cgst) + parseFloat(sgst)).toFixed(
//                   2
//                 );

//                 return `
//                 <tr>
//                   <td style="text-align: center;">${product.hsn || '12345'}</td>
//                   <td style="text-align: right;">₹${formatCurrency(price)}</td>
//                   <td style="text-align: center;">${data.cgstRate}%</td>
//                   <td style="text-align: right;">₹${formatCurrency(cgst)}</td>
//                   <td style="text-align: center;">${data.sgstRate}%</td>
//                   <td style="text-align: right;">₹${formatCurrency(sgst)}</td>
//                   <td style="text-align: right;">₹${formatCurrency(totalTax)}</td>
//                 </tr>
//               `;
//               })
//               .join('')}
//           </tbody>
//           <tfoot>
//             <tr style="background: #f9fafb; font-weight: 700;">
//               <td style="text-align: center;">Total</td>
//               <td style="text-align: right;">₹${formatCurrency(data.subtotalAfterDiscount || data.totalAmount)}</td>
//               <td></td>
//               <td style="text-align: right;">₹${formatCurrency(data.cgstAmount)}</td>
//               <td></td>
//               <td style="text-align: right;">₹${formatCurrency(data.sgstAmount)}</td>
//               <td style="text-align: right;">₹${formatCurrency(parseFloat(data.cgstAmount) + parseFloat(data.sgstAmount))}</td>
//             </tr>
//             <tr style="font-weight: 700;">
//               <td colspan="6" style="text-align: right;">Grand Total</td>
//               <td style="text-align: right; color: #16a34a;">₹${formatCurrency(data.totalAmountWithGST)}</td>
//             </tr>
//           </tfoot>
//         </table>

//         <!-- FOOTER SECTION -->
//         <div class="footer-section">
//           <div>
//             <p style="color: #1f2937;">Tax Amount (in words) : </p>
//           </div>
//           <div class="footer-columns">
//             <!-- Left Column - Company Info -->
//             <div class="footer-left">
//               <p style="color: #1f2937;">Company's PAN : ${compData.panNumber || '1234567'}</p>
//               <p style="margin-top: 12px; font-weight: 600;">Declaration</p>
//               <p style="color: #1f2937;">Terms: Client will Pay the Transaction fee.</p>
//             </div>

//             <!-- Right Column - Bank Details -->
//             <div class="footer-right">
//               <p style="font-weight: 700; margin-bottom: 4px;">Company's Bank</p>
//               <p style="color: #1f2937;">A/c Holder's Name : ${compData.accountHolderName || 'Livik Software Solutions'}</p>
//               <p style="color: #1f2937;">Bank Name : ${compData.bankName || 'Bank Name'}</p>
//               <p style="color: #1f2937;">A/c No : ${compData.accountNumber || '1234567891011'}</p>
//               <p style="color: #1f2937;">Branch & IFSC : ${compData.ifscCode || '123456'}</p>
//               <p style="color: #1f2937;">SWIFT Code : ${compData.swiftCode || '123445567'}</p>
//               <p style="margin-top: 45px; text-align: right; margin-bottom: 20px; margin-right: 36px;">Authorised Signatory</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   `;
// };
