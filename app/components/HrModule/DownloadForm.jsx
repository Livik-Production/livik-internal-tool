// components/HrModule.jsx/OfferLetterTab/DownloadForm.jsx
'use client';

// Offer Letter PDF Download
export const handleDownloadPDF = async (selectedEmployee, letterPadOption) => {
  if (!selectedEmployee) {
    alert('Please select an employee first');
    return;
  }

  // Ensure browser-only execution
  if (typeof window === 'undefined') return;

  const element = document.getElementById('offer-letter-print');

  if (!element) {
    alert('Offer letter content not found');
    return;
  }

  try {
    // ✅ Dynamic import (fixes SSR error)
    const html2pdf = (await import('html2pdf.js')).default;

    const fileName = `Offer_Letter_${selectedEmployee.name.replace(
      /\s+/g,
      '_'
    )}.pdf`;

    const options = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123], // A4 exact
        orientation: 'portrait',
      },
    };

    html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('Error downloading offer letter PDF:', error);
    alert('Failed to download offer letter. Please try again.');
  }
};

// Payslip PDF Download
export const handleDownloadPayslipPDF = async (
  selectedEmployee,
  letterPadOption
) => {
  if (!selectedEmployee) {
    alert('Please select an employee first');
    return;
  }

  // Ensure browser-only execution
  if (typeof window === 'undefined') return;

  const element = document.getElementById('payslip-print');

  if (!element) {
    alert(
      'Payslip content not found. Please make sure the payslip modal is open.'
    );
    return;
  }

  try {
    // ✅ Dynamic import (fixes SSR error)
    const html2pdf = (await import('html2pdf.js')).default;

    // Get current month and year for filename
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();

    const fileName = `Payslip_${selectedEmployee.name.replace(
      /\s+/g,
      '_'
    )}_${month}_${year}.pdf`;

    const options = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
      },
      jsPDF: {
        unit: 'px',
        format: [794, 1123], // A4 exact
        orientation: 'portrait',
      },
    };

    html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('Error downloading payslip PDF:', error);
    alert('Failed to download payslip. Please try again.');
  }
};
