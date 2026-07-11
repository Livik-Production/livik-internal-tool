import { prisma } from './prisma';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './s3';

export async function refreshS3Url(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') return oldUrl;
  if (!oldUrl.includes('.s3.') && !oldUrl.includes('amazonaws.com')) return oldUrl;
  
  try {
    const urlObj = new URL(oldUrl);
    // Pathname usually starts with a slash, we want the key
    const key = decodeURIComponent(urlObj.pathname.substring(1));
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    const freshUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days
    return freshUrl;
  } catch (err) {
    console.error('Error refreshing S3 URL:', err);
    return oldUrl;
  }
}
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
  
  const requests = await prisma.documentRequest.findMany({
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

  return await Promise.all(requests.map(async (req) => {
    if (req.documentUrl) {
      req.documentUrl = await refreshS3Url(req.documentUrl);
    }
    return req;
  }));
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

      // Refresh URL to prevent expiration errors during approval
      const freshUrl = await refreshS3Url(request.documentUrl);
      
      // Fetch file from S3 URL
      const fileResponse = await fetch(freshUrl);
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
