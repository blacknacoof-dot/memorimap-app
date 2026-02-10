import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'sonner';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            padding: '16px',
            borderRadius: '12px',
          },
        }}
      />
      {children}
    </ClerkProvider>
  );
};
