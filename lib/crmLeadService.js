// lib/crmLeadService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Create CRM Lead
 */
export async function createCrmLead(data) {
  if (!data?.companyName) throw new Error('companyName is required');
  if (!data?.pocName) throw new Error('pocName is required');

  return safeExecute((prisma) =>
    prisma.crmLead.create({
      data: {
        companyName: data.companyName,
        companyAddress: data.companyAddress ?? null,
        companyEmail: data.companyEmail ?? null,
        companyWebsite: data.companyWebsite ?? null,
        pocName: data.pocName,
        pocDepartment: data.pocDepartment ?? null,
        pocMobile: data.pocMobile ?? null,
        pocEmail: data.pocEmail ?? null,
        assigneeType: data.assigneeType ?? 'EMPLOYEE',
        assignee: data.assigneeId ? { connect: { id: data.assigneeId } } : undefined,
        createdBy: data.createdBy ?? null,
        date: data.date ? new Date(data.date) : null,
        time: data.time ?? null,
        notes: data.notes ?? null,
        reminderName: data.reminderName ?? null,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        status: data.status ?? 'New',
      },
    })
  );
}

/**
 * Get all CRM Leads
 */
export async function getAllCrmLeads() {
  return safeExecute((prisma) =>
    prisma.crmLead.findMany({
      orderBy: { createdAt: 'desc' },
    })
  );
}

/**
 * Get CRM Lead by ID
 */
export async function getCrmLeadById(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.crmLead.findUnique({
      where: { id },
    })
  );
}

/**
 * Update CRM Lead
 */
export async function updateCrmLead(id, data) {
  if (!id) throw new Error('id is required');

  const updateData = {};
  if ('companyName' in data) updateData.companyName = data.companyName;
  if ('companyAddress' in data) updateData.companyAddress = data.companyAddress ?? null;
  if ('companyEmail' in data) updateData.companyEmail = data.companyEmail ?? null;
  if ('companyWebsite' in data) updateData.companyWebsite = data.companyWebsite ?? null;
  if ('pocName' in data) updateData.pocName = data.pocName;
  if ('pocDepartment' in data) updateData.pocDepartment = data.pocDepartment ?? null;
  if ('pocMobile' in data) updateData.pocMobile = data.pocMobile ?? null;
  if ('pocEmail' in data) updateData.pocEmail = data.pocEmail ?? null;
  if ('assigneeType' in data) updateData.assigneeType = data.assigneeType ?? 'EMPLOYEE';
  if ('assigneeId' in data) {
    if (data.assigneeId) {
      updateData.assignee = { connect: { id: data.assigneeId } };
    } else {
      updateData.assignee = { disconnect: true };
    }
  }
  if ('updatedBy' in data) updateData.updatedBy = data.updatedBy ?? null;
  if ('date' in data) updateData.date = data.date ? new Date(data.date) : null;
  if ('time' in data) updateData.time = data.time ?? null;
  if ('notes' in data) updateData.notes = data.notes ?? null;
  if ('reminderName' in data) updateData.reminderName = data.reminderName ?? null;
  if ('reminderDate' in data) updateData.reminderDate = data.reminderDate ? new Date(data.reminderDate) : null;
  if ('status' in data) updateData.status = data.status;

  return safeExecute((prisma) =>
    prisma.crmLead.update({
      where: { id },
      data: updateData,
    })
  );
}

/**
 * Delete CRM Lead
 */
export async function deleteCrmLead(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.crmLead.delete({
      where: { id },
    })
  );
}
