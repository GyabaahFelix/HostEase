import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import { DBEngine } from './db.js';
import { Notification } from '../types';

// Declare standard Mongo Schema for Notifications
const MongoNotificationSchema = new Schema({
  userId: { type: String, required: true, index: true }, // "all" for system announcements, or specific student id
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['application_update', 'allocation_update', 'system_announcement'], 
    default: 'application_update',
    index: true
  },
  readBy: [{ type: String }], // Array of student ids who read this (for system announcements)
  read: { type: Boolean, default: false }, // For individual student notifications
  createdAt: { type: Date, default: Date.now }
});

// Create Mongoose Model
export const MongoNotificationModel: any = mongoose.models.MongoNotification || mongoose.model('MongoNotification', MongoNotificationSchema);

// Connection manager
let isConnected = false;

export async function connectToMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return false;
  }
  
  if (isConnected) {
    return true;
  }

  try {
    // Avoid re-connecting if already connected
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    
    isConnected = true;
    console.log('Successfully connected to MongoDB Notification database.');
    return true;
  } catch (err) {
    console.error('MongoDB connection error, falling back to local storage:', err);
    isConnected = false;
    return false;
  }
}

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
        // Query individual notifications OR system announcements
        const query: any = role === 'student' 
          ? { $or: [{ userId }, { userId: 'all' }] }
          : {}; // Admins see everything or all system announcements

        const docs = await MongoNotificationModel.find(query).sort({ createdAt: -1 }).lean();
        
        return docs.map((doc: any) => ({
          id: doc._id.toString(),
          userId: doc.userId,
          title: doc.title,
          message: doc.message,
          type: doc.type,
          readBy: doc.readBy || [],
          read: doc.userId === 'all' 
            ? (doc.readBy || []).includes(userId) 
            : doc.read,
          createdAt: doc.createdAt.toISOString()
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
          userId,
          title,
          message,
          type,
          readBy: [],
          read: false,
          createdAt: new Date(createdAt)
        });

        return {
          id: doc._id.toString(),
          userId,
          title,
          message,
          type,
          readBy: doc.readBy,
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
   * If it is a system announcement, add the userId to readBy.
   * If it is an individual notification, set read = true.
   */
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    const mongoActive = await connectToMongoDB();

    if (mongoActive) {
      try {
        // Find notification
        const doc = await MongoNotificationModel.findById(id);
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
