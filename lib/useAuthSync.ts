import { useEffect, useRef } from 'react';
import { useUser, useSession } from './auth';
import { supabase, isSupabaseConfigured, setSupabaseAuth } from './supabaseClient';

/** 타임아웃 래퍼: Clerk getToken이 무한 대기하는 것을 방지 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
}

const TOKEN_TIMEOUT = 8000; // 8초

export const useAuthSync = () => {
    const { user, isSignedIn } = useUser();
    const { session } = useSession();
    const hasSyncedRef = useRef(false);

    useEffect(() => {
        // Reset sync flag when user signs out
        if (!isSignedIn) {
            hasSyncedRef.current = false;
        }

        const syncUser = async () => {
            // Check if both services are ready
            if (!isSignedIn || !user || !isSupabaseConfigured()) {
                // If signed out, clear Supabase auth
                if (!isSignedIn && isSupabaseConfigured()) {
                    await setSupabaseAuth(null);
                }
                return;
            }

            // Prevent duplicate syncs in React Strict Mode
            if (hasSyncedRef.current) {
                return;
            }
            hasSyncedRef.current = true;

            try {
                // 0. Set Supabase Auth Token (with timeout)
                const updateToken = async () => {
                    if (session) {
                        try {
                            const token = await withTimeout(
                                session.getToken({ template: 'supabase' }),
                                TOKEN_TIMEOUT
                            );

                            if (token) {
                                await setSupabaseAuth(token);
                                return token;
                            } else {
                                console.warn('[AuthSync] Token is NULL or timed out.');
                                return null;
                            }
                        } catch (tokenError) {
                            console.error('[AuthSync] Error fetching Clerk token:', tokenError);
                            return null;
                        }
                    }
                    return null;
                };

                const token = await updateToken();

                if (!token) {
                    console.warn('[AuthSync] Aborting profile sync due to missing token.');
                    return;
                }

                // 1. Upsert profile using fresh authenticated client
                const { createAuthenticatedClient } = await import('./supabaseClient');
                const authClient = createAuthenticatedClient(token);

                const { error: syncError } = await authClient
                    .from('profiles')
                    .upsert({
                        clerk_id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        full_name: user.fullName || user.username || '사용자',
                        avatar_url: user.imageUrl,
                        role: 'user',
                        phone_number: user.primaryPhoneNumber?.phoneNumber,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'clerk_id'
                    });

                if (syncError) {
                    // @ts-ignore
                    if (syncError.code !== '42501' && syncError.status !== 401) {
                        console.error('Failed to sync profile:', syncError);
                    }
                }
            } catch (err) {
                console.error('Auth sync error:', err);
            }
        };

        syncUser();

        // Token Refresh - with timeout protection
        const REFRESH_INTERVAL = 50 * 1000;

        const intervalId = setInterval(async () => {
            if (isSignedIn && session) {
                try {
                    const token = await withTimeout(
                        session.getToken({ template: 'supabase' }),
                        TOKEN_TIMEOUT
                    );
                    if (token) {
                        await setSupabaseAuth(token);
                    } else {
                        console.warn('[AuthSync] Token refresh timed out, will retry next interval.');
                    }
                } catch (err) {
                    console.warn('[AuthSync] Token refresh failed:', err);
                }
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isSignedIn, user, session]);
};
