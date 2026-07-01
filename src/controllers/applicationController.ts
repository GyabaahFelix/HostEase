import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DBEngine } from '../db/db';
import { HostelApplication, Notification, Room } from '../types';
import crypto from 'crypto';
import { NotificationService } from '../db/mongodb';

export class ApplicationController {
  static async submitApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user;
      const { hostelId, academicYear, message } = req.body;

      if (!hostelId || !academicYear) {
        res.status(400).json({ error: 'Hostel selection and Academic Year are required.' });
        return;
      }

      // Check if student already has a pending or approved application for this academic year
      const existingApps = DBEngine.getApplications().filter(
        a => a.studentId === student.id && a.academicYear === academicYear
      );

      const hasActiveAllocation = existingApps.some(a => a.status === 'approved' || a.status === 'pending');
      if (hasActiveAllocation) {
        res.status(400).json({
          error: 'You already have an active (pending or approved) hostel application for this academic year.',
        });
        return;
      }

      // Validate hostel gender policy
      const hostel = DBEngine.getHostels().find(h => h.id === hostelId);
      if (!hostel) {
        res.status(404).json({ error: 'Selected hostel does not exist.' });
        return;
      }

      if (hostel.type !== 'unisex' && hostel.type !== student.gender) {
        res.status(400).json({
          error: `Gender mismatch. This hostel is designated for ${hostel.type} students, but your profile is registered as ${student.gender}.`,
        });
        return;
      }

      const newApplication: HostelApplication = {
        id: `app_${crypto.randomBytes(8).toString('hex')}`,
        studentId: student.id,
        hostelId,
        academicYear,
        status: 'pending',
        paymentStatus: 'unpaid',
        message: message?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DBEngine.addApplication(newApplication);

      // Create Admin Notification
      await NotificationService.createNotification(
        'usr_hostel_admin',
        'New Hostel Application',
        `Student ${student.name} (${student.matricNoOrStaffId}) has submitted a new application for ${hostel.name}.`,
        'application_update'
      );

      res.status(201).json({
        message: 'Application submitted successfully.',
        application: newApplication,
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      res.status(500).json({ error: 'Failed to submit application.' });
    }
  }

  static async listApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      let apps = DBEngine.getApplications();

      // If student, filter only their own applications
      if (user.role === 'student') {
        apps = apps.filter(a => a.studentId === user.id);
      }

      const usersList = DBEngine.getUsers();
      const hostelsList = DBEngine.getHostels();
      const roomsList = DBEngine.getRooms();

      // Populate related models
      const populatedApps = apps.map(app => {
        const student = usersList.find(u => u.id === app.studentId);
        const hostel = hostelsList.find(h => h.id === app.hostelId);
        const room = app.roomId ? roomsList.find(r => r.id === app.roomId) : undefined;

        return {
          ...app,
          studentName: student?.name || 'Unknown Student',
          studentMatric: student?.matricNoOrStaffId || 'N/A',
          studentGender: student?.gender || 'N/A',
          hostelName: hostel?.name || 'Unknown Hostel',
          roomNo: room?.roomNo || 'Unassigned',
        };
      });

      // Sort newest first
      populatedApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json(populatedApps);
    } catch (error: any) {
      console.error('Error listing applications:', error);
      res.status(500).json({ error: 'Failed to retrieve applications.' });
    }
  }

  static async updateApplicationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, roomId, adminComment } = req.body;

      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        res.status(400).json({ error: 'Invalid application status.' });
        return;
      }

      const apps = DBEngine.getApplications();
      const app = apps.find(a => a.id === id);

      if (!app) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      let finalRoomId = app.roomId;

      // Handle room allocation if approving
      if (status === 'approved') {
        if (!roomId) {
          res.status(400).json({ error: 'Room allocation is required when approving an application.' });
          return;
        }

        const room = DBEngine.getRooms().find(r => r.id === roomId);
        if (!room) {
          res.status(404).json({ error: 'Selected room not found.' });
          return;
        }

        if (room.status === 'full' || room.status === 'maintenance' || room.occupied >= room.capacity) {
          res.status(400).json({ error: 'Selected room is not available or is already full.' });
          return;
        }

        if (room.hostelId !== app.hostelId) {
          res.status(400).json({ error: 'Selected room does not belong to the applied hostel.' });
          return;
        }

        // Allocation Compatibility validation: Same-room same-gender restriction for unisex hostels
        const student = DBEngine.getUsers().find(u => u.id === app.studentId);
        if (!student) {
          res.status(404).json({ error: 'Applicant student profile not found.' });
          return;
        }

        const hostel = DBEngine.getHostels().find(h => h.id === app.hostelId);
        if (hostel && hostel.type === 'unisex') {
          const activeRoomApps = DBEngine.getApplications().filter(
            a => a.roomId === room.id && a.status === 'approved' && a.id !== app.id
          );
          const otherStudentGenders = activeRoomApps
            .map(a => DBEngine.getUsers().find(u => u.id === a.studentId)?.gender)
            .filter(g => g && g !== student.gender);

          if (otherStudentGenders.length > 0) {
            res.status(400).json({
              error: `Room Compatibility Mismatch: Room ${room.roomNo} in unisex ${hostel.name} is already allocated to a ${otherStudentGenders[0]} student. Multi-occupancy rooms must remain gender-consistent.`,
            });
            return;
          }
        }

        finalRoomId = roomId;
      } else if (status === 'rejected') {
        finalRoomId = undefined; // clear allocation if rejected
      }

      DBEngine.updateApplication(id, {
        status,
        roomId: finalRoomId,
        adminComment: adminComment?.trim() || '',
      });

      // Send Notification to Student
      const hostel = DBEngine.getHostels().find(h => h.id === app.hostelId);
      await NotificationService.createNotification(
        app.studentId,
        `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your application for ${hostel?.name || 'hostel'} has been ${status}. ${
          status === 'approved' ? 'Please complete your room payment to lock in your slot.' : ''
        }`,
        status === 'approved' ? 'allocation_update' : 'application_update'
      );

      res.status(200).json({ message: `Application ${status} successfully.` });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      res.status(500).json({ error: 'Failed to update application status.' });
    }
  }

  static async payForAllocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const student = req.user;

      const app = DBEngine.getApplications().find(a => a.id === id);
      if (!app) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      if (app.studentId !== student.id) {
        res.status(403).json({ error: 'Forbidden: You can only make payments for your own applications.' });
        return;
      }

      if (app.status !== 'approved') {
        res.status(400).json({ error: 'You can only pay for approved room allocations.' });
        return;
      }

      if (app.paymentStatus === 'paid') {
        res.status(400).json({ error: 'This room allocation is already paid for.' });
        return;
      }

      if (!app.roomId) {
        res.status(400).json({ error: 'No room was allocated to this application.' });
        return;
      }

      const room = DBEngine.getRooms().find(r => r.id === app.roomId);
      if (!room) {
        res.status(404).json({ error: 'Allocated room not found.' });
        return;
      }

      if (room.occupied >= room.capacity) {
        res.status(400).json({ error: 'Selected room is now full. Please contact Student Affairs.' });
        return;
      }

      // Process payment successfully
      DBEngine.updateApplication(id, { paymentStatus: 'paid' });

      // Increment room occupancy
      const newOccupied = room.occupied + 1;
      const isFull = newOccupied >= room.capacity;
      DBEngine.updateRoom(room.id, {
        occupied: newOccupied,
        status: isFull ? 'full' : 'available',
      });

      // Send Success Notification
      await NotificationService.createNotification(
        student.id,
        'Payment Successful',
        `Payment confirmed! You have successfully secured room ${room.roomNo} for the upcoming academic year.`,
        'allocation_update'
      );

      res.status(200).json({ message: 'Payment processed successfully, room slot secured.' });
    } catch (error: any) {
      console.error('Error in application payment:', error);
      res.status(500).json({ error: 'Failed to process payment.' });
    }
  }

  static async cancelApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user;

      const app = DBEngine.getApplications().find(a => a.id === id);
      if (!app) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      // Authorization Check
      if (user.role === 'student' && app.studentId !== user.id) {
        res.status(403).json({ error: 'Forbidden: You can only cancel your own applications.' });
        return;
      }

      // If approved & paid, decrement room occupant count
      if (app.status === 'approved' && app.paymentStatus === 'paid' && app.roomId) {
        const room = DBEngine.getRooms().find(r => r.id === app.roomId);
        if (room) {
          const newOccupied = Math.max(0, room.occupied - 1);
          DBEngine.updateRoom(room.id, {
            occupied: newOccupied,
            status: newOccupied >= room.capacity ? 'full' : 'available',
          });
        }
      }

      DBEngine.deleteApplication(id);

      // Send cancellation notification
      const isSelf = user.id === app.studentId;
      await NotificationService.createNotification(
        app.studentId,
        'Application Cancelled',
        isSelf
          ? 'You have successfully cancelled your hostel application.'
          : 'Your hostel application has been cancelled by the administration.',
        'application_update'
      );

      res.status(200).json({ message: 'Application cancelled successfully.' });
    } catch (error: any) {
      console.error('Error in cancelApplication:', error);
      res.status(500).json({ error: 'Failed to cancel application.' });
    }
  }
}
