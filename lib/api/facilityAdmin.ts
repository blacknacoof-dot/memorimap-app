import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MemorialSpace, Reservation } from '@/types/db';

// [Bug Fix] 모든 함수에 authClient 파라미터 추가 — 토큰 만료 시 RLS 차단 방지
// authClient가 전달되면 인증된 클라이언트 사용, 없으면 기존 싱글톤 fallback

// 1. 내 시설 정보 가져오기 (facilities_id 포함)
export const fetchMyFacility = async (userId: string, authClient?: SupabaseClient) => {
    const client = authClient || supabase;
    const { data, error } = await client
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
export const fetchFacilityReservations = async (facilityId: string | number, authClient?: SupabaseClient) => {
    const client = authClient || supabase;
    const { data, error } = await client
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
    rejectionReason?: string,
    authClient?: SupabaseClient
) => {
    const client = authClient || supabase;
    const updatePayload: any = { status };
    if (rejectionReason) {
        updatePayload.message = rejectionReason;
    }

    const { data, error } = await client
        .from('reservations')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 4. 시설 정보 수정
export const updateFacilityInfo = async (facilityId: string | number, updates: Partial<MemorialSpace>, authClient?: SupabaseClient) => {
    const client = authClient || supabase;
    const { data, error } = await client
        .from('facilities')
        .update(updates)
        .eq('id', facilityId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
