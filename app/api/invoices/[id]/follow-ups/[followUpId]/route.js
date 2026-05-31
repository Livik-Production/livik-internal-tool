import { NextResponse } from 'next/server';
import { updateInvoiceFollowUp, deleteInvoiceFollowUp } from '../../../../../../lib/invoiceService';

export async function PUT(req, { params }) {
  try {
    const { followUpId } = params;
    const body = await req.json();

    if (!body.date || !body.time || !body.notes) {
      return NextResponse.json(
        { error: 'Date, time, and notes are required' },
        { status: 400 }
      );
    }

    const updated = await updateInvoiceFollowUp(followUpId, body);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update follow-up' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { followUpId } = params;
    await deleteInvoiceFollowUp(followUpId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete follow-up' },
      { status: 500 }
    );
  }
}
