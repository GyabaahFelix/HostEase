import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentData
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load configuration with multi-environment fallbacks
export interface FirebaseConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

let loadedConfig: FirebaseConfig = {};

// 1. Check local firebase-applet-config.json (AI Studio native provisioned config)
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    loadedConfig = JSON.parse(raw);
  }
} catch {
  // If running in browser or file not found, fall through
}

// 2. Fallback to process.env or import.meta.env for Vercel and manual deployments
const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const envApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const envAppId = process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
const envAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN;
const envDbId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
const envStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;

if (!loadedConfig.projectId && envProjectId) {
  loadedConfig = {
    projectId: envProjectId,
    apiKey: envApiKey || '',
    appId: envAppId || '',
    authDomain: envAuthDomain || `${envProjectId}.firebaseapp.com`,
    firestoreDatabaseId: envDbId || '(default)',
    storageBucket: envStorageBucket || `${envProjectId}.firebasestorage.app`,
  };
}

export const firebaseConfig: FirebaseConfig = loadedConfig;

let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig as any);
} else {
  appInstance = getApp();
}

export const app = appInstance;

// Explicitly pass database ID (Critical for named Firestore instances)
export const db: Firestore = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);

let firebaseConnected = false;

export async function testConnection(): Promise<boolean> {
  if (!firebaseConfig.projectId) {
    console.warn('[Firebase] No Firebase Project ID configured.');
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    firebaseConnected = true;
    console.log(`[Firebase] Successfully connected to Cloud Firestore (Database: ${firebaseConfig.firestoreDatabaseId || '(default)'})`);
    return true;
  } catch (error: any) {
    // If permission or offline
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline. Please check your Firebase configuration.');
      firebaseConnected = false;
      return false;
    }
    // Connected to Firestore server even if test doc does not exist
    firebaseConnected = true;
    console.log(`[Firebase] Cloud Firestore reached successfully.`);
    return true;
  }
}

export function isFirebaseConnected(): boolean {
  return firebaseConnected;
}

// Error handling helper conforming to FirestoreErrorInfo standard
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}
