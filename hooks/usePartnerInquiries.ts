import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { PartnerInquiry } from '@/types/db';

interface UsePartnerInquiriesOptions {
    status?: 'pending' | 'approved' | 'rejected';
    page?: number;
    pageSize?: number;
}

export function usePartnerInquiries(options: UsePartnerInquiriesOptions = {}) {
    const { status, page = 1, pageSize = 20 } = options;

    return useQuery({
        queryKey: ['partner-inquiries', status, page],
        queryFn: async () => {
            let query = supabase
                .from('partner_inquiries')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false }); // Changed from submitted_at to created_at based on typical schema

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
                totalCount: uniqueData.length, // Adjust count to reflect unique items
                totalPages: Math.ceil(uniqueData.length / pageSize),
                currentPage: page
            };
        }
    });
}
