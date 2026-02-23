import { useQuery } from '@tanstack/react-query';
import { getAuthClient } from '@/lib/supabaseClient';
import { useSession } from '@/lib/auth';
import { PartnerInquiry } from '@/types/db';

interface UsePartnerInquiriesOptions {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    pageSize?: number;
}

export function usePartnerInquiries(options: UsePartnerInquiriesOptions = {}) {
    const { status, page = 1, pageSize = 20 } = options;
    const { session } = useSession();

    return useQuery({
        queryKey: ['partner-inquiries', status, page, !!session],
        queryFn: async () => {
            const client = await getAuthClient(session, { strict: true });

            let query = client
                .from('partner_inquiries')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            // 페이지네이션
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            // [Fix] Deduplicate by company_name (User Feedback: "Prevent duplicate applications")
            // We keep the latest one (since we ordered by created_at DESC)
            const uniqueData: PartnerInquiry[] = [];
            const seen = new Set<string>();

            for (const item of (data as PartnerInquiry[]) || []) {
                if (!seen.has(item.company_name)) {
                    seen.add(item.company_name);
                    uniqueData.push(item);
                }
            }

            return {
                data: uniqueData,
                totalCount: count ?? uniqueData.length,
                totalPages: Math.ceil((count ?? uniqueData.length) / pageSize),
                currentPage: page
            };
        },
        enabled: !!session,
    });
}
