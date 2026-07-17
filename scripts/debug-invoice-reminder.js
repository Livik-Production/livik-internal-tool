import { prisma } from '../lib/prisma.js';

function calculateInvoiceCycle(customer, today) {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const nextMonthIndex = (month + 1) % 12;
  const nextMonthYear = month === 11 ? year + 1 : year;

  const invoiceFromDay = typeof customer.invoiceFromDay === 'number' ? customer.invoiceFromDay : 1;
  const invoiceToDay = typeof customer.invoiceToDay === 'number' ? customer.invoiceToDay : 1;
  const reminderDaysBefore = Math.max(1, customer.reminderDaysBefore ?? 1);

  const invoiceStartDate = new Date(Date.UTC(year, month, Math.max(1, Math.min(invoiceFromDay, 31)), 0, 0, 0, 0));
  const daysInNextMonth = new Date(Date.UTC(nextMonthYear, nextMonthIndex + 1, 0)).getUTCDate();
  const safeInvoiceToDay = Math.min(invoiceToDay, daysInNextMonth);
  const invoiceEndDate = new Date(Date.UTC(nextMonthYear, nextMonthIndex, safeInvoiceToDay, 0, 0, 0, 0));

  const reminderDate = new Date(invoiceEndDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - reminderDaysBefore);

  return { invoiceStartDate, invoiceEndDate, reminderDate };
}

const today = new Date(Date.UTC(2026, 7, 6));

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      status: 'active',
      reminderEnabled: true,
      invoiceFromDay: { not: null },
      invoiceToDay: { not: null },
    },
  });

  console.log('Today:', today.toISOString());
  console.log('Eligible active customers:', customers.length);

  for (const customer of customers) {
    const cycle = calculateInvoiceCycle(customer, today);
    console.log({
      id: customer.id,
      name: customer.name,
      invoiceFromDay: customer.invoiceFromDay,
      invoiceToDay: customer.invoiceToDay,
      reminderDaysBefore: customer.reminderDaysBefore,
      invoiceStartDate: cycle.invoiceStartDate.toISOString(),
      invoiceEndDate: cycle.invoiceEndDate.toISOString(),
      reminderDate: cycle.reminderDate.toISOString(),
      isToday: cycle.reminderDate.getTime() === today.getTime(),
    });
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
