import { useState, useEffect } from 'react';
import { fetchLeads } from '@/lib/api/superAdmin';

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
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await fetchLeads();
            setLeads(data as any || []);
        } catch (error) {
            console.error('Fetch leads failed:', error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    return {
        leads,
        loading,
        refresh: loadLeads,
    };
}
