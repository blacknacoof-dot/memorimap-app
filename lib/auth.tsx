import React from 'react';
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



// --- Mock Context Removed for Security Hardening ---
// Mock logic has been stripped to enforce production security.
// Use Supabase Auth + Clerk exclusively.

// --- Exported Wrapper Components & Hooks ---

export const ClerkProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Production Security Hardening: Mock Mode Removed
  // All auth is handled by RealClerkProvider


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
  return useRealUser();
};

export const useClerk = () => {
  return useRealClerk();
};

export const useSignIn = () => {
  return useRealSignIn();
};

export const useSignUp = () => {
  return useRealSignUp();
};

export const useSession = () => {
  return useRealSession();
};

