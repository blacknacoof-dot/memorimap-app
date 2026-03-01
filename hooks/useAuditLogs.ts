import { useQuery } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata: Record<string, unknown>;
    ip_address: string;
    created_at: string;
}

export function useAuditLogs(limit: number = 50) {
    const { session } = useSession();

    return useQuery({
        queryKey: ['audit-logs', limit],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as AuditLog[];
        },
        enabled: !!session?.access_token,
    });
}
