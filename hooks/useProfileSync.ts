import { useEffect, useRef } from 'react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Sync the authenticated Supabase user into public.profiles.
 * We anchor the profile row to profiles.id = auth user id so auth-created
 * placeholder rows are updated instead of creating duplicates.
 *
 * Per session we only try once. Success and failure both stop retries
 * to avoid noisy loops around profile upsert conflicts.
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

    // Mark immediately so auth-state changes do not trigger repeated writes.
    hasSyncedRef.current = true;

    const syncProfile = async () => {
      try {
        const client = await getAuthClient(session, { strict: true });
        await client
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
      } catch {
        // Profile sync failure should not block the signed-in experience.
      }
    };

    syncProfile();
  }, [isSignedIn, session, user]);
};
