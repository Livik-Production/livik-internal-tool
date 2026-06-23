import { NextResponse } from 'next/server';
import { createPayment } from '../../../lib/paymentService';
import { safeExecute } from '../../../lib/dbHelpers.js';

export async function GET(request) {
  try {
    const payments = await safeExecute(async (prisma) => {
      const allPayments = await prisma.invoicePayment.findMany({
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            include: {
              items: true,
            },
          },
        },
      });

      const allPartialPayments = await prisma.invoicePartialPayment.findMany({
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            include: {
              items: true,
            },
          },
        },
      });

      const combined = [
        ...allPayments.map((p) => ({ ...p, isPartial: false })),
        ...allPartialPayments.map((p) => ({ ...p, isPartial: true })),
      ];

      combined.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      // Enrich payment data with customer information
      const enrichedPayments = await Promise.all(
        combined.map(async (payment) => {
          let customer = null;

          // Extract customer from invoice items metadata
          if (payment.invoice?.items) {
            const metaItem = payment.invoice.items.find(
              (i) => i.serialNumber === -1
            );
            if (metaItem && metaItem.particular.startsWith('CID:')) {
              const customerId = metaItem.particular.split('CID:')[1];
              customer = await prisma.customer.findUnique({
                where: { id: customerId },
              });
            }
          }

          return {
            id: payment.id,
            invoiceId: payment.invoiceId,
            invoiceNumber: payment.invoice?.invoiceNumber || 'N/A',
            amount: Number(payment.receivedAmount || 0),
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate,
            date: payment.paymentDate, // Alias for UI
            remarks: payment.remarks,
            customer: customer,
            client: customer?.name || 'Unknown Client',
            isPartial: payment.isPartial,
            nextInstallmentDate: payment.nextInstallmentDate || null,
          };
        })
      );

      return enrichedPayments;
    });

    return NextResponse.json(JSON.parse(JSON.stringify(payments)));
  } catch (error) {
    console.error('GET /api/payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createPayment(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
