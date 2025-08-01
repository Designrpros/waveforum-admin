// src/lib/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKMhmjQ2wqetjMHE5AWWa1t1-BYnkqs_k",
  authDomain: "waveforum-56a36.firebaseapp.com",
  projectId: "waveforum-56a36",
  storageBucket: "waveforum-56a36.firebasestorage.app",
  messagingSenderId: "1212889640",
  appId: "1:1212889640:web:18726d7902c7671ce2931d",
  measurementId: "G-CNQEM5G79T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional, only if you plan to use Firebase Analytics)
// You might want to wrap this in an if (typeof window !== 'undefined') check
// if you're getting issues with Next.js server-side rendering
let analytics;
if (typeof window !== 'undefined') { // <--- ADD THIS CHECK
  analytics = getAnalytics(app);
}

// Export the initialized app instance for use in other files
export { app, analytics };