export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request) {
  try {
    // In a real app with custom auth, you would extract userId from a verified JWT or session cookie.
    // We are extracting it from headers for now.
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id') || request.headers.get('user-id') || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json([]);
    }

    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50 notifications
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
