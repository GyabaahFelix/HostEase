import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { DBEngine } from './src/db/db';
import { AuthController } from './src/controllers/authController';
import { HostelController } from './src/controllers/hostelController';
import { ApplicationController } from './src/controllers/applicationController';
import { StatsController } from './src/controllers/statsController';
import { authMiddleware, requireRole } from './src/middleware/authMiddleware';

// --- Environment Variables Startup Validation ---
const requiredCoreVars = [
  'JWT_SECRET',
];

const missingCoreVars = requiredCoreVars.filter(v => !process.env[v]);

if (missingCoreVars.length > 0) {
  console.error('\n====================================================');
  console.error('❌ SERVER STARTUP VALIDATION WARNING:');
  console.error('Missing core environment variable(s):');
  missingCoreVars.forEach(v => {
    console.error(`   - ${v}`);
  });
  console.error('Generating development fallback credentials where possible.');
  console.error('====================================================\n');
}

// Optional integrations check
const optionalIntegrations = [
  { name: 'MongoDB Atlas Persistence', key: 'MONGODB_URI', fallback: 'Internal JSON Database Engine (data/db.json)' },
  { name: 'Cloudinary CDN Asset Storage', key: 'CLOUDINARY_URL', fallback: 'Local Asset Gallery' },
  { name: 'Gemini AI Assistant', key: 'GEMINI_API_KEY', fallback: 'Heuristic Rule-Based Matching' }
];

console.log('--- System Integrations Status ---');
optionalIntegrations.forEach(svc => {
  if (process.env[svc.key]) {
    console.log(`✅ ${svc.name}: Configured via ${svc.key}`);
  } else {
    console.log(`ℹ️  ${svc.name}: Not configured. Active Fallback -> ${svc.fallback}`);
  }
});
console.log('----------------------------------');

// Initialize internal JSON database
DBEngine.initialize();

const app = express();

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // In development or preview environments, or if matching allowedOrigins/wildcard/localhost/preview domains, allow it
    if (
      process.env.NODE_ENV !== 'production' ||
      allowedOrigins.indexOf(origin) !== -1 ||
      allowedOrigins.includes('*') ||
      origin.includes('localhost') ||
      origin.endsWith('.run.app') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('vercel') ||
      origin.includes('ai.studio')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.put('/api/auth/profile', authMiddleware, AuthController.updateProfile);
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

// Root & Health Check Endpoints
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  res.status(200).json({
    status: 'OK',
    service: 'HostelEase Backend',
    version: '1.0.0'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'HostelEase Backend',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  // If in development/non-production, enable Vite dev server to serve the React SPA
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite development middleware integrated.');
    } catch (err) {
      console.error('Failed to load Vite development middleware:', err);
    }
  }

  // Only listen if we are not running as a Vercel Serverless Function
  if (!process.env.VERCEL) {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` HostelEase Standalone Backend Server Running on Port ${port}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
