import { useState, useEffect, useCallback } from 'react';
import { useUser, useSession } from '../lib/auth';
import { toast } from 'sonner';
import * as api from '@/lib/api/facilityAdmin';
import { MemorialSpace, Reservation } from '@/types/db';
import { useApiRetry } from './useApiRetry';
import { getAuthClient } from '@/lib/supabaseClient';

export function useFacilityAdmin() {
    const { user } = useUser();
    const { session } = useSession();
    const { callWithRetry } = useApiRetry();
    const [facility, setFacility] = useState<MemorialSpace | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. 시설 정보 및 예약 내역 로딩 (자동 재시도)
    const refresh = useCallback(async () => {
        if (!user || !session) return;

        setIsLoading(true);
        setError(null);

        try {
            const client = await getAuthClient(session, { strict: true });
            const myFacility = await callWithRetry(
                () => api.fetchMyFacility(user.id, client), true
            );
            setFacility(myFacility);

            if (myFacility) {
                const myReservations = await callWithRetry(
                    () => api.fetchFacilityReservations(myFacility.id, client), true
                );
                setReservations(myReservations);
            }
        } catch {
            setError("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [user, session, callWithRetry]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // 2. 예약 승인/거절 액션 (자동 재시도)
    const handleReservationAction = async (id: string, status: Reservation['status'], reason?: string) => {
        try {
            const client = await getAuthClient(session, { strict: true });
            await callWithRetry(
                () => api.updateReservationStatus(id, status, reason, client)
            );
            await refresh();
            toast.success(`예약이 ${status === 'confirmed' ? '승인' : status === 'rejected' ? '거절' : '처리'}되었습니다.`);
        } catch {
            toast.error('처리 실패');
        }
    };

    // 3. 시설 정보 수정 액션 (자동 재시도)
    const handleUpdateFacility = async (updates: Partial<MemorialSpace>) => {
        if (!facility) return;
        try {
            const client = await getAuthClient(session, { strict: true });
            await callWithRetry(
                () => api.updateFacilityInfo(facility.id, updates, client)
            );
            await refresh();
            toast.success('시설 정보가 수정되었습니다.');
        } catch (e) {
            toast.error('정보 수정 실패');
            throw e;
        }
    };

    return {
        facility,
        reservations,
        isLoading,
        error,
        refresh,
        updateStatus: handleReservationAction,
        updateFacility: handleUpdateFacility
    };
}
