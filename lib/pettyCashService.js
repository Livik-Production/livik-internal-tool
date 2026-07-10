import { prisma } from './prisma';
import { safeExecute } from './dbHelpers.js';

/**
 * Helpers
 */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date: ' + s);
  return d;
}

function getUtcDayBounds(dateInput) {
  const d = toDate(dateInput);
  const dateStr = d.toISOString().split('T')[0];
  const start = new Date(dateStr + 'T00:00:00.000Z');
  const end = new Date(dateStr + 'T23:59:59.999Z');
  return { start, end, dateStr };
}

/**
 * Petty Cash Flow Service
 */
export const pettyCashService = {
  //expense dashboard summary api
  // async getPettyCashSpends() {
  //   return prisma.expense.findMany({
  //     where: {
  //       paymentMode: "petty_cash",
  //     },
  //     orderBy: {
  //       expenseDate: "desc",
  //     },
  //   });
  // },

  // ✅ ALL petty cash expenses
  async getPettyCashSpends() {
    return prisma.expense.findMany({
      where: {
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty_cash'] },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  },

  // ✅ ALL top-ups
  async getAllInflows() {
    return prisma.pettyCashFlow.findMany({
      orderBy: { receiveDate: 'desc' },
    });
  },
  /**
   * Create a new top-up record
   */
  async createInflow(data) {
    return prisma.pettyCashFlow.create({
      data: {
        receiveDate: new Date(data.receiveDate),
        receiveFrom: data.receiveFrom,
        paymentMethod: data.paymentMethod,
        receivedAmount: data.receivedAmount,
      },
    });
  },

  /**
   * Get all top-up records
   */
  async getAllInflows() {
    return prisma.pettyCashFlow.findMany({
      orderBy: { receiveDate: 'desc' },
    });
  },

  /**
   * Get inflow by ID with related expenses for that day
   */
  async getInflowDetail(id) {
    const inflow = await prisma.pettyCashFlow.findUnique({
      where: { id },
    });

    if (!inflow) throw new Error('Inflow record not found');

    const receiveDate = toDate(inflow.receiveDate);
    // Calculate week bounds (Monday to Sunday)
    const dayOfWeek = receiveDate.getUTCDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(receiveDate);
    weekStart.setUTCDate(receiveDate.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const weekStartDateStr = weekStart.toISOString().split('T')[0];

    // 1. Opening Balance at start of week
    const weeklyOpeningBalance = await this.getBalanceByDate(weekStartDateStr);

    // 2. Fetch ALL inflows for the week
    const weekInflows = await prisma.pettyCashFlow.findMany({
      where: {
        receiveDate: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { receiveDate: 'asc' },
    });

    // 3. Fetch ALL expenses for the week
    const weekExpenses = await prisma.expense.findMany({
      where: {
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty_cash'] },
        expenseDate: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { expenseDate: 'asc' },
    });

    // 4. Generate daily breakdown for the 7 days
    const dailyBreakdown = [];
    let runningBalance = weeklyOpeningBalance;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setUTCDate(weekStart.getUTCDate() + i);
      const { start, end, dateStr } = getUtcDayBounds(currentDate);

      const dayInflows = weekInflows.filter((inf) => {
        const d = toDate(inf.receiveDate);
        return d >= start && d <= end;
      });
      const dayExpenses = weekExpenses.filter((exp) => {
        const d = toDate(exp.expenseDate);
        return d >= start && d <= end;
      });

      const dayInflowSum = dayInflows.reduce(
        (s, inf) => s + Number(inf.receivedAmount),
        0
      );
      const dayExpenseSum = dayExpenses.reduce(
        (s, exp) => s + Number(exp.amount),
        0
      );

      const dayOpening = runningBalance;
      const dayClosing = dayOpening + dayInflowSum - dayExpenseSum;
      runningBalance = dayClosing;

      dailyBreakdown.push({
        date: dateStr,
        inflows: dayInflows,
        expenses: dayExpenses,
        totalInflow: dayInflowSum,
        totalOutflow: dayExpenseSum,
        openingBalance: dayOpening,
        closingBalance: dayClosing,
      });
    }

    // Identify current inflow's specific totals for compatibility with existing UI if needed
    const { start: inflowStart, end: inflowEnd } = getUtcDayBounds(
      inflow.receiveDate
    );
    const totalInflowToday = weekInflows
      .filter((inf) => {
        const d = toDate(inf.receiveDate);
        return d >= inflowStart && d <= inflowEnd;
      })
      .reduce((s, inf) => s + Number(inf.receivedAmount), 0);
    const totalOutflowToday = weekExpenses
      .filter((exp) => {
        const d = toDate(exp.expenseDate);
        return d >= inflowStart && d <= inflowEnd;
      })
      .reduce((s, exp) => s + Number(exp.amount), 0);

    return {
      ...inflow,
      dailyBreakdown,
      weeklyOpeningBalance,
      weeklyClosingBalance: runningBalance,
      // Keep these for UI backward compatibility during migration
      openingBalance: weeklyOpeningBalance,
      closingBalance: runningBalance,
      totalInflowToday,
      totalOutflowToday,
      weeklyExpenses: weekExpenses,
    };
  },

  /**
   * Get balance at the start of a specific date
   */
  async getBalanceByDate(date) {
    const { start } = getUtcDayBounds(date);

    const inflows = await prisma.pettyCashFlow.aggregate({
      where: {
        receiveDate: { lt: start },
      },
      _sum: { receivedAmount: true },
    });

    const outflows = await prisma.expense.aggregate({
      where: {
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty_cash'] },
        expenseDate: { lt: start },
      },
      _sum: { amount: true },
    });

    const received = Number(inflows._sum.receivedAmount || 0);
    const spent = Number(outflows._sum.amount || 0);

    return received - spent;
  },
};

/**
 * Update a petty cash inflow record
 */
export async function updatePettyCash(id, data) {
  return safeExecute((prisma) =>
    prisma.pettyCashFlow.update({
      where: { id },
      data: {
        receiveDate: toDate(data.receiveDate),
        receiveFrom: data.receiveFrom,
        receivedAmount: data.receivedAmount,
        paymentMethod: data.paymentMethod,
      },
    })
  );
}

/**
 * Delete a petty cash inflow record
 */
export async function deletePettyCash(id) {
  return safeExecute((prisma) =>
    prisma.pettyCashFlow.delete({
      where: { id },
    })
  );
}
