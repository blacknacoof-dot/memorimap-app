import { useState, useEffect, useCallback } from 'react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { toast } from 'sonner';
import type { UserAdminChecklist, AdminChecklistCategory } from '../types/db';

interface UseAdminChecklistResult {
    items: UserAdminChecklist[];
    loading: boolean;
    toggleItem: (category: AdminChecklistCategory) => Promise<void>;
    updateNotes: (category: AdminChecklistCategory, notes: string) => Promise<void>;
    completedCount: number;
    totalCount: number;
}

const TOTAL_CATEGORIES = 12;

export function useAdministrativeChecklist(): UseAdminChecklistResult {
    const { isSignedIn, user } = useUser();
    const { session } = useSession();
    const userId = (user as { id?: string })?.id ?? '';
    const [items, setItems] = useState<UserAdminChecklist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSignedIn || !session) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const load = async () => {
            try {
                const client = await getAuthClient(session, { strict: true });
                const { data, error } = await client
                    .from('user_admin_checklists')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) throw error;
                if (mounted) setItems(data || []);
            } catch {
                // 테이블 미존재 시 빈 배열 (마이그레이션 전)
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [isSignedIn, session]);

    const toggleItem = useCallback(async (category: AdminChecklistCategory) => {
        if (!session) return;
        const client = await getAuthClient(session, { strict: true });
        const existing = items.find(i => i.category === category);

        if (existing) {
            const newCompleted = !existing.is_completed;
            const { error } = await client
                .from('user_admin_checklists')
                .update({
                    is_completed: newCompleted,
                    completed_at: newCompleted ? new Date().toISOString() : null,
                })
                .eq('id', existing.id);

            if (error) {
                toast.error('저장 중 오류가 발생했습니다.');
                return;
            }
            setItems(prev =>
                prev.map(i => i.id === existing.id
                    ? { ...i, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
                    : i
                )
            );
        } else {
            const { data, error } = await client
                .from('user_admin_checklists')
                .insert({ user_id: userId, category, is_completed: true, completed_at: new Date().toISOString() })
                .select()
                .single();

            if (error) {
                toast.error('저장 중 오류가 발생했습니다.');
                return;
            }
            if (data) setItems(prev => [...prev, data]);
        }
    }, [session, items]);

    const updateNotes = useCallback(async (category: AdminChecklistCategory, notes: string) => {
        if (!session) return;
        const client = await getAuthClient(session, { strict: true });
        const existing = items.find(i => i.category === category);

        if (existing) {
            const { error } = await client
                .from('user_admin_checklists')
                .update({ notes })
                .eq('id', existing.id);
            if (!error) {
                setItems(prev => prev.map(i => i.id === existing.id ? { ...i, notes } : i));
            }
        } else {
            const { data, error } = await client
                .from('user_admin_checklists')
                .insert({ user_id: userId, category, notes, is_completed: false })
                .select()
                .single();
            if (!error && data) setItems(prev => [...prev, data]);
        }
    }, [session, items]);

    return {
        items,
        loading,
        toggleItem,
        updateNotes,
        completedCount: items.filter(i => i.is_completed).length,
        totalCount: TOTAL_CATEGORIES,
    };
}
