import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';
import { fetchLeads } from '@/lib/api/superAdmin';

export interface Lead {
    id: string;
    contact_name?: string;
    user_name?: string;
    contact_phone?: string;
    phone_number?: string | null;
    customer_name?: string;
    customer_phone?: string | null;
    facility_name?: string;
    category: string;
    type?: string;
    status: string;
    created_at: string;
    urgency?: string;
    scale?: string;
    context_data?: Record<string, unknown>;
}

export function useLeads() {
    const { session } = useSession();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const data = await fetchLeads(client);
            setLeads((data || []) as Lead[]);
        } catch (error) {
            console.error('Fetch leads failed:', error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) loadLeads();
    }, [session]);

    return {
        leads,
        loading,
        refresh: loadLeads,
    };
}
