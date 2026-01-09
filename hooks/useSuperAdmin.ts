import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api/superAdmin';
import { Notice, PartnerInquiry, Payment, Subscription } from '@/types/db';

// 1. 파트너 문의 Hook
export function usePartnerInquiries() {
    const [data, setData] = useState<PartnerInquiry[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetchPendingInquiries();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return { data, loading, refresh, approve: api.approvePartner, reject: api.rejectPartner };
}

// 2. 구독 정보 Hook
export function useSubscriptions() {
    const [data, setData] = useState<(Subscription & { facility_name: string })[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetchSubscriptions();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return { data, loading, refresh };
}

// 3. 매출 정보 Hook (통계 계산 포함)
export function useRevenue() {
    const [payments, setPayments] = useState<(Payment & { facility_name: string })[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetchPayments();
            setPayments(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // 간단한 통계 계산
    const totalRevenue = payments
        .filter(p => p.status === 'succeeded')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // 이번 달 매출
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = payments
        .filter(p => p.status === 'succeeded' && new Date(p.paid_at).getMonth() === currentMonth)
        .reduce((acc, curr) => acc + curr.amount, 0);

    return { payments, totalRevenue, monthlyRevenue, loading, refresh };
}

// 4. 공지사항 Hook
export function useNotices() {
    const [data, setData] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetchNotices();
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return { data, loading, refresh, create: api.createNotice, remove: api.deleteNotice };
}

// 5. 유저 관리 Hook [NEW]
export function useAllUsers() {
    const [users, setUsers] = useState<api.UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.fetchAllUsers();
            setUsers(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRole = async (userId: string, newRole: string) => {
        try {
            await api.updateUserRole(userId, newRole);
            await refresh(); // UI 갱신
            alert('권한이 변경되었습니다.');
        } catch (e) {
            console.error(e);
            alert('권한 변경 실패');
        }
    };

    useEffect(() => { refresh(); }, [refresh]);

    return { users, loading, refresh, updateRole };
}

// 6. 시설 통합 관리 Hook [NEW]
export function useAllFacilities() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false); // Default to false as we don't load initially

    // Remove auto-load
    // const refresh = useCallback(async () => { ... }

    const search = useCallback(async (query: string) => {
        setLoading(true);
        try {
            // Use search API if query exists, else maybe clear or fetch all?
            // User wants search only logic.
            if (!query.trim()) {
                setFacilities([]);
                return;
            }
            const res = await api.searchFacilities(query);
            setFacilities(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateManager = async (facilityId: number, newManagerId: string | null) => {
        try {
            await api.updateFacilityManager(facilityId, newManagerId);
            // Don't refresh whole list, maybe just update local state or re-search?
            // Re-searching might be best to reflect changes if necessary
            alert('관리자가 변경되었습니다.');
        } catch (e) {
            console.error(e);
            alert('관리자 변경 실패');
        }
    };

    // No useEffect

    return { facilities, loading, search, updateManager };
}
