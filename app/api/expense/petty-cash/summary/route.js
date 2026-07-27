import { NextResponse } from 'next/server';
import { pettyCashService } from '../../../../../lib/pettyCashService';

export async function GET() {
  try {
    // 1️⃣ Get all inflows (top-ups)
    const inflows = await pettyCashService.getAllInflows();

    const received = inflows.reduce(
      (sum, i) => sum + Number(i.receivedAmount || 0),
      0
    );

    // 2️⃣ Get petty cash expenses ONLY
    const spends = await pettyCashService.getPettyCashSpends();

    const spent = spends.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 3️⃣ Remaining balance
    const remaining = Math.max(received - spent, 0);

    // 4️⃣ Last 2 petty cash spends
    const recentSpends = spends
      .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
      .slice(0, 2)
      .map((e) => ({
        id: e.id,
        amount: Number(e.amount || 0),
        itemName: e.itemName || e.description || 'Expense',
        date: e.expenseDate,
      }));

    // Format summary cards for UI
    const summaryCards = [
      {
        title: 'Received',
        value: received,
        currency: '₹',
        colorClass: 'bg-blue-50',
        textColorClass: 'text-blue-600',
      },
      {
        title: 'Spent',
        value: spent,
        currency: '₹',
        colorClass: 'bg-red-50',
        textColorClass: 'text-red-600',
      },
      {
        title: 'Remaining',
        value: remaining,
        currency: '₹',
        colorClass: 'bg-green-50',
        textColorClass: 'text-green-600',
      },
    ];

    return NextResponse.json({
      received,
      spent,
      remaining,
      recentSpends,
      summaryCards,
    });
  } catch (error) {
    console.error('GET /petty-cash/summary error:', error);
    return NextResponse.json(
      { error: 'Failed to load petty cash summary' },
      { status: 500 }
    );
  }
}
