import { safeExecute } from './dbHelpers.js';

/** convert date-like value to JS Date or null */
function toDateOrNull(v) {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s) return null;
  const needsTime = !/T|\+|\-/.test(s);
  const iso = needsTime ? `${s}T00:00:00.000Z` : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getAllProjects() {
  return safeExecute((prismaClient) =>
    prismaClient.project.findMany({
      include: {
        members: {
          include: {
            employee: {
              select: {
                id: true,
                empId: true,
                firstName: true,
                lastName: true,
                designation: true,
                photo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function createProject(data) {
  const payload = { ...(data || {}) };
  
  const projectData = {
    projectId: payload.projectId,
    name: payload.name,
    description: payload.description ?? null,
    client: payload.client,
    manager: payload.manager ?? null,
    projectCategory: payload.projectCategory ?? null,
    startDate: toDateOrNull(payload.startDate),
    endDate: toDateOrNull(payload.endDate),
    status: payload.status ?? 'ACTIVE',
    progress: parseInt(payload.progress) || 0,
    tags: Array.isArray(payload.tags) ? JSON.stringify(payload.tags) : (payload.tags || "[]"),
    techStack: payload.techStack ?? null,
  };

  return safeExecute((prismaClient) =>
    prismaClient.project.create({
      data: projectData,
      include: {
        members: {
          include: {
            employee: true
          }
        }
      }
    })
  );
}

export async function updateProject(id, data) {
  const payload = { ...(data || {}) };
  
  const projectData = {};
  if ('name' in payload) projectData.name = payload.name;
  if ('description' in payload) projectData.description = payload.description;
  if ('client' in payload) projectData.client = payload.client;
  if ('manager' in payload) projectData.manager = payload.manager;
  if ('projectCategory' in payload) projectData.projectCategory = payload.projectCategory;
  if ('startDate' in payload) projectData.startDate = toDateOrNull(payload.startDate);
  if ('endDate' in payload) projectData.endDate = toDateOrNull(payload.endDate);
  if ('status' in payload) projectData.status = payload.status;
  if ('progress' in payload) projectData.progress = parseInt(payload.progress) || 0;
  if ('tags' in payload) projectData.tags = Array.isArray(payload.tags) ? JSON.stringify(payload.tags) : payload.tags;
  if ('techStack' in payload) projectData.techStack = payload.techStack;

  return safeExecute((prismaClient) =>
    prismaClient.project.update({
      where: { id },
      data: projectData,
      include: {
        members: {
          include: {
            employee: true
          }
        }
      }
    })
  );
}

export async function deleteProject(id) {
  return safeExecute((prismaClient) =>
    prismaClient.project.delete({
      where: { id }
    })
  );
}

export async function assignMemberToProject(projectId, employeeId, role = 'MEMBER') {
  return safeExecute((prismaClient) =>
    prismaClient.projectMember.upsert({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId
        }
      },
      update: { role },
      create: {
        projectId,
        employeeId,
        role
      },
      include: {
        employee: true
      }
    })
  );
}

export async function removeMemberFromProject(projectId, employeeId) {
  return safeExecute((prismaClient) =>
    prismaClient.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId
        }
      }
    })
  );
}
