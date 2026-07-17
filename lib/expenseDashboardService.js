import { getAllExpenses } from './expenseService';

/* Helper */
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getExpenseDashboardData({
  fromDate,
  toDate,
  category,
  period,
}) {
  let expenses = await getAllExpenses();

  /* ================= FILTERS ================= */

  if (category) {
    expenses = expenses.filter((e) => e.category === category);
  }

  if (fromDate) {
    expenses = expenses.filter(
      (e) => new Date(e.expenseDate) >= new Date(fromDate)
    );
  }

  if (toDate) {
    expenses = expenses.filter(
      (e) => new Date(e.expenseDate) <= new Date(toDate)
    );
  }

  /* ================= EXPENSES_DATA ================= */
  const EXPENSES_DATA = expenses.map((e) => ({
    id: e.id,
    name: e.itemName,
    category: e.category,
    amount: Number(e.amount),
    status: e.status ?? 'paid',
  }));

  /* ================= PENDING_TASKS ================= */
  const PENDING_TASKS = [
    {
      title: 'Pending Approvals',
      count: expenses.filter((e) => e.status === 'pending').length,
    },
    {
      title: 'Upcoming Expenses',
      count: expenses.filter((e) => e.status === 'overdue').length,
    },
    {
      title: 'Unreported Expenses',
      count: 0,
    },
  ];

  /* ================= RECENT_EXPENSES ================= */
  const RECENT_EXPENSES = [...expenses]
    .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
    .slice(0, 5)
    .map((e) => ({
      subject: e.itemName,
      employee: e.createdBy ?? '—',
      team: e.team ?? null,
      amount: Number(e.amount),
    }));

  /* ================= CURRENT_WEEK ================= */
  const weekMap = {};

  expenses.forEach((e) => {
    const d = new Date(e.expenseDate);
    const day = dayNames[d.getDay()];
    weekMap[day] = (weekMap[day] || 0) + Number(e.amount);
  });

  const CURRENT_WEEK = Object.keys(weekMap).map((day) => ({
    day,
    amount: weekMap[day],
    budget: 20000, // static budget (UI expects this)
  }));

  /* ================= EXPENSE DISTRIBUTION ================= */
  const categoryMap = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });

  const EXPENSE_DISTRIBUTION = Object.entries(categoryMap).map(
    ([name, value], i) => ({
      name,
      value: Math.round((value / totalAmount(expenses)) * 100),
      color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5],
    })
  );

  /* ================= TEAM / DAY MOCKS (UI ONLY) ================= */
  const TEAM_SPENDING = [
    { label: 'PD', value: 80 },
    { label: 'SD', value: 40 },
    { label: 'MB', value: 75 },
    { label: 'IS', value: 70 },
    { label: 'DW', value: 45 },
    { label: 'ND', value: 60 },
    { label: 'BS', value: 90 },
  ];

  const DAY_TO_DAY = [
    { label: 'Accommodation', value: 45 },
    { label: 'Comms', value: 20 },
    { label: 'Services', value: 85 },
    { label: 'Food', value: 70 },
    { label: 'Fuel', value: 35 },
  ];

  /* ================= SUMMARY ================= */
  const totalExpenseAmount = totalAmount(expenses);

  return {
    EXPENSES_DATA,
    PENDING_TASKS,
    RECENT_EXPENSES,
    CURRENT_WEEK,
    EXPENSE_DISTRIBUTION,
    TEAM_SPENDING,
    DAY_TO_DAY,
    SUMMARY: {
      totalExpenseAmount,
      count: expenses.length,
      paid: expenses.filter((e) => e.status === 'paid').length,
      pending: expenses.filter((e) => e.status === 'pending').length,
      overdue: expenses.filter((e) => e.status === 'overdue').length,
    },
  };
}

/* Utils */
function totalAmount(expenses) {
  return expenses.reduce((s, e) => s + Number(e.amount), 0);
}
