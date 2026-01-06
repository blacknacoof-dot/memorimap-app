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
