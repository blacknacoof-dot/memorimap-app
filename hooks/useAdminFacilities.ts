import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export interface AdminFacility {
    id: string;
    name: string;
    address: string;
    category?: string;
    type?: string;
    user_id?: string; // v4 schema
    manager_id?: string; // Legacy comp
    owner_user_id?: string; // Legacy comp
}

export function useAllFacilities() {
    const [facilities, setFacilities] = useState<AdminFacility[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const itemsPerPage = 50;

    const search = useCallback(async (term: string, targetPage: number = 0) => {
        setLoading(true);
        try {
            // [개선] facilities 대신 memorial_spaces를 기본 참조하도록 변경 (더 정제된 데이터)
            let query = supabase.from('memorial_spaces').select('*', { count: 'exact' });

            if (term) {
                query = query.ilike('name', `%${term}%`);
            }

            // 페이지네이션 계산
            const start = targetPage * itemsPerPage;
            const end = start + itemsPerPage - 1;

            const { data, error, count } = await query
                .order('name')
                .range(start, end);

            if (error) throw error;

            setFacilities(data as AdminFacility[]);
            if (count !== null) setTotalCount(count);
            setPage(targetPage);
        } catch (error) {
            console.error('Search facilities failed:', error);
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    const updateManager = useCallback(async (facilityId: string, userId: string | null) => {
        try {
            const { error } = await supabase
                .from('facilities')
                .update({ user_id: userId })
                .eq('id', facilityId);

            if (error) throw error;

            // Update local state
            setFacilities(prev => prev.map(f =>
                f.id === facilityId ? { ...f, user_id: userId || undefined } : f
            ));
            toast.success('관리자가 변경되었습니다.');
        } catch (error: any) {
            console.error('Update manager failed:', error);
            toast.error('업데이트 실패: ' + error.message);
        }
    }, []);

    return {
        facilities,
        loading,
        totalCount,
        page,
        itemsPerPage,
        search,
        updateManager
    };
}
