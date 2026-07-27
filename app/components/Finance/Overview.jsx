// // components/FinanceForm/OverviewForm.jsx
// import React, { useState, useEffect } from "react";
// import Loader from "../Loader"; // Adjust path based on your structure

// const OverviewForm = ({ financeData }) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [summary, setSummary] = useState(null);
//   const [filteredData, setFilteredData] = useState([]);
//   const [activeFilter, setActiveFilter] = useState("all");
//   const [selectedTransaction, setSelectedTransaction] = useState(null);

//   // Calculate summary statistics
//   const calculateSummary = () => {
//     const invoices = financeData.filter(item => item.type === 'invoice');
//     const expenses = financeData.filter(item => item.type === 'expense');

//     const totalInvoices = invoices.reduce((sum, item) => sum + (item.amount || 0), 0);
//     const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
//     const pendingPayments = invoices
//       .filter(inv => inv.paymentStatus === 'pending')
//       .reduce((sum, item) => sum + (item.amount || 0), 0);

//     return {
//       totalInvoices,
//       totalExpenses,
//       netBalance: totalInvoices - totalExpenses,
//       pendingPayments,
//       invoiceCount: invoices.length,
//       expenseCount: expenses.length,
//       paidInvoices: invoices.filter(inv => inv.paymentStatus === 'paid').length,
//       overdueInvoices: invoices.filter(inv => inv.paymentStatus === 'overdue').length
//     };
//   };

//   // Filter transactions
//   const filterTransactions = (filterType) => {
//     setActiveFilter(filterType);
//     switch(filterType) {
//       case 'invoices':
//         setFilteredData(financeData.filter(item => item.type === 'invoice'));
//         break;
//       case 'expenses':
//         setFilteredData(financeData.filter(item => item.type === 'expense'));
//         break;
//       case 'pending':
//         setFilteredData(financeData.filter(item => item.paymentStatus === 'pending'));
//         break;
//       default:
//         setFilteredData(financeData);
//     }
//   };

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   // Format percentage
//   const formatPercentage = (value, total) => {
//     return ((value / total) * 100).toFixed(1) + '%';
//   };

//   // Initialize data
//   useEffect(() => {
//     if (financeData && financeData.length > 0) {
//       setIsLoading(true);
//       setTimeout(() => {
//         const calculatedSummary = calculateSummary();
//         setSummary(calculatedSummary);
//         setFilteredData(financeData.slice(0, 5));
//         setIsLoading(false);
//       }, 800); // Simulate loading delay
//     } else {
//       setIsLoading(false);
//     }
//   }, [financeData]);

//   // Handle transaction click
//   const handleTransactionClick = (transaction) => {
//     setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction);
//   };

//   // Single Loader Component
//   if (isLoading) {
//     return <Loader label="Loading financial overview..." fullScreen={false} />;
//   }

//   if (!financeData || financeData.length === 0) {
//     return (
//       <div className="text-center py-12 animate-fadeIn">
//         <div className="text-4xl mb-4">📊</div>
//         <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data</h3>
//         <p className="text-gray-500">Start by adding invoices or expenses to see your financial overview.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 animate-fadeIn">
//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {[
//           {
//             title: "Total Invoices",
//             value: formatCurrency(summary.totalInvoices),
//             subtitle: `${summary.invoiceCount} invoices`,
//             icon: "📄",
//             color: "blue",
//             details: [
//               { label: "Paid", value: summary.paidInvoices },
//               { label: "Pending", value: summary.invoiceCount - summary.paidInvoices - summary.overdueInvoices },
//               { label: "Overdue", value: summary.overdueInvoices }
//             ]
//           },
//           {
//             title: "Total Expenses",
//             value: formatCurrency(summary.totalExpenses),
//             subtitle: `${summary.expenseCount} expenses`,
//             icon: "💰",
//             color: "red",
//             trend: "+12%"
//           },
//           {
//             title: "Net Balance",
//             value: formatCurrency(summary.netBalance),
//             subtitle: summary.netBalance >= 0 ? 'Positive cash flow' : 'Negative cash flow',
//             icon: "⚖️",
//             color: summary.netBalance >= 0 ? "green" : "red",
//             trend: summary.netBalance >= 0 ? "+" : "-"
//           },
//           {
//             title: "Pending Payments",
//             value: formatCurrency(summary.pendingPayments),
//             subtitle: "Awaiting clearance",
//             icon: "⏳",
//             color: "amber",
//             trend: formatPercentage(summary.pendingPayments, summary.totalInvoices)
//           }
//         ].map((card, index) => (
//           <div
//             key={index}
//             className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 hover:scale-[1.02] transform transition-transform"
//           >
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 font-medium">{card.title}</p>
//                 <p className={`text-2xl font-bold mt-1 ${
//                   card.color === 'blue' ? 'text-blue-600' :
//                   card.color === 'red' ? 'text-red-600' :
//                   card.color === 'green' ? 'text-green-600' : 'text-amber-600'
//                 }`}>
//                   {card.value}
//                 </p>
//                 <div className="flex items-center justify-between mt-2">
//                   <p className="text-xs text-gray-500">{card.subtitle}</p>
//                   {card.trend && (
//                     <span className={`text-xs font-medium px-2 py-1 rounded-full ${
//                       card.trend.includes('+') ? 'bg-green-100 text-green-800' :
//                       card.trend.includes('-') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
//                     }`}>
//                       {card.trend}
//                     </span>
//                   )}
//                 </div>
//                 {card.details && (
//                   <div className="flex gap-2 mt-3">
//                     {card.details.map((detail, idx) => (
//                       <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//                         {detail.label}: {detail.value}
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>
//               <div className={`p-3 rounded-lg ${
//                 card.color === 'blue' ? 'bg-blue-50' :
//                 card.color === 'red' ? 'bg-red-50' :
//                 card.color === 'green' ? 'bg-green-50' : 'bg-amber-50'
//               }`}>
//                 <span className="text-2xl">{card.icon}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Recent Transactions with Filter */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
//           <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
//           <div className="flex items-center gap-2">
//             <div className="flex bg-gray-100 p-1 rounded-lg">
//               {['all', 'invoices', 'expenses', 'pending'].map((filter) => (
//                 <button
//                   key={filter}
//                   onClick={() => filterTransactions(filter)}
//                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
//                     activeFilter === filter
//                       ? 'bg-white text-gray-900 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900'
//                   }`}
//                 >
//                   {filter.charAt(0).toUpperCase() + filter.slice(1)}
//                 </button>
//               ))}
//             </div>
//             <button className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-md transition-colors">
//               View All →
//             </button>
//           </div>
//         </div>

//         <div className="space-y-3">
//           {filteredData.slice(0, 6).map((item) => (
//             <div
//               key={item.id}
//               onClick={() => handleTransactionClick(item)}
//               className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
//                 selectedTransaction?.id === item.id
//                   ? 'bg-blue-50 border border-blue-200'
//                   : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
//               }`}
//             >
//               <div className="flex items-center space-x-4">
//                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
//                   item.type === 'invoice'
//                     ? 'bg-gradient-to-br from-green-100 to-green-50'
//                     : 'bg-gradient-to-br from-red-100 to-red-50'
//                 } ${selectedTransaction?.id === item.id ? 'scale-110' : ''}`}>
//                   <span className={`text-xl ${
//                     item.type === 'invoice' ? 'text-green-600' : 'text-red-600'
//                   }`}>
//                     {item.type === 'invoice' ? '📄' : '💰'}
//                   </span>
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-gray-900">{item.description}</h4>
//                   <div className="flex items-center gap-2 mt-1">
//                     <span className="text-sm text-gray-500">{item.vendor}</span>
//                     <span className="text-xs text-gray-400">•</span>
//                     <span className="text-sm text-gray-500">
//                       {new Date(item.date).toLocaleDateString('en-US', {
//                         month: 'short',
//                         day: 'numeric',
//                         year: 'numeric'
//                       })}
//                     </span>
//                     {item.category && (
//                       <>
//                         <span className="text-xs text-gray-400">•</span>
//                         <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
//                           {item.category}
//                         </span>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className={`text-lg font-semibold ${
//                   item.type === 'invoice' ? 'text-green-600' : 'text-red-600'
//                 }`}>
//                   {item.type === 'invoice' ? '+' : '-'}{formatCurrency(item.amount)}
//                 </p>
//                 <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full mt-1 ${
//                   item.paymentStatus === 'paid'
//                     ? 'bg-green-100 text-green-800'
//                     : item.paymentStatus === 'pending'
//                     ? 'bg-yellow-100 text-yellow-800'
//                     : item.paymentStatus === 'overdue'
//                     ? 'bg-red-100 text-red-800'
//                     : 'bg-gray-100 text-gray-800'
//                 }`}>
//                   <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
//                     item.paymentStatus === 'paid' ? 'bg-green-500' :
//                     item.paymentStatus === 'pending' ? 'bg-yellow-500' :
//                     item.paymentStatus === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
//                   }`}></span>
//                   {item.paymentStatus}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Category Breakdown with Progress Bars */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-6">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
//             <p className="text-sm text-gray-500 mt-1">Visual breakdown of your financial distribution</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="flex items-center">
//               <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//               <span className="text-sm text-gray-600">Invoices</span>
//             </div>
//             <div className="flex items-center ml-4">
//               <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
//               <span className="text-sm text-gray-600">Expenses</span>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <h4 className="font-semibold text-gray-900">Expenses by Category</h4>
//               <span className="text-sm text-gray-500">{formatCurrency(summary.totalExpenses)} total</span>
//             </div>
//             {Object.entries(financeData
//               .filter(item => item.type === 'expense')
//               .reduce((acc, item) => {
//                 const category = item.category || 'Uncategorized';
//                 acc[category] = (acc[category] || 0) + item.amount;
//                 return acc;
//               }, {}))
//               .sort((a, b) => b[1] - a[1])
//               .map(([category, amount], index) => {
//                 const percentage = (amount / summary.totalExpenses) * 100;
//                 return (
//                   <div key={category} className="mb-4">
//                     <div className="flex justify-between mb-2">
//                       <div className="flex items-center">
//                         <div className={`w-3 h-3 rounded-full mr-3 ${
//                           index === 0 ? 'bg-red-600' :
//                           index === 1 ? 'bg-red-500' :
//                           index === 2 ? 'bg-red-400' : 'bg-red-300'
//                         }`}></div>
//                         <span className="font-medium text-gray-700">{category}</span>
//                       </div>
//                       <div className="text-right">
//                         <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
//                         <span className="text-sm text-gray-500 ml-2">{percentage.toFixed(1)}%</span>
//                       </div>
//                     </div>
//                     <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
//                       <div
//                         className="h-full rounded-full transition-all duration-500"
//                         style={{
//                           width: `${percentage}%`,
//                           background: `linear-gradient(90deg, ${
//                             index === 0 ? '#dc2626' :
//                             index === 1 ? '#ef4444' :
//                             index === 2 ? '#f87171' : '#fca5a5'
//                           }, ${index === 0 ? '#ef4444' : '#fca5a5'})`
//                         }}
//                       ></div>
//                     </div>
//                   </div>
//                 );
//               })}
//           </div>

//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <h4 className="font-semibold text-gray-900">Invoices by Category</h4>
//               <span className="text-sm text-gray-500">{formatCurrency(summary.totalInvoices)} total</span>
//             </div>
//             {Object.entries(financeData
//               .filter(item => item.type === 'invoice')
//               .reduce((acc, item) => {
//                 const category = item.category || 'Uncategorized';
//                 acc[category] = (acc[category] || 0) + item.amount;
//                 return acc;
//               }, {}))
//               .sort((a, b) => b[1] - a[1])
//               .map(([category, amount], index) => {
//                 const percentage = (amount / summary.totalInvoices) * 100;
//                 return (
//                   <div key={category} className="mb-4">
//                     <div className="flex justify-between mb-2">
//                       <div className="flex items-center">
//                         <div className={`w-3 h-3 rounded-full mr-3 ${
//                           index === 0 ? 'bg-green-600' :
//                           index === 1 ? 'bg-green-500' :
//                           index === 2 ? 'bg-green-400' : 'bg-green-300'
//                         }`}></div>
//                         <span className="font-medium text-gray-700">{category}</span>
//                       </div>
//                       <div className="text-right">
//                         <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
//                         <span className="text-sm text-gray-500 ml-2">{percentage.toFixed(1)}%</span>
//                       </div>
//                     </div>
//                     <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
//                       <div
//                         className="h-full rounded-full transition-all duration-500"
//                         style={{
//                           width: `${percentage}%`,
//                           background: `linear-gradient(90deg, ${
//                             index === 0 ? '#16a34a' :
//                             index === 1 ? '#22c55e' :
//                             index === 2 ? '#4ade80' : '#86efac'
//                           }, ${index === 0 ? '#22c55e' : '#86efac'})`
//                         }}
//                       ></div>
//                     </div>
//                   </div>
//                 );
//               })}
//           </div>
//         </div>
//       </div>

//       {/* Add custom styles for animations */}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.5s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default OverviewForm;
// components/FinanceForm/OverviewForm.jsx
import React, { useState, useEffect } from 'react';
import Loader from '../Loader';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { FaRupeeSign } from 'react-icons/fa';

const OverviewForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch data from backend
  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      // Fetch invoices
      const invoiceRes = await fetch('/api/invoices');
      const invoiceData = await invoiceRes.json();

      // Fetch payments (you might need to adjust the endpoint)
      const paymentRes = await fetch('/api/payments');
      const paymentData = await paymentRes.json();

      // Calculate summary statistics
      calculateSummaryStats(invoiceData, paymentData);

      // Prepare recent transactions
      prepareRecentTransactions(invoiceData, paymentData);

      // Calculate invoice and payment statistics
      calculateInvoiceStats(invoiceData);
      calculatePaymentStats(paymentData);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummaryStats = (invoices, payments) => {
    if (!Array.isArray(invoices)) invoices = [];
    if (!Array.isArray(payments)) payments = [];

    // Filter invoices by paymentStatus (lowercase, calculated field from backend)
    const paidInvoices = invoices.filter((inv) => inv.paymentStatus === 'paid');
    const pendingInvoices = invoices.filter(
      (inv) =>
        inv.paymentStatus === 'pending' || inv.paymentStatus === 'partial'
    );
    const overdueInvoices = invoices.filter(
      (inv) => inv.paymentStatus === 'overdue'
    );

    // Calculate totals
    const totalInvoiceAmount = invoices.reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0
    );
    const totalPaidAmount = paidInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) || 0),
      0
    );
    // Use remainingAmount for pending/overdue to show actual amount still owed
    const totalPendingAmount = pendingInvoices.reduce(
      (sum, inv) =>
        sum + (Number(inv.remainingAmount) || Number(inv.total) || 0),
      0
    );
    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, inv) =>
        sum + (Number(inv.remainingAmount) || Number(inv.total) || 0),
      0
    );

    // Payment statistics
    const totalPayments = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    setSummary({
      totalInvoices: totalInvoiceAmount,
      totalPaid: totalPaidAmount,
      totalPending: totalPendingAmount,
      totalOverdue: totalOverdueAmount,
      totalPayments,
      netBalance: totalPaidAmount - totalPendingAmount - totalOverdueAmount,
      invoiceCount: invoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      paymentCount: payments.length,
    });
  };

  // Prepare recent transactions
  const prepareRecentTransactions = (invoices, payments) => {
    if (!Array.isArray(invoices)) invoices = [];
    if (!Array.isArray(payments)) payments = [];

    const recentInvoices = invoices.slice(0, 10).map((inv) => ({
      id: inv.id,
      type: 'invoice',
      description: `Invoice ${inv.invoiceNumber}`,
      client: inv.client || inv.customer?.name || 'Unknown Client',
      amount: Number(inv.total) || 0,
      date: inv.invoiceDate || inv.date,
      status: inv.status || 'pending',
      category: 'Revenue',
    }));

    const recentPayments = payments.slice(0, 10).map((payment) => ({
      id: payment.id,
      type: 'payment',
      description: `Payment for ${payment.invoiceNumber}`,
      client: payment.client || payment.customer?.name || 'Unknown Client',
      amount: Number(payment.amount) || 0,
      date: payment.paymentDate || payment.date,
      status: 'completed',
      category: 'Payment',
      paymentMethod: payment.paymentMethod,
    }));

    // Combine and sort by date
    const allTransactions = [...recentInvoices, ...recentPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    setRecentTransactions(allTransactions);
  };

  // Calculate invoice statistics
  const calculateInvoiceStats = (invoices) => {
    if (!Array.isArray(invoices)) invoices = [];

    const monthlyData = {};
    const clientData = {};

    invoices.forEach((invoice) => {
      // Monthly data
      const date = new Date(invoice.invoiceDate || invoice.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { invoices: 0, amount: 0 };
      }
      monthlyData[monthYear].invoices += 1;
      monthlyData[monthYear].amount += Number(invoice.total) || 0;

      // Client data
      const clientName = invoice.client || invoice.customer?.name || 'Unknown';
      if (!clientData[clientName]) {
        clientData[clientName] = { count: 0, amount: 0 };
      }
      clientData[clientName].count += 1;
      clientData[clientName].amount += Number(invoice.total) || 0;
    });

    setInvoiceStats({
      monthlyData: Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      topClients: Object.entries(clientData)
        .map(([client, data]) => ({ client, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    });
  };

  // Calculate payment statistics
  const calculatePaymentStats = (payments) => {
    if (!Array.isArray(payments)) payments = [];

    const methodData = {};
    const monthlyPayments = {};

    payments.forEach((payment) => {
      // Payment method data
      const method = payment.paymentMethod || 'Unknown';
      if (!methodData[method]) {
        methodData[method] = { count: 0, amount: 0 };
      }
      methodData[method].count += 1;
      methodData[method].amount += Number(payment.amount) || 0;

      // Monthly payment data
      const date = new Date(payment.paymentDate || payment.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyPayments[monthYear]) {
        monthlyPayments[monthYear] = { count: 0, amount: 0 };
      }
      monthlyPayments[monthYear].count += 1;
      monthlyPayments[monthYear].amount += Number(payment.amount) || 0;
    });

    setPaymentStats({
      methodDistribution: Object.entries(methodData).map(([method, data]) => ({
        method,
        ...data,
      })),
      monthlyTrends: Object.entries(monthlyPayments)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    });
  };

  // Filter transactions
  const filterTransactions = (filterType) => {
    setActiveFilter(filterType);
  };

  // Get filtered transactions based on active filter
  const getFilteredTransactions = () => {
    switch (activeFilter) {
      case 'invoices':
        return recentTransactions.filter((t) => t.type === 'invoice');
      case 'payments':
        return recentTransactions.filter((t) => t.type === 'payment');
      default:
        return recentTransactions;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Initialize data
  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return {
          bg: 'bg-[#004475]/10',
          text: 'text-[#004475]',
          dot: 'bg-[#004475]',
        };
      case 'pending':
        return {
          bg: 'bg-[#33a8d9]/10',
          text: 'text-[#33a8d9]',
          dot: 'bg-[#33a8d9]',
        };
      case 'overdue':
        return {
          bg: 'bg-[#004475]/10',
          text: 'text-[#004475]',
          dot: 'bg-[#004475]',
        };
      case 'partial':
        return {
          bg: 'bg-[#33a8d9]/10',
          text: 'text-[#33a8d9]',
          dot: 'bg-[#33a8d9]',
        };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };
    }
  };

  // Single Loader Component
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader label="Loading financial dashboard..." fullScreen={false} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Financial Data
        </h3>
        <p className="text-gray-500">
          Start by adding invoices or expenses to see your financial overview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Cards - Professional Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          {/* Premium Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Revenue
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-4">
              Invoice Billing
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
              {formatCurrency(summary.totalInvoices)}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <TrendingUp className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                {summary.paidCount} paid • {summary.pendingCount} pending
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          {/* Premium Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Finance
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-4">
              Amount Received
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
              {formatCurrency(summary.totalPaid)}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <CheckCircle className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                {summary.paymentCount} total payments
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          {/* Premium Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Performance
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-4">
              Net Balance
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
              {formatCurrency(summary.netBalance)}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <BarChart3 className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                {summary.totalInvoices > 0
                  ? ((summary.totalPaid / summary.totalInvoices) * 100).toFixed(
                      1
                    )
                  : 0}
                % Collection Rate
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white py-3 rounded-[18px] border-t-4 border-[#33a8d9] shadow-sm hover:shadow-2xl hover:shadow-[#004475]/10 hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer">
          {/* Premium Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#33a8d9]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
            <span className="text-[11px] font-bold text-[#004475] uppercase tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
              Receivables
            </span>
            <p className="text-[13px] text-gray-500 font-medium mb-4">
              Pending Payments
            </p>
            <h3 className="text-[28px] font-bold text-[#004475] mb-5 transition-all duration-500 group-hover:scale-110">
              {formatCurrency(summary.totalPending + summary.totalOverdue)}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#f0f4f8] rounded-full transition-all duration-300 group-hover:bg-[#33a8d9] group-hover:text-white group-hover:shadow-md">
              <AlertCircle className="w-3.5 h-3.5 text-[#33a8d9] group-hover:text-white transition-colors" />
              <span className="text-[12px] font-semibold text-[#004475] group-hover:text-white">
                {summary.pendingCount + summary.overdueCount} invoices
                outstanding
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Latest invoices and payments
              </p>
            </div>
            <div className="flex space-x-2">
              {['all', 'invoices', 'payments'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => filterTransactions(filter)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeFilter === filter
                      ? 'bg-[#004475] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {getFilteredTransactions().map((transaction) => {
              const statusColors = getStatusColor(transaction.status);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#33a8d9] hover:bg-[#33a8d9]/5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'invoice'
                          ? 'bg-[#33a8d9]/10'
                          : 'bg-[#004475]/10'
                      }`}
                    >
                      {transaction.type === 'invoice' ? (
                        <FileText className="w-5 h-5 text-[#33a8d9]" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-[#004475]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {transaction.description}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {transaction.client}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </span>
                        {transaction.paymentMethod && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {transaction.paymentMethod}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'invoice'
                          ? transaction.status === 'paid'
                            ? 'text-[#004475]'
                            : 'text-[#33a8d9]'
                          : 'text-[#004475]'
                      }`}
                    >
                      {transaction.type === 'invoice' &&
                      transaction.status !== 'paid'
                        ? ''
                        : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full mt-1 ${statusColors.bg} ${statusColors.text}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusColors.dot}`}
                      ></span>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Top Clients
              </h3>
              <p className="text-sm text-gray-500 mt-1">By invoice volume</p>
            </div>
          </div>

          <div className="space-y-4">
            {invoiceStats?.topClients?.map((client, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#33a8d9] to-[#004475] rounded-lg flex items-center justify-center text-white font-semibold">
                    {client.client.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {client.client}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {client.count} invoices
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(client.amount)}
                  </p>
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-[#33a8d9] to-[#004475] rounded-full transition-all duration-500"
                      style={{
                        width: `${(client.amount / (invoiceStats.topClients[0]?.amount || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods Distribution */}
          {paymentStats?.methodDistribution &&
            paymentStats.methodDistribution.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Payment Methods
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {paymentStats.methodDistribution.map((method, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {method.method}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(
                            (method.amount /
                              paymentStats.methodDistribution.reduce(
                                (sum, m) => sum + m.amount,
                                0
                              )) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-[#33a8d9] to-[#004475] rounded-full"
                          style={{
                            width: `${(method.amount / paymentStats.methodDistribution.reduce((sum, m) => sum + m.amount, 0)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(method.amount)} ({method.count}{' '}
                        payments)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Monthly Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Performance
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Revenue and payment trends
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Invoice Trends */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Invoice Trends</h4>
            <div className="space-y-4">
              {invoiceStats?.monthlyData?.slice(-6).map((monthData, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {monthData.month}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(monthData.amount)} ({monthData.invoices}{' '}
                      invoices)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#33a8d9] to-[#004475] rounded-full transition-all duration-500"
                      style={{
                        width: `${(monthData.amount / Math.max(...invoiceStats.monthlyData.map((m) => m.amount))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Trends */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Payment Trends</h4>
            <div className="space-y-4">
              {paymentStats?.monthlyTrends
                ?.slice(-6)
                .map((monthData, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {monthData.month}
                      </span>
                      <span className="text-sm font-semibold text-[#004475]">
                        {formatCurrency(monthData.amount)} ({monthData.count}{' '}
                        payments)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#33a8d9] to-[#004475] rounded-full transition-all duration-500"
                        style={{
                          width: `${(monthData.amount / Math.max(...paymentStats.monthlyTrends.map((m) => m.amount))) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#33a8d9]/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-[#33a8d9]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Invoice Value</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(
                  summary.invoiceCount > 0
                    ? summary.totalInvoices / summary.invoiceCount
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#004475]/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-[#004475]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Collection Efficiency</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.totalInvoices > 0
                  ? ((summary.totalPaid / summary.totalInvoices) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#004475]/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-[#004475]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue Percentage</p>
              <p className="text-xl font-bold text-[#004475]">
                {summary.totalInvoices > 0
                  ? (
                      (summary.totalOverdue / summary.totalInvoices) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewForm;
