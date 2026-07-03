# HostelEase Production Deployment Guide

This document outlines the step-by-step procedures, environment variables, code configurations, and architectural practices for deploying **HostelEase** to a professional production environment.

---

## 🏗️ Production Architecture Overview

The system is split into a modern decoupled, full-stack architecture:

```
                  ┌──────────────────────────────┐
                  │      Vite + React SPA        │
                  │      Hosted on Vercel        │
                  └──────────────┬───────────────┘
                                 │
                     HTTP API    │  (CORS Enabled)
                     Requests    ▼
                  ┌──────────────────────────────┐
                  │    Express API Backend       │
                  │      Hosted on Render        │
                  └──────┬───────────────┬───────┘
                         │               │
      MongoDB Connection │               │ Cloudinary CDN
                         ▼               ▼
          ┌──────────────────────┐   ┌──────────────────────┐
          │    MongoDB Atlas     │   │      Cloudinary      │
          │  (Document Database) │   │   (Media Storage)    │
          └──────────────────────┘   └──────────────────────┘
```

---

## 📂 Environment Variables

### 📱 Frontend Environment Configuration (`Vercel`)
Create a `.env` file in the root of the React app (or configure these via the Vercel Dashboard).
All frontend variables used in Vite must be prefixed with `VITE_`.

```env
# Point to your production Render Express API backend. (No trailing slash)
VITE_API_URL=https://hostelease-backend.onrender.com

# Unsigned upload preset for direct frontend-to-cloudinary image uploads (Optional fallback)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### ⚙️ Backend Environment Configuration (`Render`)
Configure these secrets in your Render Web Service dashboard under the **Environment** tab.

```env
# Node.js Server Environment
PORT=3000
NODE_ENV=production

# CORS Allowed Origins (Comma-separated list of frontends)
ALLOWED_ORIGINS=https://hostelease.vercel.app,https://hostelease-preview.vercel.app

# Database Credentials
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hostelease?retryWrites=true&w=majority

# JWT Authentication Config
JWT_SECRET=your_jwt_super_secret_production_key_change_me
JWT_EXPIRES_IN=24h

# Cloudinary Integration (For server-side file uploads)
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name

# Gemini API Key (Required for smart recommendation models)
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
```

---

## 🔒 CORS Configuration

CORS (Cross-Origin Resource Sharing) is handled securely in our Express backend. The backend parses allowed origins from the `ALLOWED_ORIGINS` environment variable and validates incoming requests.

```ts
// server.ts
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🔗 Axios / API Base URL Configuration

The API client dynamically resolves the backend location. In production, it targets the Render server. If no variable is defined, it safely falls back to relative requests for integrated dev environments.

```ts
// src/api.ts
import { User, Hostel, Room, HostelApplication, Notification } from './types';

// Load base path from client-side environment variable VITE_API_URL
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('hostelease_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Fetch requests safely proxy to the resolved API_BASE
export const api = {
  async login(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  // ... (all other routes follow the API_BASE reference)
};
```

---

## 🍃 MongoDB Connection Configuration

Mongoose is configured to connect to MongoDB Atlas securely. In production, we enable connection pooling (`maxPoolSize`) to avoid connection exhaustion on high traffic.

```ts
// src/db/mongodb.ts
import mongoose from 'mongoose';

let isConnected = false;

export async function connectToMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is missing.');
    return false;
  }
  
  if (isConnected) return true;

  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,                 // Up to 10 parallel socket connections
      serverSelectionTimeoutMS: 5000,  // Fail fast if database is down
      socketTimeoutMS: 45000,          // Close inactive sockets
    });
    
    isConnected = true;
    console.log('🚀 MongoDB Atlas database connection established.');
    return true;
  } catch (err) {
    console.error('❌ MongoDB Atlas connection failed:', err);
    isConnected = false;
    return false;
  }
}
```

---

## ☁️ Cloudinary Storage Configuration

### Backend Upload Implementation
Integrate `cloudinary` package on your backend to handle files sent from forms:

```ts
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Automatically parses CLOUDINARY_URL from the environment
cloudinary.config();

export async function uploadImage(fileBuffer: Buffer, folderName: string = 'hostelease'): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        transformation: [{ width: 1000, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    ).end(fileBuffer);
  });
}
```

---

## 🔑 JWT Authentication Configuration

Replace the in-memory simulation with robust stateless JWTs for scale.

### 1. Sign JWT on Login/Registration
```ts
// src/controllers/authController.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Within Login/Register:
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

res.json({ message: 'Success', token, user });
```

### 2. Verify JWT Middleware
```ts
// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';

export function authMiddleware(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded; // Contains id, email, role
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}
```

---

## 🚀 Vercel Deployment Notes (Frontend)

To deploy the React client-side application on Vercel:

1. **Vercel Project Setup:**
   - Link your GitHub repository containing the frontend to Vercel.
   - Set **Framework Preset** to `Vite`.
   - Set **Build Command** to `npm run build` or `vite build`.
   - Set **Output Directory** to `dist`.

2. **Configure Client-Side Router Redirects:**
   Since React utilizes a client-side SPA router (`react-router-dom` or similar), reloading a nested page (e.g., `/dashboard`) directly will trigger a `404 Not Found` error.
   We already configured a `/vercel.json` rewrite file in the root directory to handle this:
   ```json
   {
     "version": 2,
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Deploy:**
   - Go to Project Settings -> Environment Variables.
   - Add `VITE_API_URL` pointing to your deployed Render URL (e.g., `https://hostelease-backend.onrender.com`).
   - Trigger deployment.

---

## 🚀 Render Deployment Notes (Backend)

To deploy the Express backend server on Render:

1. **Render Project Setup:**
   - Create a new **Web Service** on Render.
   - Connect your Git repository.
   - Set **Runtime** to `Node`.

2. **Build and Start Commands:**
   - **Build Command:** `npm install` (or `npm run build` if building/compiling backend bundle with `esbuild`).
   - **Start Command:** `npm run start` (this executes our production CommonJS bundle `node dist/server.cjs`).

3. **Configure Environment Variables:**
   - Navigate to the **Environment** tab on Render.
   - Click **Add Environment Variable** and key in:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `mongodb+srv://...` (your Atlas cluster string)
     - `ALLOWED_ORIGINS` = `https://your-app-name.vercel.app`
     - `JWT_SECRET` = `a_very_long_secure_random_string`
     - `GEMINI_API_KEY` = `your_google_ai_studio_api_key`
     - `CLOUDINARY_URL` = `cloudinary://...`

4. **Spin Up & Auto-Sleep (Free Tier):**
   - Render's Free tier spins down Web Services after 15 minutes of inactivity. The first request after sleep will take about 50 seconds. To prevent this, you can setup a cronjob or use a ping service (such as Better Stack or UptimeRobot) to ping `/api/health` every 10 minutes.
