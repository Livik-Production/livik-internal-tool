import { prisma } from '../lib/prisma';
import { sendInvoiceReminderEmail } from '../lib/mailer';
import { calculateInvoiceCycle, getInvoiceReminderCandidates } from '../helpers/invoice-date.helper';
import { NotificationService } from './notification.service.js';

export interface InvoiceReminderProcessResult {
  processed: number;
  emailsSent: number;
  notificationsCreated: number;
  failed: number;
}

export interface InvoiceReminderProcessOptions {
  today?: Date;
}

/**
 * Service to process invoice reminders based on the customer billing cycle.
 *
 * The invoice cycle spans from the configured invoice-from day in the current
 * month to the configured invoice-to day in the next month. A reminder is sent
 * on the real reminder date derived from the invoice end date and the configured
 * number of days before it.
 */
export async function processInvoiceReminders(
  options: InvoiceReminderProcessOptions = {}
): Promise<InvoiceReminderProcessResult> {
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
    const today = options.today ? new Date(options.today) : new Date();
    const todayNormalised = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    console.log(`[InvoiceReminderService] Today's date: ${today.toISOString()}`);

    console.log('[InvoiceReminderService] SMTP Config:');
    console.log('  EMAIL_ID:', process.env.EMAIL_ID);
    console.log(
      '  GOOGLE_APP_PASSWORD:',
      process.env.GOOGLE_APP_PASSWORD ? 'SET' : 'NOT SET'
    );

    /**
     * 1. Fetch all active customers that have reminders enabled and a fully
     *    configured invoice cycle.
     */
    const allCustomers = await prisma.customer.findMany({
      where: {
        status: 'active',
        reminderEnabled: true,
        invoiceFromDay: { not: null },
        invoiceToDay: { not: null },
      },
    });

    console.log(
      `[InvoiceReminderService] Found ${allCustomers.length} active customers with reminders enabled.`
    );

    /**
     * 2. Resolve the current invoice cycle for each customer and select only
     *    those whose reminder date is today.
     */
    const dueCustomers = allCustomers
      .map((customer) => {
        const cycles = getInvoiceReminderCandidates(customer, today);
        const matchingCycle = cycles.find(
          (cycle) => cycle.reminderDate.getTime() === todayNormalised.getTime()
        );

        if (!matchingCycle) {
          console.log(
            `[InvoiceReminderService] Customer "${customer.name}" is not due today. Checked cycles: ${cycles
              .map((cycle) => cycle.reminderDate.toISOString())
              .join(', ')}`
          );
          return null;
        }

        console.log(
          `[InvoiceReminderService] Customer "${customer.name}": start=${matchingCycle.invoiceStartDate.toISOString()}, end=${matchingCycle.invoiceEndDate.toISOString()}, reminder=${matchingCycle.reminderDate.toISOString()}`
        );

        return { customer, cycle: matchingCycle };
      })
      .filter(
        (item): item is { customer: typeof allCustomers[number]; cycle: ReturnType<typeof getInvoiceReminderCandidates>[number] } => Boolean(item)
      );

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
     * 3. Fetch Super Admins.
     */
    const allEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { role: true },
    });

    const superAdmins = allEmployees.filter((employee) => {
      const role = employee.role?.roleName?.toLowerCase() ?? '';
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
    superAdmins.forEach((admin) =>
      console.log(`  - ${admin.firstName} (${admin.email}) [${admin.role?.roleName}]`)
    );

    if (superAdmins.length === 0) {
      console.warn(
        '[InvoiceReminderService] No active super_admin employees found. Cannot send notifications.'
      );
      return result;
    }

    /**
     * 4. Process each due customer.
     */
    for (const { customer, cycle } of dueCustomers) {
      result.processed++;

      const invoiceToDay = customer.invoiceToDay as number;
      const daysBefore = customer.reminderDaysBefore ?? 1;

      console.log('-------------------------------------------------');
      console.log(
        `[InvoiceReminderService] Processing Customer: ${customer.name} ` +
          `(invoice cycle ${cycle.invoiceStartDate.toISOString()} → ${cycle.invoiceEndDate.toISOString()}, reminder ${cycle.reminderDate.toISOString()})`
      );
      console.log('-------------------------------------------------');

      try {
        /**
         * Duplicate Check — one reminder per customer per reminder date.
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
            `[InvoiceReminderService] Reminder already sent for "${customer.name}" on ${todayNormalised.toISOString()}. Skipping.`
          );
          continue;
        }

        /**
         * In-App Notifications for all super admins.
         */
        const recipientIds = superAdmins.map((admin) => admin.id);

        const notificationPayload = {
          title: 'Invoice Creation Reminder',
          message: `Invoice for ${customer.name} is due on ${cycle.invoiceEndDate.toDateString()}. Please create the invoice.`,
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
         * Email to each super admin.
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
         * Log success — prevents re-sending for the same reminder date.
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