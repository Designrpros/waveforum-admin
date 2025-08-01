// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '../lib/firebase'; // Ensure this path is correct

// Define the shape of our authentication context
interface AuthContextType {
  user: FirebaseUser | null; // Firebase User object or null if not logged in
  loading: boolean; // True while we are checking auth state
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); // Start as true, as we're loading auth state

  useEffect(() => {
    const auth = getAuth(app); // Get the Firebase Auth instance

    // Set up the Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // Update our user state
      setLoading(false); // Auth state has been determined
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // The value that will be supplied to any consumers of this context
  const contextValue: AuthContextType = { user, loading };

  return (
    <AuthContext.Provider value={contextValue}>
      {children} {/* Render children only when auth state is known */}
    </AuthContext.Provider>
  );
}

// Custom hook to use the Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}