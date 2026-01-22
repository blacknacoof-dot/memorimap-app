import { useState } from 'react';
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

    const search = async (term: string) => {
        if (!term) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('facilities')
                .select('*')
                .ilike('name', `%${term}%`)
                .limit(50);

            if (error) throw error;

            // Map keys for compatibility if needed, but 'facilities' has user_id now.
            setFacilities(data as AdminFacility[]);
        } catch (error) {
            console.error('Search facilities failed:', error);
            // setFacilities([]);
        } finally {
            setLoading(false);
        }
    };

    const updateManager = async (facilityId: string, userId: string | null) => {
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
            alert('관리자가 변경되었습니다.');
        } catch (error: any) {
            console.error('Update manager failed:', error);
            alert('업데이트 실패: ' + error.message);
        }
    };

    return {
        facilities,
        loading,
        search,
        updateManager
    };
}
