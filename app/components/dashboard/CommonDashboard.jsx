'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import SummaryCard from './shared/SummaryCard';
import InvoiceWidget from './shared/InvoiceWidget';
import AssetWidget from './shared/AssetWidget';
import PayrollWidget from './shared/PayrollWidget';
import HrDetailsWidget from './shared/HrDetailsWidget';
import PendingEmployeesWidget from './shared/PendingEmployeesWidget';
import EmployeeDashboard from '../dashboard/EmployeeDashboard';
import { 
  Users, 
  CreditCard, 
  Package, 
  ChartNoAxesCombined, 
  Shield,
  Activity,
  Calendar
} from 'lucide-react';

const AttendanceBarChart = dynamic(() => import('./AttendanceBarChart'), { ssr: false });
const ExpensesChart = dynamic(() => import('./ExpensesChartClient'), { ssr: false });

/**
 * CommonDashboard - A unified dashboard that adapts its layout based on user rights.
 * It ensures that assigned modules fill the available space dynamically.
 */
export default function CommonDashboard({ 
  statsData, 
  userRights = [], 
  roleName,
  invoiceData = [],
  paymentData = [],
  pendingEmployeesData = [],
  attendanceData = [],
  employeeStats = null,
  visibleQuickActions = []
}) {
  
  const hasAllAccess = userRights.includes('ALL_ACCESS') || roleName?.toUpperCase().includes('ADMIN');
  const hasRight = (right) => hasAllAccess || userRights.some(r => r.toLowerCase().includes(right.toLowerCase()));

  // Dynamic Hybrid Logic: 1-4 modules trigger the Hybrid Transition view
  const adminModules = visibleQuickActions.filter(a => a.id !== 'employee-portal');
  const isHybridMode = adminModules.length > 0 && adminModules.length < 5;

  // 1. Filter KPI Cards
  const kpis = useMemo(() => {
    const list = [];
    if (hasRight('hr')) {
       list.push({ 
         id: 'employees', 
         label: 'Total Strength', 
         subLabel: 'Staffing', 
         value: statsData.employees, 
         change: statsData.employeeChange, 
         icon: Users,
         color: '#004475'
       });
    }
    if (hasRight('payroll')) {
       list.push({ 
         id: 'payroll', 
         label: 'Est. Payroll', 
         subLabel: 'Finance', 
         value: statsData.payroll, 
         change: statsData.payrollChange, 
         icon: CreditCard,
         color: '#2daadf'
       });
    }
    if (hasRight('asset')) {
       list.push({ 
         id: 'assets', 
         label: 'Total Assets', 
         subLabel: 'Inventory', 
         value: statsData.assets, 
         change: statsData.assetChange, 
         icon: Package,
         color: '#8B5CF6'
       });
    }
    if (hasRight('finance')) {
       list.push({ 
         id: 'revenue', 
         label: 'Billing', 
         subLabel: 'Revenue', 
         value: statsData.invoices, 
         change: statsData.invoiceChange, 
         icon: ChartNoAxesCombined,
         color: '#10B981'
       });
    }
    return list;
  }, [statsData, userRights, hasAllAccess]);

  // 2. Filter Main Widgets
  const widgets = useMemo(() => {
    const list = [];
    
    // Admin/HR Priority
    if (hasRight('hr')) {
      list.push({
        id: 'hr-ops',
        component: <HrDetailsWidget statsData={statsData} />,
        span: 'col-span-12 lg:col-span-6',
        priority: 1
      });
      list.push({
        id: 'pending-emps',
        component: <PendingEmployeesWidget pendingEmployeesData={pendingEmployeesData} />,
        span: 'col-span-12 lg:col-span-6',
        priority: 2
      });
      list.push({
        id: 'attendance',
        component: <AttendanceBarChart />,
        span: 'col-span-12',
        priority: 3
      });
    }

    if (hasRight('finance')) {
      list.push({
        id: 'expenses-chart',
        component: <ExpensesChart statsData={statsData} />,
        span: 'col-span-12 lg:col-span-6',
        priority: 4
      });
      list.push({
        id: 'invoice-hub',
        component: <InvoiceWidget invoiceData={invoiceData} paymentData={paymentData} />,
        span: 'col-span-12 lg:col-span-6',
        priority: 5
      });
    }

    if (hasRight('payroll')) {
      list.push({
        id: 'payroll-hub',
        component: <PayrollWidget statsData={statsData} />,
        span: 'col-span-12 lg:col-span-4',
        priority: 6
      });
    }

    if (hasRight('asset')) {
      list.push({
        id: 'asset-dist',
        component: <AssetWidget statsData={statsData} />,
        span: 'col-span-12 lg:col-span-4',
        priority: 7
      });
    }

    // Dynamic adjustment of spans if few widgets are visible
    if (list.length === 1) {
      list[0].span = 'col-span-12';
    } else if (list.length === 2 && list.every(w => w.span.includes('col-span-6'))) {
      // Leave as is
    }

    return list.sort((a, b) => a.priority - b.priority);
  }, [statsData, userRights, hasAllAccess, pendingEmployeesData, invoiceData, paymentData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Main Content Grid or Hybrid Layout */}
      {isHybridMode ? (
        <div className="space-y-8">
           {/* Section 1: Full Employee Dashboard (Integrated first) */}
           <div className="">
              <EmployeeDashboard 
                employeeStats={employeeStats} 
                visibleQuickActions={visibleQuickActions}
                isCommonView={true}
              />
           </div>

           {/* Section 2: Management Header KPIs (Summaries) */}
           <div className="flex flex-wrap gap-4 mt-8">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="flex-1 min-w-[240px]">
                   <SummaryCard {...kpi} />
                </div>
              ))}
           </div>

           {/* Section 3: Management Layer (Single Row Flex - Integrated second) */}
           <div className="flex flex-wrap gap-6">
             {widgets.map((widget) => (
               <div 
                 key={widget.id} 
                 className="w-full lg:w-[calc(50%-12px)] flex-grow bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 lg:p-10 hover:shadow-xl transition-all duration-500 overflow-hidden relative group"
               >
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                 <div className="relative z-10 h-full">
                   {widget.component}
                 </div>
               </div>
             ))}
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Row for High-Access Roles (Top of management view) */}
          <div className="flex flex-wrap gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex-1 min-w-[240px]">
                 <SummaryCard {...kpi} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-6">
            {widgets.map((widget) => (
              <div 
                key={widget.id} 
                className={`${widget.span} bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl transition-all duration-500 overflow-hidden relative group`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                <div className="relative z-10 h-full">
                  {widget.component}
                </div>
              </div>
            ))}

            {/* Fallback if no specific modules are assigned */}
            {widgets.length === 0 && (
              <div className="col-span-12">
                 <EmployeeDashboard 
                   employeeStats={employeeStats} 
                   visibleQuickActions={visibleQuickActions}
                   isCommonView={true}
                 />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
