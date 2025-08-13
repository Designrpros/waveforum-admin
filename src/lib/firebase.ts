// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Import all necessary Firebase services and emulator connectors
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get instances of each service
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to all emulators in development mode
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("Connecting to local Firebase emulators...");
  
  // Connect to the Auth Emulator on port 9099
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  
  // Connect to the Firestore Emulator on port 8081
  connectFirestoreEmulator(db, 'localhost', 8081);
  
  // Connect to the Storage Emulator on port 9199
  connectStorageEmulator(storage, "localhost", 9199);
}

// Initialize Analytics
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export all initialized instances
export { app, auth, db, storage, analytics };