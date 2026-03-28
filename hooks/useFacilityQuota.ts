import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '../lib/auth';
import type { FacilityQuotaType, QuotaCheckResult } from '../types/subscription';

/**
 * 시설 쿼터 체크 훅 (AI 채팅 / SMS)
 * RPC 오류 시 호출부에서 중단 처리할 수 있도록 예외를 전달한다.
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
        throw error;
      }

      return data as QuotaCheckResult;
    } finally {
      setIsChecking(false);
    }
  };

  return { checkFacilityQuota, isChecking };
}
