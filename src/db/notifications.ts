import crypto from 'crypto';
import { DBEngine } from './db';
import { Notification, UserRole } from '../types';

export class NotificationService {
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'application_update' | 'allocation_update' | 'system_announcement' = 'application_update'
  ): Promise<Notification> {
    const notif: Notification = {
      id: `not_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      title,
      message,
      read: false,
      type,
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    DBEngine.addNotification(notif);
    return notif;
  }

  static async getNotificationsForUser(userId: string, role?: UserRole): Promise<Notification[]> {
    const allNotifs = DBEngine.getNotifications();
    return allNotifs
      .filter((n) => {
        if (n.userId === userId) return true;
        if (n.userId === 'all') return true;
        if (role === 'system_admin' || role === 'hostel_admin') return true;
        return false;
      })
      .map((n) => {
        if (n.userId === 'all' && n.readBy) {
          return {
            ...n,
            read: n.readBy.includes(userId),
          };
        }
        return n;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async markAsRead(id: string, userId: string): Promise<boolean> {
    const allNotifs = DBEngine.getNotifications();
    const notif = allNotifs.find((n) => n.id === id);
    if (!notif) return false;

    if (notif.userId === 'all') {
      if (!notif.readBy) notif.readBy = [];
      if (!notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
      return DBEngine.markNotificationRead(id);
    }

    return DBEngine.markNotificationRead(id);
  }
}
