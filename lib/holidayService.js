import { safeExecute } from './dbHelpers.js';
import { NotificationService } from '../services/notification.service.js';

function getDayOfWeek(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get holidays, optionally filtered by year
 */
export async function getHolidays(year) {
  return safeExecute((prisma) =>
    prisma.companyHoliday.findMany({
      where: year ? { year: Number(year) } : undefined,
      orderBy: {
        holidayDate: 'asc',
      },
    })
  );
}

/**
 * Add a single holiday
 */
export async function addHoliday(data) {
  return safeExecute((prisma) => {
    const holidayDate = new Date(data.holidayDate);
    return prisma.companyHoliday.create({
      data: {
        holidayName: data.holidayName,
        holidayDate: holidayDate,
        dayOfWeek: getDayOfWeek(holidayDate),
        description: data.description || '',
        holidayType: data.holidayType || 'Public Holiday',
        year: holidayDate.getFullYear(),
      },
    });
  });
}

/**
 * Delete a holiday by ID
 */
export async function deleteHoliday(id) {
  return safeExecute((prisma) =>
    prisma.companyHoliday.delete({
      where: { id },
    })
  );
}

/**
 * Bulk add holidays (for CSV upload)
 * This will REPLACE all existing holidays with the new ones
 */
export async function bulkAddHolidays(holidays) {
  return safeExecute(async (prisma) => {
    const records = holidays.map((h) => {
      const d = new Date(h.holidayDate);
      return {
        holidayName: h.holidayName, // Map 'holiday' key to 'holidayName' if coming from CSV
        holidayDate: d,
        dayOfWeek: getDayOfWeek(d),
        description: h.description || '',
        holidayType: h.type || h.holidayType || 'Public Holiday', // Handle 'type' vs 'holidayType' key
        year: d.getFullYear(),
      };
    });

    // Delete all existing holidays first (REPLACE mode)
    await prisma.companyHoliday.deleteMany({});

    // Then insert the new holidays
    const result = await prisma.companyHoliday.createMany({
      data: records,
    });

    // Notify all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'Active' },
      select: { id: true },
    });

    if (activeEmployees.length > 0) {
      await NotificationService.createBulkNotifications(
        activeEmployees.map((emp) => emp.id),
        {
          title: 'Holiday Calendar Updated',
          message: 'A new company holiday calendar has been uploaded.',
          type: 'HOLIDAY',
        }
      ).catch((err) =>
        console.error('Failed to notify employees of holiday update', err)
      );
    }

    return result;
  });
}
