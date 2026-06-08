// In your PrintForm.js
'use client';

export const handlePrint = (type = 'offerLetter') => {
  let printContent;
  let htmlContent = '';

  if (type === 'payslip') {
    printContent = document.getElementById('payslip-print');
    if (!printContent) {
      // Try to find it in the payslip modal
      const modal = document.querySelector('[ref*="payslipModalRef"]');
      if (modal) {
        printContent = modal.querySelector('#payslip-print');
      }
    }
    if (!printContent) {
      alert('Payslip not found');
      return;
    }
  } else if (type === 'invoice') {
    printContent = document.getElementById('invoice-preview-print');
    if (!printContent) {
      alert('Invoice not found');
      return;
    }
  } else {
    // Attempt to find element by type-based ID (e.g. warningLetter -> warning-letter-print)
    const canonicalId = type;
    const kebab = canonicalId.replace(/([A-Z])/g, '-$1').toLowerCase();
    const expectedId = `${kebab}-print`;
    printContent = document.getElementById(expectedId);

    if (!printContent) {
      // Fallback checklist of all possible letter container IDs
      const printIds = [
        'offer-letter-print',
        'warning-letter-print',
        'termination-letter-print',
        'appointment-letter-print',
        'experience-letter-print',
        'relieving-letter-print',
      ];
      for (const id of printIds) {
        printContent = document.getElementById(id);
        if (printContent) break;
      }
    }

    if (!printContent) {
      // Try to find it in the modal
      const modal = document.querySelector('[ref*="modalRef"]');
      if (modal) {
        printContent = modal.querySelector('#offer-letter-print');
      }
    }

    if (!printContent) {
      alert('Letter content not found');
      return;
    }
  }

  // Clone the element to avoid any parent issues
  const clonedContent = printContent.cloneNode(true);

  const printWindow = window.open(
    '',
    '_blank',
    'width=900,height=650,scrollbars=yes'
  );

  printWindow.document.write(`
    <html>
      <head>
        <title>${type === 'offerLetter' ? 'Offer Letter' : type === 'payslip' ? 'Payslip' : 'Invoice'}</title>
        <!-- Tailwind CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #print-content {
            width: 794px;
            min-height: 1123px;
            margin: 0 auto;
          }
          .pdf-safe {
            width: 794px !important;
            min-height: 1123px !important;
          }
        </style>
      </head>
      <body>
        <div id="print-content">
          ${clonedContent.outerHTML}
        </div>
        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};
