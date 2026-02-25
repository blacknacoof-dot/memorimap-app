import type { SupabaseClient } from '@supabase/supabase-js';
import { MemorialSpace, Reservation } from '@/types/db';

// 1. 내 시설 정보 가져오기 (facilities_id 포함)
export const fetchMyFacility = async (userId: string, authClient: SupabaseClient) => {
    const { data, error } = await authClient
        .from('facilities')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data as (MemorialSpace & { facilities_id?: string }) | null;
};

// 2. 내 시설의 예약 목록 가져오기
export const fetchFacilityReservations = async (facilityId: string, authClient: SupabaseClient) => {
    const { data, error } = await authClient
        .from('reservations')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    interface ReservationRow {
        id?: string;
        visit_date: string;
        time_slot: string;
        visitor_name: string;
        visitor_count: number;
        contact_number: string;
        special_requests?: string;
        purpose?: string;
        facility_id: string;
        user_id: string;
        status: Reservation['status'];
        created_at?: string;
        [key: string]: unknown;
    }

    return (data || []).map((item: ReservationRow) => ({
        ...item,
        visit_time: item.time_slot,
        request_note: item.special_requests
    })) as Reservation[];
};

// 3. 예약 상태 변경 (승인/거절)
export const updateReservationStatus = async (
    reservationId: string,
    status: Reservation['status'],
    rejectionReason: string | undefined,
    authClient: SupabaseClient
) => {
    const updatePayload: { status: Reservation['status']; rejection_reason?: string } = { status };
    if (rejectionReason) {
        updatePayload.rejection_reason = rejectionReason;
    }

    const { data, error } = await authClient
        .from('reservations')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 4. 시설 정보 수정
export const updateFacilityInfo = async (facilityId: string, updates: Partial<MemorialSpace>, authClient: SupabaseClient) => {
    const { data, error } = await authClient
        .from('facilities')
        .update(updates)
        .eq('id', facilityId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
