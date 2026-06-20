// app/api/cron/birthday/route.ts
import { NextResponse } from 'next/server';
import { processBirthdays } from '../../../../services/birthday.service';

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[Cron Birthday] Cron started.');

  try {
    // 1. Authorization check
    // Vercel calls cron routes with: x-vercel-cron: 1
    // CRON_SECRET Bearer token is optional for manual/external triggers.
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCronHeader === '1';
    const isValidSecret =
      cronSecret &&
      (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);

    if (!isVercelCron && !isValidSecret) {
      console.warn('[Cron Birthday] Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Process birthdays
    const result = await processBirthdays();

    const duration = Date.now() - startTime;
    console.log('[Cron Birthday] Cron completed.');
    console.log(
      `[Cron Birthday] Summary - Total Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}, Duration: ${duration}ms`
    );

    return NextResponse.json({
      processed: result.processed,
      success: result.success,
      failed: result.failed,
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Cron Birthday] Cron failed after ${duration}ms:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Support POST requests as well for flexibility
export async function POST(request: Request) {
  return GET(request);
}
