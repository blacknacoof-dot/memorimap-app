import React, { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertCircle,
    BellRing,
    ChevronRight,
    Clock,
    MapPin,
    MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { AiConsultation, AiConsultationStatus, SangjoContract } from '../../types';
import { useContractMonitoring } from '../../hooks/useContractMonitoring';
import { useSuperAdminClient } from './SuperAdminGuard';
import { ContractDetailDrawer } from './ContractDetailDrawer';

interface ContractMonitoringProps {
    onNavigateCommunication?: (partnerName: string) => void;
}

type FilterId = 'all' | 'critical' | 'urgent' | 'normal' | 'ai_alert';

type MonitoringItem =
    | (SangjoContract & { type: 'contract' })
    | ({
          type: 'ai';
      } & AiConsultation);

const FILTERS: Array<{ id: FilterId; label: string; color: string }> = [
    { id: 'all', label: '전체', color: 'bg-slate-800' },
    { id: 'critical', label: '긴급', color: 'bg-red-600' },
    { id: 'urgent', label: '중요', color: 'bg-amber-600' },
    { id: 'ai_alert', label: 'AI 개입', color: 'bg-purple-600' },
    { id: 'normal', label: '일반', color: 'bg-green-600' },
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeAiConsultation(consultation: AiConsultation): AiConsultation {
    return {
        ...consultation,
        category: consultation.category || 'funeral',
        facility_name: consultation.facility_name || '시설명 미확인',
    };
}

function getAiStatusLabel(status: AiConsultationStatus): string {
    switch (status) {
        case AiConsultationStatus.AGENT_REQUESTED:
            return '개입 요청';
        case AiConsultationStatus.AGENT_CONNECTED:
            return '상담 연결';
        case AiConsultationStatus.AI_HANDLING:
            return 'AI 응대 중';
        case AiConsultationStatus.CONSULTATION_CONFIRMED:
            return '상담 확정';
        case AiConsultationStatus.COMPLETED:
            return '완료';
        case AiConsultationStatus.CANCELLED:
            return '취소';
        case AiConsultationStatus.DELETED:
            return '삭제';
        case AiConsultationStatus.IDLE:
        default:
            return '대기';
    }
}

function getContractCardTestId(contractNumber: string): string {
    return `monitoring-item-contract-${contractNumber}`;
}

function getAiCardTestId(conversationId: string): string {
    return `monitoring-item-ai-${conversationId}`;
}

export const ContractMonitoring: React.FC<ContractMonitoringProps> = ({ onNavigateCommunication }) => {
    const client = useSuperAdminClient();
    const { contracts, aiConsultations, loading, handleJoinChat, updateAdminMemo } = useContractMonitoring(client);
    const [activeFilter, setActiveFilter] = useState<FilterId>('all');
    const [drawerContract, setDrawerContract] = useState<SangjoContract | null>(null);
    const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});

    useEffect(() => {
        const contractPartnerIds = Array.from(
            new Set(
                contracts
                    .map((contract) => contract.sangjo_id)
                    .filter((value): value is string => Boolean(value && UUID_PATTERN.test(value))),
            ),
        );

        if (!contractPartnerIds.length) return;

        let cancelled = false;

        const resolvePartnerNames = async () => {
            const [facilitiesResult, funeralCompaniesResult, hqResult, partnersResult] = await Promise.all([
                client.from('facilities').select('id, name').in('id', contractPartnerIds),
                client.from('funeral_companies').select('id, name').in('id', contractPartnerIds),
                client.from('sangjo_hq_admins').select('sangjo_id, company_name').in('sangjo_id', contractPartnerIds),
                client.from('partners').select('id, name').in('id', contractPartnerIds),
            ]);

            if (cancelled) return;

            const nextNames: Record<string, string> = {};

            for (const row of facilitiesResult.data || []) {
                if (row.id && row.name) nextNames[String(row.id)] = row.name;
            }

            for (const row of funeralCompaniesResult.data || []) {
                if (row.id && row.name && !nextNames[String(row.id)]) {
                    nextNames[String(row.id)] = row.name;
                }
            }

            for (const row of hqResult.data || []) {
                if (row.sangjo_id && row.company_name && !nextNames[String(row.sangjo_id)]) {
                    nextNames[String(row.sangjo_id)] = row.company_name;
                }
            }

            for (const row of partnersResult.data || []) {
                if (row.id && row.name && !nextNames[String(row.id)]) {
                    nextNames[String(row.id)] = row.name;
                }
            }

            setPartnerNames(nextNames);
        };

        resolvePartnerNames().catch(() => {
            if (!cancelled) {
                setPartnerNames({});
            }
        });

        return () => {
            cancelled = true;
        };
    }, [client, contracts]);

    const items = useMemo<MonitoringItem[]>(
        () =>
            [
                ...contracts.map((contract) => ({ ...contract, type: 'contract' as const })),
                ...aiConsultations.map((consultation) => ({
                    ...normalizeAiConsultation(consultation),
                    type: 'ai' as const,
                })),
            ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()),
        [aiConsultations, contracts],
    );

    const filteredItems = items.filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'ai_alert') return item.type === 'ai';
        if (item.type === 'contract') return item.emergency_level === activeFilter;
        return false;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ContractDetailDrawer
                contract={drawerContract}
                isOpen={drawerContract !== null}
                onClose={() => setDrawerContract(null)}
                onSaveMemo={updateAdminMemo}
            />

            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 text-white shadow-xl">
                <div className="absolute inset-0 bg-blue-600/10 transition-all group-hover:bg-blue-600/20" />
                <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 animate-pulse">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold">실시간 통합 관제 시스템 가동 중</h2>
                            <p className="text-[10px] font-medium tracking-wider text-slate-400">
                                상조 계약과 AI 상담 개입 요청을 실시간으로 모니터링합니다.
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-4 md:ml-auto md:gap-6 md:pr-4">
                        <div className="text-center">
                            <p className="text-xl font-black text-red-500">
                                {contracts.filter((contract) => contract.emergency_level === 'critical').length}
                            </p>
                            <p className="text-[9px] font-black uppercase text-slate-500">Critical</p>
                        </div>
                        <div className="border-l border-slate-700 pl-4 text-center md:pl-6">
                            <p className="text-xl font-black text-amber-500">
                                {contracts.filter((contract) => contract.emergency_level === 'urgent').length}
                            </p>
                            <p className="text-[9px] font-black uppercase text-slate-500">Urgent</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="flex w-max gap-2 rounded-2xl bg-slate-100 p-1 md:w-fit">
                    {FILTERS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            data-testid={`monitoring-filter-${tab.id}`}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all md:px-6 ${
                                activeFilter === tab.id
                                    ? `${tab.color} text-white shadow-md`
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center text-slate-400">관제 데이터를 연결 중...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">현재 해당 필터에 표시할 관제 데이터가 없습니다.</div>
                ) : (
                    filteredItems.map((item) => {
                        const isCritical =
                            (item.type === 'contract' && item.emergency_level === 'critical') ||
                            (item.type === 'ai' && item.status === AiConsultationStatus.AGENT_REQUESTED);
                        const isUrgent = item.type === 'contract' && item.emergency_level === 'urgent';
                        const partnerLabel =
                            item.type === 'contract'
                                ? partnerNames[item.sangjo_id] || item.sangjo_id
                                : item.facility_name;
                        const communicationFilterValue =
                            item.type === 'contract'
                                ? partnerNames[item.sangjo_id] || item.sangjo_id
                                : item.facility_name;

                        return (
                            <div
                                key={item.type === 'contract' ? item.contract_number : item.conversation_id}
                                data-testid={
                                    item.type === 'contract'
                                        ? getContractCardTestId(item.contract_number)
                                        : getAiCardTestId(item.conversation_id)
                                }
                                className={`group flex flex-col gap-3 rounded-2xl border-2 bg-white p-4 transition-all hover:shadow-lg md:flex-row md:items-center md:justify-between md:gap-0 md:p-5 ${
                                    isCritical
                                        ? 'border-red-500/50 bg-red-50/20'
                                        : isUrgent
                                          ? 'border-amber-500/30'
                                          : 'border-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-3 md:gap-6">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl md:h-14 md:w-14 md:rounded-2xl ${
                                            item.type === 'ai'
                                                ? 'bg-purple-100 text-purple-600'
                                                : isCritical
                                                  ? 'bg-red-100 text-red-600 animate-pulse'
                                                  : isUrgent
                                                    ? 'bg-amber-100 text-amber-600'
                                                    : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {item.type === 'ai' ? (
                                            <MessageSquare size={20} />
                                        ) : isCritical ? (
                                            <BellRing size={20} />
                                        ) : isUrgent ? (
                                            <AlertCircle size={20} />
                                        ) : (
                                            <Clock size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="truncate text-sm font-black text-slate-800 md:text-lg">
                                                {item.type === 'contract' ? item.customer_name : `[AI] ${item.facility_name}`}
                                            </h3>
                                            <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                                                {item.type === 'contract'
                                                    ? item.contract_number
                                                    : item.conversation_id?.split('_').pop()}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 md:text-xs">
                                                <MapPin size={12} />
                                                <span>{(item.type === 'contract' ? item.region : item.category) || '미정'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 md:text-xs">
                                                <Activity size={12} />
                                                <span className={`font-bold ${item.type === 'ai' ? 'text-purple-600' : 'text-blue-600'}`}>
                                                    {item.type === 'ai' ? getAiStatusLabel(item.status) : item.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 md:text-xs">
                                                <Clock size={12} />
                                                <span>
                                                    {new Date(item.created_at).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:justify-end md:gap-4 md:border-0 md:pt-0">
                                    <div className="md:mr-4 md:text-right">
                                        <p className="mb-0.5 text-[10px] font-bold uppercase text-slate-400">배정 파트너</p>
                                        <p className="max-w-[120px] truncate text-xs font-bold text-slate-700 md:max-w-none md:text-sm">
                                            {partnerLabel || '자동 배정 중'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <button
                                            type="button"
                                            data-testid={`monitoring-open-communication-${
                                                item.type === 'contract' ? item.contract_number : item.conversation_id
                                            }`}
                                            onClick={() => {
                                                if (onNavigateCommunication && communicationFilterValue) {
                                                    onNavigateCommunication(communicationFilterValue);
                                                } else {
                                                    toast.info('배정된 파트너 정보가 없습니다.');
                                                }
                                            }}
                                            className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 md:p-3"
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            data-testid={
                                                item.type === 'ai'
                                                    ? `monitoring-join-ai-${item.conversation_id}`
                                                    : `monitoring-open-contract-${item.contract_number}`
                                            }
                                            onClick={() =>
                                                item.type === 'ai' ? handleJoinChat(item) : setDrawerContract(item)
                                            }
                                            className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold shadow-md transition-all md:gap-2 md:px-4 md:text-xs ${
                                                item.type === 'ai'
                                                    ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                                                    : 'bg-slate-800 text-white hover:bg-slate-900'
                                            }`}
                                        >
                                            {item.type === 'ai' ? '개입' : '관제'} <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
