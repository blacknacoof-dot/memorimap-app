import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth';
import { supabase, createAuthenticatedClient } from '@/lib/supabaseClient';
import { fetchSubscriptions, fetchPayments } from '@/lib/api/superAdmin';

async function getAuthClient(session: any) {
    try {
        const token = await session?.getToken?.({ template: 'supabase' });
        if (token) return createAuthenticatedClient(token);
    } catch { /* fallback */ }
    return supabase;
}

// Types based on SuperAdminDashboard usage
export interface Subscription {
    id: string;
    status: 'active' | 'pending' | 'expired' | 'canceled';
    facility_name: string;
    plan_name: string;
    end_date?: string;
}

export interface Payment {
    id: string;
    amount: number;
    description: string;
    facility_name: string;
    paid_at: string;
    status: string;
}

export function useSubscriptions() {
    const { session } = useSession();
    const [facilities, setFacilities] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const client = await getAuthClient(session);
                const data = await fetchSubscriptions(client);
                setFacilities(data as any);
            } catch (err) {
                console.error('Failed to fetch subscriptions:', err);
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
    const [payments, setPayments] = useState<Payment[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        const load = async () => {
            try {
                const client = await getAuthClient(session);
                const data = await fetchPayments(client);
                setPayments(data as any);
                setTotalRevenue(data.reduce((acc, curr) => acc + (curr.amount || 0), 0));
            } catch (err) {
                console.error('Failed to fetch revenue:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [session]);

    return { payments, totalRevenue, loading };
}
