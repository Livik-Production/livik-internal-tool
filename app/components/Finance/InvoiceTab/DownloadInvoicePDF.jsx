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

    // ✅ Ensure all fonts and images are fully stabilized before capturing
    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 500));

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

            /* Reset margins that html2canvas erroneously applies during clone */
            #invoice-preview-print h1,
            #invoice-preview-print h2,
            #invoice-preview-print h3,
            #invoice-preview-print p {
              margin: 0 !important;
              padding: 0 !important;
            }

            /* 1. Force table headers to align flawlessly in html2canvas (avoiding flex bugs) */
            #invoice-preview-print .flex.border-b.h-8 > div {
              display: block !important;
              padding-top: 4px !important;
              text-align: center !important;
              height: 28px !important;
            }

            #invoice-preview-print .flex.border-b.h-8 > div > div {
              display: block !important;
              text-align: center !important;
              width: 100% !important;
              margin: 0 !important;
            }

            /* 2. Micro-adjust logo alignment to sit perfectly straight with the company text */
            #invoice-preview-print img[alt="Livik Logo"] {
              margin-top: 0px !important;
              transform: translateY(3.5px) !important;
              margin-bottom: 2px !important;
              line-height: 1.5;
            }

            /* 3. Adjust spacing around the company details section */
            #invoice-preview-print .p-1\\.5.border-b.border-\\[\\#1f2937\\] {
              padding-top: 2px !important;
              padding-bottom: 12px !important; /* Adds space at the bottom of the section */
            }

            /* 4. Add line spacing between company address lines */
            #invoice-preview-print .space-y-1 p {
              margin-bottom: 3px !important;
            }

            /* 5. Add specific 0.5 (2px) gap below the company name heading */
            #invoice-preview-print .space-y-1 h1 {
              margin-bottom: 2px !important;
            }

            /* 6. Replicate exact spacing for Buyer (Bill to) section */
            #invoice-preview-print .space-y-0\\.5 > p:first-child {
              margin-bottom: 2px !important; /* Gap below "Buyer (Bill to)" */
            }
            #invoice-preview-print .space-y-0\\.5 > h2 {
              margin-bottom: 6px !important; /* Gap below Buyer Name */
            }
            #invoice-preview-print .space-y-0\\.5 > p.break-words {
              margin-bottom: 3px !important; /* Gap between address lines */
            }
            #invoice-preview-print .space-y-0\\.5 > div.mt-1 {
              margin-top: 4px !important; /* Gap above GSTIN section */
            }
            #invoice-preview-print .space-y-0\\.5 > div.mt-1 p {
              margin-bottom: 3px !important; /* Gap between GSTIN and State */
            }

            /* 7. Fix Tax Table Vertical Alignment (avoid html2canvas flex bugs) */
            /* Force all flex cells to align-top, then push text down with precise padding to perfectly center it without breaking horizontal layout */
           
            /* Main Headers */
            #invoice-preview-print .border-t-0.bg-transparent > div:first-child > .flex > div.min-h-\\[40px\\],
            #invoice-preview-print .border-t-0.bg-transparent > div:first-child > .flex > div.w-24,
            #invoice-preview-print .border-t-0.bg-transparent > div:first-child > .flex > div.w-28 {
              align-items: flex-start !important;
              padding-top: 12px !important;
            }
           
            /* CGST/SGST/IGST nested headers */
            #invoice-preview-print .border-t-0.bg-transparent > div:first-child > .flex > div.w-32 > div.flex-1 {
              align-items: flex-start !important;
              padding-top: 3px !important;
            }
            #invoice-preview-print .border-t-0.bg-transparent > div:first-child > .flex > div.w-32 > div.flex > div {
              align-items: flex-start !important;
              padding-top: 3px !important;
            }
           
            /* Tax Table Data Rows & Totals */
            #invoice-preview-print .border-t-0.bg-transparent > div > .min-h-\\[30px\\] > div {
              align-items: flex-start !important;
              padding-top: 7px !important;
            }
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
