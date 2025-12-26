import { useUser } from '../lib/auth';
import React from 'react';

interface AuthGuardProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
    const { isSignedIn, isLoaded } = useUser();

    if (!isLoaded) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    if (!isSignedIn) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
