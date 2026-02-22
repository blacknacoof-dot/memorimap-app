import React, { useState, useEffect } from 'react';
import {
    Activity, AlertCircle, Clock, CheckCircle2,
    Search, MapPin, Phone, MessageSquare,
    ChevronRight, BellRing, User
} from 'lucide-react';
import { supabase, createAuthenticatedClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { SangjoContract, AiConsultation, AiConsultationStatus } from '../../types';
import { aiConsultationService } from '../../lib/api/aiConsultation';
import { toast } from 'sonner'; // [Phase 2] Error Handler
import type { SupabaseClient } from '@supabase/supabase-js';

export const ContractMonitoring: React.FC = () => {
    const [contracts, setContracts] = useState<SangjoContract[]>([]);
    const [aiConsultations, setAiConsultations] = useState<AiConsultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'urgent' | 'normal' | 'ai_alert'>('all');
    const [joinedConversationId, setJoinedConversationId] = useState<string | null>(null);
    const { session } = useSession();
    const [authClient, setAuthClient] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = await session?.getToken?.({ template: 'supabase' });
                if (token) setAuthClient(createAuthenticatedClient(token));
            } catch { /* fallback */ }
        };
        initAuth();
    }, [session]);

    useEffect(() => {
        if (!authClient) return;
        loadContracts();
        loadAiConsultations();
        const cleanup = setupRealtime();
        const aiCleanup = setupAiRealtime();
        return () => {
            cleanup();
            aiCleanup();
        };
    }, [authClient]);

    const loadContracts = async () => {
        if (!authClient) return;
        setLoading(true);
        try {
            const { data, error } = await authClient
                .from('sangjo_contracts')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) setContracts(data as SangjoContract[]);
        } catch {
            toast.error('계약 목록 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    const loadAiConsultations = async () => {
        if (!authClient) return;
        const { data, error } = await authClient
            .from('ai_consultations')
            .select('*')
            .in('status', [AiConsultationStatus.AGENT_REQUESTED, AiConsultationStatus.AGENT_CONNECTED])
            .order('updated_at', { ascending: false });

        if (!error && data) setAiConsultations(data as AiConsultation[]);
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel('super-admin-monitoring')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sangjo_contracts'
            }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    const old = payload.old as SangjoContract;
                    if (old?.contract_number) {
                        setContracts(prev => prev.filter(c => c.contract_number !== old.contract_number));
                    }
                    return;
                }
                const updated = payload.new as SangjoContract;
                setContracts(prev => {
                    const exists = prev.find(c => c.contract_number === updated.contract_number);
                    if (exists) {
                        return prev.map(c => c.contract_number === updated.contract_number ? updated : c);
                    }
                    return [updated, ...prev];
                });

                if (updated.emergency_level === 'critical') {
                    playEmergencySound();
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    };

    const setupAiRealtime = () => {
        const channel = supabase
            .channel('ai-monitoring')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ai_consultations'
            }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    const old = payload.old as AiConsultation;
                    if (old?.conversation_id) {
                        setAiConsultations(prev => prev.filter(c => c.conversation_id !== old.conversation_id));
                    }
                    return;
                }
                const updated = payload.new as AiConsultation;

                setAiConsultations(prev => {
                    const exists = prev.find(c => c.conversation_id === updated.conversation_id);
                    if (exists) {
                        return prev.map(c => c.conversation_id === updated.conversation_id ? updated : c);
                    }
                    if (updated.status === AiConsultationStatus.AGENT_REQUESTED) {
                        return [updated, ...prev];
                    }
                    return prev;
                });

                if (updated.status === AiConsultationStatus.AGENT_REQUESTED) {
                    playEmergencySound();
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    };

    const playEmergencySound = () => {
        // 실제 구현 시 오디오 파일 경로 추가
        // Emergency sound notification
    };

    /**
     * [Action] 상담 개입 (Join Chat)
     * Atomic Lock을 통해 동시성 제어
     */
    const handleJoinChat = async (consultation: AiConsultation) => {
        // 이미 연결된 경우 (UI 상 1차 방어)
        if (consultation.status === AiConsultationStatus.AGENT_CONNECTED) {
            toast.warning('이미 상담사가 연결된 세션입니다.');
            return;
        }

        try {
            // [API] 상태 변경 시도 (Atomic Lock 동작)
            // lib/api/aiConsultation.ts의 updateStatus는 WHERE status='AI_HANDLING' 조건을 포함함
            await aiConsultationService.updateStatus(
                consultation.conversation_id,
                AiConsultationStatus.AGENT_CONNECTED
            );

            // 성공 시 UI 업데이트 (Realtime이 오기 전 즉시 반응)
            setAiConsultations(prev => prev.map(c =>
                c.conversation_id === consultation.conversation_id
                    ? { ...c, status: AiConsultationStatus.AGENT_CONNECTED }
                    : c
            ));

            // 채팅 개입 성공: 대화 ID를 추적 상태에 저장
            setJoinedConversationId(consultation.conversation_id);
            toast.success(
                `[성공] ${consultation.facility_name} 상담에 개입했습니다.\n대화 ID: ${consultation.conversation_id}`,
                { duration: 5000 }
            );

        } catch (error: any) {
            console.error('Join Chat Error:', error);
            // 2차 방어: DB 업데이트 실패 (0 rows affecting -> .single() throws error)
            // PGRST116: The result contains 0 rows
            if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
                toast.warning('⚠️ 이미 다른 관리자가 상담을 시작했습니다.');
                // 최신 데이터로 리프레시
                loadAiConsultations();
            } else {
                toast.error('오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    };

    const filteredShow = [
        ...contracts.map(c => ({ ...c, type: 'contract' as const })),
        ...aiConsultations.map(a => ({ ...a, type: 'ai' as const }))
    ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

    const filteredItems = filteredShow.filter(item => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'ai_alert') return item.type === 'ai';
        if (item.type === 'contract') return item.emergency_level === activeFilter;
        return false;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Realtime Alert Feed (Header) */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white shadow-xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">실시간 관제 시스템 가동 중</h2>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wider">전국 파트너사 상담/계약 실시간 모니터링</p>
                    </div>
                </div>
                <div className="md:ml-auto flex items-center gap-4 md:gap-6 relative z-10 md:pr-4">
                    <div className="text-center">
                        <p className="text-xl font-black text-red-500">{contracts.filter(c => c.emergency_level === 'critical').length}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">Critical</p>
                    </div>
                    <div className="text-center border-l border-slate-700 pl-4 md:pl-6">
                        <p className="text-xl font-black text-amber-500">{contracts.filter(c => c.emergency_level === 'urgent').length}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">Urgent</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-max md:w-fit">
                    {[
                        { id: 'all', label: '전체', color: 'bg-slate-800' },
                        { id: 'critical', label: '긴급', color: 'bg-red-600' },
                        { id: 'urgent', label: '중요', color: 'bg-amber-600' },
                        { id: 'ai_alert', label: 'AI 인계', color: 'bg-purple-600' },
                        { id: 'normal', label: '일반', color: 'bg-green-600' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as any)}
                            className={`px-3 md:px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeFilter === tab.id
                                ? `${tab.color} text-white shadow-md`
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contract List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">관제 데이터를 연결 중...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">현재 해당 등급의 데이터가 없습니다.</div>
                ) : filteredItems.map((item: any) => (
                    <div
                        key={item.type === 'contract' ? item.contract_number : item.conversation_id}
                        className={`bg-white border-2 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 md:justify-between transition-all hover:shadow-lg group ${(item.type === 'contract' && item.emergency_level === 'critical') || (item.type === 'ai' && item.status === AiConsultationStatus.AGENT_REQUESTED)
                            ? 'border-red-500/50 bg-red-50/20'
                            : item.emergency_level === 'urgent' ? 'border-amber-500/30' : 'border-slate-100'
                            }`}
                    >
                        <div className="flex items-center gap-3 md:gap-6">
                            {/* Status Icon */}
                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                                item.emergency_level === 'critical' ? 'bg-red-100 text-red-600 animate-pulse' :
                                    item.emergency_level === 'urgent' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {item.type === 'ai' ? <MessageSquare size={20} /> :
                                    item.emergency_level === 'critical' ? <BellRing size={20} /> :
                                        item.emergency_level === 'urgent' ? <AlertCircle size={20} /> : <Clock size={20} />}
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm md:text-lg font-black text-slate-800 truncate">
                                        {item.type === 'contract' ? item.customer_name : `[AI] ${item.facility_name}`}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter shrink-0">
                                        {item.type === 'contract' ? item.contract_number : item.conversation_id?.split('_').pop()}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500">
                                        <MapPin size={12} />
                                        <span>{item.region || item.category || '전국'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-500">
                                        <Activity size={12} />
                                        <span className={`font-bold ${item.type === 'ai' ? 'text-purple-600' : 'text-blue-600'}`}>
                                            {item.type === 'ai' ? (item.status === AiConsultationStatus.AGENT_REQUESTED ? '인계 요청' : '상담 중') : item.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-slate-400">
                                        <Clock size={12} />
                                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                            <div className="md:text-right md:mr-4">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">배정 파트너</p>
                                <p className="text-xs md:text-sm font-bold text-slate-700 truncate max-w-[120px] md:max-w-none">{item.sangjo_id || item.facility_name || '자동 배정 중'}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => toast.info('메시지 기능은 준비 중입니다.')}
                                    className="p-2.5 md:p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100">
                                    <MessageSquare size={16} />
                                </button>
                                <button
                                    onClick={() => item.type === 'ai' ? handleJoinChat(item) : toast.info(`계약 ${item.contract_number} 관제 상세 기능은 준비 중입니다.`)}
                                    className={`p-2.5 md:p-3 rounded-xl transition-all shadow-md flex items-center gap-1.5 md:gap-2 font-bold text-[11px] md:text-xs px-3 md:px-4 ${item.type === 'ai'
                                        ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                                        : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}>
                                    {item.type === 'ai' ? '개입' : '관제'} <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
