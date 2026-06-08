// lib/invoicePaymentService.js
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
 * Recalculate invoice status after payment
 */
async function updateInvoiceStatus(prisma, invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  const paidAmount = invoice.payments.reduce(
    (sum, p) => sum + Number(p.receivedAmount || 0),
    0
  );

  let status = 'PENDING';
  if (paidAmount > 0 && paidAmount < Number(invoice.total)) {
    status = 'PARTIAL';
  } else if (paidAmount >= Number(invoice.total)) {
    status = 'PAID';
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  });
}

/**
 * Add payment to an invoice
 */
export async function addInvoicePayment(invoiceId, data) {
  if (!invoiceId) throw new Error('invoiceId is required');
  if (!data?.receivedAmount) throw new Error('receivedAmount is required');
  if (!data?.paymentMethod) throw new Error('paymentMethod is required');
  if (!data?.paymentDate) throw new Error('paymentDate is required');

  return safeExecute(async (prisma) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Create payment
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId,
        receivedAmount: Number(data.receivedAmount),
        paymentMethod: data.paymentMethod,
        paymentDate: toDate(data.paymentDate),
        remarks: data.remarks ?? null,
      },
    });

    // Update invoice status
    await updateInvoiceStatus(prisma, invoiceId);

    return payment;
  });
}

/**
 * Get all payments for an invoice
 */
export async function getInvoicePayments(invoiceId) {
  if (!invoiceId) throw new Error('invoiceId is required');

  return safeExecute((prisma) =>
    prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    })
  );
}
