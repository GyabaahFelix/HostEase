/**
 * HostelEase Global Type Definitions
 */

export type UserRole = 'student' | 'hostel_admin' | 'system_admin';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  matricNoOrStaffId: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  department?: string;
  createdAt: string;
  // Account status and verification fields
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: number;
}

export interface Hostel {
  id: string;
  name: string;
  type: 'male' | 'female' | 'unisex';
  capacity: number;
  description: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  hostelId: string;
  hostelName?: string; // populated field
  roomNo: string;
  capacity: number;
  occupied: number;
  price: number;
  status: 'available' | 'full' | 'maintenance';
  createdAt: string;
}

export interface HostelApplication {
  id: string;
  studentId: string;
  studentName?: string; // populated field
  studentMatric?: string; // populated field
  studentGender?: string; // populated field
  hostelId: string;
  hostelName?: string; // populated field
  roomId?: string;
  roomNo?: string; // populated field
  academicYear: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'unpaid' | 'paid';
  message?: string;
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: 'application_update' | 'allocation_update' | 'system_announcement';
  readBy?: string[]; // userIds of students who have read this system announcement
}

export interface SystemStats {
  totalStudents: number;
  totalHostels: number;
  totalRooms: number;
  totalApplications: number;
  pendingApplications: number;
  allocatedRooms: number;
  occupancyRate: number;
}
