import React from 'react';
import { ClerkProvider as RealClerkProvider, useUser as useRealUser, useClerk as useRealClerk, useSignIn as useRealSignIn, useSignUp as useRealSignUp, useSession as useRealSession } from '@clerk/clerk-react';
import { koKR } from '@clerk/localizations';

// --- Configuration ---
// Safer check for environment variables in browser without global 'process'
const getPublishableKey = (): string => {
  // Vite environment variable (standard)
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (key) return key;

  // [Security] No hardcoded fallback — fail fast if env var missing
  throw new Error(
    'VITE_CLERK_PUBLISHABLE_KEY is not set. Please configure it in .env.local'
  );
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

