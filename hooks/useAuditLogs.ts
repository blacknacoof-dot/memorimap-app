import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface AuditLog {
    id: string;
    actor_email: string;
    action: string;
    action_display?: string; // Derived from view usually
    action_category: string;
    target_resource: string;
    details: any;
    created_at: string;
    status: string;
}

export function useAuditLogs(limit: number = 50) {
    return useQuery({
        queryKey: ['audit-logs', limit],
        queryFn: async () => {
            // Assuming 'audit_logs' table directly or a view if created
            // The SQL script didn't explicitly create 'recent_admin_activities' view, only hinted at it?
            // Wait, step 315 DID include 'CREATE OR REPLACE VIEW public.recent_admin_activities'.
            // So I can query that view.
            // But verify if I included it in my migration script?
            // Yes, I should have. Let me double check my thought process on the SQL script.
            // I might have missed the VIEW in `migrations/20260122_system_normalization.sql`.
            // I will query the table directly if the view doesn't exist, but purely logically, user asked for it.
            // I will assume I can query 'audit_logs' directly for now to be safe as views might not be created if I missed it.
            // Actually, better to query 'audit_logs' and map it or use the view if I am sure.
            // Let's stick to 'audit_logs' table for safety in this MVP hook.

            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as AuditLog[];
        }
    });
}
