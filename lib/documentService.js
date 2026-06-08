import { prisma } from './prisma';

export async function createDocumentRequest(data) {
  return await prisma.documentRequest.create({
    data: {
      employeeId: data.employeeId,
      documentType: data.documentType,
      documentUrl: data.documentUrl,
      proofLabel: data.proofLabel,
      status: 'PENDING',
      requestedByRole: data.requestedByRole,
      requestedById: data.requestedById,
    },
  });
}

export async function getDocumentRequests(filters = {}) {
  const { status, requestedByRole, employeeId } = filters;
  
  return await prisma.documentRequest.findMany({
    where: {
      ...(status && { status }),
      ...(requestedByRole && { requestedByRole }),
      ...(employeeId && { employeeId }),
    },
    include: {
      employee: {
        select: {
          id: true,
          empId: true,
          firstName: true,
          lastName: true,
          designation: true,
          photo: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function processDocumentRequest(requestId, status, processedBy, remarks) {
  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error('Request not found');

  return await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.documentRequest.update({
      where: { id: requestId },
      data: {
        status,
        processedBy,
        processedAt: new Date(),
        remarks,
      },
    });

    if (status === 'APPROVED') {
      // Apply the change to the Employee model
      const updateData = {};
      if (request.documentType === 'aadhaarCard') {
        updateData.aadhaarCard = request.documentUrl;
      } else if (request.documentType === 'panCard') {
        updateData.panCard = request.documentUrl;
      } else if (request.documentType === 'photo') {
        updateData.photo = request.documentUrl;
      } else if (request.documentType === 'proofs') {
        // Handle proofs array update
        const employee = await tx.employee.findUnique({
          where: { id: request.employeeId },
          select: { proofs: true },
        });
        
        const proofs = Array.isArray(employee.proofs) ? employee.proofs : [];
        const newProofs = [...proofs, { label: request.proofLabel, url: request.documentUrl }];
        updateData.proofs = newProofs;
      }

      await tx.employee.update({
        where: { id: request.employeeId },
        data: updateData,
      });
    }

    return updatedRequest;
  });
}
