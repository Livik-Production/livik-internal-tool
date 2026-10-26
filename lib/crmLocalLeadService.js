// lib/crmLocalLeadService.js
import { safeExecute } from './dbHelpers.js';
import { randomUUID } from 'crypto';

/**
 * Generate CRM Local Lead ID (format: LK-CRM-LOC-XXXX)
 */
export async function generateLocalLeadId(pad = 4) {
  await safeExecute((prismaClient) =>
    prismaClient.$executeRaw`CREATE SEQUENCE IF NOT EXISTS crm_local_lead_number_seq START 1;`
  );

  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting?.findUnique?.({ where: { module: 'crm_local_lead' } })
    );
  } catch (err) {
    console.error('Error fetching CRM Local Lead ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : 'LK-CRM-LOC-';
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute((prismaClient) =>
    prismaClient.$queryRaw`SELECT nextval('crm_local_lead_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (crm_local_lead_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

/**
 * Get all CRM local leads ordered by newest first
 */
export async function getAllCrmLocalLeads() {
  return safeExecute(async (prisma) => {
    if (prisma?.crmLocalLead?.findMany) {
      return prisma.crmLocalLead.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    // Resilient fallback for un-restarted Next.js dev server instances
    const records = await prisma.$queryRaw`
      SELECT 
        id,
        lead_id AS "leadId",
        lead_name AS "leadName",
        phone_number AS "phoneNumber",
        lead_owner AS "leadOwner",
        date,
        whatsapp,
        email,
        linkedin_url AS "linkedinUrl",
        company_name AS "companyName",
        source,
        visibility,
        keywords,
        notes,
        stage,
        follow_ups AS "followUps",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM crm_local_leads
      ORDER BY created_at DESC;
    `;
    return records;
  });
}

/**
 * Get a single CRM local lead by ID
 */
export async function getCrmLocalLeadById(id) {
  if (!id) throw new Error('id is required');
  return safeExecute(async (prisma) => {
    if (prisma?.crmLocalLead?.findUnique) {
      return prisma.crmLocalLead.findUnique({
        where: { id },
      });
    }

    const records = await prisma.$queryRaw`
      SELECT 
        id,
        lead_id AS "leadId",
        lead_name AS "leadName",
        phone_number AS "phoneNumber",
        lead_owner AS "leadOwner",
        date,
        whatsapp,
        email,
        linkedin_url AS "linkedinUrl",
        company_name AS "companyName",
        source,
        visibility,
        keywords,
        notes,
        stage,
        follow_ups AS "followUps",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM crm_local_leads
      WHERE id = ${id}
      LIMIT 1;
    `;
    return records?.[0] || null;
  });
}

/**
 * Create a new CRM local lead
 */
export async function createCrmLocalLead(data) {
  if (!data?.leadName) throw new Error('leadName is required');
  if (!data?.phoneNumber) throw new Error('phoneNumber is required');
  if (!data?.leadOwner) throw new Error('leadOwner is required');
  if (!data?.date) throw new Error('date is required');

  let finalLeadId = data.leadId;
  if (!finalLeadId || finalLeadId.startsWith('LOC-')) {
    finalLeadId = await generateLocalLeadId();
  }

  return safeExecute(async (prisma) => {
    if (prisma?.crmLocalLead?.create) {
      return prisma.crmLocalLead.create({
        data: {
          leadId: finalLeadId,
          leadName: data.leadName,
          phoneNumber: data.phoneNumber,
          leadOwner: data.leadOwner,
          date: new Date(data.date),
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          linkedinUrl: data.linkedinUrl || null,
          companyName: data.companyName || null,
          source: data.source || null,
          visibility: data.visibility || 'Everyone',
          keywords: data.keywords || null,
          notes: data.notes || null,
          stage: data.stage || 'New',
          followUps: Array.isArray(data.followUps) ? data.followUps : [],
        },
      });
    }

    const id = randomUUID();
    const dateVal = new Date(data.date);
    const followUpsJson = JSON.stringify(Array.isArray(data.followUps) ? data.followUps : []);
    const stageVal = data.stage || 'New';

    const res = await prisma.$queryRaw`
      INSERT INTO crm_local_leads (
        id,
        lead_id,
        lead_name,
        phone_number,
        lead_owner,
        date,
        whatsapp,
        email,
        linkedin_url,
        company_name,
        source,
        visibility,
        keywords,
        notes,
        stage,
        follow_ups,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${finalLeadId},
        ${data.leadName},
        ${data.phoneNumber},
        ${data.leadOwner},
        ${dateVal},
        ${data.whatsapp || null},
        ${data.email || null},
        ${data.linkedinUrl || null},
        ${data.companyName || null},
        ${data.source || null},
        ${data.visibility || 'Everyone'},
        ${data.keywords || null},
        ${data.notes || null},
        ${stageVal},
        ${followUpsJson}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING 
        id,
        lead_id AS "leadId",
        lead_name AS "leadName",
        phone_number AS "phoneNumber",
        lead_owner AS "leadOwner",
        date,
        whatsapp,
        email,
        linkedin_url AS "linkedinUrl",
        company_name AS "companyName",
        source,
        visibility,
        keywords,
        notes,
        stage,
        follow_ups AS "followUps",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;
    return res?.[0];
  });
}

/**
 * Update an existing CRM local lead
 */
export async function updateCrmLocalLead(id, data) {
  if (!id) throw new Error('id is required');

  const updatePayload = {};
  if (data.leadName !== undefined) updatePayload.leadName = data.leadName;
  if (data.phoneNumber !== undefined) updatePayload.phoneNumber = data.phoneNumber;
  if (data.leadOwner !== undefined) updatePayload.leadOwner = data.leadOwner;
  if (data.date !== undefined) updatePayload.date = new Date(data.date);
  if (data.whatsapp !== undefined) updatePayload.whatsapp = data.whatsapp || null;
  if (data.email !== undefined) updatePayload.email = data.email || null;
  if (data.linkedinUrl !== undefined) updatePayload.linkedinUrl = data.linkedinUrl || null;
  if (data.companyName !== undefined) updatePayload.companyName = data.companyName || null;
  if (data.source !== undefined) updatePayload.source = data.source || null;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
  if (data.keywords !== undefined) updatePayload.keywords = data.keywords || null;
  if (data.notes !== undefined) updatePayload.notes = data.notes || null;
  if (data.stage !== undefined || data.status !== undefined) {
    updatePayload.stage = data.stage ?? data.status;
  }
  if (data.followUps !== undefined) {
    updatePayload.followUps = Array.isArray(data.followUps) ? data.followUps : [];
  }

  return safeExecute(async (prisma) => {
    if (prisma?.crmLocalLead?.update) {
      return prisma.crmLocalLead.update({
        where: { id },
        data: updatePayload,
      });
    }

    const current = await getCrmLocalLeadById(id);
    if (!current) throw new Error('Local lead not found');

    const leadName = data.leadName ?? current.leadName;
    const phoneNumber = data.phoneNumber ?? current.phoneNumber;
    const leadOwner = data.leadOwner ?? current.leadOwner;
    const dateVal = data.date ? new Date(data.date) : new Date(current.date);
    const whatsapp = 'whatsapp' in data ? (data.whatsapp || null) : current.whatsapp;
    const email = 'email' in data ? (data.email || null) : current.email;
    const linkedinUrl = 'linkedinUrl' in data ? (data.linkedinUrl || null) : current.linkedinUrl;
    const companyName = 'companyName' in data ? (data.companyName || null) : current.companyName;
    const source = 'source' in data ? (data.source || null) : current.source;
    const visibility = data.visibility ?? current.visibility ?? 'Everyone';
    const keywords = 'keywords' in data ? (data.keywords || null) : current.keywords;
    const notes = 'notes' in data ? (data.notes || null) : current.notes;
    const stage = data.stage ?? data.status ?? current.stage ?? 'New';
    const followUps = Array.isArray(data.followUps) ? data.followUps : (current.followUps || []);
    const followUpsJson = JSON.stringify(followUps);

    const res = await prisma.$queryRaw`
      UPDATE crm_local_leads
      SET
        lead_name = ${leadName},
        phone_number = ${phoneNumber},
        lead_owner = ${leadOwner},
        date = ${dateVal},
        whatsapp = ${whatsapp},
        email = ${email},
        linkedin_url = ${linkedinUrl},
        company_name = ${companyName},
        source = ${source},
        visibility = ${visibility},
        keywords = ${keywords},
        notes = ${notes},
        stage = ${stage},
        follow_ups = ${followUpsJson}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id,
        lead_id AS "leadId",
        lead_name AS "leadName",
        phone_number AS "phoneNumber",
        lead_owner AS "leadOwner",
        date,
        whatsapp,
        email,
        linkedin_url AS "linkedinUrl",
        company_name AS "companyName",
        source,
        visibility,
        keywords,
        notes,
        stage,
        follow_ups AS "followUps",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;
    return res?.[0];
  });
}

/**
 * Delete a CRM local lead by ID
 */
export async function deleteCrmLocalLead(id) {
  if (!id) throw new Error('id is required');

  return safeExecute(async (prisma) => {
    if (prisma?.crmLocalLead?.delete) {
      return prisma.crmLocalLead.delete({
        where: { id },
      });
    }

    await prisma.$queryRaw`
      DELETE FROM crm_local_leads
      WHERE id = ${id};
    `;
    return { success: true };
  });
}
