import { NextResponse } from 'next/server';
import {
  getHolidays,
  addHoliday,
  bulkAddHolidays,
} from '../../../../lib/holidayService';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    // If year is not provided, maybe default to current or next year?
    // Or just return all (service handles undefined year by returning all)
    // Let's pass whatever is provided.
    const holidays = await getHolidays(year);
    return NextResponse.json(holidays);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      // Bulk add
      const result = await bulkAddHolidays(body);
      return NextResponse.json(result, { status: 201 });
    } else {
      // Single add
      const result = await addHoliday(body);
      return NextResponse.json(result, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to add holiday' },
      { status: 500 }
    );
  }
}
