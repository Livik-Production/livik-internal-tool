import { NextResponse } from 'next/server';
import { processInvoiceReminders } from '../../../../services/invoice-reminder.service';

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const todayParam = url.searchParams.get('today');

  console.log('[Cron Invoice Reminder] Cron started.');

  try {
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCronHeader === '1';
    const isValidSecret =
      cronSecret &&
      (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);

    if (!isVercelCron && !isValidSecret) {
      console.warn('[Cron Invoice Reminder] Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let todayOverride: Date | undefined;

    if (todayParam) {
      todayOverride = new Date(todayParam);

      if (Number.isNaN(todayOverride.getTime())) {
        return NextResponse.json(
          { error: 'Invalid today query parameter. Use YYYY-MM-DD.' },
          { status: 400 }
        );
      }
    }

    const result = await processInvoiceReminders({ today: todayOverride });

    const duration = Date.now() - startTime;
    console.log('[Cron Invoice Reminder] Cron completed.');
    console.log(
      `[Cron Invoice Reminder] Summary - Processed: ${result.processed}, Emails Sent: ${result.emailsSent}, Notifications Created: ${result.notificationsCreated}, Failed: ${result.failed}, Duration: ${duration}ms`
    );

    return NextResponse.json({
      processed: result.processed,
      emailsSent: result.emailsSent,
      notificationsCreated: result.notificationsCreated,
      failed: result.failed,
      durationMs: duration,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[Cron Invoice Reminder] Cron failed after ${duration}ms:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
