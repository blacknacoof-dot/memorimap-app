import { useEffect, useRef } from 'react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Sync the authenticated Supabase user into public.profiles.
 * We anchor the profile row to profiles.id = auth user id so auth-created
 * placeholder rows are updated instead of creating duplicates.
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

    const syncProfile = async () => {
      try {
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client
          .from('profiles')
          .upsert(
            {
              id: user.id,
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              full_name: user.fullName || user.username || '사용자',
              avatar_url: user.imageUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
          );

        if (error) {
          const pgError = error as { code?: string; status?: number; message: string };
          if (pgError.code !== '42501' && pgError.status !== 401) {
            // Non-critical sync failure.
          }
        } else {
          hasSyncedRef.current = true;
        }
      } catch {
        // Silent fallback.
      }
    };

    syncProfile();
  }, [isSignedIn, session, user]);
};
