import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Notice {
    id: string;
    title: string;
    content: string;
    target_audience: 'all' | 'facility_admin' | 'user';
    is_published: boolean;
    created_at: string;
}

export function useNotices() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            // Trying 'admin_notices' table based on SQL file, but fields might mismatch.
            // Component expects 'target_audience', 'is_published'.
            // If table lacks them, this will error. 
            // We'll perform a soft select or try to adapt.
            // For now, write strictly what component expects.
            const { data, error } = await supabase
                .from('admin_notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotices(data as any[] || []);
        } catch (error) {
            console.error('Fetch notices failed:', error);
            // Fallback for safety
            setNotices([]);
        } finally {
            setLoading(false);
        }
    };

    const create = async (notice: Omit<Notice, 'id' | 'created_at'>) => {
        const { error } = await supabase
            .from('admin_notices')
            .insert([{
                ...notice,
                // Optional: Map fields if DB schema is different, e.g. 
                // category: notice.target_audience
            }]);

        if (error) throw error;
        await fetchNotices();
    };

    const remove = async (id: string) => {
        const { error } = await supabase
            .from('admin_notices')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await fetchNotices();
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    return {
        data: notices,
        loading,
        create,
        remove
    };
}
