import { prisma } from './prisma';
import { safeExecute } from './dbHelpers';

// Get all assets
export async function getAllAssets() {
  return safeExecute(() =>
    prisma.asset.findMany({
      include: {
        category: true,
        repairs: {
          orderBy: { dateOfGivingtoRepair: 'desc' },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                empId: true,
                firstName: true,
                lastName: true,
                department: true,
                workLocation: true,
              },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

// Get asset by ID
export async function getAssetById(id) {
  return safeExecute(() =>
    prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        repairs: {
          orderBy: { dateOfGivingtoRepair: 'desc' },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                empId: true,
                firstName: true,
                lastName: true,
                department: true,
                workLocation: true,
              },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
      },
    })
  );
}

// Create asset
export async function createAsset(data) {
  return safeExecute(() =>
    prisma.asset.create({
      data: {
        assetTag: data.assetTag,
        categoryId: data.categoryId,
        deviceType: data.deviceType,
        brand: data.brand,
        modelName: data.modelName,
        serialNumber: data.serialNumber,
        vendor: data.vendor,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ? Number(data.purchaseCost) : null,
        warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
        invoiceFile: data.invoiceFile,
        warrantyFile: data.warrantyFile,
        notes: data.notes,
        specs: data.specs ?? null,
      },
    })
  );
}

// Update asset
export async function updateAsset(id, data) {
  const updateData = {};
  const fields = [
    'assetTag',
    'categoryId',
    'deviceType',
    'brand',
    'modelName',
    'serialNumber',
    'vendor',
    'invoiceFile',
    'warrantyFile',
    'notes',
    'specs',
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  if (data.purchaseDate !== undefined)
    updateData.purchaseDate = data.purchaseDate
      ? new Date(data.purchaseDate)
      : null;
  if (data.purchaseCost !== undefined)
    updateData.purchaseCost = data.purchaseCost
      ? Number(data.purchaseCost)
      : null;
  if (data.warrantyUntil !== undefined)
    updateData.warrantyUntil = data.warrantyUntil
      ? new Date(data.warrantyUntil)
      : null;

  return safeExecute(() =>
    prisma.asset.update({
      where: { id },
      data: updateData,
    })
  );
}

// Delete asset
export async function deleteAsset(id) {
  return safeExecute(async () => {
    // First, delete all related assignments
    await prisma.assetAssignment.deleteMany({
      where: { assetId: id },
    });

    // Then delete the asset
    return await prisma.asset.delete({
      where: { id },
    });
  });
}
