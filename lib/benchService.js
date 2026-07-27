import { safeExecute } from './dbHelpers.js';

/**
 * Calculate how many days an employee has been on bench.
 * @param {Date|string} benchStartDate
 * @returns {number}
 */
export function calcBenchDays(benchStartDate) {
  if (!benchStartDate) return 0;
  const start = new Date(benchStartDate);
  const now = new Date();
  const diffMs = now - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Put an employee on bench (creates or resets their BenchDetail record).
 * Call this when:
 *   - A new employee is created
 *   - An employee is removed from a project
 * @param {string} employeeId
 */
export async function putEmployeeOnBench(employeeId) {
  return safeExecute((prisma) =>
    prisma.benchDetail.upsert({
      where: { employeeId },
      create: {
        employeeId,
        benchStartDate: new Date(),
      },
      update: {
        benchStartDate: new Date(), // reset the clock
      },
    })
  );
}

/**
 * Remove an employee from bench (they have been assigned to a project).
 * @param {string} employeeId
 */
export async function removeEmployeeFromBench(employeeId) {
  return safeExecute(async (prisma) => {
    // Soft-delete: simply remove the record so they no longer appear on bench
    await prisma.benchDetail.deleteMany({
      where: { employeeId },
    });
  });
}

/**
 * Get bench detail for a single employee, including calculated bench days.
 * @param {string} employeeId
 */
export async function getEmployeeBenchDetail(employeeId) {
  const record = await safeExecute((prisma) =>
    prisma.benchDetail.findUnique({
      where: { employeeId },
    })
  );
  if (!record) return null;
  return {
    ...record,
    benchDays: calcBenchDays(record.benchStartDate),
  };
}

/**
 * Get all bench details (for all employees currently on bench),
 * with dynamically calculated bench days.
 */
export async function getAllBenchDetails() {
  const records = await safeExecute((prisma) =>
    prisma.benchDetail.findMany({
      include: {
        employee: {
          select: {
            id: true,
            empId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            photo: true,
            totalExperience: true,
            projectsDone: true,
            skills: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { benchStartDate: 'asc' },
    })
  );

  return records.map((r) => ({
    ...r,
    benchDays: calcBenchDays(r.benchStartDate),
  }));
}
