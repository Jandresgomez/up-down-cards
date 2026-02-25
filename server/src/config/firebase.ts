import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'up-down-cards',
  credential: admin.credential.applicationDefault()
});

export const db = admin.firestore();
