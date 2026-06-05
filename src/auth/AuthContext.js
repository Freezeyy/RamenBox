import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setRole(null);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          // Default role for first-time sign-in. Change later in Firestore for admin users.
          await setDoc(
            userRef,
            {
              email: user.email ?? null,
              role: "cashier",
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          setRole("cashier");
        } else {
          const data = snap.data();
          setRole(data?.role ?? "cashier");
        }
      } catch (e) {
        console.error("Failed to load user role:", e);
        // Fallback: allow app to load, but treat user as cashier.
        setRole("cashier");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user: authUser,
      role,
      loading,
      isAdmin: role === "admin",
      isCashier: role === "cashier",
    }),
    [authUser, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

