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
      ...(requestedByRole && { 
        requestedByRole: requestedByRole.includes(',') 
          ? { in: requestedByRole.split(',') } 
          : requestedByRole 
      }),
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

  let s3Key = null;

  if (status === 'APPROVED') {
    const s3DocTypes = {
      'aadhaarCard': 'AADHAR',
      'panCard': 'PAN',
      'photo': 'PROFILE_PHOTO'
    };

    const docType = request.documentType;

    if (s3DocTypes[docType]) {
      const employee = await prisma.employee.findUnique({
        where: { id: request.employeeId },
        select: { empId: true }
      });
      if (!employee) throw new Error('Employee not found');

      // Fetch file from Vercel Blob URL
      const fileResponse = await fetch(request.documentUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch document from temporary URL: ${request.documentUrl}`);
      }
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      
      const urlParts = request.documentUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'document';
      
      const file = new File([buffer], filename, { type: contentType });
      
      const { uploadEmployeeDocument } = await import('./employeeDocumentService');
      
      // Upload to S3 (this also updates the employee record in DB)
      const s3Result = await uploadEmployeeDocument(
        employee.empId,
        s3DocTypes[docType],
        file
      );
      s3Key = s3Result.key;
    }
  }

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
        updateData.aadhaarCard = s3Key || request.documentUrl;
      } else if (request.documentType === 'panCard') {
        updateData.panCard = s3Key || request.documentUrl;
      } else if (request.documentType === 'photo') {
        updateData.photo = s3Key || request.documentUrl;
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
