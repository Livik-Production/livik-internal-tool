// app/dashboard/payroll/components/PayrollExportExcel.jsx
'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import CustomAlertForm from '../CustomAlertForm';

const PayrollExportExcel = ({ payrollData, fileName = 'payroll_export' }) => {
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });
  const showAlert = (title, message, type = 'info') =>
    setAlertModal({ isOpen: true, title, message, type });
  const closeAlert = () =>
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  const formatPayrollDataForExcel = () => {
    return payrollData.map((payroll) => ({
      'Cycle ID': payroll.cycleId || '',
      'Payroll Month': payroll.month || '',
      Period: payroll.period || '',
      'Start Date': payroll.startDate || '',
      'End Date': payroll.endDate || '',
      'Processing Date': payroll.processingDate || '',
      'Payment Date': payroll.paymentDate || '',
      'Employee Count': payroll.employeeCount || 0,
      'Total Gross Salary': payroll.totalGross || '₹0',
      'Total Tax': payroll.totalTax || '₹0',
      'Total Deductions': payroll.totalDeductions || '₹0',
      'Total Net Pay': payroll.totalNet || '₹0',
      Status: payroll.status || '',
      Approver: payroll.approver || '',
      'Processed By': payroll.processedBy || '',
      'Bank File': payroll.bankFile || '',
      'Payslips Generated': payroll.payslipsGenerated ? 'Yes' : 'No',
      'Compliance Submitted': payroll.complianceSubmitted ? 'Yes' : 'No',
    }));
  };

  const exportToExcel = async () => {
    try {
      // Prepare data for Excel
      const excelData = formatPayrollDataForExcel();

      // Create a new workbook
      const wb = new ExcelJS.Workbook();

      // Create a worksheet
      const ws = wb.addWorksheet('Payroll Data');

      if (excelData.length > 0) {
        const headers = Object.keys(excelData[0]);
        ws.addRow(headers);

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true };

        excelData.forEach((row) => {
          ws.addRow(Object.values(row));
        });

        ws.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? String(cell.value).length : 0;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        });
      }

      // Add a summary sheet
      const summaryWs = wb.addWorksheet('Summary');

      const summaryData = [
        ['Payroll Summary Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Total Records:', excelData.length],
        [''],
        ['Summary by Status:'],
      ];

      // Calculate status counts
      const statusCounts = {};
      payrollData.forEach((item) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        summaryData.push([status, count]);
      });

      // Calculate totals
      const totalAmounts = payrollData.reduce(
        (acc, item) => {
          const gross =
            parseFloat(item.totalGross?.replace(/[^0-9.-]+/g, '')) || 0;
          const tax = parseFloat(item.totalTax?.replace(/[^0-9.-]+/g, '')) || 0;
          const net = parseFloat(item.totalNet?.replace(/[^0-9.-]+/g, '')) || 0;
          const employees = item.employeeCount || 0;

          return {
            totalGross: acc.totalGross + gross,
            totalTax: acc.totalTax + tax,
            totalNet: acc.totalNet + net,
            totalEmployees: acc.totalEmployees + employees,
          };
        },
        { totalGross: 0, totalTax: 0, totalNet: 0, totalEmployees: 0 }
      );

      summaryData.push(
        [''],
        ['Financial Summary:'],
        [
          'Total Gross Salary:',
          `₹${totalAmounts.totalGross.toLocaleString('en-IN')}`,
        ],
        ['Total Tax:', `₹${totalAmounts.totalTax.toLocaleString('en-IN')}`],
        ['Total Net Pay:', `₹${totalAmounts.totalNet.toLocaleString('en-IN')}`],
        ['Total Employees Processed:', totalAmounts.totalEmployees]
      );

      summaryData.forEach((row) => {
        summaryWs.addRow(row);
      });

      // Style the summary sheet
      summaryWs.columns = [{ width: 25 }, { width: 20 }];

      // Generate Excel file
      const excelFileName = `${fileName}_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = excelFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert(
        'Export Failed',
        'Failed to export to Excel. Please try again.',
        'danger'
      );
      return false;
    }
  };

  const exportToCSV = () => {
    const excelData = formatPayrollDataForExcel();
    const headers = Object.keys(excelData[0] || {});
    const csvRows = [
      headers.join(','),
      ...excelData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${fileName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          title="Export to Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </button>

        <button
          onClick={exportToCSV}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          title="Export to CSV"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      <CustomAlertForm
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        cancelText="Close"
      />
    </>
  );
};

export default PayrollExportExcel;
