import { User, Hostel, Room, HostelApplication, Notification } from './types';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('hostelease_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Authentication
  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ message: string; token: string; user: User }>(res);
    localStorage.setItem('hostelease_token', result.token);
    return result;
  },

  async login(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ message: string; token: string; user: User }>(res);
    localStorage.setItem('hostelease_token', result.token);
    return result;
  },

  async me(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<User>(res);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      console.warn('Logout request failed or server session already cleared', e);
    } finally {
      localStorage.removeItem('hostelease_token');
    }
  },

  async forgotPassword(emailOrUsername: string): Promise<{ message: string; simulatedToken: string | null; instructions?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername }),
    });
    return handleResponse<any>(res);
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse<any>(res);
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return handleResponse<any>(res);
  },

  async sendVerificationEmail(): Promise<{ message: string; simulatedToken: string; instructions?: string }> {
    const res = await fetch(`${API_BASE}/auth/send-verification`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Hostels
  async listHostels(params?: { search?: string; type?: string; hasVacancy?: boolean; page?: number; limit?: number }): Promise<(Hostel & { totalRooms: number; totalCapacity: number; totalOccupied: number; availableCapacity: number })[]> {
    let url = `${API_BASE}/hostels`;
    if (params) {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.type) query.append('type', params.type);
      if (params.hasVacancy) query.append('hasVacancy', 'true');
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      
      const queryString = query.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async createHostel(data: Partial<Hostel>): Promise<{ hostel: Hostel }> {
    const res = await fetch(`${API_BASE}/hostels`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateHostel(id: string, data: Partial<Hostel>): Promise<void> {
    const res = await fetch(`${API_BASE}/hostels/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteHostel(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/hostels/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Rooms
  async listRooms(hostelId: string): Promise<(Room & { hostelName: string })[]> {
    const res = await fetch(`${API_BASE}/hostels/${hostelId}/rooms`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async addRoom(hostelId: string, data: Partial<Room>): Promise<{ room: Room }> {
    const res = await fetch(`${API_BASE}/hostels/${hostelId}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateRoom(roomId: string, data: Partial<Room>): Promise<void> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deleteRoom(roomId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Applications
  async submitApplication(data: { hostelId: string; academicYear: string; message?: string }): Promise<{ application: HostelApplication }> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async listApplications(): Promise<(HostelApplication & { studentName: string; studentMatric: string; studentGender: string; hostelName: string; roomNo: string })[]> {
    const res = await fetch(`${API_BASE}/applications`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async updateApplicationStatus(id: string, data: { status: 'approved' | 'rejected'; roomId?: string; adminComment?: string }): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async payForAllocation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}/pay`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async cancelApplication(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Stats & Notifications
  async getStats(): Promise<{
    summary: {
      totalStudents: number;
      totalHostels: number;
      totalRooms: number;
      totalApplications: number;
      pendingApplications: number;
      allocatedRooms: number;
      occupancyRate: number;
      totalCapacity: number;
    };
    charts: {
      hostelCapacity: { name: string; capacity: number; occupied: number; available: number }[];
      applicationStatus: { name: string; value: number; color: string }[];
      genderDistribution: { name: string; value: number }[];
      revenue: { name: string; revenue: number }[];
    };
  }> {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async listNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse<Notification[]>(res);
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async createAnnouncement(data: { title: string; message: string }): Promise<{ announcement: Notification }> {
    const res = await fetch(`${API_BASE}/notifications/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async listStudents(params?: { search?: string; department?: string; page?: number; limit?: number }): Promise<User[]> {
    let url = `${API_BASE}/students`;
    if (params) {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.department) query.append('department', params.department);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      
      const queryString = query.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<User[]>(res);
  }
};
