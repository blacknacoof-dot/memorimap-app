import { supabase } from '../supabaseClient';
import { Consultation } from '../queries'; // Import existing type or redefine if needed for strictness

// Re-export type if needed, or define specific AI-related types
export interface CreateAIContextResult {
  context: string;
  relevantFacilities: any[];
}

/**
 * [New] Subscribe to realtime consultation updates for a facility
 */
export const subscribeToConsultations = (
  facilityId: string,
  onInsert: (payload: any) => void,
  onUpdate: (payload: any) => void
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
      (payload) => onInsert(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultations',
        filter: `facility_id=eq.${facilityId}`,
      },
      (payload) => onUpdate(payload)
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

  // 2. Format Context
  const context = `
시설명: ${facility.name}
주소: ${facility.address}
유형: ${facility.type}
설명: ${facility.description || '없음'}
특징: ${Array.isArray(facility.features) ? facility.features.join(', ') : facility.features || '없음'}
  `.trim();

  return {
    context,
    relevantFacilities: [facility]
  };
};
