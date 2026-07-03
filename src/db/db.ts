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

        // Check if database is using the old template hostels, if so force re-seeding with UG data
        const containsOldHostels = this.data.hostels.some(h => h.id === 'hst_nelson_mandela' || h.name.includes('Nelson Mandela'));
        if (containsOldHostels || this.data.hostels.length < 5) {
          console.log('Old or incomplete template dataset detected. Re-seeding with University of Ghana halls & hostels...');
          this.seedDefaults();
        }
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

            const containsOldHostels = hostels.some((h: any) => h.id === 'hst_nelson_mandela' || h.name?.includes('Nelson Mandela'));
            if (containsOldHostels || hostels.length < 5) {
              console.log('MongoDB Atlas contains old or incomplete dataset. Re-seeding with University of Ghana halls & hostels...');
              await Promise.all([
                MongoUserModel.deleteMany({}),
                MongoHostelModel.deleteMany({}),
                MongoRoomModel.deleteMany({}),
                MongoApplicationModel.deleteMany({}),
                MongoNotificationModel.deleteMany({})
              ]);

              this.seedDefaults();

              await Promise.all([
                MongoUserModel.insertMany(this.data.users),
                MongoHostelModel.insertMany(this.data.hostels),
                MongoRoomModel.insertMany(this.data.rooms),
                MongoApplicationModel.insertMany(this.data.applications),
                MongoNotificationModel.insertMany(this.data.notifications)
              ]);
              console.log('MongoDB Atlas successfully re-seeded with University of Ghana halls and hostels!');
            } else {
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
    console.log('Seeding initial HostelEase database with University of Ghana halls and hostels...');

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
        phone: '+233 244 123 456',
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
        phone: '+233 209 876 543',
        department: 'Student Affairs Office',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_student_john',
        username: 'john',
        email: 'john@student.edu',
        passwordHash: hashPassword('john123'),
        role: 'student',
        name: 'John Doe',
        matricNoOrStaffId: 'UG/10923456/2024',
        gender: 'male',
        phone: '+233 555 456 789',
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
        matricNoOrStaffId: 'UG/10985432/2024',
        gender: 'female',
        phone: '+233 543 567 890',
        department: 'Software Engineering',
        createdAt: new Date().toISOString(),
      },
    ];

    // Hostels (Authentic University of Ghana traditional halls and private hostels)
    const hostels: Hostel[] = [
      {
        id: 'hst_commonwealth',
        name: 'Commonwealth Hall',
        type: 'male',
        capacity: 1500,
        description: 'The premier all-male traditional hall of the University of Ghana, affectionately known as Vandal City. Fosters strong leadership, comradeship, and vibrant student traditions.',
        location: 'Main Campus (Hilltop), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_legon',
        name: 'Legon Hall',
        type: 'unisex',
        capacity: 1200,
        description: 'The premier traditional hall of the University of Ghana, establishing the foundation of academic excellence. Elegant architecture styled with quiet, serene quadrangle gardens.',
        location: 'Main Campus (Central Quad), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b6?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_akuafo',
        name: 'Akuafo Hall',
        type: 'unisex',
        capacity: 1300,
        description: 'Commonly known as the "Farmers\' Hall", Akuafo Hall is a vibrant traditional hall celebrating the rich agricultural roots of Ghana. Centrally located with high-speed student reading rooms.',
        location: 'Main Campus, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_volta',
        name: 'Volta Hall',
        type: 'female',
        capacity: 1000,
        description: 'The premier all-female traditional hall at the University of Ghana. Highly revered for its extremely serene atmosphere, stellar security, and proud academic legacy.',
        location: 'Main Campus (Near Registry), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_sarbah',
        name: 'Mensah Sarbah Hall',
        type: 'unisex',
        capacity: 1400,
        description: 'Named after the legendary patriot Mensah Sarbah. Home of the vibrant "Vikings" community, featuring spacious recreational grounds, modern study centers, and dining facilities.',
        location: 'Main Campus (West Wing), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_kwapong',
        name: 'Alexander Kwapong Hall',
        type: 'unisex',
        capacity: 1200,
        description: 'A premium modern UGEL/Diaspora hall named in honor of the university\'s first Ghanaian Vice Chancellor. Features modern 4, 2, and 1-in-a-room apartments with en-suite bathrooms.',
        location: 'Diaspora (Limann-Kwapong Quad), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_limann',
        name: 'Hilla Limann Hall',
        type: 'unisex',
        capacity: 1200,
        description: 'A state-of-the-art modern UGEL/Diaspora hall featuring comfortable study spaces, on-site supermarkets, backup power systems, and premium student facilities.',
        location: 'Diaspora, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_sey',
        name: 'Elizabeth Frances Sey Hall',
        type: 'unisex',
        capacity: 1200,
        description: 'A highly comfortable, modern UGEL Diaspora hall named after the university\'s pioneer female graduate. Offers outstanding infrastructure, reading rooms, and fully fitted kitchens.',
        location: 'Diaspora, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_jean_nelson',
        name: 'Jean Nelson Aka Hall',
        type: 'unisex',
        capacity: 1200,
        description: 'A vibrant modern UGEL Diaspora hall celebrated for its academic focus, cleanliness, high-speed study areas, and highly convenient local shops.',
        location: 'Diaspora, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_pentagon',
        name: 'African Union Hall (Pentagon)',
        type: 'unisex',
        capacity: 2500,
        description: 'Affectionately known as "Pent", this is the premier and largest private-public partnership hostel on campus. Boasts an private gym, extensive food courts, banking halls, and standard shuttle services.',
        location: 'Pentagon Area (North Campus), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_tf',
        name: 'James Topp Nelson Yankah Hall (TF Hostel)',
        type: 'unisex',
        capacity: 2000,
        description: 'Popularly known as TF Hostel, this spacious private hall offers highly affordable room plans, vibrant student social corridors, shuttle transit buses, and standard study halls.',
        location: 'TF Area (Near Botanical Gardens), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_evandy',
        name: 'Evandy Hostel',
        type: 'unisex',
        capacity: 1200,
        description: 'A highly sought-after private hostel providing modern self-contained apartments, study balconies, fast-food dining halls, and robust student security networks.',
        location: 'Near TF Hostel, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_bani',
        name: 'Bani Hostel',
        type: 'unisex',
        capacity: 1000,
        description: 'An outstanding private hostel featuring beautiful reading bays, high-speed fiber internet infrastructure, power generators, and personal room kitchenettes.',
        location: 'Bani Area (Near Legon Botanical Gardens), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_jubilee',
        name: 'Jubilee Hall',
        type: 'unisex',
        capacity: 500,
        description: 'A quiet, celebratory university hostel. Offers peaceful single and double rooms dedicated to final-year undergraduate students, researchers, and honors students.',
        location: 'Main Campus (Central), Legon',
        imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'hst_ish',
        name: 'International Students Hostel (ISH)',
        type: 'unisex',
        capacity: 300,
        description: 'A dedicated premium residential block catering to global foreign exchange students, international researchers, and academic visitors. Promotes global cultural integration.',
        location: 'Near Volta Hall, Legon',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      },
    ];

    // Rooms (Seeded rooms for each of the 15 halls and hostels with authentic structures)
    const rooms: Room[] = [
      // Commonwealth Hall Rooms (Male)
      {
        id: 'rm_commonwealth_101',
        hostelId: 'hst_commonwealth',
        roomNo: 'A101',
        capacity: 4,
        occupied: 2,
        price: 150000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_commonwealth_102',
        hostelId: 'hst_commonwealth',
        roomNo: 'A102',
        capacity: 4,
        occupied: 4,
        price: 150000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_commonwealth_103',
        hostelId: 'hst_commonwealth',
        roomNo: 'A103',
        capacity: 2,
        occupied: 0,
        price: 250000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Legon Hall Rooms (Unisex)
      {
        id: 'rm_legon_101',
        hostelId: 'hst_legon',
        roomNo: 'L101',
        capacity: 4,
        occupied: 1,
        price: 160000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_legon_102',
        hostelId: 'hst_legon',
        roomNo: 'L102',
        capacity: 2,
        occupied: 2,
        price: 260000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },

      // Akuafo Hall Rooms (Unisex)
      {
        id: 'rm_akuafo_101',
        hostelId: 'hst_akuafo',
        roomNo: 'AK101',
        capacity: 4,
        occupied: 0,
        price: 150000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_akuafo_102',
        hostelId: 'hst_akuafo',
        roomNo: 'AK102',
        capacity: 2,
        occupied: 1,
        price: 250000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Volta Hall Rooms (Female Only)
      {
        id: 'rm_volta_101',
        hostelId: 'hst_volta',
        roomNo: 'V101',
        capacity: 4,
        occupied: 2,
        price: 170000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_volta_102',
        hostelId: 'hst_volta',
        roomNo: 'V102',
        capacity: 2,
        occupied: 0,
        price: 270000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Mensah Sarbah Rooms (Unisex)
      {
        id: 'rm_sarbah_101',
        hostelId: 'hst_sarbah',
        roomNo: 'MS101',
        capacity: 4,
        occupied: 3,
        price: 150000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_sarbah_102',
        hostelId: 'hst_sarbah',
        roomNo: 'MS102',
        capacity: 2,
        occupied: 2,
        price: 250000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },

      // Alexander Kwapong Rooms (Unisex / Diaspora)
      {
        id: 'rm_kwapong_101',
        hostelId: 'hst_kwapong',
        roomNo: 'K101',
        capacity: 4,
        occupied: 2,
        price: 350000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_kwapong_102',
        hostelId: 'hst_kwapong',
        roomNo: 'K102',
        capacity: 2,
        occupied: 0,
        price: 450000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Hilla Limann Rooms (Unisex / Diaspora)
      {
        id: 'rm_limann_101',
        hostelId: 'hst_limann',
        roomNo: 'HL101',
        capacity: 4,
        occupied: 1,
        price: 350000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_limann_102',
        hostelId: 'hst_limann',
        roomNo: 'HL102',
        capacity: 2,
        occupied: 2,
        price: 450000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },

      // Elizabeth Frances Sey Rooms (Unisex / Diaspora)
      {
        id: 'rm_sey_101',
        hostelId: 'hst_sey',
        roomNo: 'S101',
        capacity: 4,
        occupied: 2,
        price: 360000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_sey_102',
        hostelId: 'hst_sey',
        roomNo: 'S102',
        capacity: 2,
        occupied: 1,
        price: 460000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Jean Nelson Rooms (Unisex / Diaspora)
      {
        id: 'rm_jean_nelson_101',
        hostelId: 'hst_jean_nelson',
        roomNo: 'JN101',
        capacity: 4,
        occupied: 3,
        price: 350000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_jean_nelson_102',
        hostelId: 'hst_jean_nelson',
        roomNo: 'JN102',
        capacity: 2,
        occupied: 0,
        price: 450000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Pentagon Rooms (Unisex / Private)
      {
        id: 'rm_pentagon_101',
        hostelId: 'hst_pentagon',
        roomNo: 'P101',
        capacity: 4,
        occupied: 2,
        price: 650000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_pentagon_102',
        hostelId: 'hst_pentagon',
        roomNo: 'P102',
        capacity: 2,
        occupied: 2,
        price: 850000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_pentagon_103',
        hostelId: 'hst_pentagon',
        roomNo: 'P103',
        capacity: 1,
        occupied: 0,
        price: 1200000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // James Topp Nelson Yankah (TF Hostel) (Unisex / Private)
      {
        id: 'rm_tf_101',
        hostelId: 'hst_tf',
        roomNo: 'TF101',
        capacity: 4,
        occupied: 1,
        price: 500000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_tf_102',
        hostelId: 'hst_tf',
        roomNo: 'TF102',
        capacity: 2,
        occupied: 0,
        price: 700000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Evandy Hostel Rooms (Unisex / Private)
      {
        id: 'rm_evandy_101',
        hostelId: 'hst_evandy',
        roomNo: 'E101',
        capacity: 4,
        occupied: 2,
        price: 600000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_evandy_102',
        hostelId: 'hst_evandy',
        roomNo: 'E102',
        capacity: 2,
        occupied: 2,
        price: 800000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },

      // Bani Hostel Rooms (Unisex / Private)
      {
        id: 'rm_bani_101',
        hostelId: 'hst_bani',
        roomNo: 'B101',
        capacity: 4,
        occupied: 0,
        price: 550000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_bani_102',
        hostelId: 'hst_bani',
        roomNo: 'B102',
        capacity: 2,
        occupied: 1,
        price: 750000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // Jubilee Hall Rooms (Unisex)
      {
        id: 'rm_jubilee_101',
        hostelId: 'hst_jubilee',
        roomNo: 'J101',
        capacity: 2,
        occupied: 1,
        price: 300000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_jubilee_102',
        hostelId: 'hst_jubilee',
        roomNo: 'J102',
        capacity: 1,
        occupied: 0,
        price: 500000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },

      // ISH Rooms (Unisex / International)
      {
        id: 'rm_ish_101',
        hostelId: 'hst_ish',
        roomNo: 'ISH101',
        capacity: 2,
        occupied: 2,
        price: 400000,
        status: 'full',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rm_ish_102',
        hostelId: 'hst_ish',
        roomNo: 'ISH102',
        capacity: 1,
        occupied: 0,
        price: 600000,
        status: 'available',
        createdAt: new Date().toISOString(),
      },
    ];

    // Applications
    const applications: HostelApplication[] = [
      {
        id: 'app_001',
        studentId: 'usr_student_john',
        hostelId: 'hst_commonwealth',
        roomId: 'rm_commonwealth_101',
        academicYear: '2025/2026',
        status: 'approved',
        paymentStatus: 'paid',
        message: 'Requesting allocation in Commonwealth Hall. Proud to be a vandal!',
        adminComment: 'Allocated to Room A101 lower bunk.',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'app_002',
        studentId: 'usr_student_jane',
        hostelId: 'hst_volta',
        roomId: 'rm_volta_101',
        academicYear: '2025/2026',
        status: 'pending',
        paymentStatus: 'unpaid',
        message: 'Looking forward to staying in Volta hall. Extremely safe and close to my departments.',
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
        message: 'Your hostel application for Commonwealth Hall has been approved and allocated to Room A101!',
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
