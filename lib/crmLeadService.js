// lib/crmLeadService.js
import { safeExecute } from './dbHelpers.js';

/**
 * Generate CRM Lead ID
 */
export async function generateLeadId(pad = 4) {
  await safeExecute((prismaClient) =>
    prismaClient.$executeRaw`CREATE SEQUENCE IF NOT EXISTS crm_lead_number_seq START 1;`
  );

  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting.findUnique({ where: { module: 'crm_lead' } })
    );
  } catch (err) {
    console.error('Error fetching CRM Lead ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : 'LK-CRM-LD-';
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute((prismaClient) =>
    prismaClient.$queryRaw`SELECT nextval('crm_lead_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (crm_lead_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

/**
 * Create CRM Lead
 */
export async function createCrmLead(data) {
  if (!data?.leadName) throw new Error('leadName is required');

  let finalLeadId = data.leadId;
  // If no leadId provided or it's a legacy client-generated placeholder, generate one server-side
  if (!finalLeadId || finalLeadId.startsWith('LD-')) {
    finalLeadId = await generateLeadId();
  }

  return safeExecute((prisma) =>
    prisma.crmLead.create({
      data: {
        leadId: finalLeadId,
        companyName: data.companyName ?? null,
        companyAddress: data.companyAddress ?? null,
        companyEmail: data.companyEmail ?? null,
        websiteUrl: data.websiteUrl ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        leadName: data.leadName,
        department: data.department ?? null,
        phoneNumber: data.phoneNumber,
        email: data.email,
        leadOwnerType: data.leadOwnerType ?? 'EMPLOYEE',
        leadOwner: data.leadOwnerId ? { connect: { id: data.leadOwnerId } } : undefined,
        leadOwnerName: data.leadOwnerName ?? null,
        createdBy: data.createdBy ?? null,
        date: data.date ? new Date(data.date) : null,
        time: data.time ?? null,
        activityDetails: data.activityDetails ?? null,
        followUps: data.followUps && data.followUps.length > 0 ? {
          create: data.followUps.map(f => ({
            date: f.date ? new Date(f.date) : new Date(),
            time: f.time || '',
            notes: f.notes || ''
          }))
        } : undefined,
        leadStage: data.leadStage ?? 'New',
        source: data.source ?? null,
        expectedRevenue: data.expectedRevenue ?? null,
        visibility: data.visibility ?? 'Everyone',
        whatsapp: data.whatsapp ?? null,
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
      include: { followUps: true }
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
      include: { followUps: true }
    })
  );
}

/**
 * Update CRM Lead
 */
export async function updateCrmLead(id, data) {
  if (!id) throw new Error('id is required');

  const updateData = {};
  if ('companyName' in data) updateData.companyName = data.companyName ?? null;
  if ('companyAddress' in data) updateData.companyAddress = data.companyAddress ?? null;
  if ('companyEmail' in data) updateData.companyEmail = data.companyEmail ?? null;
  if ('websiteUrl' in data) updateData.websiteUrl = data.websiteUrl ?? null;
  if ('linkedinUrl' in data) updateData.linkedinUrl = data.linkedinUrl ?? null;
  if ('leadName' in data) updateData.leadName = data.leadName;
  if ('department' in data) updateData.department = data.department ?? null;
  if ('phoneNumber' in data) updateData.phoneNumber = data.phoneNumber ?? null;
  if ('email' in data) updateData.email = data.email ?? null;
  if ('leadOwnerType' in data) updateData.leadOwnerType = data.leadOwnerType ?? 'EMPLOYEE';
  if ('leadOwnerId' in data) {
    if (data.leadOwnerId) {
      updateData.leadOwner = { connect: { id: data.leadOwnerId } };
    } else {
      updateData.leadOwner = { disconnect: true };
    }
  }
  if ('leadOwnerName' in data) updateData.leadOwnerName = data.leadOwnerName ?? null;
  if ('updatedBy' in data) updateData.updatedBy = data.updatedBy ?? null;
  if ('date' in data) updateData.date = data.date ? new Date(data.date) : null;
  if ('time' in data) updateData.time = data.time ?? null;
  if ('activityDetails' in data) updateData.activityDetails = data.activityDetails ?? null;
  if ('visibility' in data) updateData.visibility = data.visibility;
  if ('whatsapp' in data) updateData.whatsapp = data.whatsapp ?? null;
  
  if ('followUps' in data && Array.isArray(data.followUps)) {
    updateData.followUps = {
      deleteMany: {},
      create: data.followUps.map(f => ({
        date: f.date ? new Date(f.date) : new Date(),
        time: f.time || '',
        notes: f.notes || ''
      }))
    };
  }

  if ('leadStage' in data) updateData.leadStage = data.leadStage;
  if ('source' in data) updateData.source = data.source ?? null;
  if ('expectedRevenue' in data) updateData.expectedRevenue = data.expectedRevenue ?? null;

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
  )
}

/**
 * CRM Company Services
 */
export async function generateCompanyId(pad = 4) {
  await safeExecute((prismaClient) =>
    prismaClient.$executeRaw`CREATE SEQUENCE IF NOT EXISTS crm_company_number_seq START 1;`
  );

  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting.findUnique({ where: { module: 'crm_company' } })
    );
  } catch (err) {
    console.error('Error fetching CRM Company ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : 'LK-CRM-CMP-';
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute((prismaClient) =>
    prismaClient.$queryRaw`SELECT nextval('crm_company_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (crm_company_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

export async function createCrmCompany(data) {
  if (!data?.companyName) throw new Error('companyName is required');

  let finalCompanyId = data.companyId;
  if (!finalCompanyId || finalCompanyId.startsWith('CMP-')) {
    finalCompanyId = await generateCompanyId();
  }

  return safeExecute((prisma) =>
    prisma.crmCompany.create({
      data: {
        companyId: finalCompanyId,
        companyName: data.companyName,
        email: data.email ?? null,
        websiteUrl: data.websiteUrl ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        address: data.address ?? null,
        expectedRevenue: data.expectedRevenue ?? null,
        industry: data.industry ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        country: data.country ?? null,
        contactName: data.contactName ?? null,
        contactPhone: data.contactPhone ?? null,
        documentUrl: data.documentUrl ?? null,
        source: data.source ?? null,
      },
    })
  );
}

export async function getAllCrmCompanies() {
  return safeExecute((prisma) =>
    prisma.crmCompany.findMany({
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function updateCrmCompany(id, data) {
  if (!id) throw new Error('id is required');
  
  const updateData = { ...data };
  delete updateData.id;
  delete updateData.companyId;
  delete updateData.type;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  return safeExecute((prisma) =>
    prisma.crmCompany.update({
      where: { id },
      data: updateData,
    })
  );
}

export async function deleteCrmCompany(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.crmCompany.delete({
      where: { id },
    })
  );
}

/**
 * CRM Interview Services
 */
export async function generateInterviewId(pad = 4) {
  await safeExecute((prismaClient) =>
    prismaClient.$executeRaw`CREATE SEQUENCE IF NOT EXISTS crm_interview_number_seq START 1;`
  );

  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting.findUnique({ where: { module: 'crm_interview' } })
    );
  } catch (err) {
    console.error('Error fetching CRM Interview ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : 'LK-CRM-INT-';
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute((prismaClient) =>
    prismaClient.$queryRaw`SELECT nextval('crm_interview_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (crm_interview_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

export async function createCrmInterview(data) {
  if (!data?.title || !data?.candidateName) throw new Error('title and candidateName are required');

  let finalInterviewId = data.interviewId;
  if (!finalInterviewId || finalInterviewId.startsWith('INT-')) {
    finalInterviewId = await generateInterviewId();
  }

  return safeExecute((prisma) =>
    prisma.crmInterview.create({
      data: {
        interviewId: finalInterviewId,
        title: data.title,
        jobDescription: data.jobDescription ?? null,
        description: data.description ?? null,
        candidateName: data.candidateName,
        date: data.date ? new Date(data.date) : null,
        time: data.time ?? null,
        interviewersName: data.interviewersName ?? null,
        interviewersEmail: data.interviewersEmail ?? null,
        companyName: data.companyName ?? null,
        result: data.result ?? 'Pending',
        feedback: data.feedback ?? null,
        notes: data.notes ?? null,
        organizerName: data.organizerName ?? null,
        organizerPhone: data.organizerPhone ?? null,
        organizerEmail: data.organizerEmail ?? null,
      },
    })
  );
}

export async function getAllCrmInterviews() {
  return safeExecute((prisma) =>
    prisma.crmInterview.findMany({
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function updateCrmInterview(id, data) {
  if (!id) throw new Error('id is required');
  
  const updateData = { ...data };
  delete updateData.id;
  delete updateData.interviewId;
  delete updateData.type;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  if (updateData.date) {
    updateData.date = new Date(updateData.date);
  }

  return safeExecute((prisma) =>
    prisma.crmInterview.update({
      where: { id },
      data: updateData,
    })
  );
}

export async function deleteCrmInterview(id) {
  if (!id) throw new Error('id is required');

  return safeExecute((prisma) =>
    prisma.crmInterview.delete({
      where: { id },
    })
  );
}
