import { prisma } from './prisma';
import { NotificationService } from '../services/notification.service';

export const assetAssignmentService = {
  assignAsset: async (
    assetId,
    employeeId,
    assignedDate,
    notes,
    assignmentType = 'EMPLOYEE',
    locationId = null
  ) => {
    const exists = await prisma.assetAssignment.findFirst({
      where: { assetId, returnDate: null },
    });
    if (exists) throw new Error('Asset already assigned');

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId,
        assignmentType,
        employeeId: assignmentType === 'EMPLOYEE' ? employeeId : null,
        locationId: assignmentType === 'LOCATION' ? locationId : null,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        notes,
      },
      include: { asset: true },
    });

    // Notify employee if applicable
    if (assignmentType === 'EMPLOYEE' && employeeId) {
      await NotificationService.createBulkNotifications([employeeId], {
        title: 'Asset Assigned',
        message: `A new asset (${assignment.asset.modelName || assignment.asset.assetTag || 'Hardware'}) has been assigned to you.`,
        type: 'ASSET',
      }).catch((err) =>
        console.error('Failed to notify employee of asset assignment', err)
      );
    }

    return assignment;
  },

  listAssigned: async () => {
    return prisma.assetAssignment.findMany({
      where: { returnDate: null },
      include: { asset: true, employee: true },
    });
  },

  getById: async (id) => {
    return prisma.assetAssignment.findUnique({
      where: { id },
      include: { asset: true, employee: true },
    });
  },

  deleteAssignment: async (id) => {
    return prisma.assetAssignment.delete({ where: { id } });
  },

  returnAsset: async (assignmentId, returnDate) => {
    return prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: {
        returnDate: returnDate ? new Date(returnDate) : new Date(),
        status: 'RETURNED',
      },
    });
  },

  unassignedAssets: async () => {
    return prisma.asset.findMany({
      where: {
        assignments: { none: { returnDate: null } },
      },
    });
  },

  history: async (assetId) => {
    return prisma.assetAssignment.findMany({
      where: { assetId },
      include: { employee: true },
      orderBy: { assignedDate: 'desc' },
    });
  },
};
