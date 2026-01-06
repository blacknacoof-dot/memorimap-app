import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as api from '@/lib/api/facilityAdmin';
import { MemorialSpace, Reservation } from '@/types/db';

export function useFacilityAdmin() {
    const { user } = useUser();
    const [facility, setFacility] = useState<MemorialSpace | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. 시설 정보 및 예약 내역 로딩
    const refresh = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            // A. 내 시설 조회
            const myFacility = await api.fetchMyFacility(user.id);
            setFacility(myFacility);

            // B. 시설이 있다면 예약 내역 조회
            if (myFacility) {
                const myReservations = await api.fetchFacilityReservations(myFacility.id);
                setReservations(myReservations);
            }
        } catch (err: any) {
            console.error("Facility Admin Load Error:", err);
            // Don't show error if it's just no facility found (already handled by null facility)
            // But fetchMyFacility handles 404. Ideally we want to know if it failed for other reasons.
            setError("데이터를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // 2. 예약 승인/거절 액션
    const handleReservationAction = async (id: string, status: Reservation['status'], reason?: string) => {
        try {
            await api.updateReservationStatus(id, status, reason);
            await refresh(); // 목록 새로고침
            alert(`예약이 ${status === 'confirmed' ? '승인' : status === 'rejected' ? '거절' : '처리'}되었습니다.`);
        } catch (e) {
            console.error(e);
            alert("처리 실패");
        }
    };

    // 3. 시설 정보 수정 액션
    const handleUpdateFacility = async (updates: Partial<MemorialSpace>) => {
        if (!facility) return;
        try {
            await api.updateFacilityInfo(facility.id, updates);
            await refresh();
            alert("시설 정보가 수정되었습니다.");
        } catch (e) {
            console.error(e);
            alert("정보 수정 실패");
            throw e; // Form can catch this if needed
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
