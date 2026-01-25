import { useState, useEffect } from 'react';
import { fetchSubscriptions, fetchPayments } from '@/lib/api/superAdmin';

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
    const [facilities, setFacilities] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchSubscriptions();
                setFacilities(data as any);
            } catch (err) {
                console.error('Failed to fetch subscriptions:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return { data: facilities, loading };
}

export function useRevenue() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchPayments();
                setPayments(data as any);
                setTotalRevenue(data.reduce((acc, curr) => acc + (curr.amount || 0), 0));
            } catch (err) {
                console.error('Failed to fetch revenue:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return { payments, totalRevenue, loading };
}
