import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "up-down-cards",
  appId: "1:1043296434823:web:78e37686e2ae022ecb9622",
  storageBucket: "up-down-cards.firebasestorage.app",
  apiKey: "AIzaSyCmfvbcaokJ1S9MmKYsVBrS_rdKGi8ez1w",
  authDomain: "up-down-cards.firebaseapp.com",
  messagingSenderId: "1043296434823",
  measurementId: "G-KZSTHC3WK6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const db = getFirestore(app);

// Connect to emulators in development
const isDevelopment = import.meta.env.MODE === 'dev';

if (isDevelopment) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('🔧 Connected to Firebase emulators');
}

// Auto sign-in anonymously
signInAnonymously(auth).catch(console.error);
