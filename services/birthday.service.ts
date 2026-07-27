// services/birthday.service.ts
import { prisma } from '../lib/prisma';
import { sendBirthdayEmail } from '../lib/mailer';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  isActive: boolean;
}

export interface BirthdayProcessResult {
  processed: number;
  success: number;
  failed: number;
}

/**
 * Service to process daily birthday emails.
 * It queries active employees whose birthday matches today's date,
 * checks for duplicates in the current year, sends emails,
 * and logs successes and failures in the database.
 */
export async function processBirthdays(): Promise<BirthdayProcessResult> {
  const startTime = Date.now();
  console.log('[BirthdayService] Starting birthday email job...');

  const result: BirthdayProcessResult = {
    processed: 0,
    success: 0,
    failed: 0,
  };

  try {
    // 1. Fetch active employees whose birthday is today
    const employees = await prisma.$queryRaw<Employee[]>`
      SELECT *
      FROM "Employee"
      WHERE "isActive" = true
      AND "dateOfBirth" IS NOT NULL
      AND EXTRACT(MONTH FROM "dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM "dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
    `;

    console.log(`[BirthdayService] Found ${employees.length} active employees with birthdays today.`);

    const currentYear = new Date().getFullYear();

    // 2. Process each employee
    for (const employee of employees) {
      result.processed++;
      const name = employee.firstName;
      const email = employee.email;

      try {
        // Check duplicate prevention
        const existingLog = await (prisma as any).birthdayEmailLog.findUnique({
          where: {
            employeeId_sentYear: {
              employeeId: employee.id,
              sentYear: currentYear,
            },
          },
        });

        if (existingLog && existingLog.isSuccess) {
          console.log(`[BirthdayService] Email already sent successfully to Employee ${employee.id} (${name}) for year ${currentYear}. Skipping.`);
          // Not counted as successful send, but processed.
          continue;
        }

        if (!email) {
          throw new Error('Employee has no email address configured.');
        }

        // Send birthday email
        await sendBirthdayEmail(email, name);

        // Success Logging
        await (prisma as any).birthdayEmailLog.upsert({
          where: {
            employeeId_sentYear: {
              employeeId: employee.id,
              sentYear: currentYear,
            },
          },
          update: {
            isSuccess: true,
            error: null,
            sentAt: new Date(),
          },
          create: {
            employeeId: employee.id,
            sentYear: currentYear,
            isSuccess: true,
          },
        });

        result.success++;
        console.log(`[BirthdayService] Successfully sent birthday email to ${name} (${email}).`);
      } catch (err: any) {
        result.failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[BirthdayService] Failed to process birthday email for Employee ${employee.id} (${name}): ${errorMessage}`);

        // Failure Logging
        try {
          await (prisma as any).birthdayEmailLog.upsert({
            where: {
              employeeId_sentYear: {
                employeeId: employee.id,
                sentYear: currentYear,
              },
            },
            update: {
              isSuccess: false,
              error: errorMessage,
              sentAt: new Date(),
            },
            create: {
              employeeId: employee.id,
              sentYear: currentYear,
              isSuccess: false,
              error: errorMessage,
            },
          });
        } catch (logErr) {
          console.error(`[BirthdayService] Critical: Failed to create failure log for Employee ${employee.id}:`, logErr);
        }
      }
    }
  } catch (globalErr: any) {
    console.error('[BirthdayService] Global error in birthday service processing:', globalErr);
    throw globalErr;
  }

  const duration = Date.now() - startTime;
  console.log(`[BirthdayService] Birthday email job completed in ${duration}ms. Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}`);

  return result;
}
