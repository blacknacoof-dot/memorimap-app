import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data as Lead[] || []);
        } catch (error) {
            console.error('Fetch leads failed:', error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            await fetchLeads();
        } catch (err: any) {
            alert('Failed to update status: ' + err.message);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    return {
        leads,
        loading,
        refresh: fetchLeads,
        updateStatus
    };
}
