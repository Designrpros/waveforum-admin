// src/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBB6iYnZPhLS4bQcblIoCnwEECCmcsUAxk",
  authDomain: "waveform-d0bf6.firebaseapp.com",
  projectId: "waveform-d0bf6",
  storageBucket: "waveform-d0bf6.firebasestorage.app",
  messagingSenderId: "674358758887",
  appId: "1:674358758887:web:2d7c311c03466f34e88142",
  measurementId: "G-ZHJXSM8LFW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on the client-side to prevent server-side errors
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export the initialized app and analytics instances
export { app, analytics };