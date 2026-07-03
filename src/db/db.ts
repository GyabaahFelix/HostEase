import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Hostel, Room, HostelApplication, Notification } from '../types';
import { 
  connectToMongoDB, 
  MongoUserModel, 
  MongoHostelModel, 
  MongoRoomModel, 
  MongoApplicationModel, 
  MongoNotificationModel 
} from './mongoose.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  hostels: Hostel[];
  rooms: Room[];
  applications: HostelApplication[];
  notifications: Notification[];
}

// Simple but secure PBKDF2 or SHA-256 password hashing helper using native crypto
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to check passwords
export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class DBEngine {
  private static data: DatabaseSchema = {
    users: [],
    hostels: [],
    rooms: [],
    applications: [],
    notifications: [],
  };

  static async initialize() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.hostels) this.data.hostels = [];
        if (!this.data.rooms) this.data.rooms = [];
        if (!this.data.applications) this.data.applications = [];
        if (!this.data.notifications) this.data.notifications = [];
      } catch (err) {
        console.error('Error reading database file, resetting to defaults:', err);
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }

    // Connect and synchronize with MongoDB Atlas if configured
    if (process.env.MONGODB_URI) {
      console.log('Connecting to MongoDB Atlas for persistent synchronization...');
      try {
        const connected = await connectToMongoDB();
        if (connected) {
          const userCount = await MongoUserModel.countDocuments();
          if (userCount === 0) {
            console.log('MongoDB is empty. Seeding local dataset into MongoDB Atlas...');
            await Promise.all([
              MongoUserModel.insertMany(this.data.users),
              MongoHostelModel.insertMany(this.data.hostels),
              MongoRoomModel.insertMany(this.data.rooms),
              MongoApplicationModel.insertMany(this.data.applications),
              MongoNotificationModel.insertMany(this.data.notifications)
            ]);
            console.log('MongoDB Atlas successfully seeded with initial defaults!');
          } else {
            console.log('MongoDB Atlas has existing records. Hydrating cache from Atlas...');
            const [users, hostels, rooms, applications, notifications] = await Promise.all([
              MongoUserModel.find({}).lean(),
              MongoHostelModel.find({}).lean(),
              MongoRoomModel.find({}).lean(),
              MongoApplicationModel.find({}).lean(),
              MongoNotificationModel.find({}).lean()
            ]);

            this.data = {
              users: users.map((u: any) => {
                const { _id, __v, ...rest } = u;
                return rest as User;
              }),
              hostels: hostels.map((h: any) => {
                const { _id, __v, ...rest } = h;
                return rest as Hostel;
              }),
              rooms: rooms.map((r: any) => {
                const { _id, __v, ...rest } = r;
                return rest as Room;
              }),
              applications: applications.map((a: any) => {
                const { _id, __v, ...rest } = a;
                return rest as HostelApplication;
              }),
              notifications: notifications.map((n: any) => {
                const { _id, __v, ...rest } = n;
                return rest as Notification;
              })
            };
            this.save();
            console.log('Local memory cache successfully populated from MongoDB Atlas.');
          }
        }
      } catch (err) {
        console.error('Failed to sync with MongoDB Atlas on initialization:', err);
      }
    }
  }

  static save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private static seedDefaults() {
    console.log('Seeding initial HostelEase database...');

    // Users
    const users: User[] = [
      {
        id: 'usr_sys_admin',
        username: 'admin',
        email: 'admin@university.edu',
        passwordHash: hashPassword('admin123'),
        role: 'system_admin',
        name: 'Prof. Charles Xavier',
        matricNoOrStaffId: 'STAFF/001',
        gender: 'male',
        phone: '+234 801 234 5678',
        department: 'Information Technology Services',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_hostel_admin',
        username: 'manager',
        email: 'manager@university.edu',
        passwordHash: hashPassword('manager123'),
        role: 'hostel_admin',
        name: 'Dr. Jean Grey',
        matricNoOrStaffId: 'STAFF/042',
        gender: 'female',
        phone: '+234 802 345 6789',
        department: 'Student Affairs',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_student_john',
        username: 'john',
        email: 'john@student.edu',
        passwordHash: hashPassword('john123'),
        role: 'student',
        name: 'John Doe',
        matricNoOrStaffId: 'RUN/2023/10234',
        gender: 'male',
        phone: '+234 803 456 7890',
        department: 'Computer Science',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_student_jane',
        username: 'jane',
        email: 'jane@student.edu',
        passwordHash: hashPassword('jane123'),
        role: 'student',
        name: 'Jane Smith',
        matricNoOrStaffId: 'RUN/2023/10543',
        gender: 'female',
        phone: '+234 804 567 8901',
        department: 'Software Engineering',
        createdAt: new Date().toISOString(),
      },
    ];

    // Hostels
    const hostels: Hostel[] = [
      {
        id: 'hst_nelson_mandela',
        name: 'Nelson Mandela Hall',
        type: 'male',
        capacity: 120,
        description: 'Premium boys hostel located close to the university sports complex. Includes high-speed WiFi, laundry services, and standard reading rooms.',
        location: 'North Campus Quad',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_funmilayo_ransome',
        name: 'Funmilayo Ransome-Kuti Hall',
        type: 'female',
        capacity: 120,
        description: 'Elite female hostel with 24/7 power supply, a spacious modern kitchen, hair salon facilities, and excellent security.',
        location: 'South Campus Quad',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_academic_villa',
        name: 'Postgraduate Academic Villa',
        type: 'unisex',
        capacity: 50,
        description: 'Quiet, premium unisex block reserved for research scholars, PG students, and final year honors. High-speed study pods, individual room kitchenettes.',
        location: 'East Wing Campus',
        createdAt: new Date().toISOString(),
      },
    ];

    // Rooms
    const rooms: Room[] = [
      // Nelson Mandela Hall Rooms (Male)
      {
        id: 'rm_mandela_101',
        hostelId: 'hst_nelson_mandela',
        roomNo: 'A101',
        capacity: 4,
        occupied: 2,
        price: 150000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_mandela_102',
        hostelId: 'hst_nelson_mandela',
        roomNo: 'A102',
        capacity: 4,
        occupied: 4,
        price: 150000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_mandela_103',
        hostelId: 'hst_nelson_mandela',
        roomNo: 'A103',
        capacity: 2,
        occupied: 0,
        price: 250000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      // Funmilayo Hall Rooms (Female)
      {
        id: 'rm_funmilayo_101',
        hostelId: 'hst_funmilayo_ransome',
        roomNo: 'B101',
        capacity: 4,
        occupied: 1,
        price: 160000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_funmilayo_102',
        hostelId: 'hst_funmilayo_ransome',
        roomNo: 'B102',
        capacity: 2,
        occupied: 2,
        price: 260000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_funmilayo_103',
        hostelId: 'hst_funmilayo_ransome',
        roomNo: 'B103',
        capacity: 4,
        occupied: 0,
        price: 160000,
        status: 'maintenance',
        createdAt: new Date().toISOString(),
      },
      // Postgraduate Villa Rooms
      {
        id: 'rm_villa_101',
        hostelId: 'hst_academic_villa',
        roomNo: 'V101',
        capacity: 1,
        occupied: 1,
        price: 450000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_villa_102',
        hostelId: 'hst_academic_villa',
        roomNo: 'V102',
        capacity: 1,
        occupied: 0,
        price: 450000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
    ];

    // Applications
    const applications: HostelApplication[] = [
      {
        id: 'app_001',
        studentId: 'usr_student_john',
        hostelId: 'hst_nelson_mandela',
        roomId: 'rm_mandela_101',
        academicYear: '2025/2026',
        status: 'approved',
        paymentStatus: 'paid',
        message: 'Requesting allocation in Mandela Hall. Prefer a lower-bunk bed due to a minor sprain.',
        adminComment: 'Allocated to Room A101 lower bunk.',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'app_002',
        studentId: 'usr_student_jane',
        hostelId: 'hst_funmilayo_ransome',
        roomId: 'rm_funmilayo_101',
        academicYear: '2025/2026',
        status: 'pending',
        paymentStatus: 'unpaid',
        message: 'Looking forward to staying in Ransome Kuti hall. Close to my science departments.',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    // Notifications
    const notifications: Notification[] = [
      {
        id: 'not_001',
        userId: 'usr_student_john',
        title: 'Application Approved',
        message: 'Your hostel application for Nelson Mandela Hall has been approved and allocated to Room A101!',
        read: false,
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    this.data = { users, hostels, rooms, applications, notifications };
    this.save();
  }

  // Collection Accessors
  static getUsers(): User[] {
    return this.data.users;
  }

  static getHostels(): Hostel[] {
    return this.data.hostels;
  }

  static getRooms(): Room[] {
    return this.data.rooms;
  }

  static getApplications(): HostelApplication[] {
    return this.data.applications;
  }

  static getNotifications(): Notification[] {
    return this.data.notifications;
  }

  // Database Modifiers (Create, Update, Delete)
  static addUser(user: User) {
    this.data.users.push(user);
    this.save();
    MongoUserModel.create(user).catch(err => console.error('Atlas sync failed (addUser):', err));
  }

  static updateUser(id: string, updates: Partial<User>): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    MongoUserModel.updateOne({ id }, { $set: updates }).catch(err => console.error('Atlas sync failed (updateUser):', err));
    return true;
  }

  static addHostel(hostel: Hostel) {
    this.data.hostels.push(hostel);
    this.save();
    MongoHostelModel.create(hostel).catch(err => console.error('Atlas sync failed (addHostel):', err));
  }

  static updateHostel(id: string, updates: Partial<Hostel>): boolean {
    const idx = this.data.hostels.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    this.data.hostels[idx] = { ...this.data.hostels[idx], ...updates };
    this.save();
    MongoHostelModel.updateOne({ id }, { $set: updates }).catch(err => console.error('Atlas sync failed (updateHostel):', err));
    return true;
  }

  static deleteHostel(id: string): boolean {
    const lenBefore = this.data.hostels.length;
    this.data.hostels = this.data.hostels.filter((h) => h.id !== id);
    // Cascade delete rooms and applications
    this.data.rooms = this.data.rooms.filter((r) => r.hostelId !== id);
    this.data.applications = this.data.applications.filter((a) => a.hostelId !== id);
    this.save();
    
    // Background MongoDB Atlas sync
    MongoHostelModel.deleteOne({ id }).catch(err => console.error('Atlas sync failed (deleteHostel):', err));
    MongoRoomModel.deleteMany({ hostelId: id }).catch(err => console.error('Atlas sync failed (cascade deleteRoom):', err));
    MongoApplicationModel.deleteMany({ hostelId: id }).catch(err => console.error('Atlas sync failed (cascade deleteApplication):', err));
    
    return this.data.hostels.length < lenBefore;
  }

  static addRoom(room: Room) {
    this.data.rooms.push(room);
    this.save();
    MongoRoomModel.create(room).catch(err => console.error('Atlas sync failed (addRoom):', err));
  }

  static updateRoom(id: string, updates: Partial<Room>): boolean {
    const idx = this.data.rooms.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.rooms[idx] = { ...this.data.rooms[idx], ...updates };
    this.save();
    MongoRoomModel.updateOne({ id }, { $set: updates }).catch(err => console.error('Atlas sync failed (updateRoom):', err));
    return true;
  }

  static deleteRoom(id: string): boolean {
    const lenBefore = this.data.rooms.length;
    this.data.rooms = this.data.rooms.filter((r) => r.id !== id);
    this.save();
    MongoRoomModel.deleteOne({ id }).catch(err => console.error('Atlas sync failed (deleteRoom):', err));
    return this.data.rooms.length < lenBefore;
  }

  static addApplication(app: HostelApplication) {
    this.data.applications.push(app);
    this.save();
    MongoApplicationModel.create(app).catch(err => console.error('Atlas sync failed (addApplication):', err));
  }

  static updateApplication(id: string, updates: Partial<HostelApplication>): boolean {
    const idx = this.data.applications.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.applications[idx] = { ...this.data.applications[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    MongoApplicationModel.updateOne({ id }, { $set: { ...updates, updatedAt: new Date().toISOString() } }).catch(err => console.error('Atlas sync failed (updateApplication):', err));
    return true;
  }

  static deleteApplication(id: string): boolean {
    const lenBefore = this.data.applications.length;
    this.data.applications = this.data.applications.filter((a) => a.id !== id);
    this.save();
    MongoApplicationModel.deleteOne({ id }).catch(err => console.error('Atlas sync failed (deleteApplication):', err));
    return this.data.applications.length < lenBefore;
  }

  static addNotification(notif: Notification) {
    this.data.notifications.push(notif);
    this.save();
    MongoNotificationModel.create(notif).catch(err => console.error('Atlas sync failed (addNotification):', err));
  }

  static markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.save();
    MongoNotificationModel.updateOne({ id }, { $set: { read: true } }).catch(err => console.error('Atlas sync failed (markNotificationRead):', err));
    return true;
  }
}
