import { useState } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '../lib/auth';
import type { FacilityQuotaType, QuotaCheckResult } from '../types/subscription';

/**
 * Facility quota gate for AI chat usage.
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
