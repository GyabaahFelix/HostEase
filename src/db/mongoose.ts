import mongoose, { Schema } from 'mongoose';

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
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    isConnected = true;
    console.log('Successfully connected to MongoDB.');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
    return false;
  }
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
