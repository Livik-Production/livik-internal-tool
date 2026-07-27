import { NextResponse } from 'next/server';
import { deleteHoliday } from '../../../../../lib/holidayService';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}
