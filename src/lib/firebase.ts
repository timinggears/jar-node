/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Connection test as per SKILL.md
async function testConnection() {
  try {
    // Attempting a read on a known path (or just a non-existent one) to verify client is online/configured
    await getDocFromServer(doc(db, 'system', 'handshake'));
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.warn("Firebase client is offline. Check configuration.");
    }
  }
}

testConnection();

export { serverTimestamp };
