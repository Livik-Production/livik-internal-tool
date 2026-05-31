import { safeExecute } from './dbHelpers';

export async function createPayment(data) {
  const {
    invoiceId,
    amount,
    paymentMethod,
    paymentDate,
    notes,
    referenceNumber,
  } = data;

  if (!invoiceId) throw new Error('Invoice ID is required');
  if (!amount) throw new Error('Amount is required');

  return safeExecute(async (prisma) => {
    // 1. Get current invoice to check totals
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    // 2. Create Payment Record
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId,
        receivedAmount: Number(amount),
        paymentMethod: paymentMethod || 'Unknown',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        remarks: notes || referenceNumber || '',
      },
    });

    // 3. Update Invoice Status
    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + Number(p.receivedAmount), 0) +
      Number(amount);
    const totalAmount = Number(invoice.total);

    let newStatus = 'PENDING';
    if (totalPaid >= totalAmount - 1) {
      // -1 tolerance for float issues
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    return payment;
  });
}

export async function getPaymentsByInvoiceId(invoiceId) {
  return safeExecute((prisma) =>
    prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    })
  );
}
