import { useEffect, useRef } from 'react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Supabase Auth 로그인 시 profiles 테이블 upsert.
 * Clerk useAuthSync를 대체합니다.
 */
export const useProfileSync = () => {
  const { user, isSignedIn } = useUser();
  const { session } = useSession();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn) {
      hasSyncedRef.current = false;
      return;
    }

    if (!user || !isSupabaseConfigured() || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const syncProfile = async () => {
      try {
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client
          .from('profiles')
          .upsert(
            {
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              full_name: user.fullName || user.username || '사용자',
              avatar_url: user.imageUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'clerk_id' }
          );

        if (error) {
          const pgError = error as { code?: string; status?: number; message: string };
          if (pgError.code !== '42501' && pgError.status !== 401) {
            console.warn('[ProfileSync] Profile sync failed:', pgError.code, pgError.message);
          }
        }
      } catch (err) {
        console.error('[ProfileSync] Error:', err);
      }
    };

    syncProfile();
  }, [isSignedIn, user, session]);
};
