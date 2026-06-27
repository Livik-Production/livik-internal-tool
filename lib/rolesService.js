// lib/rolesService.js
import { safeExecute } from './dbHelpers.js';

/** Create role */
export async function createRole(data) {
  // Generate roleName from displayName if missing
  let roleName = data.roleName;
  if (!roleName && data.displayName) {
    roleName = data.displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  const payload = {
    displayName: data.displayName ?? null,
    roleName: roleName ?? null,
    description: data.description ?? null,
  };

  return safeExecute(async (prisma) => {
    // Handle rights if provided
    let rightsCreate = undefined;
    if (data.rights && Array.isArray(data.rights) && data.rights.length > 0) {
      // Find rights by display name
      const rightsRecords = await prisma.rights.findMany({
        where: { displayName: { in: data.rights } },
        select: { id: true },
      });

      if (rightsRecords.length > 0) {
        rightsCreate = {
          create: rightsRecords.map((r) => ({ rightId: r.id })),
        };
      }
    }

    return prisma.role.create({
      data: {
        ...payload,
        rights: rightsCreate,
      },
      include: {
        _count: {
          select: { rights: true },
        },
      },
    });
  });
}

/** Get all roles */
export async function getAllRoles() {
  return safeExecute((prisma) =>
    prisma.role.findMany({
      orderBy: { displayName: 'asc' },
      include: {
        _count: {
          select: { rights: true },
        },
      },
    })
  );
}

/** Get single role by id */
export async function getRoleById(id) {
  return safeExecute((prisma) =>
    prisma.role.findUnique({
      where: { id },
      include: {
        employees: true,
        rights: {
          include: {
            right: true,
          },
        },
        _count: {
          select: { rights: true, employees: true },
        },
      },
    })
  );
}

/** Update role */
export async function updateRole(id, data) {
  const updateData = {};
  if ('displayName' in data) updateData.displayName = data.displayName ?? null;
  if ('roleName' in data) updateData.roleName = data.roleName ?? null;
  if ('description' in data) updateData.description = data.description ?? null;

  return safeExecute(async (prisma) => {
    // Handle rights if provided
    let rightsUpdate = undefined;
    if (data.rights && Array.isArray(data.rights)) {
      // Find rights by display name
      const rightsRecords = await prisma.rights.findMany({
        where: { displayName: { in: data.rights } },
        select: { id: true },
      });

      // Replace existing rights
      rightsUpdate = {
        deleteMany: {}, // Remove all existing assignments
        create: rightsRecords.map((r) => ({ rightId: r.id })), // Add new assignments
      };
    }

    return prisma.role.update({
      where: { id },
      data: {
        ...updateData,
        rights: rightsUpdate,
      },
      include: {
        _count: {
          select: { rights: true },
        },
      },
    });
  });
}

/** Delete role (RoleRights cascade handled by schema) */
export async function deleteRole(id) {
  return safeExecute((prisma) =>
    prisma.role.delete({
      where: { id },
    })
  );
}
