import { useQuery } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import { useAuth, useSession } from '../lib/auth';
import type { UserPlanInfo } from '../types/subscription';

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
      if (error) throw error;
      return data as UserPlanInfo;
    },
    staleTime: 60 * 1000,
    enabled: !!isSignedIn,
  });

  const isFree = !query.data || query.data.plan_name === 'personal_free';

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isFree,
  };
}
