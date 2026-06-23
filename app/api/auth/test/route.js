import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  try {
    const emp = await prisma.employee.findFirst({ select: { id: true } });
    await prisma.notification.createMany({
      data: [
        { title: 'Test', message: 'Msg', type: 'TEST', recipientId: emp.id },
      ],
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({
      error: e.message,
      code: e.code,
      stack: e.stack,
    });
  }
}
