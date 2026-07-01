import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DBEngine } from '../db/db';
import { Hostel, Room } from '../types';
import crypto from 'crypto';

export class HostelController {
  // Hostel API Handlers
  static async listHostels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let hostels = DBEngine.getHostels();
      const rooms = DBEngine.getRooms();

      // Populate extra details (like count of total and available rooms)
      let hostelsWithStats = hostels.map(h => {
        const hostelRooms = rooms.filter(r => r.hostelId === h.id);
        const totalRoomsCount = hostelRooms.length;
        const occupiedCount = hostelRooms.reduce((sum, r) => sum + r.occupied, 0);
        const totalRoomCapacity = hostelRooms.reduce((sum, r) => sum + r.capacity, 0);
        
        return {
          ...h,
          totalRooms: totalRoomsCount,
          totalCapacity: totalRoomCapacity,
          totalOccupied: occupiedCount,
          availableCapacity: totalRoomCapacity - occupiedCount,
        };
      });

      // Search Filter (by Name or Location)
      const { search, type, hasVacancy, page, limit } = req.query;
      
      if (search) {
        const searchStr = String(search).toLowerCase();
        hostelsWithStats = hostelsWithStats.filter(
          h => h.name.toLowerCase().includes(searchStr) || h.location.toLowerCase().includes(searchStr)
        );
      }

      // Type Filter (male, female, unisex)
      if (type && type !== 'all') {
        const typeStr = String(type).toLowerCase();
        hostelsWithStats = hostelsWithStats.filter(h => h.type === typeStr);
      }

      // Vacancy Filter
      if (hasVacancy === 'true') {
        hostelsWithStats = hostelsWithStats.filter(h => h.availableCapacity > 0);
      }

      const totalCount = hostelsWithStats.length;

      // Pagination
      if (page && limit) {
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        
        const paginatedData = hostelsWithStats.slice(startIndex, endIndex);
        
        res.setHeader('X-Total-Count', totalCount.toString());
        res.setHeader('X-Page', pageNum.toString());
        res.setHeader('X-Limit', limitNum.toString());
        res.setHeader('X-Total-Pages', Math.ceil(totalCount / limitNum).toString());
        
        res.status(200).json(paginatedData);
        return;
      }

      res.status(200).json(hostelsWithStats);
    } catch (error: any) {
      console.error('Error listing hostels:', error);
      res.status(500).json({ error: 'Failed to retrieve hostels list.' });
    }
  }

  static async createHostel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, type, capacity, description, location, imageUrl } = req.body;

      if (!name || !type || !capacity || !location) {
        res.status(400).json({ error: 'Name, type, capacity, and location are required.' });
        return;
      }

      const hostels = DBEngine.getHostels();
      if (hostels.some(h => h.name.toLowerCase() === name.toLowerCase())) {
        res.status(400).json({ error: `Hostel with name "${name}" already exists.` });
        return;
      }

      const newHostel: Hostel = {
        id: `hst_${crypto.randomBytes(8).toString('hex')}`,
        name: name.trim(),
        type: type as 'male' | 'female' | 'unisex',
        capacity: Number(capacity),
        description: description?.trim() || '',
        location: location.trim(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString(),
      };

      DBEngine.addHostel(newHostel);
      res.status(201).json({ message: 'Hostel created successfully', hostel: newHostel });
    } catch (error: any) {
      console.error('Error creating hostel:', error);
      res.status(500).json({ error: 'Failed to create hostel.' });
    }
  }

  static async updateHostel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type, capacity, description, location, imageUrl } = req.body;

      const success = DBEngine.updateHostel(id, {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(capacity && { capacity: Number(capacity) }),
        ...(description && { description: description.trim() }),
        ...(location && { location: location.trim() }),
        ...(imageUrl && { imageUrl }),
      });

      if (!success) {
        res.status(404).json({ error: 'Hostel not found.' });
        return;
      }

      res.status(200).json({ message: 'Hostel updated successfully' });
    } catch (error: any) {
      console.error('Error updating hostel:', error);
      res.status(500).json({ error: 'Failed to update hostel.' });
    }
  }

  static async deleteHostel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if any rooms in this hostel are currently occupied
      const rooms = DBEngine.getRooms().filter(r => r.hostelId === id);
      const isOccupied = rooms.some(r => r.occupied > 0);

      if (isOccupied) {
        res.status(400).json({ error: 'Cannot delete hostel because some rooms are currently occupied by students.' });
        return;
      }

      const success = DBEngine.deleteHostel(id);
      if (!success) {
        res.status(404).json({ error: 'Hostel not found.' });
        return;
      }

      res.status(200).json({ message: 'Hostel and its associated rooms deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting hostel:', error);
      res.status(500).json({ error: 'Failed to delete hostel.' });
    }
  }

  // Room API Handlers
  static async listRoomsByHostel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hostelId } = req.params;
      const rooms = DBEngine.getRooms().filter(r => r.hostelId === hostelId);
      const hostel = DBEngine.getHostels().find(h => h.id === hostelId);

      if (!hostel) {
        res.status(404).json({ error: 'Hostel not found.' });
        return;
      }

      const roomsWithHostelDetails = rooms.map(r => ({
        ...r,
        hostelName: hostel.name,
      }));

      res.status(200).json(roomsWithHostelDetails);
    } catch (error: any) {
      console.error('Error listing rooms:', error);
      res.status(500).json({ error: 'Failed to retrieve rooms list.' });
    }
  }

  static async addRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hostelId } = req.params;
      const { roomNo, capacity, price } = req.body;

      if (!roomNo || !capacity || !price) {
        res.status(400).json({ error: 'Room number, capacity, and price are required.' });
        return;
      }

      const numCapacity = Number(capacity);
      const numPrice = Number(price);

      if (isNaN(numCapacity) || numCapacity <= 0) {
        res.status(400).json({ error: 'Room capacity must be a positive integer greater than 0.' });
        return;
      }

      if (isNaN(numPrice) || numPrice < 0) {
        res.status(400).json({ error: 'Room price/fee cannot be negative.' });
        return;
      }

      const hostel = DBEngine.getHostels().find(h => h.id === hostelId);
      if (!hostel) {
        res.status(404).json({ error: 'Hostel not found.' });
        return;
      }

      // Check if room number is unique within the hostel
      const existingRooms = DBEngine.getRooms().filter(r => r.hostelId === hostelId);
      if (existingRooms.some(r => r.roomNo.toLowerCase() === roomNo.trim().toLowerCase())) {
        res.status(400).json({ error: `Room ${roomNo} already exists in this hostel.` });
        return;
      }

      const newRoom: Room = {
        id: `rm_${crypto.randomBytes(8).toString('hex')}`,
        hostelId,
        roomNo: roomNo.trim().toUpperCase(),
        capacity: numCapacity,
        occupied: 0,
        price: numPrice,
        status: 'available',
        createdAt: new Date().toISOString(),
      };

      DBEngine.addRoom(newRoom);
      res.status(201).json({ message: 'Room added successfully', room: newRoom });
    } catch (error: any) {
      console.error('Error adding room:', error);
      res.status(500).json({ error: 'Failed to add room.' });
    }
  }

  static async updateRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { roomNo, capacity, occupied, price, status } = req.body;

      const rooms = DBEngine.getRooms();
      const targetRoom = rooms.find(r => r.id === roomId);

      if (!targetRoom) {
        res.status(404).json({ error: 'Room not found.' });
        return;
      }

      // Validate duplicate room code within the same hostel
      if (roomNo && roomNo.trim().toUpperCase() !== targetRoom.roomNo) {
        const otherRooms = rooms.filter(r => r.hostelId === targetRoom.hostelId && r.id !== roomId);
        if (otherRooms.some(r => r.roomNo.toLowerCase() === roomNo.trim().toLowerCase())) {
          res.status(400).json({ error: `Room ${roomNo} already exists in this hostel.` });
          return;
        }
      }

      // Validate capacity vs occupied
      const finalOccupied = occupied !== undefined ? Number(occupied) : targetRoom.occupied;
      const finalCapacity = capacity !== undefined ? Number(capacity) : targetRoom.capacity;

      if (isNaN(finalCapacity) || finalCapacity <= 0) {
        res.status(400).json({ error: 'Room capacity must be a positive integer greater than 0.' });
        return;
      }

      if (finalOccupied > finalCapacity) {
        res.status(400).json({ error: 'Occupied slots cannot exceed the total room capacity.' });
        return;
      }

      if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
        res.status(400).json({ error: 'Room price/fee cannot be negative.' });
        return;
      }

      let finalStatus = status || targetRoom.status;
      if (finalOccupied >= finalCapacity && finalCapacity > 0) {
        finalStatus = 'full';
      } else if (finalOccupied < finalCapacity && finalStatus === 'full') {
        finalStatus = 'available';
      }

      const success = DBEngine.updateRoom(roomId, {
        ...(roomNo && { roomNo: roomNo.trim().toUpperCase() }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(occupied !== undefined && { occupied: Number(occupied) }),
        ...(price !== undefined && { price: Number(price) }),
        status: finalStatus,
      });

      if (!success) {
        res.status(404).json({ error: 'Room not found.' });
        return;
      }

      res.status(200).json({ message: 'Room updated successfully' });
    } catch (error: any) {
      console.error('Error updating room:', error);
      res.status(500).json({ error: 'Failed to update room.' });
    }
  }

  static async deleteRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;

      const targetRoom = DBEngine.getRooms().find(r => r.id === roomId);
      if (!targetRoom) {
        res.status(404).json({ error: 'Room not found.' });
        return;
      }

      if (targetRoom.occupied > 0) {
        res.status(400).json({ error: 'Cannot delete an active room while students are allocated to it.' });
        return;
      }

      const success = DBEngine.deleteRoom(roomId);
      if (!success) {
        res.status(404).json({ error: 'Room not found.' });
        return;
      }

      res.status(200).json({ message: 'Room deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room.' });
    }
  }
}
