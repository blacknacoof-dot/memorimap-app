import { supabase } from '@/lib/supabaseClient';
import { MemorialSpace, Reservation } from '@/types/db';

// 1. 내 시설 정보 가져오기
export const fetchMyFacility = async (userId: string) => {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .eq('owner_user_id', userId) // Changed from manager_id to owner_user_id
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 결과 없음 에러
        throw error;
    }

    return data as MemorialSpace | null;
};

// 2. 내 시설의 예약 목록 가져오기
export const fetchFacilityReservations = async (facilityId: string) => {
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // DB의 raw 데이터를 Reservation 타입으로 변환 (필드 매핑)
    return (data || []).map((item: any) => ({
        ...item,
        visit_time: item.time_slot, // Map DB time_slot to visit_time for UI
        request_note: item.special_requests // Map DB special_requests to request_note for UI
    })) as Reservation[];
};

// 3. 예약 상태 변경 (승인/거절)
export const updateReservationStatus = async (
    reservationId: string,
    status: Reservation['status'],
    rejectionReason?: string
) => {
    const updatePayload: any = { status };
    if (rejectionReason) {
        updatePayload.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
        .from('reservations')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 4. 시설 정보 수정
export const updateFacilityInfo = async (facilityId: string, updates: Partial<MemorialSpace>) => {
    const { data, error } = await supabase
        .from('memorial_spaces')
        .update(updates)
        .eq('id', facilityId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
