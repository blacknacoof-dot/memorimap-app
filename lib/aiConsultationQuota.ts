import type { SupabaseClient } from '@supabase/supabase-js';

import type { QuotaCheckResult } from '../types/subscription';

export async function checkAiConsultationQuota(
  client: SupabaseClient,
  facilityId: string,
  category: string,
): Promise<QuotaCheckResult> {
  const { data, error } = await client.rpc('check_and_increment_ai_consult_quotas', {
    p_facility_id: facilityId,
    p_category: category,
  });

  if (error) throw error;
  return data as QuotaCheckResult;
}
