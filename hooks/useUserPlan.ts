import { useQuery } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import { useAuth, useSession } from '../lib/auth';
import type { UserPlanInfo } from '../types/subscription';

const FREE_PLAN_DEFAULT: UserPlanInfo = {
  plan_id: 'personal_free',
  plan_name: 'PERSONAL_FREE',
  ai_consult_by_category: { funeral_home: 0, memorial_facility: 0, pet_funeral: 0 },
  sangjo_compare_used: 0,
  favorites_count: 0,
  sangjo_favorites_count: 0,
  limits: {
    ai_consult_per_category: 1,
    sangjo_compare: 10,
    favorites: 5,
    ending_note: 'basic',
    ads: true,
    discount_pct: 0,
    family_sharing: 0,
  },
  expires_at: null,
};

const normalizePlanName = (planName?: string | null) => (planName || '').toUpperCase();

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
      const client = await getAuthClient(session, { strict: true });

      const { data, error } = await client.rpc('get_user_plan_info');
      if (error) {
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

  const isFree = !query.data || normalizePlanName(query.data.plan_name) === 'PERSONAL_FREE';
  const isCancelling = query.data?.status === 'cancelling';

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isFree,
    isCancelling,
  };
}
