// lib/expenseService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Helpers
 */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

/**
 * Create expense
 */
export async function createExpense(data) {
  if (!data?.category) throw new Error('category is required');
  if (!data?.itemName) throw new Error('itemName is required');
  if (!data?.paymentMode) throw new Error('paymentMode is required');
  if (data?.amount == null) throw new Error('amount is required');
  if (!data?.expenseDate) throw new Error('expenseDate is required');

  return safeExecute((prisma) =>
    prisma.expense.create({
      data: {
        category: data.category,
        itemName: data.itemName,
        paymentMode: data.paymentMode,
        amount: Number(data.amount),
        expenseDate: toDate(data.expenseDate),
        remarks: data.remarks ?? null,
        attachment: data.attachment ?? null,
      },
    })
  );
}

/**
 * Get all expenses (with optional filters)
 */
export async function getAllExpenses(filters = {}) {
  return safeExecute((prisma) =>
    prisma.expense.findMany({
      where: {
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              expenseDate: {
                ...(filters.fromDate ? { gte: toDate(filters.fromDate) } : {}),
                ...(filters.toDate ? { lte: toDate(filters.toDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { expenseDate: 'desc' },
    })
  );
}

/**
 * Get expense by ID
 */
export async function getExpenseById(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.expense.findUnique({
      where: { id },
    })
  );
}

/**
 * Update expense
 */
export async function updateExpense(id, data) {
  if (!id) throw new Error('id is required');

  const updateData = {};
  if ('category' in data) updateData.category = data.category;
  if ('itemName' in data) updateData.itemName = data.itemName;
  if ('paymentMode' in data) updateData.paymentMode = data.paymentMode;
  if ('amount' in data) updateData.amount = Number(data.amount);
  if ('expenseDate' in data) updateData.expenseDate = toDate(data.expenseDate);
  if ('remarks' in data) updateData.remarks = data.remarks ?? null;
  if ('attachment' in data) updateData.attachment = data.attachment ?? null;

  return safeExecute((prisma) =>
    prisma.expense.update({
      where: { id },
      data: updateData,
    })
  );
}

/**
 * Delete expense
 */
export async function deleteExpense(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.expense.delete({
      where: { id },
    })
  );
}
