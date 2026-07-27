import { prisma } from './prisma.js';
import { getSignedResumeUrl } from './getSignedResumeUrl.ts';

/**
 * Creates a new job application.
 * @param {Object} data - The job application data.
 * @returns {Promise<Object>} The created job application.
 */
export async function createJobApplication(data) {
  const {
    fullName,
    email,
    phoneNumber,
    skillset,
    location,
    experience,
    resume,
    appliedPosition,
  } = data;

  if (
    !fullName ||
    !email ||
    !phoneNumber ||
    !skillset ||
    !location ||
    !experience ||
    !resume ||
    !appliedPosition
  ) {
    throw new Error('Missing required fields');
  }

  return await prisma.jobApplication.create({
    data: {
      fullName,
      email,
      phoneNumber,
      skillset,
      location,
      experience,
      resume,
      appliedPosition,
    },
  });
}

/**
 * Fetches all job applications.
 * @returns {Promise<Array>} List of job applications.
 */
export async function getAllJobApplications() {
  const applications = await prisma.jobApplication.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return Promise.all(
    applications.map(async (app) => {
      if (app.resume) {
        try {
          app.resume = await getSignedResumeUrl(app.resume);
        } catch (error) {
          console.error(
            `Error signing resume URL for application ${app.id}:`,
            error
          );
        }
      }
      return app;
    })
  );
}

/**
 * Fetches a single job application by ID.
 * @param {String} id - The job application ID.
 * @returns {Promise<Object>} The job application.
 */
export async function getJobApplicationById(id) {
  const application = await prisma.jobApplication.findUnique({
    where: { id },
  });

  if (application && application.resume) {
    try {
      application.resume = await getSignedResumeUrl(application.resume);
    } catch (error) {
      console.error(
        `Error signing resume URL for application ${application.id}:`,
        error
      );
    }
  }

  return application;
}

/**
 * Deletes a job application.
 * @param {String} id - The job application ID.
 * @returns {Promise<Object>} The deleted job application.
 */
export async function deleteJobApplication(id) {
  return await prisma.jobApplication.delete({
    where: { id },
  });
}
