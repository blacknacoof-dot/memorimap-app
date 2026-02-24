
/**
 * [Phase 9] 시나리오 봇 데이터 관리
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';


export const getFacilityScenario = async (facilityId: string) => {
    const { data, error } = await supabase
        .from('facility_scenarios')
        .select('scenario_data')
        .eq('facility_id', facilityId)
        .single();

    if (error) {
        // null means no custom scenario, handled by hook
        return null;
    }
    return data?.scenario_data;
};

export const upsertFacilityScenario = async (facilityId: string, scenarioData: Record<string, unknown>, client: SupabaseClient) => {
    const { error } = await client
        .from('facility_scenarios')
        .upsert({
            facility_id: facilityId,
            scenario_data: scenarioData,
            updated_at: new Date()
        });

    if (error) throw error;
    return true;
};
