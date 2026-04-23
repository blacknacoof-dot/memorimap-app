import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PartnerInquiry } from '@/types/db';

interface UsePartnerInquiriesOptions {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    pageSize?: number;
    client: SupabaseClient;
}

export function usePartnerInquiries(options: UsePartnerInquiriesOptions) {
    const { status, page = 1, pageSize = 20, client } = options;

    return useQuery({
        queryKey: ['partner-inquiries', status, page],
        queryFn: async () => {
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

            // Deduplicate exact duplicate submissions only. Company name alone is
            // not safe because branches and business types can share a name.
            const uniqueData: PartnerInquiry[] = [];
            const seen = new Set<string>();

            const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
            for (const item of (data as PartnerInquiry[]) || []) {
                const dedupeKey = [
                    normalize(item.company_name),
                    normalize(item.business_type),
                    normalize(item.company_email || item.email),
                    normalize(item.contact_number || item.manager_mobile),
                    normalize(item.address),
                ].join('|');

                if (!seen.has(dedupeKey)) {
                    seen.add(dedupeKey);
                    uniqueData.push(item);
                }
            }

            // totalCount는 dedup 후 실제 건수 사용
            const dedupCount = uniqueData.length;

            return {
                data: uniqueData,
                totalCount: dedupCount,
                totalPages: Math.ceil((count ?? dedupCount) / pageSize),
                currentPage: page
            };
        },
        enabled: !!client,
    });
}
