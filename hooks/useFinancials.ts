import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';
import { fetchSubscriptions, fetchPayments, fetchPersonalSubscriptions } from '@/lib/api/superAdmin';
import type { PaymentWithFacility, PersonalSubscriptionAdminRow } from '@/lib/api/superAdmin';
import { toast } from 'sonner';

// Types based on SuperAdminDashboard usage
export interface Subscription {
    id: string;
    status: 'active' | 'pending' | 'expired' | 'canceled';
    facility_name: string;
    plan_name: string;
    end_date?: string;
    facility_id_uuid?: string;
    facility_id_bigint?: string | number;
    next_billing_date?: string;
}

export type { PaymentWithFacility as Payment };

export function useSubscriptions() {
    const { session } = useSession();
    const [facilities, setFacilities] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const data = await fetchSubscriptions(client);
                setFacilities(data as Subscription[]);
            } catch {
                toast.error('구독 데이터 로딩에 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    return { data: facilities, loading };
}

export function useRevenue() {
    const { session } = useSession();
    const [payments, setPayments] = useState<PaymentWithFacility[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const result = await fetchPayments(client);
                const succeededPayments = result.payments.filter((payment) => payment.status === 'succeeded');
                const hasFacilityNameFailure = result.payments.some((payment) => (
                    payment.payment_context === 'facility' && payment.facility_name.startsWith('(')
                ));
                setPayments(result.payments);
                setTotalRevenue(succeededPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0));
                if ((result.activeFacilityNameFailed ?? result.facilityNameFailed) && hasFacilityNameFailure) {
                    toast.warning('시설명 조회에 실패했습니다. 일부 항목이 (알 수 없음)으로 표시됩니다.');
                }
            } catch {
                toast.error('매출 데이터 로딩에 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    return { payments, totalRevenue, loading };
}

export function usePersonalSubscriptions() {
    const { session } = useSession();
    const [users, setUsers] = useState<PersonalSubscriptionAdminRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const data = await fetchPersonalSubscriptions(client);
                setUsers(data);
            } catch {
                toast.error('개인 구독 데이터를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    return { data: users, loading };
}
