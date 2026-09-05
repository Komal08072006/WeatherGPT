import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile with Firestore users/{uid}
  const syncUserProfile = async (firebaseUser, preferredName = null) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return null;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const profile = {
          uid: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || data.email,
          photoURL: data.photoURL || firebaseUser.photoURL || null,
          createdAt: data.createdAt
        };
        setUserProfile(profile);
        return profile;
      } else {
        // Create new Firestore document for user
        const newProfile = {
          uid: firebaseUser.uid,
          name: preferredName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || null,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.warn("Firestore user sync warning (using fallback profile):", error);
      const fallbackProfile = {
        uid: firebaseUser.uid,
        name: preferredName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || null
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Signup
  const signupWithEmail = async (name, email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (name) {
        try {
          await updateProfile(user, { displayName: name });
        } catch (e) {}
      }

      const profile = await syncUserProfile(user, name);
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Email/Password Login
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await syncUserProfile(userCredential.user);
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = await syncUserProfile(user, user.displayName);
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem('weathergpt_user');
      sessionStorage.removeItem('weathergpt_user');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
