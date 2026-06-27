// lib/rightsService.js
import { safeExecute } from './dbHelpers.js';

/** Create a right */
export async function createRight(data) {
  const payload = {
    module: data.module ?? null,
    displayName: data.displayName ?? null,
    rightName: data.rightName ?? null,
    description: data.description ?? null,
  };

  return safeExecute((prisma) =>
    prisma.rights.create({
      data: payload,
    })
  );
}

/** Get all rights */
export async function getAllRights() {
  return safeExecute((prisma) =>
    prisma.rights.findMany({
      orderBy: [{ module: 'asc' }, { displayName: 'asc' }],
    })
  );
}

/** Get single right by id */
export async function getRightById(id) {
  return safeExecute((prisma) =>
    prisma.rights.findUnique({
      where: { id },
    })
  );
}

/** Update right */
export async function updateRight(id, data) {
  const updateData = {};

  if ('module' in data) updateData.module = data.module ?? null;
  if ('displayName' in data) updateData.displayName = data.displayName ?? null;
  if ('rightName' in data) updateData.rightName = data.rightName ?? null;
  if ('description' in data) updateData.description = data.description ?? null;

  return safeExecute((prisma) =>
    prisma.rights.update({
      where: { id },
      data: updateData,
    })
  );
}

/** Delete right (RoleRights cascade handled by schema) */
export async function deleteRight(id) {
  return safeExecute((prisma) =>
    prisma.rights.delete({
      where: { id },
    })
  );
}
