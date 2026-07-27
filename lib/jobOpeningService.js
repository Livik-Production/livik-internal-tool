import { prisma } from './prisma.js';

/**
 * Creates a new job opening.
 * @param {Object} data - The job opening data.
 * @returns {Promise<Object>} The created job opening.
 */
export async function createJobOpening(data) {
  const {
    jobId,
    jobTitle,
    experience,
    location,
    employmentType,
    jobDescription,
    status,
  } = data;

  if (
    !jobTitle ||
    !experience ||
    !location ||
    !employmentType ||
    !jobDescription
  ) {
    throw new Error('Missing required fields');
  }

  return await prisma.jobOpening.create({
    data: {
      jobId: jobId || `LK-JOB-${Date.now()}`,
      jobTitle,
      experience,
      location,
      employmentType,
      jobDescription,
      status: status || 'ACTIVE',
    },
  });
}

/**
 * Fetches all job openings.
 * @returns {Promise<Array>} List of job openings.
 */
export async function getAllJobOpenings() {
  return await prisma.jobOpening.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Fetches only active job openings.
 * @returns {Promise<Array>} List of active job openings.
 */
export async function getActiveJobOpenings() {
  return await prisma.jobOpening.findMany({
    where: {
      status: {
        not: 'INACTIVE',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Fetches a single job opening by ID.
 * @param {String} id - The job opening ID.
 * @returns {Promise<Object>} The job opening.
 */
export async function getJobOpeningById(id) {
  return await prisma.jobOpening.findUnique({
    where: { id },
  });
}

/**
 * Updates a job opening.
 * @param {String} id - The job opening ID.
 * @param {Object} data - The update data.
 * @returns {Promise<Object>} The updated job opening.
 */
export async function updateJobOpening(id, data) {
  return await prisma.jobOpening.update({
    where: { id },
    data,
  });
}

/**
 * Deletes a job opening.
 * @param {String} id - The job opening ID.
 * @returns {Promise<Object>} The deleted job opening.
 */
export async function deleteJobOpening(id) {
  return await prisma.jobOpening.delete({
    where: { id },
  });
}
