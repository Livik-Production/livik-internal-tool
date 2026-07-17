import { prisma } from './prisma.js';

/**
 * Creates a new contact submission.
 * @param {Object} data - The submission data.
 * @returns {Promise<Object>} The created submission.
 */
export async function createContactSubmission(data) {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    companyName,
    service,
    projectDetails,
  } = data;

  // Validation
  if (!firstName || !lastName || !email || !service || !projectDetails) {
    throw new Error('Missing required fields');
  }

  return await prisma.contactSubmission.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNumber,
      companyName,
      service,
      projectDetails,
    },
  });
}

/**
 * Fetches all contact submissions.
 * @returns {Promise<Array>} List of submissions.
 */
export async function getAllContactSubmissions() {
  return await prisma.contactSubmission.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Updates the feedback on a contact submission.
 * @param {string} id - The submission ID.
 * @param {string} feedback - The feedback string.
 * @returns {Promise<Object>} The updated submission.
 */
export async function updateContactSubmissionFeedback(id, feedback) {
  return await prisma.contactSubmission.update({
    where: { id },
    data: { feedback },
  });
}

/**
 * Deletes a contact submission.
 * @param {string} id - The submission ID.
 * @returns {Promise<Object>} The deleted submission.
 */
export async function deleteContactSubmission(id) {
  return await prisma.contactSubmission.delete({
    where: { id },
  });
}
