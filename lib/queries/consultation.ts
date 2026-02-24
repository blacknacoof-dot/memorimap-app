import { supabase } from '../supabaseClient';
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

/** DB consultations row shape for realtime payload typing */
interface ConsultationRow {
  id: string;
  facility_id: string;
  user_id: string | null;
  user_name: string | null;
  user_phone: string | null;
  urgency: string | null;
  location: string | null;
  needs_ambulance: boolean;
  scale: string | null;
  religion: string | null;
  schedule: string | null;
  status: string;
  notes: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

/** DB facilities row shape (subset used by createAIContext) */
interface FacilityContextRow {
  name: string;
  address: string;
  type: string;
  description: string | null;
  features: string[] | string | null;
}

// Re-export type if needed, or define specific AI-related types
export interface CreateAIContextResult {
  context: string;
  relevantFacilities: FacilityContextRow[];
}

/**
 * [New] Subscribe to realtime consultation updates for a facility
 */
export const subscribeToConsultations = (
  facilityId: string,
  onInsert: (payload: RealtimePostgresInsertPayload<ConsultationRow>) => void,
  onUpdate: (payload: RealtimePostgresUpdatePayload<ConsultationRow>) => void
) => {
  return supabase
    .channel(`public:consultations:facility_id=eq.${facilityId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'consultations',
        filter: `facility_id=eq.${facilityId}`,
      },
      (payload) => onInsert(payload as RealtimePostgresInsertPayload<ConsultationRow>)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultations',
        filter: `facility_id=eq.${facilityId}`,
      },
      (payload) => onUpdate(payload as RealtimePostgresUpdatePayload<ConsultationRow>)
    )
    .subscribe();
};

/**
 * [New] Create AI Context for RAG (Retrieval Augmented Generation)
 * This is a placeholder for the logic that will fetch facility details and previous Q&A
 */
export const createAIContext = async (facilityId: string): Promise<CreateAIContextResult> => {
  // 1. Fetch Facility Details
  const { data: facility, error } = await supabase
    .from('facilities')
    .select('name, address, type, description, features') // features or ai_features
    .eq('id', facilityId)
    .single();

  if (error || !facility) {
    throw new Error('Facility not found for AI context');
  }

  const typedFacility = facility as FacilityContextRow;

  // 2. Format Context
  const context = `
시설명: ${typedFacility.name}
주소: ${typedFacility.address}
유형: ${typedFacility.type}
설명: ${typedFacility.description || '없음'}
특징: ${Array.isArray(typedFacility.features) ? typedFacility.features.join(', ') : typedFacility.features || '없음'}
  `.trim();

  return {
    context,
    relevantFacilities: [typedFacility]
  };
};
