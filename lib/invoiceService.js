// lib/invoiceService.js
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

function calcTotals(items = [], taxPercent = 0, discountPercent = 0) {
  const subTotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const discountAmount = (subTotal * Number(discountPercent || 0)) / 100;
  const taxableAmount = subTotal - discountAmount;
  const taxAmount = (taxableAmount * Number(taxPercent || 0)) / 100;

  const total = taxableAmount + taxAmount;

  return { subTotal, total };
}

async function enrichInvoice(inv, prisma) {
  if (!inv) return null;

  const items = inv.items || [];
  const metaItem = items.find((i) => i.serialNumber === -1);
  let customer = null;

  if (metaItem && metaItem.particular.startsWith('CID:')) {
    const customerId = metaItem.particular.split('CID:')[1];
    customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
  }

  // Calculate Payment Status details for UI
  const totalAmount = Number(inv.total || 0);
  const totalPaid =
    inv.payments?.reduce((sum, p) => sum + Number(p.receivedAmount || 0), 0) ||
    0;
  const remainingAmount = Math.max(0, totalAmount - totalPaid);

  let paymentStatus = 'pending';
  if (totalPaid >= totalAmount - 1) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  return {
    ...inv,
    items: items.filter((i) => i.serialNumber !== -1),
    customer: customer,
    client: customer?.name || 'Unknown Client',
    paymentMethod: inv.payments?.[0]?.paymentMethod || '',
    paymentDate: inv.payments?.[0]?.paymentDate || null,
    paymentStatus,
    paidAmount: totalPaid,
    remainingAmount,
    partialAmount: totalPaid,
    amount: Number(inv.subTotal),
    totalAmount: totalAmount,
    tax: Number(inv.total) - Number(inv.subTotal),
    date: inv.invoiceDate,
    vendor: 'Livik',
    invoiceType: inv.invoiceType,
  };
}

/**
 * Create invoice
 */
export async function createInvoice(data) {
  if (!data?.invoiceNumber) throw new Error('invoiceNumber is required');
  if (!data?.invoiceDate) throw new Error('invoiceDate is required');
  if (!data?.dueDate) throw new Error('dueDate is required');

  if (!Array.isArray(data?.items) || data.items.length === 0) {
    throw new Error('At least one invoice item is required');
  }

  const taxPercent = Number(data.taxPercent || 0);
  const discountPercent = Number(data.discountPercent || 0);

  const { subTotal, total } = calcTotals(
    data.items,
    taxPercent,
    discountPercent
  );

  return safeExecute((prisma) =>
    prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: toDate(data.invoiceDate),
        dueDate: toDate(data.dueDate),

        taxPercent,
        discountPercent,
        subTotal,
        total,
        notes: data.notes || null,
        invoiceType: data.invoiceType || 'actual',
        status: 'PENDING',

        items: {
          create: [
            ...data.items.map((item, index) => ({
              serialNumber: item.serialNumber ?? index + 1,
              particular: item.particular,
              description: item.description || '',
              hsnSacCode: item.hsnSacCode,
              amount: Number(item.amount),
            })),
            // Metadata item for Customer ID
            ...(data.customerId
              ? [
                  {
                    serialNumber: -1,
                    particular: `CID:${data.customerId}`,
                    description: '',
                    hsnSacCode: 'META',
                    amount: 0,
                  },
                ]
              : []),
          ],
        },
      },
      include: { items: true, payments: true, followUps: true },
    })
  );
}

/**
 * Get all invoices
 */
export async function getAllInvoices(filters = {}) {
  return safeExecute(async (prisma) => {
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.invoiceType ? { invoiceType: filters.invoiceType } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              invoiceDate: {
                ...(filters.fromDate ? { gte: toDate(filters.fromDate) } : {}),
                ...(filters.toDate ? { lte: toDate(filters.toDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { invoiceDate: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        followUps: { orderBy: { date: 'desc' } },
      },
    });

    return Promise.all(invoices.map((inv) => enrichInvoice(inv, prisma)));
  });
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true, followUps: { orderBy: { date: 'desc' } } },
    });

    return enrichInvoice(invoice, prisma);
  });
}

/**
 * Update invoice (recalculate totals)
 */
export async function updateInvoice(id, data) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) throw new Error('Invoice not found');

    const taxPercent =
      'taxPercent' in data
        ? Number(data.taxPercent)
        : Number(existing.taxPercent);

    const discountPercent =
      'discountPercent' in data
        ? Number(data.discountPercent)
        : Number(existing.discountPercent);

    const items =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : existing.items;

    const { subTotal, total } = calcTotals(items, taxPercent, discountPercent);

    // Replace items if provided
    if (Array.isArray(data.items)) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceNumber: existing.invoiceNumber },
      });

      const newItems = data.items.map((item, index) => ({
        invoiceNumber: existing.invoiceNumber,
        serialNumber: item.serialNumber ?? index + 1,
        particular: item.particular,
        description: item.description || '',
        hsnSacCode: item.hsnSacCode,
        amount: Number(item.amount),
      }));

      // Preserve existing customer if not being updated via some other means (though updateInvoice signature doesn't support changing customer easily with this hack, we'll keep the meta item if we find it in existing items and no new customerId is provided, but for now assuming items replacement might wipe it. Need to handle preservation.)

      // Re-add metadata item for Customer ID
      const existingMeta = existing.items.find((i) => i.serialNumber === -1);
      const customerId =
        data.customerId ||
        (existingMeta && existingMeta.particular.startsWith('CID:')
          ? existingMeta.particular.split('CID:')[1]
          : null);

      if (customerId) {
        newItems.push({
          invoiceNumber: existing.invoiceNumber,
          serialNumber: -1,
          particular: `CID:${customerId}`,
          description: '',
          hsnSacCode: 'META',
          amount: 0,
        });
      }

      await prisma.invoiceItem.createMany({
        data: newItems,
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceDate:
          'invoiceDate' in data ? toDate(data.invoiceDate) : undefined,
        dueDate: 'dueDate' in data ? toDate(data.dueDate) : undefined,
        taxPercent,
        discountPercent,
        subTotal,
        total,
        notes: 'notes' in data ? data.notes : undefined,
        invoiceType: 'invoiceType' in data ? data.invoiceType : undefined,
      },
      include: { items: true, payments: true, followUps: true },
    });

    return enrichInvoice(updated, prisma);
  });
}

/**
 * Delete invoice
 */
export async function deleteInvoice(id) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');

    await prisma.invoiceItem.deleteMany({
      where: { invoiceNumber: invoice.invoiceNumber },
    });

    await prisma.invoicePayment.deleteMany({
      where: { invoiceId: id },
    });

    return prisma.invoice.delete({ where: { id } });
  });
}

/**
 * Add an invoice follow-up
 */
export async function addInvoiceFollowUp(invoiceId, data) {
  if (!invoiceId) throw new Error('Invoice ID is required');
  return safeExecute(async (prisma) => {
    return prisma.invoiceFollowUp.create({
      data: {
        invoiceId,
        date: new Date(data.date),
        time: data.time,
        notes: data.notes,
      },
    });
  });
}

/**
 * Update an invoice follow-up
 */
export async function updateInvoiceFollowUp(followUpId, data) {
  if (!followUpId) throw new Error('Follow-up ID is required');
  return safeExecute(async (prisma) => {
    return prisma.invoiceFollowUp.update({
      where: { id: followUpId },
      data: {
        date: new Date(data.date),
        time: data.time,
        notes: data.notes,
      },
    });
  });
}

/**
 * Delete an invoice follow-up
 */
export async function deleteInvoiceFollowUp(followUpId) {
  if (!followUpId) throw new Error('Follow-up ID is required');
  return safeExecute(async (prisma) => {
    return prisma.invoiceFollowUp.delete({
      where: { id: followUpId },
    });
  });
}
