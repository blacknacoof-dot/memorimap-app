import { useEffect, useRef } from 'react';
import { useUser } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Supabase Auth 로그인 시 profiles 테이블 upsert.
 * Clerk useAuthSync를 대체합니다.
 */
export const useProfileSync = () => {
  const { user, isSignedIn } = useUser();
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
        const { error } = await supabase
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
          const code = (error as any).code;
          const status = (error as any).status;
          if (code !== '42501' && status !== 401) {
            console.warn('[ProfileSync] Profile sync failed:', code, error.message);
          }
        }
      } catch (err) {
        console.error('[ProfileSync] Error:', err);
      }
    };

    syncProfile();
  }, [isSignedIn, user]);
};
