import { NextResponse } from 'next/server';
import { addInvoiceFollowUp } from '../../../../../lib/invoiceService';

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!body.date || !body.time || !body.notes) {
      return NextResponse.json(
        { error: 'Date, time, and notes are required' },
        { status: 400 }
      );
    }

    const followUp = await addInvoiceFollowUp(id, body);
    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('Error adding follow-up:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add follow-up' },
      { status: 500 }
    );
  }
}
