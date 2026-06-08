import { prisma } from './prisma';

export const assetAssignmentService = {
  assignAsset: async (assetId, employeeId, assignedDate, notes) => {
    const exists = await prisma.assetAssignment.findFirst({
      where: { assetId, returnDate: null },
    });
    if (exists) throw new Error('Asset already assigned');

    return prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        notes,
      },
    });
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
