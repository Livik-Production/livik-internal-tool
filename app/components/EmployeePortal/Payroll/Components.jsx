import CustomTable from '../../CustomTable';
import { CreditCard, Search } from 'lucide-react';

import Loader from '../../Loader';

const Components = ({ historyData = [], isLoading = false }) => {
  const getHistoryRowClass = (row) => {
    const isCurrent = historyData.length > 0 && historyData[0].id === row.id;
    return isCurrent
      ? 'bg-blue-50/50 border-l-4 border-blue-500 hover:bg-blue-100/30'
      : 'hover:bg-slate-50';
  };

  const historyColumns = [
    {
      key: 'yearId',
      label: 'Year-Month',
      render: (row) => {
        const isCurrent =
          historyData.length > 0 && historyData[0].id === row.id;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              {row.yearId || row.id}
            </span>
            {isCurrent && (
              <span className="px-2 py-0.5 bg-[#004475] text-white text-[9px] uppercase font-bold rounded-full tracking-wider">
                Current
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'ctc',
      label: 'CTC',
      render: (row) => (
        <span className="font-bold text-slate-700">
          ₹{(row.ctc || row.grossSalary || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'basicPay',
      label: 'Basic Pay',
      render: (row) => (
        <span className="font-medium text-slate-600">
          ₹{(row.basicPay || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'hra',
      label: 'HRA',
      render: (row) => (
        <span className="font-medium text-slate-600">
          ₹{(row.hra || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'otherAllowances',
      label: 'Other Allowances',
      render: (row) => (
        <span className="font-medium text-slate-600">
          ₹{(row.otherAllowances || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'grossSalary',
      label: 'Gross Salary',
      render: (row) => (
        <span className="text-emerald-600 font-bold">
          ₹{(row.grossSalary || row.ctc || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (row) => (
        <span className="text-slate-500 font-medium">
          {row.effectiveDate
            ? new Date(row.effectiveDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div key={isLoading} className="bg-transparent animate-dashboard-reveal">
      {isLoading ? (
        <div className="p-12 flex justify-center items-center bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
          <Loader label="Fetching salary components..." size="md" fullScreen={false} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#004475] rounded-xl shadow-lg shadow-blue-100 ring-4 ring-blue-50">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    Salary Components
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="">
            {historyData.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <CustomTable
                  columns={historyColumns}
                  data={historyData}
                  rowKey="id"
                  maxHeight="none"
                  tableClassName="min-w-full"
                  theadClassName="bg-slate-50/50 border-b border-slate-100"
                  tbodyClassName="divide-y divide-slate-100 font-medium text-slate-600"
                  rowClassName={getHistoryRowClass}
                />
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full opacity-50"></div>
                  <div className="relative w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No Salary History
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                  We couldn't find any salary setup records in your history.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Components;
