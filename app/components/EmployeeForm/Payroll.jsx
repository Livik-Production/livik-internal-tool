// components/SalaryComponentsTable.jsx
'use client';

import { useState, useMemo } from 'react';

function TopTabs({ tabs, active, onChange }) {
  return (
    <nav
      role="tablist"
      aria-label="subtabs"
      className="flex space-x-1 border-b border-gray-300 mb-4 px-2"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2 font-semibold text-sm transition rounded-t-xl ${
              isActive
                ? 'bg-[#e7f0fa] text-[#173469] border-b-4 border-[#173469]'
                : 'bg-transparent text-gray-500 border-b-4 border-transparent hover:text-[#173469] hover:bg-[#e7f0fa]'
            }`}
          >
            {t.label}
            {t.count ? (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#ffd6db] text-[#9b303d] font-bold text-xs">
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

const Payroll = ({
  effectiveOptions = [],
  selectedEffectiveId,
  onEffectiveSelect,
  getComponentsForEffective,

  isViewMode = true,
  selectedPayslipYear,
  onPayslipYearChange,
  getPayslipsForYear,
  payrollYears = [],
  monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  employeeName = '',
}) => {
  const [activeTab, setActiveTab] = useState('components');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState(null);

  const handleEffectiveClick = (e, effectiveId) => {
    e.preventDefault();
    e.stopPropagation();

    const effective = effectiveOptions.find((o) => o.id === effectiveId);
    if (!effective) return;

    if (onEffectiveSelect) {
      onEffectiveSelect(effectiveId);
    }

    const components = getComponentsForEffective(effectiveId);
    const totalGross = components.reduce(
      (s, c) => s + Number(c.amount || 0),
      0
    );
    const deductions = components
      .filter((c) => (c.group || '').toLowerCase().includes('deduct'))
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const net = totalGross - deductions;
    const ctc = totalGross * 12;

    setSelectedDetail({
      effective,
      components,
      totals: { totalGross, deductions, net, ctc },
    });
    setShowDetailModal(true);
  };

  const tableData = useMemo(() => {
    return effectiveOptions.map((effective) => {
      const components = getComponentsForEffective(effective.id);
      const basic = components.find((c) => c.group === 'Basic')?.amount || 0;
      const hra = components.find((c) => c.group === 'HRA')?.amount || 0;
      const otherAllowances = components
        .filter((c) => c.group === 'Allowances' && c.name !== 'HRA')
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const gross = basic + hra + otherAllowances;
      const deductions = components
        .filter((c) => (c.group || '').toLowerCase().includes('deduct'))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      const net = gross - deductions;

      return {
        effective,
        basic,
        hra,
        otherAllowances,
        gross,
        deductions,
        net,
      };
    });
  }, [effectiveOptions, getComponentsForEffective]);

  const payslipsForYear = useMemo(() => {
    if (!selectedPayslipYear) return [];
    return getPayslipsForYear?.(selectedPayslipYear) || [];
  }, [selectedPayslipYear, getPayslipsForYear]);

  const payrollTabs = [
    { id: 'components', label: 'Components' },
    { id: 'payslips', label: 'Payslips', count: payslipsForYear.length },
  ];

  const openPayslipModal = (p) => {
    setPayslipModalData(p);
    setPayslipModalOpen(true);
  };

  const closePayslipModal = () => {
    setPayslipModalOpen(false);
    setPayslipModalData(null);
  };

  const downloadPayslip = (p) => {
    const text = `Payslip: ${p.monthName} ${p.year}\nEmployee: ${employeeName}\nGross: ₹${p.gross}\nDeductions: ₹${p.deductions}\nNet Pay: ₹${p.net}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${p.monthName}-${p.year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!isViewMode && effectiveOptions.length > 0 && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">
              Effective month-year:
            </label>
            <select
              value={selectedEffectiveId || effectiveOptions[0]?.id || ''}
              onChange={(e) => onEffectiveSelect?.(e.target.value)}
              className="px-3 py-2 border rounded-md"
              aria-label="Select effective payroll version"
            >
              {effectiveOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <TopTabs tabs={payrollTabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'components' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Salary Components History
            </h4>

            {isViewMode && effectiveOptions.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">
                  Effective version:
                </label>
                <select
                  value={selectedEffectiveId || effectiveOptions[0]?.id || ''}
                  onChange={(e) => onEffectiveSelect?.(e.target.value)}
                  className="px-3 py-2 border  border-gray-300 rounded-md text-sm"
                >
                  {effectiveOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0 ">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left font-medium text-gray-700 border-b border-gray-200 rounded-tl-lg">
                    Effective From
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 border-b border-gray-200">
                    Basic (₹)
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 border-b border-gray-200">
                    HRA (₹)
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 border-b border-gray-200">
                    Other Allowances (₹)
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700 border-b border-gray-200 rounded-tr-lg">
                    Net Pay (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr
                    key={row.effective.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedEffectiveId === row.effective.id
                        ? 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4 border-b border-gray-200">
                      <button
                        onClick={(e) =>
                          handleEffectiveClick(e, row.effective.id)
                        }
                        className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        type="button"
                      >
                        {row.effective.label}
                        {selectedEffectiveId === row.effective.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </button>
                      <div className="text-xs text-gray-500 mt-1">
                        {row.effective.description || 'Salary revision'}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      <div className="font-medium">
                        ₹{Number(row.basic).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((row.basic / row.gross) * 100).toFixed(1)}% of gross
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      <div className="font-medium">
                        ₹{Number(row.hra).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((row.hra / row.gross) * 100).toFixed(1)}% of gross
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      <div className="font-medium">
                        ₹{Number(row.otherAllowances).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((row.otherAllowances / row.gross) * 100).toFixed(1)}%
                        of gross
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-gray-200">
                      <div className="font-bold text-green-600">
                        ₹{Number(row.net).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((row.net / row.gross) * 100).toFixed(1)}% take-home
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-100"></div>
                <span>Click Effective From to view detailed breakdown</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payslips Tab - Your existing UI */}
      {activeTab === 'payslips' && (
        <div className="bg-white rounded-lg border border-gray-300">
          <div className="flex items-center gap-3 m-4 justify-end">
            <label className="text-sm text-gray-600">Payslip year</label>
            <select
              value={selectedPayslipYear}
              onChange={(e) => onPayslipYearChange?.(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md"
              aria-label="Select payslip year"
            >
              {payrollYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {payslipsForYear.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-gray-300 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      {p.monthName} {p.year}
                    </div>
                    <div className="text-lg font-semibold">
                      Net ₹ {Number(p.net).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openPayslipModal(p)}
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPayslip(p)}
                      className="px-3 py-1 rounded bg-white text-blue-600 border border-blue-600 text-sm"
                    >
                      Download
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Gross: ₹ {Number(p.gross).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Deductions: ₹ {Number(p.deductions).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal for Components */}
      {showDetailModal && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Salary Components — {selectedDetail.effective.label}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-white border rounded p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-2">Component</th>
                        <th className="pb-2">Group</th>
                        <th className="pb-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.components.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="py-2">{c.name}</td>
                          <td className="py-2 text-xs text-gray-500">
                            {c.group}
                          </td>
                          <td className="py-2 text-right">
                            {Number(c.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}

                      <tr className="border-t">
                        <td className="py-2 font-semibold">Gross</td>
                        <td />
                        <td className="py-2 text-right font-semibold">
                          {Number(
                            selectedDetail.totals.totalGross
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-t">
                        <td className="py-2 font-semibold">CTC (annually)</td>
                        <td />
                        <td className="py-2 text-right font-semibold">
                          {Number(selectedDetail.totals.ctc).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-t">
                        <td className="py-2 font-semibold">Deductions</td>
                        <td />
                        <td className="py-2 text-right font-semibold">
                          {Number(
                            selectedDetail.totals.deductions
                          ).toLocaleString()}
                        </td>
                      </tr>

                      <tr className="border-t bg-green-50">
                        <td className="py-3 font-bold">Net Pay</td>
                        <td />
                        <td className="py-3 text-right font-bold text-green-700 text-lg">
                          ₹ {Number(selectedDetail.totals.net).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <SimpleModal
        open={payslipModalOpen}
        onClose={closePayslipModal}
        title={`Payslip — ${payslipModalData?.monthName} ${payslipModalData?.year}`}
      >
        {payslipModalData ? (
          <div>
            <div className="mb-4">
              <div className="text-sm">
                Gross: ₹ {Number(payslipModalData.gross).toLocaleString()}
              </div>
              <div className="text-sm">
                Deductions: ₹{' '}
                {Number(payslipModalData.deductions).toLocaleString()}
              </div>
              <div className="text-lg font-semibold">
                Net: ₹ {Number(payslipModalData.net).toLocaleString()}
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Component</th>
                  <th className="pb-2">Group</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payslipModalData.components.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-xs text-gray-500">{c.group}</td>
                    <td className="py-2 text-right">
                      ₹ {Number(c.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No data</div>
        )}
      </SimpleModal>
    </>
  );
};

export default Payroll;
