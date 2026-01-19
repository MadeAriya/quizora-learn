import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/SupabaseConfig";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/", 
      },
    });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    // Ambil session pertama kali saat app load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setCurrentUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listener jika ada perubahan login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
