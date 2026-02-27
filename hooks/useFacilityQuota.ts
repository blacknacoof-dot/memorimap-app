import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '../lib/auth';
import type { FacilityQuotaType, QuotaCheckResult } from '../types/subscription';

/**
 * 시설 쿼터 체크 훅 (AI 채팅 / SMS)
 * fail-open 정책: RPC 에러 시 {allowed: true} 반환
 */
export function useFacilityQuota() {
  const { session } = useSession();
  const [isChecking, setIsChecking] = useState(false);

  const checkFacilityQuota = async (
    facilityId: string,
    type: FacilityQuotaType
  ): Promise<QuotaCheckResult> => {
    setIsChecking(true);
    try {
      const client = await getAuthClient(session, { strict: true });
      const { data, error } = await client.rpc('check_and_increment_facility_quota', {
        p_facility_id: facilityId,
        p_quota_type: type,
      });

      if (error) {
        console.error('[useFacilityQuota] RPC error (fail-open):', error);
        return { allowed: true, current: 0, limit: -1 };
      }

      return data as QuotaCheckResult;
    } catch (err) {
      console.error('[useFacilityQuota] unexpected error (fail-open):', err);
      return { allowed: true, current: 0, limit: -1 };
    } finally {
      setIsChecking(false);
    }
  };

  return { checkFacilityQuota, isChecking };
}
