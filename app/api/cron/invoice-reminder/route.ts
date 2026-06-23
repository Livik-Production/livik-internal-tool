// app/api/cron/invoice-reminder/route.ts
import { NextResponse } from 'next/server';
import { processInvoiceReminders } from '../../../../services/invoice-reminder.service';

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[Cron InvoiceReminder] Cron started.');

  try {
    // 1. Authorization check
    // Vercel internally calls cron routes with the header: x-vercel-cron: 1
    // Optionally, CRON_SECRET can also be set for external/manual triggers.
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCronHeader === '1';
    const isValidSecret =
      cronSecret &&
      (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);

    if (!isVercelCron && !isValidSecret) {
      console.warn('[Cron InvoiceReminder] Unauthorized access attempt.', {
        vercelCronHeader,
        hasAuthHeader: !!authHeader,
        hasCronSecret: !!cronSecret,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Process invoice reminders
    const result = await processInvoiceReminders();

    const duration = Date.now() - startTime;
    console.log('[Cron InvoiceReminder] Cron completed.');
    console.log(
      `[Cron InvoiceReminder] Summary — Processed: ${result.processed}, Emails: ${result.emailsSent}, Notifications: ${result.notificationsCreated}, Failed: ${result.failed}, Duration: ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      emailsSent: result.emailsSent,
      notificationsCreated: result.notificationsCreated,
      failed: result.failed,
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[Cron InvoiceReminder] Cron failed after ${duration}ms:`,
      error
    );
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