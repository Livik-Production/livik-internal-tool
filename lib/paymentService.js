import { safeExecute } from './dbHelpers';

export async function createPayment(data) {
  const {
    invoiceId,
    amount,
    paymentMethod,
    paymentDate,
    notes,
    referenceNumber,
    nextInstallmentDate,
  } = data;

  if (!invoiceId) throw new Error('Invoice ID is required');
  if (!amount) throw new Error('Amount is required');

  return safeExecute(async (prisma) => {
    // 1. Get current invoice to check totals (including both relations)
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, partialPayments: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    const totalPaidPayments = invoice.payments.reduce((sum, p) => sum + Number(p.receivedAmount), 0);
    const totalPaidPartial = invoice.partialPayments.reduce((sum, p) => sum + Number(p.receivedAmount), 0);
    const totalPaid = totalPaidPayments + totalPaidPartial + Number(amount);
    const totalAmount = Number(invoice.total);

    let newStatus = 'PENDING';
    let isPartialPayment = false;
    if (totalPaid >= totalAmount - 1) {
      // -1 tolerance for float issues
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
      isPartialPayment = true;
    }

    // 2. Create Payment Record in respective table
    let payment;
    if (isPartialPayment) {
      payment = await prisma.invoicePartialPayment.create({
        data: {
          invoiceId,
          receivedAmount: Number(amount),
          paymentMethod: paymentMethod || 'Unknown',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          remarks: notes || referenceNumber || '',
          nextInstallmentDate: nextInstallmentDate ? new Date(nextInstallmentDate) : null,
        },
      });
    } else {
      payment = await prisma.invoicePayment.create({
        data: {
          invoiceId,
          receivedAmount: Number(amount),
          paymentMethod: paymentMethod || 'Unknown',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          remarks: notes || referenceNumber || '',
        },
      });
    }

    // 3. Update Invoice Status and optionally due date
    const invoiceUpdateData = { status: newStatus };
    if (newStatus === 'PARTIAL' && nextInstallmentDate) {
      invoiceUpdateData.dueDate = new Date(nextInstallmentDate);
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: invoiceUpdateData,
    });

    return payment;
  });
}

export async function getPaymentsByInvoiceId(invoiceId) {
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
