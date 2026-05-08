import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

// Track event helper
export async function trackEvent(type: 'CALCULATION' | 'PDF_DOWNLOAD', metadata: any = {}) {
  try {
    const analyticsRef = collection(db, 'analytics_events');
    await addDoc(analyticsRef, {
      type,
      timestamp: serverTimestamp(),
      ...metadata
    });
  } catch (error) {
    // If it's a permission error, it might be expected if the user is spamming or if rules are strict
    console.error('Failed to track event:', error);
  }
}

// Test connection strictly according to guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
     if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    // Permission errors are expected here because of "default deny" rule
  }
}
testConnection();
