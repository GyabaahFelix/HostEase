import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DBEngine } from './src/db/db';
import { AuthController } from './src/controllers/authController';
import { HostelController } from './src/controllers/hostelController';
import { ApplicationController } from './src/controllers/applicationController';
import { StatsController } from './src/controllers/statsController';
import { authMiddleware, requireRole } from './src/middleware/authMiddleware';

// Initialize internal JSON database
DBEngine.initialize();

const app = express();
app.use(express.json());

// Log requests for auditing and system analytics
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- RESTful API Routes ---

// Authentication Endpoints
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/me', authMiddleware, AuthController.me);
app.post('/api/auth/logout', AuthController.logout);
app.post('/api/auth/forgot-password', AuthController.forgotPassword);
app.post('/api/auth/reset-password', AuthController.resetPassword);
app.post('/api/auth/verify-email', AuthController.verifyEmail);
app.post('/api/auth/send-verification', authMiddleware, AuthController.sendVerificationEmail);

// Hostel Management Endpoints
app.get('/api/hostels', authMiddleware, HostelController.listHostels);
app.post('/api/hostels', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.createHostel);
app.put('/api/hostels/:id', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.updateHostel);
app.delete('/api/hostels/:id', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.deleteHostel);

// Room Management Endpoints (Scoped per Hostel)
app.get('/api/hostels/:hostelId/rooms', authMiddleware, HostelController.listRoomsByHostel);
app.post('/api/hostels/:hostelId/rooms', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.addRoom);
app.put('/api/rooms/:roomId', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.updateRoom);
app.delete('/api/rooms/:roomId', authMiddleware, requireRole(['hostel_admin', 'system_admin']), HostelController.deleteRoom);

// Application & Allocation Endpoints
app.post('/api/applications', authMiddleware, requireRole(['student']), ApplicationController.submitApplication);
app.get('/api/applications', authMiddleware, ApplicationController.listApplications);
app.put('/api/applications/:id/status', authMiddleware, requireRole(['hostel_admin', 'system_admin']), ApplicationController.updateApplicationStatus);
app.post('/api/applications/:id/pay', authMiddleware, requireRole(['student']), ApplicationController.payForAllocation);
app.delete('/api/applications/:id', authMiddleware, requireRole(['student', 'hostel_admin', 'system_admin']), ApplicationController.cancelApplication);

// Stats, Notifications & Directory
app.get('/api/stats', authMiddleware, StatsController.getStats);
app.get('/api/analytics', authMiddleware, requireRole(['hostel_admin', 'system_admin']), StatsController.getDetailedAnalytics);
app.get('/api/notifications', authMiddleware, StatsController.getNotifications);
app.post('/api/notifications/announcements', authMiddleware, requireRole(['hostel_admin', 'system_admin']), StatsController.createAnnouncement);
app.put('/api/notifications/:id/read', authMiddleware, StatsController.markNotificationRead);
app.get('/api/students', authMiddleware, requireRole(['hostel_admin', 'system_admin']), StatsController.listStudents);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Serve frontend assets conditionally
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production assets from dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Enable Vite's HMR and dev server via express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Only listen on port 3000 if we are not running as a Vercel Serverless Function
  if (!process.env.VERCEL) {
    const port = 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` HostelEase Full-Stack Server Running on Port ${port}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  }
}

// Kick off server listeners
if (!process.env.VERCEL) {
  startServer().catch((error) => {
    console.error('Failed to boot HostelEase server:', error);
    process.exit(1);
  });
}

export default app;
