import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { SangjoContract } from '../types';

// AI 상담 인계 기능은 현재 비활성 상태입니다.
// ScenarioBot(유일한 ai_consultations 쓰기 경로)이 제거되어
// ai_consultations 테이블에 새 데이터가 유입되지 않습니다.
// 향후 AI 상담 인계를 복구할 경우, 새로운 쓰기 경로 구현 후 이 훅에 다시 추가하세요.

export function useContractMonitoring(client: SupabaseClient) {
    const [contracts, setContracts] = useState<SangjoContract[]>([]);
    const [loading, setLoading] = useState(true);

    const loadContracts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await client
                .from('sangjo_contracts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContracts((data ?? []) as SangjoContract[]);
        } catch {
            toast.error('계약 목록 로딩에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => {
        let mounted = true;

        loadContracts();

        const channelSuffix = Date.now();
        const contractChannel = client
            .channel(`contract-monitor-${channelSuffix}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sangjo_contracts' }, (payload) => {
                if (!mounted) return;

                if (payload.eventType === 'DELETE') {
                    const old = payload.old as SangjoContract;
                    if (old?.contract_number) {
                        setContracts((prev) => prev.filter((contract) => contract.contract_number !== old.contract_number));
                    }
                    return;
                }

                const updated = payload.new as SangjoContract;
                setContracts((prev) => {
                    const exists = prev.find((contract) => contract.contract_number === updated.contract_number);
                    if (exists) {
                        return prev.map((contract) =>
                            contract.contract_number === updated.contract_number ? updated : contract,
                        );
                    }
                    return [updated, ...prev];
                });
            })
            .subscribe();

        return () => {
            mounted = false;
            contractChannel.unsubscribe();
        };
    }, [client, loadContracts]);

    const updateAdminMemo = async (contract: SangjoContract, memo: string): Promise<void> => {
        let query = client.from('sangjo_contracts').update({ admin_memo: memo });

        query = contract.id
            ? query.eq('id', contract.id)
            : query.eq('contract_number', contract.contract_number);

        const { error } = await query;
        if (error) throw error;
    };

    return {
        contracts,
        loading,
        updateAdminMemo,
    };
}
