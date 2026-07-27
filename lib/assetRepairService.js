import { prisma } from './prisma';
import { safeExecute } from './dbHelpers';

/**
 * Synchronize a single repair record to the Expense table
 */
async function syncRepairToExpense(repair, assetTag) {
  const amount = repair.actualCost || 0;
  if (repair.status === 'Completed' && amount > 0) {
    const requestId = repair.requestId || 'REP-UNKNOWN';
    const refString = `Repair Ref: ${requestId}`;

    // Search for existing expense using the unique reference in remarks
    const existingExpense = await prisma.expense.findFirst({
      where: {
        remarks: {
          contains: refString,
        },
      },
    });

    const expenseData = {
      category: 'Asset Maintenance',
      itemName: `Repair: ${assetTag} / ${requestId}`,
      amount: Number(amount),
      expenseDate: repair.completedOn ? new Date(repair.completedOn) : new Date(),
      paymentMode: 'Other',
      remarks: `${refString}. Asset ID: ${repair.assetId}. Vendor: ${repair.vendorName || 'Unknown'}`,
    };

    if (existingExpense) {
      // Update existing expense if details have changed
      if (
        Number(existingExpense.amount) !== Number(expenseData.amount) ||
        existingExpense.itemName !== expenseData.itemName
      ) {
        await prisma.expense.update({
          where: { id: existingExpense.id },
          data: {
            amount: expenseData.amount,
            itemName: expenseData.itemName,
            expenseDate: expenseData.expenseDate,
            remarks: expenseData.remarks,
          },
        });
      }
    } else {
      // Create new expense record
      await prisma.expense.create({
        data: expenseData,
      });
    }
  }
}

/**
 * Get all repairs for an asset
 */
export async function getRepairsByAssetId(assetId) {
  return safeExecute(() =>
    prisma.assetRepair.findMany({
      where: { assetId },
      orderBy: { dateOfGivingtoRepair: 'desc' },
    })
  );
}

/**
 * Create a repair record
 */
export async function createAssetRepair(assetId, data) {
  return safeExecute(async () => {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');

    // Auto-generate or resolve collisions for requestId
    let requestId = data.requestId;
    
    // Check if the provided ID already exists
    if (requestId) {
      const existing = await prisma.assetRepair.findUnique({ where: { requestId } });
      if (existing) requestId = null; // Force regeneration if duplicate
    }

    if (!requestId) {
      const lastRepair = await prisma.assetRepair.findFirst({
        orderBy: { requestId: 'desc' },
        where: { requestId: { startsWith: 'REP-' } }
      });
      
      let nextNum = 1;
      if (lastRepair && lastRepair.requestId) {
        const match = lastRepair.requestId.match(/REP-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      requestId = `REP-${String(nextNum).padStart(3, '0')}`;
    }

    const repairData = {
      assetId,
      requestId,
      dateOfGivingtoRepair: new Date(data.dateOfGivingtoRepair || data.reportDate || data.date || new Date()),
      vendorName: data.vendorName || data.vendor || 'Unknown',
      issueType: data.issueType || 'Hardware',
      estimatedCost: Number(data.estimatedCost || data.cost || 0),
      description: data.description || data.issue || 'No description',
      status: data.status || 'Reported',
      completedOn: data.completedOn || data.completedDate ? new Date(data.completedOn || data.completedDate) : null,
      actualCost: data.actualCost ? Number(data.actualCost) : null,
    };

    const repair = await prisma.assetRepair.create({
      data: repairData,
    });

    await syncRepairToExpense(repair, asset.assetTag);
    return repair;
  });
}

/**
 * Update a repair record
 */
export async function updateAssetRepair(id, data) {
  return safeExecute(async () => {
    const existing = await prisma.assetRepair.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!existing) throw new Error('Repair record not found');

    const updateData = {};
    if (data.requestId) updateData.requestId = data.requestId;
    if (data.dateOfGivingtoRepair || data.reportDate || data.date) 
      updateData.dateOfGivingtoRepair = new Date(data.dateOfGivingtoRepair || data.reportDate || data.date);
    if (data.vendorName || data.vendor) updateData.vendorName = data.vendorName || data.vendor;
    if (data.issueType) updateData.issueType = data.issueType;
    if (data.estimatedCost !== undefined || data.cost !== undefined) 
      updateData.estimatedCost = Number(data.estimatedCost ?? data.cost);
    if (data.description || data.issue) updateData.description = data.description || data.issue;
    if (data.status) updateData.status = data.status;
    if (data.completedOn || data.completedDate) 
      updateData.completedOn = new Date(data.completedOn || data.completedDate);
    if (data.actualCost !== undefined) updateData.actualCost = Number(data.actualCost);

    const updated = await prisma.assetRepair.update({
      where: { id },
      data: updateData,
    });

    await syncRepairToExpense(updated, existing.asset.assetTag);
    return updated;
  });
}

/**
 * Delete a repair record
 */
export async function deleteAssetRepair(id) {
  return safeExecute(() =>
    prisma.assetRepair.delete({
      where: { id },
    })
  );
}
