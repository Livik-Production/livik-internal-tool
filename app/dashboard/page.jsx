'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Users,
  CreditCard as CreditCardIcon,
  Package,
  Shield,
  ChartNoAxesCombined,
  UserCircle2Icon,
} from 'lucide-react';
import DashboardModuleHeader from '../components/DashboardModuleHeader';
import Loader from '../components/Loader';
import { selectAuthUser } from '../../store/slices/authSlice';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import HrDashboard from '../components/dashboard/HrDashboard';
import CommonDashboard from '../components/dashboard/CommonDashboard';

// Quick Actions Configuration (Source of Truth)
const quickActions = [
  {
    id: 'hr',
    title: 'HR Module',
    icon: <Users size={24} />,
    color: 'blue',
    to: '/dashboard/hr',
    description: 'Manage employees, attendance & HR operations',
    tag: 'Core',
  },
  {
    id: 'payroll',
    title: 'Payroll',
    icon: <CreditCardIcon size={24} />,
    color: 'emerald',
    to: '/dashboard/payroll',
    description: 'Process salaries, bonuses & tax computations',
    tag: 'Finance',
  },
  {
    id: 'asset',
    title: 'Asset Tracking',
    icon: <Package size={24} />,
    color: 'purple',
    to: '/dashboard/asset',
    description: 'Monitor company assets, inventory & repairs',
    tag: 'Inventory',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: <ChartNoAxesCombined size={24} />,
    color: 'indigo',
    to: '/dashboard/finance',
    description: 'Financial management, invoices & reports',
    tag: 'Admin',
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    icon: <Shield size={24} />,
    color: 'amber',
    to: '/dashboard/admin',
    description: 'System settings, roles & access controls',
    tag: 'System',
  },
  {
    id: 'employee-portal',
    title: 'Employee Portal',
    icon: <UserCircle2Icon size={24} />,
    color: 'cyan',
    to: '/dashboard/employee_portal',
    description: 'Self-service portal for staff operations',
    tag: 'Access',
  },
];

export default function DashboardIndex() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const authUser = useSelector(selectAuthUser);

  // Employee-specific state
  const [employeeStats, setEmployeeStats] = useState({
    remainingLeaves: 0,
    pendingRequests: 0,
    assignedAssets: 0,
    nextHoliday: null,
    lastPayslip: null,
  });

  const [statsData, setStatsData] = useState({
    employees: '0',
    payroll: '₹0',
    assets: '0',
    customers: '0',
    invoices: '₹0',
    expenses: '₹0',
    pendingLeaves: '00',
    todaysAbsent: '00',
    attendanceRate: '0%',
    attendanceChange: '0%',
    departments: '00',
  });
  const [invoiceData, setInvoiceData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [pendingEmployeesData, setPendingEmployeesData] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidaysData, setHolidaysData] = useState([]);
  const [permissionsData, setPermissionsData] = useState([]);

  // ROBUST ROLE DETECTION: Ensures employees always see their dashboard
  const rawRole =
    typeof authUser?.role === 'string'
      ? authUser.role
      : authUser?.role?.roleName || authUser?.role?.name || '';

  const roleName = rawRole.trim();
  const upperRole = roleName.toUpperCase().replace('_', ' ');

  // STRICT ROLE ROUTING:
  // 1. Only exact 'Admin' (case-insensitive) gets AdminDashboard
  // 2. Only exact 'Employee' gets EmployeeDashboard
  // 3. Only exact 'Hr Admin' (handles 'HR ADMIN' or 'HR_ADMIN') gets HrDashboard
  // 4. Everything else (e.g., 'System Admin', 'Finance Manager') gets CommonDashboard
  
  const isAdminUser = upperRole === 'ADMIN';
  const isEmployeeDashboard = upperRole === 'EMPLOYEE';
  const isHrUser = upperRole === 'HR ADMIN';
  const isAdminOrHr = isAdminUser || isHrUser;
  const userRights = authUser?.rights || [];

  const visibleQuickActions = useMemo(() => {
    if (isAdminOrHr || userRights.includes('ALL_ACCESS')) return quickActions;

    return quickActions.filter((action) => {
      const moduleId = action.id.toLowerCase();
      if (moduleId === 'employee-portal' || moduleId === 'portal') return true;
      return userRights.some((r) => r.toLowerCase().includes(moduleId));
    });
  }, [isAdminOrHr, userRights]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const [
          empRes,
          payrollRes,
          assetsRes,
          customersRes,
          invoiceRes,
          expenseRes,
          leaveRes,
          attendanceRes,
          paymentRes,
          holidayRes,
          permissionRes,
        ] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/payroll/data'),
          fetch('/api/assets'),
          fetch('/api/customers'),
          fetch('/api/invoices'),
          fetch('/api/expense'),
          fetch('/api/leave'),
          fetch(`/api/hr/attendance?month=${monthStr}&detailed=true`),
          fetch('/api/payments'),
          fetch(`/api/hr/holidays?year=${now.getFullYear()}`),
          fetch(`/api/permission?status=APPROVED&date=${todayStr}`),
        ]);

        const employees = empRes.ok ? await empRes.json() : [];
        const pendingEmps = employees.filter(
          (e) =>
            e.status?.toUpperCase() === 'PENDING' ||
            e.status?.toUpperCase() === 'REVIEW'
        );
        setPendingEmployeesData(pendingEmps);
        setEmployeesData(employees);
        const payrollData = payrollRes.ok ? await payrollRes.json() : [];
        const assets = assetsRes.ok ? await assetsRes.json() : [];
        const customers = customersRes.ok ? await customersRes.json() : [];
        const invoices = invoiceRes.ok ? await invoiceRes.json() : [];
        const expenses = expenseRes.ok ? await expenseRes.json() : [];
        const leaves = leaveRes.ok ? await leaveRes.json() : [];
        const attendanceData = attendanceRes.ok
          ? await attendanceRes.json()
          : [];
        setAttendanceData(attendanceData);
        const payments = paymentRes.ok ? await paymentRes.json() : [];
        const holidays = holidayRes.ok ? await holidayRes.json() : [];
        setHolidaysData(holidays);
        const permissions = permissionRes.ok ? await permissionRes.json() : [];
        setPermissionsData(permissions);

        // Calculate dynamic change and real values
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        const totalEmployees = employees?.length || 0;
        const newEmployeesThisMonth =
          employees?.filter((e) => new Date(e.createdAt) >= thisMonthStart)
            .length || 0;
        const employeeChange =
          newEmployeesThisMonth > 0 ? `+${newEmployeesThisMonth}` : '0';

        let latestPayrollTotal = '₹0';
        let lastRunTotal = '₹0';
        let payrollChange = '0%';
        if (payrollData?.length > 0) {
          const currentTotal = Number(payrollData[0].totalNet || 0);
          latestPayrollTotal = `₹${currentTotal.toLocaleString('en-IN')}`;
          if (payrollData.length > 1) {
            const lastTotal = Number(payrollData[1].totalNet || 0);
            if (lastTotal > 0) {
              const diff = Math.round(
                ((currentTotal - lastTotal) / lastTotal) * 100
              );
              payrollChange = diff > 0 ? `+${diff}%` : `${diff}%`;
            } else {
              payrollChange = currentTotal > 0 ? '+100%' : '0%';
            }
          } else {
            payrollChange = currentTotal > 0 ? '+100%' : '0%';
          }
        }

        // Calculate Last Run (Last Processed or Disbursed cycle)
        const processedCycles = (payrollData || []).filter(
          (p) => p.status === 'PROCESSED' || p.status === 'DISBURSED'
        );
        if (processedCycles.length > 0) {
          lastRunTotal = `₹${Number(processedCycles[0].totalNet || 0).toLocaleString('en-IN')}`;
        } else if (payrollData?.length > 0) {
          lastRunTotal = `₹${Number(payrollData[0].totalNet || 0).toLocaleString('en-IN')}`;
        }

        const activeAssets =
          assets?.filter((a) => {
            const activeAssignment = a.assignments?.find(
              (as) => as.returnDate === null
            );
            return !!activeAssignment;
          })?.length || 0;

        const totalAssets = assets?.length || 0;
        const assetChange =
          totalAssets > 0
            ? Math.round((activeAssets / totalAssets) * 100) + '%'
            : '0%';

        const typeCounts = {};
        (assets || []).forEach((a) => {
          const type = a.deviceType || a.type || 'Other';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const generateColors = [
          '#005a9c',
          '#f59e0b',
          '#2daadf',
          '#EF4444',
          '#10B981',
          '#8B5CF6',
        ];
        const assetDistribution = Object.keys(typeCounts)
          .sort((a, b) => typeCounts[b] - typeCounts[a])
          .slice(0, 5)
          .map((type, i) => ({
            label: type,
            value: typeCounts[type],
            color: generateColors[i % generateColors.length],
          }));

        const totalCustomers = customers?.length || 0;

        const totalInvoiceAmount = invoices.reduce(
          (sum, inv) => sum + (Number(inv.total) || 0),
          0
        );

        const thisMonthInvoices = invoices.filter(
          (i) => new Date(i.invoiceDate || i.createdAt) >= thisMonthStart
        );
        const lastMonthInvoices = invoices.filter(
          (i) =>
            new Date(i.invoiceDate || i.createdAt) >= lastMonthStart &&
            new Date(i.invoiceDate || i.createdAt) < thisMonthStart
        );
        const thisMonthTotalInv = thisMonthInvoices.reduce(
          (sum, inv) => sum + (Number(inv.total) || 0),
          0
        );
        const lastMonthTotalInv = lastMonthInvoices.reduce(
          (sum, inv) => sum + (Number(inv.total) || 0),
          0
        );

        let invoiceChange = '0%';
        if (lastMonthTotalInv > 0) {
          const diff = Math.round(
            ((thisMonthTotalInv - lastMonthTotalInv) / lastMonthTotalInv) * 100
          );
          invoiceChange = diff > 0 ? `+${diff}%` : `${diff}%`;
        } else if (thisMonthTotalInv > 0) {
          invoiceChange = '+100%';
        }

        const totalExpenseAmount = expenses.reduce(
          (sum, exp) => sum + (Number(exp.amount) || 0),
          0
        );

        // Calculate Expense Trend (last 6 months)
        const expenseTrend = [];
        let expChange = '0%';
        const monthNames = [
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
        ];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mthStr = monthNames[d.getMonth()];
          const mthStart = new Date(d.getFullYear(), d.getMonth(), 1);
          const mthEnd = new Date(
            d.getFullYear(),
            d.getMonth() + 1,
            0,
            23,
            59,
            59
          );

          const monthAmount = expenses
            .filter((e) => {
              const eDate = new Date(e.expenseDate || e.createdAt);
              return eDate >= mthStart && eDate <= mthEnd;
            })
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

          expenseTrend.push({ name: mthStr, amount: monthAmount });
        }

        const thisMthExp = expenseTrend[5].amount;
        const lastMthExp = expenseTrend[4].amount;
        if (lastMthExp > 0) {
          const diff = Math.round(
            ((thisMthExp - lastMthExp) / lastMthExp) * 100
          );
          expChange = diff > 0 ? `+${diff}%` : `${diff}%`;
        } else if (thisMthExp > 0) {
          expChange = '+100%';
        }

        // HR Dashboard Details calculations
        const pendingLeavesCount = leaves.filter(
          (l) => l.status?.toUpperCase() === 'PENDING'
        ).length;

        let todaysAbsentCount = 0;
        let attendanceRate = '0%';
        let attendanceChange = '0%';

        if (Array.isArray(attendanceData) && totalEmployees > 0) {
          // Today's Logic
          todaysAbsentCount = attendanceData.filter(
            (emp) =>
              emp.dailyAttendance && emp.dailyAttendance[todayStr] === 'A'
          ).length;

          const todaysRate =
            ((totalEmployees - todaysAbsentCount) / totalEmployees) * 100;
          attendanceRate = `${todaysRate.toFixed(1)}%`;

          // Yesterday's Logic for Change Calculation
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

          const yesterdayAbsentCount = attendanceData.filter(
            (emp) =>
              emp.dailyAttendance && emp.dailyAttendance[yesterdayStr] === 'A'
          ).length;

          const yesterdayRate =
            ((totalEmployees - yesterdayAbsentCount) / totalEmployees) * 100;
          const diff = todaysRate - yesterdayRate;
          attendanceChange =
            diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        }

        const departmentsCount = new Set(
          employees.map((e) => e.department).filter(Boolean)
        ).size;

        setStatsData({
          employees: totalEmployees.toString(),
          employeeChange,
          payroll: latestPayrollTotal,
          lastRun: lastRunTotal,
          lastRunPeriod:
            processedCycles.length > 0
              ? processedCycles[0].month
              : payrollData?.length > 0
                ? payrollData[0].month
                : '',
          payrollChange,
          assets: totalAssets.toString(),
          unassignedAssets: (totalAssets - activeAssets).toString(),
          assetChange,
          assetDistribution,
          customers: totalCustomers.toString(),
          invoices: `₹${totalInvoiceAmount.toLocaleString('en-IN')}`,
          invoiceChange,
          expenses: `₹${totalExpenseAmount.toLocaleString('en-IN')}`,
          expenseTrend,
          expenseChange: expChange,
          pendingLeaves: pendingLeavesCount.toString().padStart(2, '0'),
          todaysAbsent: todaysAbsentCount.toString().padStart(2, '0'),
          attendanceRate,
          attendanceChange,
          departments: departmentsCount.toString().padStart(2, '0'),
        });
        setInvoiceData(invoices);
        setPaymentData(payments);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEmployeeDashboardData = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [empRes, leaveRes, holidayRes, assetRes, payslipRes, attendanceRes] =
          await Promise.all([
            fetch(`/api/employees/${authUser.id}`),
            fetch(`/api/hr/leave-requests?employeeId=${authUser.id}`),
            fetch('/api/hr/holidays'),
            fetch('/api/assets'),
            fetch(`/api/payroll/salary-setup?employeeId=${authUser.id}`),
            fetch(`/api/attendance?employeeId=${authUser.id}`),
          ]);

        const empData = empRes.ok ? await empRes.json() : {};
        const leaveData = leaveRes.ok ? await leaveRes.json() : [];
        const holidayData = holidayRes.ok ? await holidayRes.json() : [];
        const assetData = assetRes.ok ? await assetRes.json() : [];
        const salaryHistory = payslipRes.ok ? await payslipRes.json() : [];
        const attendanceData = (await Promise.all([
          attendanceRes.ok ? attendanceRes.json() : []
        ]))[0];

        const pendingLeaves = leaveData.filter(
          (l) => l.status === 'Pending'
        ).length;

        const assignedAssetsCount = assetData.filter((a) =>
          a.assignments?.some(
            (as) => as.employeeId === authUser.id && as.returnDate === null
          )
        ).length;

        const today = new Date();
        const nextHoliday = holidayData
          .filter((h) => new Date(h.holidayDate) >= today)
          .sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate))[0];

        // NEW: Calculate Total and Remaining Leaves from balances
        let totalLeaves = 0;
        let remainingLeaves = 0;
        let sickBalance = 0;
        let casualBalance = 0;

        if (empData.leaveBalances?.length > 0) {
          empData.leaveBalances.forEach((bal) => {
            const allocated = Number(bal.allocated || 0);
            const used = Number(bal.used || 0);
            const balance = allocated - used;
            
            totalLeaves += allocated;
            remainingLeaves += balance;

            if (bal.leaveType === 'SL') {
              sickBalance = balance;
            } else if (bal.leaveType === 'CL') {
              casualBalance = balance;
            }
          });
        } else {
          // Fallback if no balances exist in DB yet
          remainingLeaves = empData.remainingLeaves || 0;
        }

        const recentActivities = [
          ...leaveData.slice(0, 3).map((l) => ({
            id: `l-${l.id}`,
            title: `Leave Request: ${l.leaveType}`,
            date: new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: l.status,
            type: 'Leave',
          })),
          ...assetData.map(a => {
             const assignment = a.assignments?.find(as => as.employeeId === authUser.id);
             if(!assignment) return null;
             return {
                id: `a-${a.id}`,
                title: `Asset Assigned: ${a.deviceName}`,
                date: new Date(assignment.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: assignment.returnDate ? 'Returned' : 'Active',
                type: 'Asset',
             }
          }).filter(Boolean).slice(0, 2),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

        // CALCULATE MONTHLY ATTENDANCE RATE
        const now = new Date();
        const curM = now.getMonth();
        const curY = now.getFullYear();

        const getWorkingDays = (y, m, stopD, hols = []) => {
          let count = 0;
          for (let d = 1; d <= stopD; d++) {
            const dt = new Date(y, m, d);
            const day = dt.getDay();
            if (day !== 0 && day !== 6) {
              const isH = hols.some(h => {
                const hd = new Date(h.holidayDate);
                return hd.getFullYear() === y && hd.getMonth() === m && hd.getDate() === d;
              });
              if (!isH) count++;
            }
          }
          return count;
        };

        // Current Month Stats
        const workingNow = getWorkingDays(curY, curM, now.getDate(), holidayData);
        const presentNow = attendanceData.filter(a => {
          const ad = new Date(a.date);
          return ad.getMonth() === curM && ad.getFullYear() === curY;
        }).length;
        const currentRate = workingNow > 0 ? (presentNow / workingNow) * 100 : 0;

        // Previous Month Stats (for trend)
        const prevDate = new Date(curY, curM, 0); // Last day of prev month
        const prevM = prevDate.getMonth();
        const prevY = prevDate.getFullYear();
        const workingPrev = getWorkingDays(prevY, prevM, prevDate.getDate(), holidayData);
        const presentPrev = attendanceData.filter(a => {
          const ad = new Date(a.date);
          return ad.getMonth() === prevM && ad.getFullYear() === prevY;
        }).length;
        const prevRate = workingPrev > 0 ? (presentPrev / workingPrev) * 100 : 0;
        
        const rateChange = prevRate > 0 ? 
          `${(currentRate - prevRate).toFixed(1)}%` : 
          '0%';

        const announcements = [];
        if (nextHoliday) {
          announcements.push({
             time: 'UPCOMING HOLIDAY',
             title: nextHoliday.holidayName,
             desc: `${nextHoliday.holidayName} is on ${new Date(nextHoliday.holidayDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`,
             active: true,
          });
        }
        if (pendingLeaves > 0) {
          announcements.push({
             time: 'SYSTEM ALERT',
             title: 'Pending Leave Approvals',
             desc: `You have ${pendingLeaves} pending leave request(s) awaiting approval from HR.`,
             active: false,
          });
        }

        setEmployeeStats({
          employeeId: authUser.id,
          remainingLeaves: Math.max(0, remainingLeaves),
          totalLeaves: totalLeaves,
          sickBalance: Math.max(0, sickBalance),
          casualBalance: Math.max(0, casualBalance),
          pendingRequests: pendingLeaves,
          assignedAssets: assignedAssetsCount,
          nextHoliday: nextHoliday
            ? {
                name: nextHoliday.holidayName,
                date: nextHoliday.holidayDate,
                day: nextHoliday.dayOfWeek,
              }
            : null,
          lastPayslip: salaryHistory[0] || null,
          attendanceRate: `${currentRate.toFixed(1)}%`,
          attendanceChange: (currentRate >= prevRate ? '+' : '') + rateChange,
          recentActivities,
          announcements
        });
      } catch (error) {
        console.error('Error fetching employee dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Decide what to fetch based on role and module count
    if (isEmployeeDashboard) {
      fetchEmployeeDashboardData();
    } else if (isAdminUser || isHrUser) {
      fetchDashboardData();
    } else {
      // Custom/Hybrid roles: Fetch BOTH to support the hybrid view
      fetchDashboardData();
      fetchEmployeeDashboardData();
    }
  }, [isEmployeeDashboard, isAdminUser, isHrUser, authUser?.id]);

  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!isLoading && authUser) {
      const timer = setTimeout(() => setIsRevealed(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsRevealed(false);
    }
  }, [isLoading, authUser]);

  if (isLoading || !authUser) {
    return (
      <div className="h-full w-full flex items-center justify-center py-20">
        <Loader
          label={
            !authUser ? 'Loading...' : 'Loading your dashboard...'
          }
          size="lg"
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-[#f8fafc] relative overflow-hidden text-sm rounded-2xl transition-opacity duration-300 ${
        isRevealed ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative z-10 md:px-2">
        <div className="shrink-0">
          <DashboardModuleHeader />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 pb-6">

        {isEmployeeDashboard ? (
          <EmployeeDashboard
            employeeStats={employeeStats}
            visibleQuickActions={visibleQuickActions}
          />
        ) : isHrUser ? (
          <HrDashboard
            statsData={statsData}
            roleName={roleName}
            visibleQuickActions={visibleQuickActions}
            employeesData={employeesData}
            attendanceData={attendanceData}
            holidaysData={holidaysData}
            permissionsData={permissionsData}
          />
        ) : isAdminUser ? (
          <AdminDashboard
            statsData={statsData}
            roleName={roleName}
            visibleQuickActions={visibleQuickActions}
            invoiceData={invoiceData}
            paymentData={paymentData}
            pendingEmployeesData={pendingEmployeesData}
          />
        ) : (
          <CommonDashboard 
            statsData={statsData}
            userRights={userRights}
            roleName={roleName}
            invoiceData={invoiceData}
            paymentData={paymentData}
            pendingEmployeesData={pendingEmployeesData}
            attendanceData={attendanceData}
            employeeStats={employeeStats}
            visibleQuickActions={visibleQuickActions}
          />
        )}
        </div>
      </div>
    </div>
  );
}
