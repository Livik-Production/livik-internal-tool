// lib/roleRightsService.js
import { safeExecute } from './dbHelpers.js';

/** Assign a right to a role */
export async function assignRightToRole({ roleId, rightId }) {
  return safeExecute((prisma) =>
    prisma.roleRights.create({
      data: {
        roleId,
        rightId,
      },
      include: {
        role: true,
        right: true,
      },
    })
  );
}

/** Get all role ↔ rights mappings */
export async function getAllRoleRights() {
  return safeExecute((prisma) =>
    prisma.roleRights.findMany({
      include: {
        role: true,
        right: true,
      },
      orderBy: {
        role: { displayName: 'asc' },
      },
    })
  );
}

/** Get rights by roleId */
export async function getRightsByRoleId(roleId) {
  return safeExecute((prisma) =>
    prisma.roleRights.findMany({
      where: { roleId },
      include: { right: true },
      orderBy: { right: { displayName: 'asc' } },
    })
  );
}

/** Remove a right from a role (delete mapping row) */
export async function removeRightFromRole(mappingId) {
  return safeExecute((prisma) =>
    prisma.roleRights.delete({
      where: { id: mappingId },
    })
  );
}

/** Remove all rights for a role (e.g., before reassigning) */
export async function clearRightsForRole(roleId) {
  return safeExecute((prisma) =>
    prisma.roleRights.deleteMany({
      where: { roleId },
    })
  );
}
