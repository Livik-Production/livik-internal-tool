import { prisma } from './prisma.js';
import { getSignedResumeUrl } from './getSignedResumeUrl.ts';

/**
 * Fetches all talent community entries.
 * @returns {Promise<Array>} List of entries.
 */
export async function getAllTalentCommunity() {
  const entries = await prisma.talentCommunity.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return Promise.all(
    entries.map(async (entry) => {
      if (entry.resume) {
        try {
          entry.resume = await getSignedResumeUrl(entry.resume);
        } catch (error) {
          console.error(
            `Error signing resume URL for talent community entry ${entry.id}:`,
            error
          );
        }
      }
      return entry;
    })
  );
}

/**
 * Fetches a single talent community entry by ID.
 * @param {String} id - The entry ID.
 * @returns {Promise<Object>} The entry.
 */
export async function getTalentCommunityById(id) {
  const entry = await prisma.talentCommunity.findUnique({
    where: { id },
  });

  if (entry && entry.resume) {
    try {
      entry.resume = await getSignedResumeUrl(entry.resume);
    } catch (error) {
      console.error(
        `Error signing resume URL for talent community entry ${entry.id}:`,
        error
      );
    }
  }

  return entry;
}

/**
 * Deletes a talent community entry.
 * @param {String} id - The entry ID.
 * @returns {Promise<Object>} The deleted entry.
 */
export async function deleteTalentCommunity(id) {
  return await prisma.talentCommunity.delete({
    where: { id },
  });
}
