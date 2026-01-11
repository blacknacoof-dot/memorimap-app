import React, { createContext, useContext, useState } from 'react';
import { ClerkProvider as RealClerkProvider, useUser as useRealUser, useClerk as useRealClerk, useSignIn as useRealSignIn, useSignUp as useRealSignUp, useSession as useRealSession } from '@clerk/clerk-react';
import { koKR } from '@clerk/localizations';

// --- Configuration ---
// Safer check for environment variables in browser without global 'process'
const getPublishableKey = () => {
  try {
    // 1. Vite / Modern Standard
    if (import.meta.env && import.meta.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
      return import.meta.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    }
    // 2. Node / Legacy Shim
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
      return process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    }
    // 3. Window Shim
    if (typeof window !== 'undefined' && (window as any).process?.env?.REACT_APP_CLERK_PUBLISHABLE_KEY) {
      return (window as any).process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    }
    // 4. Vite Direct (Correct Variable Name Check)
    if (import.meta.env && import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
      return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    }
  } catch (e) {
    console.warn("Error reading env vars:", e);
  }
  // Fallback: Hardcode the key to ensure it works
  return "pk_test_cmVuZXdpbmctZ29waGVyLTEuY2xlcmsuYWNjb3VudHMuZGV2JA";
};

const PUBLISHABLE_KEY = getPublishableKey();
// const IS_MOCK_MODE = true; // Forced Mock Mode for debugging
const IS_MOCK_MODE = !PUBLISHABLE_KEY;

// --- Mock Context & Hooks ---
const MockAuthContext = createContext<any>({
  mockUseUser: { isLoaded: true, isSignedIn: false, user: null },
  mockClerk: { signOut: async () => { } },
  mockSignIn: { isLoaded: true, signIn: { create: async () => { } }, setActive: async () => { } },
  mockSignUp: { isLoaded: true, signUp: { create: async () => { }, prepareEmailAddressVerification: async () => { }, attemptEmailAddressVerification: async () => { } }, setActive: async () => { } }
});

const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<{ firstName: string; username: string; primaryEmailAddress: { emailAddress: string }; imageUrl: string } | null>(null);

  const mockSignIn = {
    isLoaded: true,
    signIn: {
      create: async ({ identifier, password }: any) => {
        if (identifier && password) {
          return { status: "complete", createdSessionId: "mock-session-id" };
        }
        throw { errors: [{ message: "Invalid credentials" }] };
      }
    },
    setActive: async ({ session }: any) => {
      setIsSignedIn(true);
      setUser({
        firstName: "게스트",
        username: "Guest",
        primaryEmailAddress: { emailAddress: "guest@example.com" },
        imageUrl: ""
      });
    }
  };

  const mockSignUp = {
    isLoaded: true,
    signUp: {
      create: async () => { },
      prepareEmailAddressVerification: async () => { },
      attemptEmailAddressVerification: async () => {
        return { status: "complete", createdSessionId: "mock-session-id" };
      }
    },
    setActive: async () => {
      setIsSignedIn(true);
      setUser({
        firstName: "새회원",
        username: "New User",
        primaryEmailAddress: { emailAddress: "newuser@example.com" },
        imageUrl: ""
      });
    }
  };

  const mockClerk = {
    signOut: async () => {
      setIsSignedIn(false);
      setUser(null);
    }
  };

  const mockUseUser = {
    isLoaded: true,
    isSignedIn,
    user
  };

  return (
    <MockAuthContext.Provider value={{ mockUseUser, mockClerk, mockSignIn, mockSignUp }}>
      {children}
    </MockAuthContext.Provider>
  );
};

// --- Exported Wrapper Components & Hooks ---

export const ClerkProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (IS_MOCK_MODE) {
    // Only log once or not at all to avoid console spam
    // console.warn("Clerk Publishable Key missing. Running in Mock Auth Mode.");
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <RealClerkProvider
      publishableKey={PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
      localization={koKR}
    >
      {children}
    </RealClerkProvider>
  );
};

export const useUser = () => {
  if (IS_MOCK_MODE) {
    const ctx = useContext(MockAuthContext);
    return ctx ? ctx.mockUseUser : { isLoaded: true, isSignedIn: false, user: null };
  }
  return useRealUser();
};

export const useClerk = () => {
  if (IS_MOCK_MODE) {
    const ctx = useContext(MockAuthContext);
    return ctx ? ctx.mockClerk : { signOut: async () => { } };
  }
  return useRealClerk();
};

export const useSignIn = () => {
  if (IS_MOCK_MODE) {
    const ctx = useContext(MockAuthContext);
    return ctx ? ctx.mockSignIn : { isLoaded: true, signIn: {}, setActive: async () => { } };
  }
  return useRealSignIn();
};

export const useSignUp = () => {
  if (IS_MOCK_MODE) {
    const ctx = useContext(MockAuthContext);
    return ctx ? ctx.mockSignUp : { isLoaded: true, signUp: {}, setActive: async () => { } };
  }
  return useRealSignUp();
};

export const useSession = () => {
  if (IS_MOCK_MODE) {
    const ctx = useContext(MockAuthContext);
    // Mock session object structure matching Clerk
    return {
      isLoaded: true,
      isSignedIn: ctx?.mockUseUser?.isSignedIn,
      session: ctx?.mockUseUser?.isSignedIn ? {
        getToken: async ({ template }: { template?: string }) => "mock-supabase-token",
        user: ctx.mockUseUser.user
      } : null
    };
  }
  return useRealSession();
};

export const isClerkConfigured = () => !IS_MOCK_MODE;