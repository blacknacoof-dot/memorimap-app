import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// --- Clerk-compatible user interface ---
interface WrappedUser {
  id: string;
  primaryEmailAddress: { emailAddress: string } | undefined;
  fullName: string | null;
  firstName: string | null;
  username: string | null;
  imageUrl: string | undefined;
  primaryPhoneNumber: { phoneNumber: string } | undefined;
}

interface AuthContextType {
  user: WrappedUser | null;
  session: Session | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isSignedIn: false,
  isLoaded: false,
  signOut: async () => {},
});

function wrapUser(session: Session | null): WrappedUser | null {
  const raw = session?.user;
  if (!raw) return null;
  const meta = raw.user_metadata || {};
  return {
    id: raw.id,
    primaryEmailAddress: raw.email ? { emailAddress: raw.email } : undefined,
    fullName: meta.full_name || null,
    firstName: meta.full_name?.split(' ')[0] || null,
    username: meta.username || raw.email?.split('@')[0] || null,
    imageUrl: meta.avatar_url || undefined,
    primaryPhoneNumber: meta.phone ? { phoneNumber: meta.phone } : undefined,
  };
}

// --- Provider ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsLoaded(true);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const user = useMemo(() => wrapUser(session), [session]);

  const contextValue = useMemo(() => ({
    user, session, isSignedIn: !!session, isLoaded, signOut
  }), [user, session, isLoaded, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Backward-compatible alias
export const ClerkProviderWrapper = AuthProvider;

// --- Hooks ---

export const useUser = () => {
  const { user, isSignedIn, isLoaded } = useContext(AuthContext);
  return { user, isSignedIn, isLoaded };
};

export const useClerk = () => {
  const { signOut } = useContext(AuthContext);
  return {
    signOut,
    openSignIn: () => {
      window.dispatchEvent(new Event('open-login-modal'));
    },
  };
};

export const useSession = () => {
  const { session, user } = useContext(AuthContext);
  const wrappedSession = useMemo(() => session
    ? {
        ...session,
        user: {
          ...session.user,
          ...user,
        },
        getToken: async (_opts?: Record<string, unknown>): Promise<string | null> => session.access_token || null,
      }
    : null, [session, user]);
  return { session: wrappedSession, isLoaded: true };
};

/**
 * Clerk useAuth compatibility.
 * getToken returns the current Supabase access_token (auto-refreshed).
 */
export const useAuth = () => {
  const { user, isSignedIn, session } = useContext(AuthContext);
  return {
    userId: user?.id || null,
    isSignedIn,
    getToken: async (_opts?: Record<string, unknown>): Promise<string | null> => session?.access_token || null,
  };
};

// No longer needed (LoginModal/SignUpModal rewritten with direct Supabase calls)
export const useSignIn = () => ({ signIn: null as never, setActive: null as never, isLoaded: true });
export const useSignUp = () => ({ signUp: null as never, isLoaded: true });
