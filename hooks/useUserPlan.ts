import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth, useSession } from '../lib/auth';
import type { UserPlanInfo } from '../types/subscription';

const FREE_PLAN_DEFAULT: UserPlanInfo = {
  plan_id: 'personal_free',
  plan_name: 'PERSONAL_FREE',
  ai_consult_by_category: { funeral_home: 0, memorial_facility: 0, pet_funeral: 0 },
  sangjo_compare_used: 0,
  favorites_count: 0,
  sangjo_favorites_count: 0,
  limits: {} as UserPlanInfo['limits'],
  expires_at: null,
};

/**
 * 유저 플랜 정보 조회 훅
 * get_user_plan_info RPC → React Query (staleTime: 60s)
 */
export function useUserPlan() {
  const { isSignedIn } = useAuth();
  const { session } = useSession();

  const query = useQuery({
    queryKey: ['user-plan'],
    queryFn: async (): Promise<UserPlanInfo> => {
      // 세션 재확인 — SDK 내부 토큰 만료 대비
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession?.access_token) {
        return FREE_PLAN_DEFAULT;
      }

      const { data, error } = await supabase.rpc('get_user_plan_info');
      if (error) {
        // 400/401 등 인증 관련 에러 시 기본값 반환 (콘솔 에러 방지)
        if (error.code === 'PGRST301' || error.message?.includes('Not authenticated')) {
          return FREE_PLAN_DEFAULT;
        }
        throw error;
      }
      return data as UserPlanInfo;
    },
    staleTime: 60 * 1000,
    enabled: !!isSignedIn && !!session?.access_token,
    retry: 1,
  });

  const isFree = !query.data || query.data.plan_name === 'PERSONAL_FREE';

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isFree,
  };
}
