import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth';
import { supabase, createAuthenticatedClient } from '@/lib/supabaseClient';
import { fetchLeads } from '@/lib/api/superAdmin';

async function getAuthClient(session: any) {
    try {
        const token = await session?.getToken?.({ template: 'supabase' });
        if (token) return createAuthenticatedClient(token);
    } catch { /* fallback */ }
    return supabase;
}

export interface Lead {
    id: string;
    contact_name: string;
    contact_phone: string;
    category: string;
    status: 'new' | 'in_progress' | 'contacted' | 'closed';
    created_at: string;
    urgency?: string;
    scale?: string;
    context_data?: any;
}

export function useLeads() {
    const { session } = useSession();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session);
            const data = await fetchLeads(client);
            setLeads(data as any || []);
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
