
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";

import type {
    Session,
    User,
} from "@supabase/supabase-js";

import { supabase } from "../services/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    // --------------------------------------------------------
    // Get existing Supabase session
    // --------------------------------------------------------

    const loadSession = async () => {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "❌ Failed to get Supabase session:",
            error
          );
        }

        if (mounted) {
          setSession(
            data.session ?? null
          );
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "❌ Failed to load auth session:",
          error
        );

        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    loadSession();

    // --------------------------------------------------------
    // Listen for authentication changes
    // --------------------------------------------------------

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;

          setSession(
            newSession ?? null
          );

          setLoading(false);
        }
      );

    // --------------------------------------------------------
    // Cleanup
    // --------------------------------------------------------

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------------
  // Sign out
  // ----------------------------------------------------------

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "❌ Supabase sign out failed:",
        error
      );

      throw error;
    }
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

