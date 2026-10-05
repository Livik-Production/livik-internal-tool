// lib/quotationService.js
import { safeExecute } from './dbHelpers.js';

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

function calcSubtotal(items = []) {
  return items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
}

async function enrichQuotation(q, prisma) {
  if (!q) return null;

  const customer = q.customerId
    ? await prisma.customer.findUnique({ where: { id: q.customerId } })
    : null;

  return {
    ...q,
    customer,
    client: customer?.name || 'Unknown Client',
    date: q.quotationDate,
  };
}

/**
 * Create quotation
 */
export async function createQuotation(data) {
  if (!data?.quotationNumber) throw new Error('quotationNumber is required');
  if (!data?.quotationDate) throw new Error('quotationDate is required');
  if (!data?.customerId) throw new Error('customerId is required');

  if (!Array.isArray(data?.items) || data.items.length === 0) {
    throw new Error('At least one quotation item is required');
  }

  const subTotal = calcSubtotal(data.items);

  return safeExecute((prisma) =>
    prisma.quotation.create({
      data: {
        quotationNumber: data.quotationNumber,
        quotationDate: toDate(data.quotationDate),
        customerId: data.customerId,
        subject: data.subject || null,
        greeting: data.greeting || null,
        gstPercent: Number(data.gstPercent || 0),
        termsAndConditions: data.termsAndConditions || null,
        subTotal,
        status: data.status || 'DRAFT',

        items: {
          create: data.items.map((item, index) => ({
            serialNumber: item.serialNumber ?? index + 1,
            moduleName: item.moduleName,
            amount: Number(item.amount),
          })),
        },
      },
      include: { items: true },
    })
  );
}

/**
 * Get all quotations
 */
export async function getAllQuotations(filters = {}) {
  return safeExecute(async (prisma) => {
    const quotations = await prisma.quotation.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              quotationDate: {
                ...(filters.fromDate ? { gte: toDate(filters.fromDate) } : {}),
                ...(filters.toDate ? { lte: toDate(filters.toDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { quotationDate: 'desc' },
      include: { items: true },
    });

    return Promise.all(quotations.map((q) => enrichQuotation(q, prisma)));
  });
}

/**
 * Get quotation by ID
 */
export async function getQuotationById(id) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    return enrichQuotation(quotation, prisma);
  });
}

/**
 * Update quotation
 */
export async function updateQuotation(id, data) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) throw new Error('Quotation not found');

    const items =
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : existing.items;

    const subTotal = calcSubtotal(items);

    // Replace items if provided
    if (Array.isArray(data.items)) {
      await prisma.quotationItem.deleteMany({
        where: { quotationNumber: existing.quotationNumber },
      });

      await prisma.quotationItem.createMany({
        data: data.items.map((item, index) => ({
          quotationNumber: existing.quotationNumber,
          serialNumber: item.serialNumber ?? index + 1,
          moduleName: item.moduleName,
          amount: Number(item.amount),
        })),
      });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        quotationDate:
          'quotationDate' in data ? toDate(data.quotationDate) : undefined,
        customerId: 'customerId' in data ? data.customerId : undefined,
        subject: 'subject' in data ? data.subject : undefined,
        greeting: 'greeting' in data ? data.greeting : undefined,
        gstPercent:
          'gstPercent' in data ? Number(data.gstPercent) : undefined,
        termsAndConditions:
          'termsAndConditions' in data ? data.termsAndConditions : undefined,
        status: 'status' in data ? data.status : undefined,
        subTotal,
      },
      include: { items: true },
    });

    return enrichQuotation(updated, prisma);
  });
}

/**
 * Delete quotation
 */
export async function deleteQuotation(id) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw new Error('Quotation not found');

    await prisma.quotationItem.deleteMany({
      where: { quotationNumber: quotation.quotationNumber },
    });

    return prisma.quotation.delete({ where: { id } });
  });
}
