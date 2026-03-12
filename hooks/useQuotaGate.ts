import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '../lib/auth';
import type { UserQuotaType, AiConsultCategory, QuotaCheckResult } from '../types/subscription';

/**
 * 유저 쿼터 체크 & 증가 훅
 * fail-open 정책: RPC 에러 시 {allowed: true} 반환
 */
export function useQuotaGate() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  const checkQuota = async (
    type: UserQuotaType,
    category?: AiConsultCategory | 'sangjo' | 'facility'
  ): Promise<QuotaCheckResult> => {
    setIsChecking(true);
    try {
      const client = await getAuthClient(session, { strict: true });
      const { data, error } = await client.rpc('check_and_increment_user_quota', {
        p_quota_type: type,
        p_category: category ?? null,
      });

      if (error) {
        return { allowed: true, current: 0, limit: -1 }; // fail-open
      }

      const result = data as QuotaCheckResult;

      // 성공 시 user-plan 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user-plan'] });

      return result;
    } catch (_err) {
      return { allowed: true, current: 0, limit: -1 }; // fail-open
    } finally {
      setIsChecking(false);
    }
  };

  const decrementFavorite = async (isSangjo = false): Promise<void> => {
    try {
      const client = await getAuthClient(session, { strict: true });
      await client.rpc('decrement_user_favorites_count', {
        p_is_sangjo: isSangjo,
      });
      queryClient.invalidateQueries({ queryKey: ['user-plan'] });
    } catch (_err) {
      // silent: decrement 실패는 무시
    }
  };

  return { checkQuota, decrementFavorite, isChecking };
}
