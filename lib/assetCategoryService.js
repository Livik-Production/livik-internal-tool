import { safeExecute } from './dbHelpers.js';

/** Create Asset Category */
export async function createAssetCategory(data) {
  const payload = {
    name: data.name ?? null,
  };

  return safeExecute((prisma) =>
    prisma.assetCategory.create({
      data: payload,
    })
  );
}

/** Get all asset categories */
export async function getAllAssetCategories() {
  return safeExecute((prisma) =>
    prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    })
  );
}

/** Get asset category by ID */
export async function getAssetCategoryById(id) {
  return safeExecute((prisma) =>
    prisma.assetCategory.findUnique({
      where: { id },
    })
  );
}

/** Update category (name only for now) */
export async function updateAssetCategory(id, data) {
  const updateData = {};
  if ('name' in data) updateData.name = data.name ?? null;

  return safeExecute((prisma) =>
    prisma.assetCategory.update({
      where: { id },
      data: updateData,
    })
  );
}

/** Delete Category — Assets remain but lose category ref if FK not restricted */
export async function deleteAssetCategory(id) {
  return safeExecute((prisma) =>
    prisma.assetCategory.delete({
      where: { id },
    })
  );
}
