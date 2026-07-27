import { safeExecute } from './dbHelpers.js';

/**
 * Create a new skill for an employee
 * @param {Object} data - The skill data
 */
export async function createSkill(data) {
  return safeExecute((prismaClient) =>
    prismaClient.skill.create({
      data: {
        employeeId: data.employeeId,
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
      },
    })
  );
}

/**
 * Get all skills for a specific employee
 * @param {string} employeeId - The employee unique ID (CUID)
 */
export async function getSkillsByEmployee(employeeId) {
  return safeExecute((prismaClient) =>
    prismaClient.skill.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' },
    })
  );
}

/**
 * Get all skills (for admin/global view)
 */
export async function getAllSkills() {
  return safeExecute((prismaClient) =>
    prismaClient.skill.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            empId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

/**
 * Update a skill
 * @param {string} id - The skill ID
 * @param {Object} data - The updated skill data
 */
export async function updateSkill(id, data) {
  return safeExecute((prismaClient) =>
    prismaClient.skill.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      },
    })
  );
}

/**
 * Delete a skill
 * @param {string} id - The skill ID
 */
export async function deleteSkill(id) {
  return safeExecute((prismaClient) =>
    prismaClient.skill.delete({
      where: { id },
    })
  );
}

/**
 * Bulk update skills for an employee (deletes old ones and adds new ones)
 * @param {string} employeeId - The employee ID
 * @param {Array} skillsData - Array of skill objects
 * @param {Object} professionalInfo - Additional professional info like experience and projects
 */
export async function updateEmployeeSkills(employeeId, skillsData, professionalInfo = {}) {
  return safeExecute(async (prismaClient) => {
    // 1. Update Employee professional info
    if (professionalInfo) {
      await prismaClient.employee.update({
        where: { id: employeeId },
        data: {
          totalExperience: professionalInfo.totalExperience,
          projectsDone: professionalInfo.projectsDone,
        },
      });
    }

    // 2. Delete existing skills for the employee
    await prismaClient.skill.deleteMany({
      where: { employeeId },
    });

    // 3. Create new skills
    if (skillsData && skillsData.length > 0) {
      await prismaClient.skill.createMany({
        data: skillsData.map((s) => ({
          employeeId,
          name: s.name,
          category: s.category || 'Core Proficiency',
          proficiency: s.proficiency || 'Mid',
          effectiveDate: s.effectiveDate
            ? new Date(s.effectiveDate)
            : new Date(),
        })),
      });
    }
    return { success: true };
  });
}
