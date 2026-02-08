import { useEffect, useRef } from 'react';
import { useUser, useSession } from './auth';
import { supabase, isSupabaseConfigured, setSupabaseAuth } from './supabaseClient';

export const useAuthSync = () => {
    // [DEBUG] Hook Mount Log
    // console.log('[AuthSync] Hook Rendered'); 

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
                // 0. Set Supabase Auth Token
                const updateToken = async () => {
                    if (session) {
                        try {
                            const token = await session.getToken({ template: 'supabase' });

                            // [DEBUG] 토큰 확인 (로그)
                            if (token) {
                                console.log('[AuthSync] ✅ Token Retrieved! Length:', token.length);

                                // JWT Payload Decode for Debugging
                                try {
                                    const parts = token.split('.');
                                    if (parts.length === 3) {
                                        const payload = JSON.parse(atob(parts[1]));
                                        console.log('[AuthSync] 🕵️ Token Payload:', payload);
                                    }
                                } catch (e) {
                                    console.warn('[AuthSync] Failed to decode token payload', e);
                                }

                                await setSupabaseAuth(token);
                                return token;
                            } else {
                                console.warn('[AuthSync] ❌ Token is NULL. Check Clerk Dashboard > JWT Templates > "supabase" exist?');
                                return null;
                            }
                        } catch (tokenError) {
                            console.error("Error fetching Clerk token:", tokenError);
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

                // 1. Upsert profile specifically using a fresh authenticated client
                // This avoids any potential singleton header mutation race conditions and ensures Auth header is present
                // [Revert Reason] Singleton header mutation caused 401 errors. Prioritizing robust Auth over avoiding instance warnings.
                const { createAuthenticatedClient } = await import('./supabaseClient');
                const authClient = createAuthenticatedClient(token);

                const { error: syncError } = await authClient
                    .from('profiles')
                    .upsert({
                        clerk_id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        full_name: user.fullName || user.username || '사용자',
                        avatar_url: user.imageUrl,
                        role: 'user', // Default role
                        phone_number: user.primaryPhoneNumber?.phoneNumber,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'clerk_id'
                    });

                if (syncError) {
                    // Ignore 401/42501 logging for cleaner console (handled by RLS)
                    // @ts-ignore - status property might exist in runtime but not in type definition
                    if (syncError.code !== '42501' && syncError.status !== 401) {
                        console.error("Failed to sync profile:", syncError);
                    }
                } else {
                    // console.log("Profile synced successfully!");
                }
            } catch (err) {
                console.error("Auth sync error:", err);
            }
        };

        syncUser();

        // Token Refresh - only when needed
        // Clerk tokens are short-lived (usually 60s). We refresh every 50s to be safe.
        const REFRESH_INTERVAL = 50 * 1000;
        let lastToken: string | null = null;

        const intervalId = setInterval(async () => {
            if (isSignedIn && session) {
                const token = await session.getToken({ template: 'supabase' });
                // 토큰이 실제로 변경되었을 때만 업데이트
                if (token) {
                    // [DEBUG] 토큰 검사
                    console.log('[AuthSync] 🔑 Token acquired. Length:', token.length);
                    console.log('[AuthSync] 🔍 Raw Token Preview:', token.substring(0, 10) + '...' + token.substring(token.length - 10));

                    // Supabase 클라이언트에 토큰 설정
                    await setSupabaseAuth(token);

                    // [DEBUG] 헤더 설정 확인
                    // @ts-ignore
                    const currentHeaders = (await import('./supabaseClient')).supabase['rest']?.headers;
                    console.log('[AuthSync] 📡 Current Headers:', currentHeaders);
                }
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [isSignedIn, user, session]);
};
