// lib/sequenceService.js
import { safeExecute } from './dbHelpers.js';

/** extracts the numeric portion out of an id like "LK021" or "CE-2026-007" */
function extractNumber(idValue) {
  if (!idValue) return 0;
  const digits = String(idValue).match(/(\d+)(?!.*\d)/); // last run of digits
  if (!digits) return 0;
  const n = parseInt(digits[1], 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Each module backed by a real Postgres sequence, plus how to find the
 * highest number currently in use in its table so a reset never dips
 * below a record that still exists.
 */
const SEQUENCE_MODULES = [
  {
    module: 'employee',
    label: 'Employee ID',
    sequenceName: 'employee_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) =>
        pc.employee.findMany({ select: { empId: true } })
      ).then((rows) => Math.max(0, ...rows.map((r) => extractNumber(r.empId)))),
  },
  {
    module: 'contract_employee',
    label: 'Contract Employee ID',
    sequenceName: 'contract_employee_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) =>
        pc.employee.findMany({
          where: { contractEmpId: { not: null } },
          select: { contractEmpId: true },
        })
      ).then((rows) =>
        Math.max(0, ...rows.map((r) => extractNumber(r.contractEmpId)))
      ),
  },
  {
    module: 'crm_lead',
    label: 'CRM Lead ID',
    sequenceName: 'crm_lead_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) => pc.crmLead.findMany({ select: { leadId: true } })).then(
        (rows) => Math.max(0, ...rows.map((r) => extractNumber(r.leadId)))
      ),
  },
  {
    module: 'crm_local_lead',
    label: 'CRM Local Lead ID',
    sequenceName: 'crm_local_lead_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) =>
        pc.crmLocalLead.findMany({ select: { leadId: true } })
      ).then((rows) => Math.max(0, ...rows.map((r) => extractNumber(r.leadId)))),
  },
  {
    module: 'crm_company',
    label: 'CRM Company ID',
    sequenceName: 'crm_company_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) =>
        pc.crmCompany.findMany({ select: { companyId: true } })
      ).then((rows) => Math.max(0, ...rows.map((r) => extractNumber(r.companyId)))),
  },
  {
    module: 'crm_interview',
    label: 'CRM Interview ID',
    sequenceName: 'crm_interview_number_seq',
    getHighestUsed: () =>
      safeExecute((pc) =>
        pc.crmInterview.findMany({ select: { interviewId: true } })
      ).then((rows) =>
        Math.max(0, ...rows.map((r) => extractNumber(r.interviewId)))
      ),
  },
];

async function getSequenceCurrentValue(sequenceName) {
  try {
    const res = await safeExecute(
      (pc) =>
        pc.$queryRawUnsafe(
          `SELECT last_value, is_called FROM "${sequenceName}"`
        )
    );
    const row = res?.[0];
    if (!row) return 0;
    // If is_called is false, nextval() will still return last_value itself,
    // so treat current "issued" value as 0 in that case.
    return row.is_called ? Number(row.last_value) : 0;
  } catch (err) {
    // Sequence may not exist yet (e.g. contract_employee_number_seq is
    // created lazily on first use) — treat as not-yet-issued.
    return 0;
  }
}

export async function getSequenceStatuses() {
  const results = [];
  for (const def of SEQUENCE_MODULES) {
    const [currentValue, highestUsed] = await Promise.all([
      getSequenceCurrentValue(def.sequenceName),
      def.getHighestUsed().catch(() => 0),
    ]);
    results.push({
      module: def.module,
      label: def.label,
      sequenceName: def.sequenceName,
      currentValue,
      highestUsed,
      hasGap: currentValue > highestUsed,
      nextWouldBe: currentValue + 1,
      safeNextAfterReset: highestUsed + 1,
    });
  }
  return results;
}

export async function resetSequence(moduleName) {
  const def = SEQUENCE_MODULES.find((m) => m.module === moduleName);
  if (!def) {
    throw new Error(`Unknown sequence module: ${moduleName}`);
  }

  const [currentValue, highestUsed] = await Promise.all([
    getSequenceCurrentValue(def.sequenceName),
    def.getHighestUsed(),
  ]);

  if (currentValue <= highestUsed) {
    return {
      module: def.module,
      oldValue: currentValue,
      newValue: currentValue,
      changed: false,
      message: 'No gap found — sequence is already at the safe minimum.',
    };
  }

  // setval(seq, highestUsed, true) makes the NEXT nextval() return highestUsed + 1,
  // never below a number that is still in use.
  await safeExecute((pc) =>
    pc.$executeRawUnsafe(
      `SELECT setval('${def.sequenceName}', $1, true)`,
      highestUsed
    )
  );

  return {
    module: def.module,
    oldValue: currentValue,
    newValue: highestUsed,
    changed: true,
    message: `Sequence reset. Next ${def.label} issued will be number ${highestUsed + 1}.`,
  };
}
