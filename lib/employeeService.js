// lib/employeeService.js
import { safeExecute } from './dbHelpers.js';
import { putEmployeeOnBench } from './benchService.js';

/** convert date-like value to JS Date or null */
function toDateOrNull(v) {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s) return null;
  // if only date part provided, append time to make ISO
  const needsTime = !/T|\+|\-/.test(s);
  const iso = needsTime ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** generate empId using postgres sequence (uses safeExecute) */
export async function generateEmpId(prefix = 'LK', pad = 3) {
  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting.findUnique({ where: { module: 'employee' } })
    );
  } catch (err) {
    console.error('Error fetching employee ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : prefix;
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute(
    (prismaClient) =>
      prismaClient.$queryRaw`SELECT nextval('employee_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (employee_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

/** generate contractEmpId using a separate continuous global postgres sequence (uses safeExecute) */
export async function generateContractEmpId(year, pad = 3) {
  // Create sequence if it doesn't exist
  await safeExecute(
    (prismaClient) =>
      prismaClient.$executeRaw`CREATE SEQUENCE IF NOT EXISTS contract_employee_number_seq START 1;`
  );

  let formatSetting = null;
  try {
    formatSetting = await safeExecute((pc) =>
      pc.numberFormatSetting.findUnique({ where: { module: 'contract_employee' } })
    );
  } catch (err) {
    console.error('Error fetching contract employee ID format setting:', err);
  }

  const effectivePrefix = formatSetting ? formatSetting.prefix : `CE-${year}-`;
  const effectivePad = formatSetting ? (formatSetting.padding ?? pad) : pad;
  const effectiveSuffix = formatSetting ? (formatSetting.suffix || '') : '';

  const res = await safeExecute(
    (prismaClient) =>
      prismaClient.$queryRaw`SELECT nextval('contract_employee_number_seq') as seq;`
  );
  const seq = Number(res?.[0]?.seq ?? res?.seq ?? res?.nextval ?? null);
  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to get sequence value (contract_employee_number_seq).');
  }
  return `${effectivePrefix}${String(seq).padStart(effectivePad, '0')}${effectiveSuffix}`;
}

export async function createEmployee(data) {
  // defensive clone to avoid mutating caller object
  const payload = { ...(data || {}) };

  const educationsInput = Array.isArray(payload.education)
    ? payload.education
    : Array.isArray(payload.educationDetails)
      ? payload.educationDetails
      : [];

  const empFields = {
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
    dateOfBirth: toDateOrNull(payload.dateOfBirth),
    gender: payload.gender ?? null,
    aadhaarNumber: payload.aadhaarNumber ?? null,
    panNumber: payload.panNumber ?? null,
    email: payload.email ?? null,
    phoneNumber: payload.phoneNumber ?? null,
    emergencyContact: payload.emergencyContact ?? null,
    photo: payload.photo ?? null,
    aadhaarCard: payload.aadhaarCard ?? null,
    panCard: payload.panCard ?? null,
    proofs: payload.proofs ?? [],
    bloodGroup: payload.bloodGroup ?? null,
    presentAddress: payload.presentAddress ?? null,
    permanentAddress: payload.permanentAddress ?? null,
    designation: payload.designation ?? null,
    department: payload.department ?? null,
    roleId: payload.roleId ?? null,
    dateOfJoining: toDateOrNull(payload.dateOfJoining),
    workLocation: payload.workLocation ?? null,
    bankName: payload.bankName ?? null,
    accountNumber: payload.accountNumber ?? null,
    ifscCode: payload.ifscCode ?? null,
    totalExperience: payload.totalExperience ?? null,
    projectsDone: payload.projectsDone ?? null,

    // Work fields
    workMode: payload.workMode ?? null,
    workType: payload.workType ?? null,

    // -- Bond Details --
    bondDuration: payload.bondDuration ? String(payload.bondDuration) : null,
    isOnBond: !!payload.bondDuration, // true if duration provided
    bondStartDate: payload.bondStartDate
      ? toDateOrNull(payload.bondStartDate)
      : payload.bondDuration && payload.dateOfJoining
        ? toDateOrNull(payload.dateOfJoining)
        : null,
    bondEndDate: payload.bondEndDate
      ? toDateOrNull(payload.bondEndDate)
      : payload.bondDuration && payload.dateOfJoining
        ? (() => {
            const d = toDateOrNull(payload.dateOfJoining);
            if (d) {
              const years = parseFloat(payload.bondDuration);
              if (!isNaN(years)) {
                // Add years to date
                const end = new Date(d);
                end.setFullYear(end.getFullYear() + Math.floor(years));
                // Approximate months for fractional years if needed, but simplistic approach:
                // For simplicity, just add milliseconds for fractional year or better assume integer/half
                // Let's use simple logic: bond usually 1 or 2 years.
                // If fraction needed:
                const months = (years % 1) * 12;
                end.setMonth(end.getMonth() + months);
                return end;
              }
            }
            return null;
          })()
        : null,
    bondRemarks: payload.bondRemarks ?? null,

    // -- Documents (Map array to booleans) --
    docSSLCCollected: (payload.documentsCollected || []).includes('sslc'),
    docHSCCollected: (payload.documentsCollected || []).includes('hsc'),
    docDegreeCollected: (payload.documentsCollected || []).includes('degree'),
    docRemarks: payload.docRemarks ?? null, // if you want to store separate doc remarks
  };

  // enforce required workType on create
  if (!empFields.workType) {
    throw new Error('workType is required when creating an employee');
  }

  let empId;
  let contractEmpId = null;

  if (String(empFields.workType).toUpperCase() === 'CONTRACT') {
    const year = new Date().getFullYear();
    const ceId = await generateContractEmpId(year, 3);
    empId = ceId;
    contractEmpId = ceId;
  } else {
    empId = await generateEmpId();
  }

  const createEducations = educationsInput
    .filter((e) => e && e.institution && e.qualification && e.yearCompleted)
    .map((e) => ({
      university: e.university || null,
      institution: String(e.institution),
      qualification: String(e.qualification),
      yearCompleted: String(e.yearCompleted),
    }));

  // create employee and nested educations
  const created = await safeExecute((prismaClient) =>
    prismaClient.employee.create({
      data: {
        ...empFields,
        empId,
        contractEmpId,
        status: payload.status ?? 'PENDING',
        educationDetails: {
          create: createEducations,
        },
      },
      include: { educationDetails: true },
    })
  );

  // Auto-place new employee on bench
  await putEmployeeOnBench(created.id);

  return created;
}

/** Get all employees */
export async function getAllEmployees() {
  return safeExecute((prismaClient) =>
    prismaClient.employee.findMany({
      where: {
        NOT: {
          empId: 'MEETING_HALL',
        },
      },
      include: {
        educationDetails: true,
        projectMembers: {
          include: { project: true },
        },
        skills: true,
        benchDetail: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/** Get single employee by uuid (id) */
export async function getEmployeeById(id) {
  return safeExecute((prismaClient) =>
    prismaClient.employee.findUnique({
      where: { id },
      include: {
        educationDetails: true,
        leaveBalances: true,
        skills: true,
        assetAssignments: {
          where: { returnDate: null },
          include: {
            asset: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })
  );
}

export async function getEmployeeQuickProfile(id) {
  if (!id) throw new Error('ID is required');
  return safeExecute((prismaClient) =>
    prismaClient.employee.findFirst({
      where: {
        OR: [{ id }, { empId: id }],
      },
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        designation: true,
        department: true,
        photo: true,
      },
    })
  );
}

/**
 * Update employee
 * - Accepts id (uuid) and data (may include `education` array)
 * - Handles education separately: deletes old educations and creates new ones
 */
export async function updateEmployee(id, data) {
  // normalize employee non-education fields
  const employeeData = {};

  if ('firstName' in data) employeeData.firstName = data.firstName ?? null;
  if ('lastName' in data) employeeData.lastName = data.lastName ?? null;
  if ('dateOfBirth' in data)
    employeeData.dateOfBirth = toDateOrNull(data.dateOfBirth);
  if ('gender' in data) employeeData.gender = data.gender ?? null;
  if ('aadhaarNumber' in data)
    employeeData.aadhaarNumber = data.aadhaarNumber ?? null;
  if ('panNumber' in data) employeeData.panNumber = data.panNumber ?? null;
  if ('email' in data) employeeData.email = data.email ?? null;
  if ('phoneNumber' in data)
    employeeData.phoneNumber = data.phoneNumber ?? null;
  if ('emergencyContact' in data)
    employeeData.emergencyContact = data.emergencyContact ?? null;
  if ('photo' in data) {
    const val = data.photo;
    const isSignedS3Url = val && typeof val === 'string' && (val.includes('X-Amz-') || val.includes('amazonaws.com'));
    if (!isSignedS3Url) {
      employeeData.photo = val ?? null;
    }
  }
  if ('aadhaarCard' in data) {
    const val = data.aadhaarCard;
    const isSignedS3Url = val && typeof val === 'string' && (val.includes('X-Amz-') || val.includes('amazonaws.com'));
    if (!isSignedS3Url) {
      employeeData.aadhaarCard = val ?? null;
    }
  }
  if ('panCard' in data) {
    const val = data.panCard;
    const isSignedS3Url = val && typeof val === 'string' && (val.includes('X-Amz-') || val.includes('amazonaws.com'));
    if (!isSignedS3Url) {
      employeeData.panCard = val ?? null;
    }
  }
  if ('proofs' in data) employeeData.proofs = data.proofs ?? [];
  if ('bloodGroup' in data) employeeData.bloodGroup = data.bloodGroup ?? null;
  if ('presentAddress' in data)
    employeeData.presentAddress = data.presentAddress ?? null;
  if ('permanentAddress' in data)
    employeeData.permanentAddress = data.permanentAddress ?? null;
  if ('designation' in data)
    employeeData.designation = data.designation ?? null;
  if ('department' in data) employeeData.department = data.department ?? null;
  if ('role' in data) employeeData.role = data.role ?? null;
  if ('dateOfJoining' in data)
    employeeData.dateOfJoining = toDateOrNull(data.dateOfJoining);
  if ('workLocation' in data)
    employeeData.workLocation = data.workLocation ?? null;
  if ('workMode' in data) employeeData.workMode = data.workMode ?? null;
  if ('workType' in data) employeeData.workType = data.workType ?? null;
  if ('bankName' in data) employeeData.bankName = data.bankName ?? null;
  if ('accountNumber' in data)
    employeeData.accountNumber = data.accountNumber ?? null;
  if ('ifscCode' in data) employeeData.ifscCode = data.ifscCode ?? null;
  if ('status' in data) employeeData.status = data.status ?? 'PENDING';
  if ('empId' in data) employeeData.empId = data.empId ?? undefined; // allow updating empId if needed
  if ('totalExperience' in data)
    employeeData.totalExperience = data.totalExperience ?? null;
  if ('projectsDone' in data)
    employeeData.projectsDone = data.projectsDone ?? null;

  // -- Bond Details --
  if ('bondDuration' in data || 'bondRemarks' in data) {
    if (data.bondDuration) {
      employeeData.bondDuration = String(data.bondDuration);
      employeeData.isOnBond = true;

      // Determine effective Date of Joining
      let effectiveDOJ = toDateOrNull(data.dateOfJoining);

      // If DoJ not in payload, ignore? No, we need it to calc bond dates.
      // We must fetch existing if not provided.
      if (!effectiveDOJ) {
        // safeExecute allows us to run a quick query
        const existing = await safeExecute((pc) =>
          pc.employee.findUnique({
            where: { id },
            select: { dateOfJoining: true },
          })
        );
        if (existing?.dateOfJoining) {
          effectiveDOJ = existing.dateOfJoining;
        }
      }

      if (effectiveDOJ) {
        employeeData.bondStartDate = effectiveDOJ;
        const years = parseFloat(data.bondDuration);
        if (!isNaN(years)) {
          const end = new Date(effectiveDOJ);
          end.setFullYear(end.getFullYear() + Math.floor(years));
          // Handle fractional years (e.g. 2.5)
          const months = (years % 1) * 12; // 0.5 * 12 = 6
          // We can add 30 days * months approx, or update month info
          // setMonth gracefully handles overflow (e.g. month 13 becomes Jan next year)
          // But adding float to setMonth is risky? setMonth takes integer.
          // (years % 1) is float. Math.round(months) is safer.
          end.setMonth(end.getMonth() + Math.round(months));

          employeeData.bondEndDate = end;
        }
      }
    } else if (data.bondDuration === '') {
      // cleared
      employeeData.bondDuration = null;
      employeeData.isOnBond = false;
      employeeData.bondStartDate = null;
      employeeData.bondEndDate = null;
    }
  }
  // Allow direct update of remarks independent of duration
  if ('bondRemarks' in data)
    employeeData.bondRemarks = data.bondRemarks ?? null;

  // -- Documents --
  if ('documentsCollected' in data) {
    const docs = data.documentsCollected || [];
    employeeData.docSSLCCollected = docs.includes('sslc');
    employeeData.docHSCCollected = docs.includes('hsc');
    employeeData.docDegreeCollected = docs.includes('degree');
  }
  if ('docRemarks' in data) employeeData.docRemarks = data.docRemarks ?? null;

  // handle education replacement separately
  const educationsInput = Array.isArray(data.education)
    ? data.education
    : Array.isArray(data.educationDetails)
      ? data.educationDetails
      : null;

  // Resolve the actual employee first to handle either CUID or empId lookups
  const targetEmployee = await safeExecute((pc) =>
    pc.employee.findFirst({
      where: {
        OR: [{ id }, { empId: id }],
      },
      select: { id: true },
    })
  );

  if (!targetEmployee) {
    throw new Error(`Record not found for ID or EmpID: ${id}`);
  }

  const actualId = targetEmployee.id;

  // If updating to CONTRACT and no contractEmpId exists, generate one
  if ('workType' in data && String(data.workType).toUpperCase() === 'CONTRACT') {
    const existing = await safeExecute((pc) =>
      pc.employee.findFirst({
        where: { OR: [{ id }, { empId: id }] },
        select: { contractEmpId: true },
      })
    );
    if (!existing?.contractEmpId) {
      const year = new Date().getFullYear();
      employeeData.contractEmpId = await generateContractEmpId(year, 3);
    }
  }

  // Update employee fields
  await safeExecute((prismaClient) =>
    prismaClient.employee.update({
      where: { id: actualId },
      data: employeeData,
      include: { educationDetails: true },
    })
  );

  // If education present, replace them: delete existing then create new
  if (Array.isArray(educationsInput)) {
    // delete old
    await safeExecute((prismaClient) =>
      prismaClient.education.deleteMany({
        where: { employeeId: id },
      })
    );

    // create new
    const createManyData = educationsInput
      .filter((e) => e && (e.institution || e.qualification || e.university))
      .map((e) => ({
        university: e.university ?? null,
        institution: e.institution ?? null,
        qualification: e.qualification ?? null,
        yearCompleted: e.yearCompleted ?? null,
        employeeId: id,
      }));

    if (createManyData.length > 0) {
      await safeExecute((prismaClient) =>
        prismaClient.education.createMany({ data: createManyData })
      );
    }
  }

  // return fresh employee with educations
  return safeExecute((prismaClient) =>
    prismaClient.employee.findUnique({
      where: { id },
      include: { educationDetails: true },
    })
  );
}

/** delete employee & cascade educations and other relations */
export async function deleteEmployee(identifier) {
  return safeExecute(async (prismaClient) => {
    // Resolve the actual employee first to handle either CUID or empId lookups
    const targetEmployee = await prismaClient.employee.findFirst({
      where: {
        OR: [{ id: identifier }, { empId: identifier }],
      },
      select: { id: true },
    });

    if (!targetEmployee) {
      throw new Error(`Record not found for ID or EmpID: ${identifier}`);
    }

    const id = targetEmployee.id;

    // 1. Delete Educations
    await prismaClient.education.deleteMany({ where: { employeeId: id } });

    // 2. Delete Leave Balances
    await prismaClient.leaveBalance.deleteMany({ where: { employeeId: id } });

    // 3. Delete Attendance
    await prismaClient.attendance.deleteMany({ where: { employeeId: id } });

    // 4. Delete Asset Assignments
    await prismaClient.assetAssignment.deleteMany({
      where: { employeeId: id },
    });

    // 6. Delete Leave Requests (requester)
    await prismaClient.leaveRequest.deleteMany({ where: { employeeId: id } });

    // 6b. Nullify Leave Requests (approver)
    await prismaClient.leaveRequest.updateMany({
      where: { approverId: id },
      data: { approverId: null },
    });

    // 7. Delete Salary Setup
    await prismaClient.salarySetup.deleteMany({ where: { employeeId: id } });

    // Finally delete the employee
    return prismaClient.employee.delete({ where: { id } });
  });
}

/**
 * Validates if the requester has permission to assign the new role to the target employee.
 *
 * Rules:
 * 1. Only SUPER_ADMIN and ADMIN can assign roles. If the requester has any other role, reject.
 * 2. Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles.
 * 3. Only SUPER_ADMIN can change the role of an employee who currently is SUPER_ADMIN or ADMIN.
 * 4. ADMIN role employees can assign any role lower than ADMIN (e.g. HR_ADMIN, EMPLOYEE, or null)
 *    to an employee who is not currently SUPER_ADMIN or ADMIN.
 */
export async function checkRoleAssignmentPermission(
  requesterId,
  targetEmployeeId,
  newRoleId
) {
  if (!requesterId) {
    throw new Error(
      'Requester ID is required for role assignment authorization.'
    );
  }

  return safeExecute(async (prisma) => {
    // 1. Fetch requester's role
    const requester = await prisma.employee.findUnique({
      where: { id: requesterId },
      select: {
        role: {
          select: { roleName: true },
        },
      },
    });

    const requesterRole = requester?.role?.roleName?.toUpperCase() || null;

    // Only SUPER_ADMIN and ADMIN are allowed to perform role assignments
    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN') {
      throw new Error('Forbidden: You do not have permission to assign roles.');
    }

    // If requester is SUPER_ADMIN, they have access to everything
    if (requesterRole === 'SUPER_ADMIN') {
      return true;
    }

    // 2. Requester is ADMIN. Validate target employee's current role.
    if (targetEmployeeId) {
      const targetEmployee = await prisma.employee.findFirst({
        where: {
          OR: [{ id: targetEmployeeId }, { empId: targetEmployeeId }],
        },
        select: {
          role: {
            select: { roleName: true },
          },
        },
      });
      const currentTargetRole =
        targetEmployee?.role?.roleName?.toUpperCase() || null;

      // An ADMIN cannot modify the role of another ADMIN or a SUPER_ADMIN
      if (
        currentTargetRole === 'SUPER_ADMIN' ||
        currentTargetRole === 'ADMIN'
      ) {
        throw new Error(
          'Forbidden: Only Super Admin can modify the role of an Admin or Super Admin.'
        );
      }
    }

    // 3. Validate new role being assigned
    if (newRoleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: newRoleId },
        select: { roleName: true },
      });
      const newRoleName = targetRole?.roleName?.toUpperCase() || null;

      // An ADMIN cannot assign SUPER_ADMIN or ADMIN role to anyone
      if (newRoleName === 'SUPER_ADMIN' || newRoleName === 'ADMIN') {
        throw new Error(
          'Forbidden: Only Super Admin can assign Admin or Super Admin roles.'
        );
      }
    }

    return true;
  });
}
