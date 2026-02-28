import { useState, useEffect } from 'react';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';

export interface Notice {
    id: string;
    title: string;
    content: string;
    target_audience: 'all' | 'facility_admin' | 'user';
    is_published: boolean;
    created_at: string;
}

interface NoticeRow {
    id: string;
    title: string;
    content: string;
    target_audience?: string;
    category?: string;
    is_published?: boolean;
    created_at: string;
    [key: string]: unknown;
}

function mapNoticeRow(item: NoticeRow): Notice {
    return {
        id: item.id,
        title: item.title,
        content: item.content,
        target_audience: (item.target_audience || item.category || 'all') as Notice['target_audience'],
        is_published: item.is_published !== undefined ? item.is_published : true,
        created_at: item.created_at,
    };
}

export function useNotices() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const { session } = useSession();

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotices(((data || []) as NoticeRow[]).map(mapNoticeRow));
        } catch {
            setNotices([]);
        } finally {
            setLoading(false);
        }
    };

    const create = async (notice: Omit<Notice, 'id' | 'created_at'>) => {
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client.from('notices').insert([{ ...notice }]);
        if (error) throw error;
        await fetchNotices();
    };

    const remove = async (id: string) => {
        const client = await getAuthClient(session, { strict: true });
        const { error } = await client.from('notices').delete().eq('id', id);
        if (error) throw error;
        await fetchNotices();
    };

    useEffect(() => {
        if (session) fetchNotices();
    }, [session]);

    return { data: notices, loading, create, remove };
}
