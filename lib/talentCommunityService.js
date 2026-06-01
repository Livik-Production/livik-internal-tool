import { prisma } from './prisma.js';

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
  return entries;
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
