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
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty cash', 'petty_cash'] },
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
    const receiveDateStr = receiveDate.toISOString().split('T')[0];
    
    // Start of the period is the day of this top-up
    const periodStart = new Date(receiveDateStr + 'T00:00:00.000Z');
    
    // Find the next top-up (on a strictly later date) to determine the end of this period
    const endOfDayForReceive = new Date(receiveDateStr + 'T23:59:59.999Z');
    const nextInflow = await prisma.pettyCashFlow.findFirst({
      where: {
        receiveDate: { gt: endOfDayForReceive }
      },
      orderBy: { receiveDate: 'asc' }
    });

    let periodEnd;
    if (nextInflow) {
      const nextDateStr = toDate(nextInflow.receiveDate).toISOString().split('T')[0];
      periodEnd = new Date(nextDateStr + 'T00:00:00.000Z');
      periodEnd.setUTCDate(periodEnd.getUTCDate() - 1); // Day before next top-up
      periodEnd.setUTCHours(23, 59, 59, 999);
    } else {
      // If no next top-up, go up to today
      periodEnd = new Date();
      periodEnd.setUTCHours(23, 59, 59, 999);
      if (periodEnd < endOfDayForReceive) {
          periodEnd = new Date(endOfDayForReceive);
      }
    }

    const periodStartDateStr = periodStart.toISOString().split('T')[0];

    // 1. Opening Balance at start of the period
    const periodOpeningBalance = await this.getBalanceByDate(periodStartDateStr);

    // 2. Fetch ALL inflows for the period
    const periodInflows = await prisma.pettyCashFlow.findMany({
      where: {
        receiveDate: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { receiveDate: 'asc' },
    });

    // 3. Fetch ALL expenses for the period
    const periodExpenses = await prisma.expense.findMany({
      where: {
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty cash', 'petty_cash'] },
        expenseDate: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { expenseDate: 'asc' },
    });

    // 4. Generate daily breakdown for the days in the period
    const dailyBreakdown = [];
    let runningBalance = periodOpeningBalance;

    // Generate array of days
    const daysInPeriod = [];
    for (let d = new Date(periodStart); d <= periodEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        daysInPeriod.push(new Date(d));
    }

    for (const currentDate of daysInPeriod) {
      const { start, end, dateStr } = getUtcDayBounds(currentDate);

      const dayInflows = periodInflows.filter((inf) => {
        const d = toDate(inf.receiveDate);
        return d >= start && d <= end;
      });
      const dayExpenses = periodExpenses.filter((exp) => {
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
        inflows: dayInflows.map((inf) => ({
          id: inf.id,
          receivedAmount: Number(inf.receivedAmount),
          receiveFrom: inf.receiveFrom,
          paymentMethod: inf.paymentMethod,
          receiveDate: inf.receiveDate,
        })),
        expenses: dayExpenses.map((exp) => ({
          id: exp.id,
          itemName: exp.itemName,
          category: exp.category,
          amount: Number(exp.amount),
          expenseDate: exp.expenseDate,
          paymentMode: exp.paymentMode,
          remarks: exp.remarks || '',
        })),
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
    const totalInflowToday = periodInflows
      .filter((inf) => {
        const d = toDate(inf.receiveDate);
        return d >= inflowStart && d <= inflowEnd;
      })
      .reduce((s, inf) => s + Number(inf.receivedAmount), 0);
    const totalOutflowToday = periodExpenses
      .filter((exp) => {
        const d = toDate(exp.expenseDate);
        return d >= inflowStart && d <= inflowEnd;
      })
      .reduce((s, exp) => s + Number(exp.amount), 0);

    return {
      ...inflow,
      dailyBreakdown,
      weeklyOpeningBalance: periodOpeningBalance,
      weeklyClosingBalance: runningBalance,
      openingBalance: periodOpeningBalance,
      closingBalance: runningBalance,
      totalInflowToday,
      totalOutflowToday,
      weeklyExpenses: periodExpenses,
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
        paymentMode: { in: ['Petty Cash', 'Petty cash', 'petty cash', 'petty_cash'] },
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
