import { useEffect, useRef } from 'react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Sync the authenticated Supabase user into public.profiles.
 * We anchor the profile row to profiles.id = auth user id so auth-created
 * placeholder rows are updated instead of creating duplicates.
 *
 * 한 세션에서 1회만 시도. 성공/실패 무관하게 재시도하지 않음.
 * (409 Conflict 등 에러 시 무한 루프 방지)
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

    // 즉시 true로 설정하여 의존성 변경으로 인한 재실행 차단
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
        // 프로필 동기화 실패는 앱 사용에 치명적이지 않음 — 무시
      }
    };

    syncProfile();
  }, [isSignedIn, session, user]);
};
