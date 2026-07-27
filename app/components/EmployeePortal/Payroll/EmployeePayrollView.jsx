'use client';

import React, { useState, useEffect } from 'react';
import Components from './Components';
import EmployeePayslipTab from './Payslip';
import Loader from '../../Loader';
import TabButton from '../../Buttons/TabButton';
import PaySlip from '../../HrModule/PaySlipTab/Payslip';
import Button from '../../Buttons/Button';
import { handlePrint } from '../../HrModule/PrintForm';
import { handleDownloadPayslipPDF } from '../../HrModule/DownloadForm';
import { handleSendPayslipEmail } from '../../HrModule/EmailForm';
import { Printer, Download, Mail, SquareX } from 'lucide-react';

export default function EmployeePayrollView({ employee }) {
  const [activePayrollTab, setActivePayrollTab] = useState('components');
  const [payrollData, setPayrollData] = useState({
    effectiveVersions: [],
    components: [],
    payslips: [],
    history: [],
    processedMonths: [],
  });
  const [isPayrollLoading, setIsPayrollLoading] = useState(false);
  const [selectedEffectiveId, setSelectedEffectiveId] = useState('');
  const [selectedPayslipYear, setSelectedPayslipYear] = useState(new Date().getFullYear());

  // payslip modal state
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState(null);

  const employeeId = employee.id;

  // Fetch salary history
  useEffect(() => {
    if (!employeeId) return;

    const fetchSalaryHistory = async () => {
      try {
        setIsPayrollLoading(true);
        const res = await fetch(`/api/payroll/salary-setup?employeeId=${employeeId}`);
        if (!res.ok) throw new Error('Failed to fetch salary history');
        const history = await res.json();

        const versions = history.map((h, i) => ({
          id: h.id,
          label: `${new Date(h.effectiveDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${history[i - 1]
            ? new Date(new Date(history[i - 1].effectiveDate).setDate(0)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
            : 'Present'}`,
          date: h.effectiveDate,
        }));

        const components = [];
        history.forEach((h) => {
          components.push(
            { id: `${h.id}-basic`, effectiveId: h.id, name: 'Basic Salary', group: 'Basic', amount: Number(h.basicPay) },
            { id: `${h.id}-hra`, effectiveId: h.id, name: 'HRA', group: 'HRA', amount: Number(h.hra) },
            { id: `${h.id}-other`, effectiveId: h.id, name: 'Other Allowances', group: 'Allowances', amount: Number(h.otherAllowances) }
          );
        });

        setPayrollData((prev) => ({
          ...prev,
          effectiveVersions: versions,
          components: components,
          history: history,
        }));

        if (versions.length > 0 && !selectedEffectiveId) {
          setSelectedEffectiveId(versions[0].id);
        }

        const resData = await fetch(`/api/payroll/data?employeeId=${employeeId}`);
        if (resData.ok) {
          const allPayroll = await resData.json();
          const processedMonths = allPayroll
            .filter((p) => {
              const status = (p.status || '').toUpperCase();
              const isProcessed = status === 'PROCESSED' || status === 'DISBURSED';
              const isEmployeeInCycle = p.payrolls && p.payrolls.length > 0;
              return isProcessed && isEmployeeInCycle;
            })
            .map((p) => p.month);

          setPayrollData((prev) => ({
            ...prev,
            processedMonths,
          }));
        }
      } catch (err) {
        console.error('Salary history fetch failed:', err);
      } finally {
        setIsPayrollLoading(false);
      }
    };

    fetchSalaryHistory();
  }, [employeeId]);

  const handleViewPayslip = async (payslip) => {
    try {
      const res = await fetch('/api/hr/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, month: payslip.monthName, year: payslip.year }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch payslip data');
      }

      const data = await res.json();
      setPayslipModalData({ rawData: data, monthName: payslip.monthName, year: payslip.year });
      setPayslipModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error generating payslip: ' + err.message);
    }
  };

  const handleDownloadPayslip = (payslip) => {
    const text = `Payslip: ${payslip.monthName} ${payslip.year}\nEmployee: ${employee.firstName}\nGross: ₹${payslip.gross}\nDeductions: ₹${payslip.deductions}\nNet Pay: ₹${payslip.net}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslip.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getComponentsForEffective = (effectiveId) => payrollData.components.filter((c) => c.effectiveId === effectiveId);

  const payrollYears = ['All Years', new Date().getFullYear(), new Date().getFullYear() - 1];
  const payrollSubTabs = [
    { id: 'components', label: 'Components' },
    { id: 'payslips', label: 'Payslips' },
  ];

  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  const employeeRole = employee.designation || '';
  const employeeDepartment = employee.department || '';
  const employeeEmail = employee.email || '';
  const employeePhone = employee.phoneNumber || '';
  const employeeAddress = employee.presentAddress || '';
  const empIdText = employee.empId || employeeId;

  const payslipContactData = {
    id: empIdText,
    name: employeeName,
    role: employeeRole,
    email: employeeEmail,
    phone: employeePhone,
    address: employeeAddress,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <nav className="flex space-x-1 border-b border-gray-300 bg-white sticky top-0 z-20 pt-2 overflow-x-auto no-scroll">
        {payrollSubTabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activePayrollTab === tab.id}
            onClick={() => setActivePayrollTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </nav>

      <div className="mt-3 min-h-[400px] animate-dashboard-reveal">
        {activePayrollTab === 'components' && (
          <div>
            <Components
              employeeId={employeeId}
              effectiveId={selectedEffectiveId}
              versions={payrollData.effectiveVersions}
              isLoading={isPayrollLoading}
              components={getComponentsForEffective(selectedEffectiveId)}
              onVersionChange={setSelectedEffectiveId}
              historyData={payrollData.history}
            />
          </div>
        )}

        {activePayrollTab === 'payslips' && (
          <div>
            <EmployeePayslipTab
              years={payrollYears}
              selectedYear={selectedPayslipYear}
              onYearChange={setSelectedPayslipYear}
              processedMonths={payrollData.processedMonths || []}
              onViewPayslip={handleViewPayslip}
              onDownloadPayslip={handleDownloadPayslip}
              isLoading={isPayrollLoading}
            />
          </div>
        )}
      </div>

      {payslipModalOpen && payslipModalData && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPayslipModalOpen(false);
              setPayslipModalData(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  Payslip - {payslipModalData.monthName} {payslipModalData.year}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => handlePrint('payslip')} className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-blue-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110" title="Print Payslip">
                  <Printer size={18} />
                </Button>
                <Button onClick={() => handleDownloadPayslipPDF(payslipContactData, 'with')} className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-green-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110" title="Download Payslip">
                  <Download size={18} />
                </Button>
                <Button onClick={() => handleSendPayslipEmail(payslipContactData)} className="w-8 h-8 p-0 bg-gray-600 text-white rounded-full hover:bg-purple-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110" title="Email Payslip">
                  <Mail size={18} />
                </Button>
                <button onClick={() => { setPayslipModalOpen(false); setPayslipModalData(null); }} className="w-8 h-8 p-0 bg-red-600 text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:brightness-110 ml-2" title="Close">
                  <SquareX size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scroll">
              <div className="flex justify-center">
                <PaySlip
                  employeeData={{
                    ...payslipContactData,
                    department: employeeDepartment,
                  }}
                  payslipData={payslipModalData.rawData}
                  letterPad="with"
                  month={payslipModalData.monthName}
                  year={payslipModalData.year}
                />
              </div>
              <div className="pt-4 text-center text-sm text-gray-600 print:hidden">
                <p>This is a computer generated payslip. No signature is required.</p>
                <p className="mt-1">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
