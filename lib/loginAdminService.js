import { prisma } from './prisma';
import { safeExecute } from './dbHelpers';

/**
 * Create a new login admin record
 * @param {Object} data - { mobile, password }
 */
export async function createLoginAdmin(data) {
  return safeExecute(() =>
    prisma.loginAdmin.create({
      data: {
        mobile: data.mobile,
        password: data.password,
      },
    })
  );
}

/**
 * Get all login admin records
 */
export async function getAllLoginAdmins() {
  return safeExecute(() =>
    prisma.loginAdmin.findMany({
      orderBy: { id: 'desc' },
    })
  );
}
