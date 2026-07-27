// components/HrModule.jsx/OfferLetterTab/EmailForm.jsx
'use client';

// Offer Letter Email
export const handleSendEmail = (selectedEmployee, letterContent) => {
  if (!selectedEmployee) {
    alert('Please select an employee first');
    return;
  }

  const employeeEmail = selectedEmployee.email;
  const employeeName = selectedEmployee.name;
  const hrEmail = 'hr@liviktech.com'; // Updated to Livik Technologies
  const today = new Date().toLocaleDateString();

  // Email subject
  const subject = `Job Offer - ${letterContent.position} - Livik Technologies`;

  // Email body
  const emailBody = `
Dear ${employeeName},

CONGRATULATIONS!

We are delighted to offer you the position of ${letterContent.position} at Livik Technologies. 
Please find the details of your offer below:

POSITION: ${letterContent.position}
START DATE: ${letterContent.startDate}
COMPENSATION: ${letterContent.salary}
REPORTING TO: ${letterContent.reportingTo}
OFFER VALID UNTIL: ${letterContent.responseDate}

EMPLOYEE INFORMATION:
Name: ${employeeName}
Employee ID: ${selectedEmployee.id}
Email: ${employeeEmail}
Phone: ${selectedEmployee.phone}

The formal offer letter is attached to this email. Please:
1. Review the offer letter carefully
2. Sign and return it by ${letterContent.responseDate}
3. Contact HR for any clarifications

We are excited about the possibility of you joining our team and contributing to our success.

Warm regards,

HR Manager
Livik Technologies
📧 ${hrEmail}
📞 +91 8610470324

---
ATTACHMENT: Offer_Letter_${selectedEmployee.name.replace(/\s+/g, '_')}.pdf
REFERENCE: OFFER-${selectedEmployee.id}-${new Date().getFullYear()}
DATE: ${today}
  `.trim();

  // Create mailto link with CC to HR
  const mailtoLink = `mailto:${employeeEmail}?cc=${encodeURIComponent(
    hrEmail
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    emailBody
  )}`;

  // Open email client
  window.open(mailtoLink, '_blank');

  // Optional: Create a temporary link for download as well
  setTimeout(() => {
    const confirmMsg = `✓ Email draft created for ${employeeName}\n\nRecipient: ${employeeEmail}\nSubject: ${subject}\n\nYour email client should open automatically. If not, please check your browser settings.`;
    if (
      confirm(
        confirmMsg + '\n\nWould you like to download a copy of this email?'
      )
    ) {
      const downloadContent = `Offer Letter for ${employeeName}\n\n${emailBody}`;
      const blob = new Blob([downloadContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Offer_Email_${employeeName.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, 500);
};

// Payslip Email
export const handleSendPayslipEmail = (selectedEmployee) => {
  if (!selectedEmployee) {
    alert('Please select an employee first');
    return;
  }

  const employeeEmail = selectedEmployee.email;
  const employeeName = selectedEmployee.name;
  const hrEmail = 'hr@liviktech.com';
  const today = new Date();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  const formattedDate = today.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Email subject
  const subject = `Payslip - ${month} ${year} - ${employeeName} - Livik Technologies`;

  // Email body
  const emailBody = `
Dear ${employeeName},

Your payslip for ${month} ${year} is ready.

Please find your salary details for the month of ${month} ${year} attached to this email.

EMPLOYEE INFORMATION:
Name: ${employeeName}
Employee ID: ${selectedEmployee.id}
Month: ${month} ${year}
Date Generated: ${formattedDate}

This is a system generated payslip. Please review the attached document for detailed breakdown of:
- Earnings (Basic Salary, HRA, Allowances)
- Deductions (if any)
- Net Salary

If you have any questions regarding your payslip, please contact the HR department.

IMPORTANT NOTES:
1. This is an electronic payslip, no physical copy will be issued
2. Please verify all the details in the attached payslip
3. Contact HR within 3 working days for any discrepancies
4. Keep this payslip for your records

Best regards,

HR Department
Livik Technologies
📧 ${hrEmail}
📞 +91 8610470324

---
ATTACHMENT: Payslip_${selectedEmployee.name.replace(/\s+/g, '_')}_${month}_${year}.pdf
REFERENCE: PAYSLIP-${selectedEmployee.id}-${month}-${year}
DATE: ${formattedDate}
  `.trim();

  // Create mailto link with CC to HR
  const mailtoLink = `mailto:${employeeEmail}?cc=${encodeURIComponent(
    hrEmail
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    emailBody
  )}`;

  // Open email client
  window.open(mailtoLink, '_blank');

  // Optional: Create a temporary link for download as well
  setTimeout(() => {
    const confirmMsg = `✓ Payslip email draft created for ${employeeName}\n\nRecipient: ${employeeEmail}\nSubject: ${subject}\nMonth: ${month} ${year}\n\nYour email client should open automatically. If not, please check your browser settings.`;
    if (
      confirm(
        confirmMsg + '\n\nWould you like to download a copy of this email?'
      )
    ) {
      const downloadContent = `Payslip Email for ${employeeName} - ${month} ${year}\n\n${emailBody}`;
      const blob = new Blob([downloadContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payslip_Email_${employeeName.replace(/\s+/g, '_')}_${month}_${year}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, 500);
};

// Alternative: Unified function with type parameter
export const handleSendEmailByType = (
  type,
  selectedEmployee,
  letterContent = null
) => {
  if (!selectedEmployee) {
    alert('Please select an employee first');
    return;
  }

  if (type === 'offerLetter') {
    return handleSendEmail(selectedEmployee, letterContent);
  } else if (type === 'payslip') {
    return handleSendPayslipEmail(selectedEmployee);
  } else {
    alert('Invalid email type');
  }
};
