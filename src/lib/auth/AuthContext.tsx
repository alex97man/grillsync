"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: any | null; // Will expand this later with Revolut tag
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        
        if (currentUser) {
          try {
            // Fetch extended profile data from Firestore
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            } else {
              // Setup initial user doc if it's the first time
              const newProfile = {
                uid: currentUser.uid,
                displayName: currentUser.displayName || "",
                email: currentUser.email || "",
                paymentDetails: { revolutTag: "", iban: "" },
                createdAt: new Date()
              };
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
            }
          } catch (err: any) {
            console.error("Firestore Error in AuthContext:", err);
            alert("Eroare gravă de Bază de Date: Mergi în Firebase Console -> Firestore Database -> Rules, și modifică linia în 'allow read, write: if true;' pentru a debloca aplicația!");
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Init Error:", e);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      alert("Autentificarea a eșuat (sau ai închis fereastra).");
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
