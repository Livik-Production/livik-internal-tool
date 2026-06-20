import { prisma } from '../lib/prisma';
import { sendInvoiceReminderEmail } from '../lib/mailer';
import { NotificationService } from './notification.service.js';

export interface InvoiceReminderProcessResult {
  processed: number;
  emailsSent: number;
  notificationsCreated: number;
  failed: number;
}

/**
 * Service to process daily customer invoice reminders.
 *
 * Logic:
 *   - For each active customer with `reminderEnabled = true`, compute the
 *     target reminder date as: `invoiceToDay - reminderDaysBefore` days.
 *   - If today matches that computed reminder date, send email + in-app
 *     notifications to all super_admin employees.
 *   - Duplicate prevention: a log entry per (customerId, reminderDate) ensures
 *     we never send the same reminder twice in the same billing cycle.
 */
export async function processInvoiceReminders(): Promise<InvoiceReminderProcessResult> {
  const startTime = Date.now();

  console.log('=================================================');
  console.log('[InvoiceReminderService] Starting invoice reminder job...');
  console.log('=================================================');

  const result: InvoiceReminderProcessResult = {
    processed: 0,
    emailsSent: 0,
    notificationsCreated: 0,
    failed: 0,
  };

  try {
    const today = new Date();
    const currentDay = today.getDate(); // e.g. 19

    // Normalised "today" at midnight UTC for log key comparisons
    const todayNormalised = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );

    console.log(`[InvoiceReminderService] Today's date: ${today.toISOString()}`);
    console.log(`[InvoiceReminderService] Current day-of-month: ${currentDay}`);

    console.log('[InvoiceReminderService] SMTP Config:');
    console.log('  EMAIL_ID:', process.env.EMAIL_ID);
    console.log(
      '  GOOGLE_APP_PASSWORD:',
      process.env.GOOGLE_APP_PASSWORD ? 'SET' : 'NOT SET'
    );

    /**
     * 1. Fetch all active customers that have reminders enabled and have
     *    both invoiceFromDay and invoiceToDay configured.
     */
    const allCustomers = await prisma.customer.findMany({
      where: {
        status: 'active',
        reminderEnabled: true,
        invoiceToDay: { not: null },
      },
    });

    console.log(
      `[InvoiceReminderService] Found ${allCustomers.length} active customers with reminders enabled.`
    );

    /**
     * 2. Filter customers where TODAY is the reminder day.
     *
     *    reminderDay = invoiceToDay - reminderDaysBefore
     *
     *    We handle month-wrap-around: if the computed day falls below 1 we
     *    don't bother — such edge cases are rare and the admin can manually
     *    create the invoice.
     */
    const dueCustomers = allCustomers.filter((c) => {
      const invoiceToDay = c.invoiceToDay as number;
      const daysBefore = c.reminderDaysBefore ?? 1;
      const reminderDay = invoiceToDay - daysBefore;

      console.log(
        `[InvoiceReminderService] Customer "${c.name}": invoiceToDay=${invoiceToDay}, reminderDaysBefore=${daysBefore}, reminderDay=${reminderDay}, currentDay=${currentDay}`
      );

      // If reminderDay < 1 skip (edge-case where to-day is 1 and days-before >= 1)
      if (reminderDay < 1) {
        console.warn(
          `[InvoiceReminderService] Customer "${c.name}" has reminderDay=${reminderDay} < 1 — skipping.`
        );
        return false;
      }

      return reminderDay === currentDay;
    });

    console.log(
      `[InvoiceReminderService] ${dueCustomers.length} customer(s) match today's reminder schedule.`
    );

    if (dueCustomers.length === 0) {
      console.warn(
        '[InvoiceReminderService] No customers need reminders today.'
      );
      return result;
    }

    /**
     * 3. Fetch Super Admins
     */
    const allEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { role: true },
    });

    const superAdmins = allEmployees.filter((e) => {
      const role = e.role?.roleName?.toLowerCase() ?? '';
      return (
        role === 'super-admin' ||
        role === 'super admin' ||
        role === 'superadmin' ||
        role === 'admin'
      );
    });

    console.log(
      `[InvoiceReminderService] Found ${superAdmins.length} active super admin(s):`
    );
    superAdmins.forEach((a) =>
      console.log(`  - ${a.firstName} (${a.email}) [${a.role?.roleName}]`)
    );

    if (superAdmins.length === 0) {
      console.warn(
        '[InvoiceReminderService] No active super_admin employees found. Cannot send notifications.'
      );
      return result;
    }

    /**
     * 4. Process each due customer
     */
    for (const customer of dueCustomers) {
      result.processed++;

      const invoiceToDay = customer.invoiceToDay as number;
      const daysBefore = customer.reminderDaysBefore ?? 1;

      console.log('-------------------------------------------------');
      console.log(
        `[InvoiceReminderService] Processing Customer: ${customer.name} ` +
          `(invoice due on day ${invoiceToDay}, reminder ${daysBefore} day(s) before)`
      );
      console.log('-------------------------------------------------');

      try {
        /**
         * Duplicate Check — one reminder per customer per calendar day
         */
        const existingLog = await prisma.invoiceReminderLog.findUnique({
          where: {
            customerId_reminderDate: {
              customerId: customer.id,
              reminderDate: todayNormalised,
            },
          },
        });

        if (existingLog) {
          console.warn(
            `[InvoiceReminderService] Reminder already sent for "${customer.name}" today. Skipping.`
          );
          continue;
        }

        /**
         * In-App Notifications for all super admins
         */
        const recipientIds = superAdmins.map((admin) => admin.id);

        const notificationPayload = {
          title: 'Invoice Creation Reminder',
          message: `Invoice for ${customer.name} is due in ${daysBefore} day(s) (day ${invoiceToDay}). Please create the invoice.`,
          type: 'INVOICE_CYCLE',
          customerId: customer.id,
        };

        console.log(
          `[InvoiceReminderService] Creating ${recipientIds.length} in-app notification(s)...`
        );

        await NotificationService.createBulkNotifications(
          recipientIds,
          notificationPayload
        );

        result.notificationsCreated += recipientIds.length;
        console.log(
          '[InvoiceReminderService] In-app notifications created successfully.'
        );

        /**
         * Email to each super admin
         */
        for (const admin of superAdmins) {
          if (!admin.email) {
            console.warn(
              `[InvoiceReminderService] Admin "${admin.firstName}" has no email. Skipping email.`
            );
            continue;
          }

          try {
            console.log(
              `[InvoiceReminderService] Sending email to ${admin.email}...`
            );

            await sendInvoiceReminderEmail(
              admin.email,
              admin.firstName,
              customer.name,
              invoiceToDay,
              daysBefore
            );

            console.log(
              `[InvoiceReminderService] ✅ Email sent to ${admin.email}`
            );

            result.emailsSent++;
          } catch (emailError) {
            console.error(
              `[InvoiceReminderService] ❌ Email failed for ${admin.email}:`,
              emailError
            );
            result.failed++;
          }
        }

        /**
         * Log success — prevents re-sending within the same day
         */
        await prisma.invoiceReminderLog.create({
          data: {
            customerId: customer.id,
            reminderDate: todayNormalised,
          },
        });

        console.log(
          `[InvoiceReminderService] Reminder log created for "${customer.name}".`
        );
      } catch (err) {
        result.failed++;
        console.error(
          `[InvoiceReminderService] Failed processing customer "${customer.name}":`,
          err
        );
      }
    }
  } catch (globalErr) {
    console.error(
      '[InvoiceReminderService] Global processing error:',
      globalErr
    );
    throw globalErr;
  }

  const duration = Date.now() - startTime;

  console.log('=================================================');
  console.log('[InvoiceReminderService] Job Completed');
  console.log('  Processed:              ', result.processed);
  console.log('  Emails Sent:            ', result.emailsSent);
  console.log('  Notifications Created:  ', result.notificationsCreated);
  console.log('  Failed:                 ', result.failed);
  console.log('  Duration:               ', duration, 'ms');
  console.log('=================================================');

  return result;
}