import { prisma } from './prisma.js';

// Simple in-memory cache for high-performance lookup
let cachedDropdowns = null;
let cacheTimestamp = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache expiration

// Helper to invalidate cache when database updates occur
export function invalidateDropdownCache() {
  cachedDropdowns = null;
  cacheTimestamp = null;
}

const DEFAULT_DROPDOWNS = [
  // payment_methods
  { type: 'payment_methods', label: 'Bank Transfer', value: 'Bank Transfer' },
  { type: 'payment_methods', label: 'Credit Card', value: 'Credit Card' },
  { type: 'payment_methods', label: 'Debit Card', value: 'Debit Card' },
  { type: 'payment_methods', label: 'Cash', value: 'Cash' },
  { type: 'payment_methods', label: 'Cheque', value: 'Cheque' },
  { type: 'payment_methods', label: 'Online Payment', value: 'Online Payment' },
  { type: 'payment_methods', label: 'UPI', value: 'UPI' },
  // payment_terms
  { type: 'payment_terms', label: 'Net 15', value: 'Net 15' },
  { type: 'payment_terms', label: 'Net 30', value: 'Net 30' },
  { type: 'payment_terms', label: 'Net 45', value: 'Net 45' },
  { type: 'payment_terms', label: 'Net 60', value: 'Net 60' },
  { type: 'payment_terms', label: 'Due on Receipt', value: 'Due on Receipt' },
  // departments
  { type: 'departments', label: 'Engineering', value: 'Engineering' },
  { type: 'departments', label: 'Design', value: 'Design' },
  { type: 'departments', label: 'Marketing', value: 'Marketing' },
  { type: 'departments', label: 'Sales', value: 'Sales' },
  { type: 'departments', label: 'Human Resources', value: 'Human Resources' },
  { type: 'departments', label: 'Finance', value: 'Finance' },
  { type: 'departments', label: 'Operations', value: 'Operations' },
  // designations
  { type: 'designations', label: 'Software Engineer', value: 'Software Engineer' },
  { type: 'designations', label: 'Senior Engineer', value: 'Senior Engineer' },
  { type: 'designations', label: 'Team Lead', value: 'Team Lead' },
  { type: 'designations', label: 'Project Manager', value: 'Project Manager' },
  { type: 'designations', label: 'HR Executive', value: 'HR Executive' },
  { type: 'designations', label: 'Designer', value: 'Designer' },
  { type: 'designations', label: 'Intern', value: 'Intern' },
  { type: 'designations', label: 'Accountant', value: 'Accountant' },
  // lead_sources
  { type: 'lead_sources', label: 'Website', value: 'Website' },
  { type: 'lead_sources', label: 'Referral', value: 'Referral' },
  { type: 'lead_sources', label: 'Social Media', value: 'Social Media' },
  { type: 'lead_sources', label: 'Cold Call', value: 'Cold Call' },
  { type: 'lead_sources', label: 'Email Campaign', value: 'Email Campaign' },
  { type: 'lead_sources', label: 'Trade Show', value: 'Trade Show' },
  // project_status
  { type: 'project_status', label: 'Not Started', value: 'Not Started' },
  { type: 'project_status', label: 'In Progress', value: 'In Progress' },
  { type: 'project_status', label: 'On Hold', value: 'On Hold' },
  { type: 'project_status', label: 'Completed', value: 'Completed' },
  { type: 'project_status', label: 'Cancelled', value: 'Cancelled' },
  // priority_levels
  { type: 'priority_levels', label: 'Critical', value: 'Critical' },
  { type: 'priority_levels', label: 'High', value: 'High' },
  { type: 'priority_levels', label: 'Medium', value: 'Medium' },
  { type: 'priority_levels', label: 'Low', value: 'Low' },
];

// Helper to seed default lookup values if table is empty
async function ensureSeeded() {
  try {
    const count = await prisma.dropdown.count();
    if (count === 0) {
      console.log('[ensureSeeded] Seeding default lookup values...');
      await prisma.dropdown.createMany({
        data: DEFAULT_DROPDOWNS,
      });
    }
  } catch (error) {
    console.error('[ensureSeeded] Seed check/execution failed:', error);
  }
}

/**
 * Fetches all dropdown items grouped by their category type.
 * Uses cached data when available and valid.
 * @returns {Promise<Object>} Map of category type to array of items.
 */
export async function getAllDropdownsGrouped() {
  const now = Date.now();
  if (cachedDropdowns && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedDropdowns;
  }

  try {
    const dropdowns = await prisma.dropdown.findMany({
      orderBy: { label: 'asc' },
    });

    const grouped = dropdowns.reduce((acc, curr) => {
      if (!acc[curr.type]) {
        acc[curr.type] = [];
      }
      acc[curr.type].push({
        id: curr.id,
        label: curr.label,
        value: curr.value,
        status: curr.status,
        createdAt: curr.createdAt,
        updatedAt: curr.updatedAt,
      });
      return acc;
    }, {});

    cachedDropdowns = grouped;
    cacheTimestamp = now;
    return grouped;
  } catch (error) {
    console.error('[dropdownService] Failed to fetch grouped dropdowns:', error);
    throw error;
  }
}

/**
 * Fetches all options for a specific dropdown category.
 * @param {String} type - Dropdown category (e.g. 'departments').
 * @returns {Promise<Array>} List of options.
 */
export async function getDropdownsByType(type) {
  const grouped = await getAllDropdownsGrouped();
  return grouped[type] || [];
}

/**
 * Creates a new dropdown lookup option.
 * @param {Object} data - Contains { type, label, value }.
 * @returns {Promise<Object>} The created dropdown option.
 */
export async function createDropdown(data) {
  const { type, label, value, status } = data;
  if (!type || !label || !value) {
    throw new Error('Type, label, and value are required');
  }

  try {
    const created = await prisma.dropdown.create({
      data: { type, label, value, status: status || 'active' },
    });
    invalidateDropdownCache();
    return created;
  } catch (error) {
    console.error('[dropdownService] Failed to create dropdown:', error);
    throw error;
  }
}

/**
 * Updates an existing dropdown option.
 * @param {String} id - Option ID.
 * @param {Object} data - Contains { type, label, value }.
 * @returns {Promise<Object>} The updated option.
 */
export async function updateDropdown(id, data) {
  const { type, label, value, status } = data;

  try {
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.dropdown.update({
      where: { id },
      data: updateData,
    });
    invalidateDropdownCache();
    return updated;
  } catch (error) {
    console.error('[dropdownService] Failed to update dropdown:', error);
    throw error;
  }
}

/**
 * Deletes a dropdown option.
 * @param {String} id - Option ID.
 * @returns {Promise<Object>} The deleted option.
 */
export async function deleteDropdown(id) {
  try {
    const deleted = await prisma.dropdown.delete({
      where: { id },
    });
    invalidateDropdownCache();
    return deleted;
  } catch (error) {
    console.error('[dropdownService] Failed to delete dropdown:', error);
    throw error;
  }
}

/**
 * Renames all dropdown types from oldType to newType.
 * @param {String} oldType
 * @param {String} newType
 * @returns {Promise<Number>} Number of updated rows.
 */
export async function updateCategoryType(oldType, newType) {
  if (!oldType || !newType) {
    throw new Error('Both oldType and newType are required');
  }
  try {
    const result = await prisma.dropdown.updateMany({
      where: { type: oldType },
      data: { type: newType },
    });
    invalidateDropdownCache();
    return result.count;
  } catch (error) {
    console.error('[dropdownService] Failed to update category type:', error);
    throw error;
  }
}

