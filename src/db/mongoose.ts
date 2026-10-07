import mongoose, { Schema } from 'mongoose';

// Connection state manager
let isConnected = false;
let connectionPromise: Promise<boolean> | null = null;
let lastAttemptFailed = false;
let lastAttemptTime = 0;
const RETRY_COOLDOWN_MS = 30000; // 30 seconds cooldown before retrying unreachable cluster

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function isValidMongoUri(uri?: string): boolean {
  if (!uri) return false;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    return false;
  }
  // Check for placeholder credentials in templates
  if (trimmed.includes('<username>') || trimmed.includes('<password>') || trimmed.includes('<dbname>')) {
    return false;
  }
  return true;
}

export async function connectToMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!isValidMongoUri(uri)) {
    return false;
  }
  
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  // If a recent attempt failed, respect cooldown to prevent request stalling
  const now = Date.now();
  if (lastAttemptFailed && now - lastAttemptTime < RETRY_COOLDOWN_MS) {
    return false;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        isConnected = true;
        lastAttemptFailed = false;
        return true;
      }

      await mongoose.connect(uri!, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        bufferCommands: false, // Do not buffer operations if disconnected
      });
      
      isConnected = true;
      lastAttemptFailed = false;
      console.log('✅ Successfully connected to MongoDB Atlas.');
      return true;
    } catch (err: any) {
      isConnected = false;
      lastAttemptFailed = true;
      lastAttemptTime = Date.now();
      const reason = err?.message || String(err);
      console.warn(`⚠️ [MongoDB] Atlas cluster is unreachable (${reason}). Seamlessly operating on internal JSON database.`);
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

// User Schema
const MongoUserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'hostel_admin', 'system_admin'] },
  name: { type: String, required: true },
  matricNoOrStaffId: { type: String, required: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'other', 'unisex'] },
  phone: { type: String },
  department: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Number }
});
export const MongoUserModel: any = mongoose.models.MongoUser || mongoose.model('MongoUser', MongoUserSchema);

// Hostel Schema
const MongoHostelSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['male', 'female', 'unisex'] },
  capacity: { type: Number, required: true },
  description: { type: String },
  location: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const MongoHostelModel: any = mongoose.models.MongoHostel || mongoose.model('MongoHostel', MongoHostelSchema);

// Room Schema
const MongoRoomSchema = new Schema({
  id: { type: String, required: true, unique: true },
  hostelId: { type: String, required: true, index: true },
  roomNo: { type: String, required: true },
  capacity: { type: Number, required: true },
  occupied: { type: Number, default: 0 },
  price: { type: Number, required: true },
  status: { type: String, required: true, enum: ['available', 'full', 'maintenance'] },
  createdAt: { type: String, default: () => new Date().toISOString() }
});
export const MongoRoomModel: any = mongoose.models.MongoRoom || mongoose.model('MongoRoom', MongoRoomSchema);

// HostelApplication Schema
const MongoApplicationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, index: true },
  hostelId: { type: String, required: true, index: true },
  roomId: { type: String, index: true },
  academicYear: { type: String, required: true },
  status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'] },
  paymentStatus: { type: String, required: true, enum: ['unpaid', 'paid'] },
  message: { type: String },
  adminComment: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});
export const MongoApplicationModel: any = mongoose.models.MongoApplication || mongoose.model('MongoApplication', MongoApplicationSchema);

// Notification Schema
const MongoNotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  type: { type: String, enum: ['application_update', 'allocation_update', 'system_announcement'], default: 'application_update' },
  readBy: [{ type: String }]
});
export const MongoNotificationModel: any = mongoose.models.MongoNotification || mongoose.model('MongoNotification', MongoNotificationSchema);
