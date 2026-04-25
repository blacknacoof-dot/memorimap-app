import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { getAuthClient } from '@/lib/supabaseClient';

export interface AdminFacility {
    id: string;
    name: string;
    address: string;
    category?: string;
    type?: string;
    user_id?: string;
    images?: string[] | null;
    phone?: string | null;
    description?: string | null;
    verified?: boolean | null;
    status?: string | null;
    price_range?: string | null;
    operating_hours?: string | null;
    business_hours?: Record<string, unknown> | null;
    packages?: unknown[] | null;
    package_count?: number;
}

export interface AdminFacilityBasicsUpdate {
    verified?: boolean;
    status?: string | null;
    price_range?: string | null;
    operating_hours?: string | null;
}

export function useAllFacilities() {
    const { session } = useSession();
    const [facilities, setFacilities] = useState<AdminFacility[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const itemsPerPage = 50;

    const search = useCallback(async (term: string, targetPage: number = 0) => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            let query = client
                .from('facilities')
                .select('id, name, address, type, user_id, images, phone, description, verified, status, price_range, operating_hours, business_hours, packages', { count: 'exact' });

            if (term) {
                query = query.ilike('name', `%${term}%`);
            }

            const start = targetPage * itemsPerPage;
            const end = start + itemsPerPage - 1;

            const { data, error, count } = await query
                .order('name')
                .range(start, end);

            if (error) throw error;

            setFacilities(data as AdminFacility[]);
            if (count !== null) setTotalCount(count);
            setPage(targetPage);
        } catch {
            // 에러는 빈 목록으로 자연 처리
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, session]);

    const updateManager = useCallback(async (facilityId: string, userId: string | null) => {
        try {
            const client = await getAuthClient(session, { strict: true });
            const { error } = await client
                .from('facilities')
                .update({ user_id: userId })
                .eq('id', facilityId);

            if (error) throw error;

            setFacilities(prev => prev.map(f =>
                f.id === facilityId ? { ...f, user_id: userId || undefined } : f
            ));
            toast.success('관리자가 변경되었습니다.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('업데이트 실패: ' + message);
        }
    }, [session]);

    const updateBasics = useCallback(async (facilityId: string, updates: AdminFacilityBasicsUpdate): Promise<boolean> => {
        try {
            const client = await getAuthClient(session, { strict: true });
            const { data, error } = await client
                .from('facilities')
                .update(updates)
                .eq('id', facilityId)
                .select('id, verified, status, price_range, operating_hours')
                .single();

            if (error) throw error;

            setFacilities(prev => prev.map(f =>
                f.id === facilityId ? { ...f, ...data } : f
            ));
            toast.success('시설 기본 정보가 변경되었습니다.');
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error('시설 정보 업데이트 실패: ' + message);
            return false;
        }
    }, [session]);

    return {
        facilities,
        loading,
        totalCount,
        page,
        itemsPerPage,
        search,
        updateManager,
        updateBasics
    };
}
