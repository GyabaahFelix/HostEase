import crypto from 'crypto';
import { DBEngine } from './db.js';
import { Notification } from '../types';
import { connectToMongoDB, MongoNotificationModel } from './mongoose.js';

export { connectToMongoDB, MongoNotificationModel };

/**
 * Service to manage notifications on either MongoDB or local file-based DB Engine.
 */
export class NotificationService {
  /**
   * Fetch all notifications for a student.
   * Includes individual notifications (by userId) AND system announcements (userId: "all").
   */
  static async getNotificationsForUser(userId: string, role: string): Promise<Notification[]> {
    const mongoActive = await connectToMongoDB();

    if (mongoActive) {
      try {
        const query: any = role === 'student' 
          ? { $or: [{ userId }, { userId: 'all' }] }
          : {};

        const docs = await MongoNotificationModel.find(query).sort({ createdAt: -1 }).lean();
        
        return docs.map((doc: any) => ({
          id: doc.id || doc._id.toString(),
          userId: doc.userId,
          title: doc.title,
          message: doc.message,
          type: doc.type,
          readBy: doc.readBy || [],
          read: doc.userId === 'all' 
            ? (doc.readBy || []).includes(userId) 
            : doc.read,
          createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date(doc.createdAt).toISOString()
        }));
      } catch (err) {
        console.error('MongoDB query error, falling back to local:', err);
      }
    }

    // Fallback: local DB
    const allNotifs = DBEngine.getNotifications() as Notification[];
    
    let filtered = allNotifs;
    if (role === 'student') {
      filtered = allNotifs.filter(n => n.userId === userId || n.userId === 'all');
    }

    return filtered.map(n => ({
      ...n,
      read: n.userId === 'all' 
        ? (n.readBy || []).includes(userId)
        : n.read
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Save a new notification or broadcast a system announcement.
   */
  static async createNotification(
    userId: string, 
    title: string, 
    message: string, 
    type: 'application_update' | 'allocation_update' | 'system_announcement'
  ): Promise<Notification> {
    const mongoActive = await connectToMongoDB();
    const id = `not_${crypto.randomBytes(8).toString('hex')}`;
    const createdAt = new Date().toISOString();

    if (mongoActive) {
      try {
        const doc = await MongoNotificationModel.create({
          id,
          userId,
          title,
          message,
          type,
          readBy: [],
          read: false,
          createdAt
        });

        return {
          id,
          userId,
          title,
          message,
          type,
          readBy: doc.readBy || [],
          read: false,
          createdAt
        };
      } catch (err) {
        console.error('MongoDB insert error, falling back to local:', err);
      }
    }

    // Fallback: local DB
    const notif: Notification = {
      id,
      userId,
      title,
      message,
      type,
      readBy: [],
      read: false,
      createdAt
    };

    DBEngine.addNotification(notif);
    return notif;
  }

  /**
   * Mark a notification as read.
   */
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    const mongoActive = await connectToMongoDB();

    if (mongoActive) {
      try {
        const doc = await MongoNotificationModel.findOne({ id });
        if (doc) {
          if (doc.userId === 'all') {
            if (!doc.readBy.includes(userId)) {
              doc.readBy.push(userId);
              await doc.save();
            }
          } else {
            doc.read = true;
            await doc.save();
          }
          return true;
        }
      } catch (err) {
        console.error('MongoDB update error, falling back to local:', err);
      }
    }

    // Fallback: local DB
    const notif = DBEngine.getNotifications().find((n: any) => n.id === id);
    if (notif) {
      if (notif.userId === 'all') {
        if (!notif.readBy) notif.readBy = [];
        if (!notif.readBy.includes(userId)) {
          notif.readBy.push(userId);
          DBEngine.save();
        }
      } else {
        notif.read = true;
        DBEngine.save();
      }
      return true;
    }

    return false;
  }
}
