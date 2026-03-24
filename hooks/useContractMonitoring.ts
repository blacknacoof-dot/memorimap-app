import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AiConsultation, AiConsultationStatus, SangjoContract } from '../types';
import { aiConsultationService } from '../lib/api/aiConsultation';

export function useContractMonitoring(client: SupabaseClient) {
    const [contracts, setContracts] = useState<SangjoContract[]>([]);
    const [aiConsultations, setAiConsultations] = useState<AiConsultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinedConversationId, setJoinedConversationId] = useState<string | null>(null);

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

    const loadAiConsultations = useCallback(async () => {
        try {
            const { data, error } = await client
                .from('ai_consultations')
                .select('*')
                .in('status', [AiConsultationStatus.AGENT_REQUESTED, AiConsultationStatus.AGENT_CONNECTED])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setAiConsultations((data ?? []) as AiConsultation[]);
        } catch {
            toast.error('AI 상담 목록 로딩에 실패했습니다.');
        }
    }, [client]);

    useEffect(() => {
        let mounted = true;

        loadContracts();
        loadAiConsultations();

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

        const aiChannel = client
            .channel(`ai-monitor-${channelSuffix}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_consultations' }, (payload) => {
                if (!mounted) return;

                if (payload.eventType === 'DELETE') {
                    const old = payload.old as AiConsultation;
                    if (old?.conversation_id) {
                        setAiConsultations((prev) =>
                            prev.filter((consultation) => consultation.conversation_id !== old.conversation_id),
                        );
                    }
                    return;
                }

                const updated = payload.new as AiConsultation;
                setAiConsultations((prev) => {
                    const exists = prev.find(
                        (consultation) => consultation.conversation_id === updated.conversation_id,
                    );

                    if (exists) {
                        return prev.map((consultation) =>
                            consultation.conversation_id === updated.conversation_id ? updated : consultation,
                        );
                    }

                    if (updated.status === AiConsultationStatus.AGENT_REQUESTED) {
                        return [updated, ...prev];
                    }

                    return prev;
                });
            })
            .subscribe();

        return () => {
            mounted = false;
            contractChannel.unsubscribe();
            aiChannel.unsubscribe();
        };
    }, [client, loadAiConsultations, loadContracts]);

    const updateAdminMemo = async (contract: SangjoContract, memo: string): Promise<void> => {
        let query = client.from('sangjo_contracts').update({ admin_memo: memo });

        query = contract.id
            ? query.eq('id', contract.id)
            : query.eq('contract_number', contract.contract_number);

        const { error } = await query;
        if (error) throw error;
    };

    const handleJoinChat = async (consultation: AiConsultation) => {
        if (consultation.status === AiConsultationStatus.AGENT_CONNECTED) {
            toast.warning('이미 다른 관리자가 연결한 상담입니다.');
            return;
        }

        try {
            await aiConsultationService.updateStatus(
                client,
                consultation.conversation_id,
                AiConsultationStatus.AGENT_CONNECTED,
            );

            setAiConsultations((prev) =>
                prev.map((item) =>
                    item.conversation_id === consultation.conversation_id
                        ? { ...item, status: AiConsultationStatus.AGENT_CONNECTED }
                        : item,
                ),
            );
            setJoinedConversationId(consultation.conversation_id);
            toast.success(
                `[성공] ${consultation.facility_name} 상담에 개입했습니다.\n상담 ID: ${consultation.conversation_id}`,
                { duration: 5000 },
            );
        } catch (error: unknown) {
            const err = error instanceof Error ? error : null;
            const errCode = (error as { code?: string })?.code;

            if (errCode === 'PGRST116' || err?.message?.includes('0 rows')) {
                toast.warning('이미 다른 관리자가 상담을 시작했습니다.');
                loadAiConsultations();
            } else {
                toast.error('오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    };

    return {
        contracts,
        aiConsultations,
        loading,
        joinedConversationId,
        handleJoinChat,
        updateAdminMemo,
    };
}
