import { useState, useEffect } from 'react';

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
    // Mocking array return
    const [facilities, setFacilities] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(false);

    // TODO: Fetch from actual DB tables (e.g., subscriptions, or facilities with plan info)
    // For now returning empty to fix crash

    return { data: facilities, loading };
}

export function useRevenue() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(false);

    // TODO: Fetch from actual payments table

    return { payments, totalRevenue, loading };
}
