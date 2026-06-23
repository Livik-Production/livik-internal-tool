import { prisma } from '../lib/prisma';
import { sendAnniversaryEmail } from '../lib/mailer';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  dateOfJoining: Date | null;
  isActive: boolean;
}

export interface AnniversaryProcessResult {
  processed: number;
  success: number;
  failed: number;
}

/**
 * Service to process daily work anniversary emails.
 * It queries active employees whose anniversary matches today's date,
 * checks for duplicates in the current year, sends emails,
 * and logs successes and failures in the database.
 */
export async function processAnniversaries(): Promise<AnniversaryProcessResult> {
  const startTime = Date.now();
  console.log('[AnniversaryService] Starting work anniversary email job...');

  const result: AnniversaryProcessResult = {
    processed: 0,
    success: 0,
    failed: 0,
  };

  try {
    // 1. Fetch active employees whose work anniversary is today (at least 1 year completed)
    const employees = await prisma.$queryRaw<Employee[]>`
      SELECT *
      FROM "Employee"
      WHERE "isActive" = true
      AND "dateOfJoining" IS NOT NULL
      AND EXTRACT(MONTH FROM "dateOfJoining") = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM "dateOfJoining") = EXTRACT(DAY FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM "dateOfJoining") >= 1
    `;

    console.log(`[AnniversaryService] Found ${employees.length} active employees with anniversaries today.`);

    const currentYear = new Date().getFullYear();

    // 2. Process each employee
    for (const employee of employees) {
      result.processed++;
      const name = employee.firstName;
      const email = employee.email;
      const dateOfJoining = employee.dateOfJoining ? new Date(employee.dateOfJoining) : null;
      if (!dateOfJoining) continue;

      const yearsCompleted = currentYear - dateOfJoining.getFullYear();

      try {
        // Check duplicate prevention
        const existingLog = await (prisma as any).workAnniversaryEmailLog.findUnique({
          where: {
            employeeId_sentYear: {
              employeeId: employee.id,
              sentYear: currentYear,
            },
          },
        });

        if (existingLog && existingLog.isSuccess) {
          console.log(`[AnniversaryService] Anniversary email already sent successfully to Employee ${employee.id} (${name}) for year ${currentYear}. Skipping.`);
          continue;
        }

        if (!email) {
          throw new Error('Employee has no email address configured.');
        }

        // Send anniversary email
        await sendAnniversaryEmail(email, name, yearsCompleted);

        // Success Logging
        await (prisma as any).workAnniversaryEmailLog.upsert({
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
        console.log(`[AnniversaryService] Successfully sent anniversary email to ${name} (${email}).`);
      } catch (err: any) {
        result.failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[AnniversaryService] Failed to process anniversary email for Employee ${employee.id} (${name}): ${errorMessage}`);

        // Failure Logging
        try {
          await (prisma as any).workAnniversaryEmailLog.upsert({
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
          console.error(`[AnniversaryService] Critical: Failed to create failure log for Employee ${employee.id}:`, logErr);
        }
      }
    }
  } catch (globalErr: any) {
    console.error('[AnniversaryService] Global error in anniversary service processing:', globalErr);
    throw globalErr;
  }

  const duration = Date.now() - startTime;
  console.log(`[AnniversaryService] Anniversary email job completed in ${duration}ms. Processed: ${result.processed}, Success: ${result.success}, Failed: ${result.failed}`);

  return result;
}
