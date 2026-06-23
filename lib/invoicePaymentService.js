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
async function updateInvoiceStatus(prisma, invoiceId, nextInstallmentDate = null) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true, partialPayments: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  const paidAmountPayments = invoice.payments.reduce(
    (sum, p) => sum + Number(p.receivedAmount || 0),
    0
  );
  const paidAmountPartial = invoice.partialPayments.reduce(
    (sum, p) => sum + Number(p.receivedAmount || 0),
    0
  );
  const paidAmount = paidAmountPayments + paidAmountPartial;

  let status = 'PENDING';
  if (paidAmount > 0 && paidAmount < Number(invoice.total)) {
    status = 'PARTIAL';
  } else if (paidAmount >= Number(invoice.total)) {
    status = 'PAID';
  }

  const invoiceUpdateData = { status };
  if (status === 'PARTIAL' && nextInstallmentDate) {
    invoiceUpdateData.dueDate = toDate(nextInstallmentDate);
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: invoiceUpdateData,
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
      include: { payments: true, partialPayments: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    const totalPaidPayments = invoice.payments.reduce((sum, p) => sum + Number(p.receivedAmount), 0);
    const totalPaidPartial = invoice.partialPayments.reduce((sum, p) => sum + Number(p.receivedAmount), 0);
    const totalPaid = totalPaidPayments + totalPaidPartial + Number(data.receivedAmount);
    const totalAmount = Number(invoice.total);

    let isPartialPayment = false;
    if (totalPaid < totalAmount - 1) {
      isPartialPayment = true;
    }

    let payment;
    if (isPartialPayment) {
      payment = await prisma.invoicePartialPayment.create({
        data: {
          invoiceId,
          receivedAmount: Number(data.receivedAmount),
          paymentMethod: data.paymentMethod,
          paymentDate: toDate(data.paymentDate),
          remarks: data.remarks ?? null,
          nextInstallmentDate: data.nextInstallmentDate ? toDate(data.nextInstallmentDate) : null,
        },
      });
    } else {
      payment = await prisma.invoicePayment.create({
        data: {
          invoiceId,
          receivedAmount: Number(data.receivedAmount),
          paymentMethod: data.paymentMethod,
          paymentDate: toDate(data.paymentDate),
          remarks: data.remarks ?? null,
        },
      });
    }

    // Update invoice status
    await updateInvoiceStatus(prisma, invoiceId, data.nextInstallmentDate);

    return payment;
  });
}

/**
 * Get all payments for an invoice
 */
export async function getInvoicePayments(invoiceId) {
  if (!invoiceId) throw new Error('invoiceId is required');

  return safeExecute(async (prisma) => {
    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
    const partialPayments = await prisma.invoicePartialPayment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });

    const all = [
      ...payments.map((p) => ({ ...p, isPartial: false })),
      ...partialPayments.map((p) => ({ ...p, isPartial: true })),
    ];

    return all.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  });
}
