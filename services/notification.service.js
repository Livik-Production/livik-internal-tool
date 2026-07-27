import { prisma } from '../lib/prisma.js';

export const NotificationService = {
  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(recipients, payload) {
    if (!recipients || recipients.length === 0) return;
    
    const notifications = recipients.map(recipientId => ({
      ...payload,
      recipientId
    }));
    
    return await prisma.notification.createMany({
      data: notifications
    });
  },

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId) {
    return await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true }
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true }
    });
  }
};
