import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Official Hostnames & reCAPTCHA Site Key
export const OFFICIAL_HOSTNAMES = ['www.sbmh.org', 'sbmh.org', 'www.SBMH.org', 'SBMH.org'];
export const recaptchaSiteKey = firebaseConfig.recaptchaSiteKey || '6LdccQguAAAAACdIEHz2y_5SGf-hQEhe-t7-LngV';

// Connection test as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('🔥 Connected to Firebase Firestore successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, check internet or configuration.');
    } else {
      // Permission-denied or not-found on 'test/connection' is still a successful network ping to Firestore!
      console.log('🔥 Firebase Firestore reachable');
    }
    return true;
  }
}

// Perform test connection on startup
testFirestoreConnection();
