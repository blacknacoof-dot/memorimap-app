import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Phone, MapPin, Clock } from 'lucide-react';
import { getAllLeads } from '../../lib/queries';
import { useSuperAdminClient } from './SuperAdminGuard';
import type { Lead } from '../../types/db';

export const AdminLeadsView: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const client = useSuperAdminClient();

    useEffect(() => {
        void loadLeads();
    }, [client]);

    const loadLeads = async () => {
        try {
            const data = await getAllLeads(client);
            setLeads((data || []) as Lead[]);
        } catch {
            toast.error('리드 목록 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new':
                return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">신규 접수</span>;
            case 'in_progress':
                return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold border border-amber-200">처리중</span>;
            case 'contacted':
                return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">연락 완료</span>;
            case 'closed':
                return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold border border-slate-200">종료</span>;
            default:
                return <span className="text-xs text-slate-500">{status}</span>;
        }
    };

    const getCategoryLabel = (category: string) => {
        const map: Record<string, string> = {
            funeral: '장례식장',
            memorial: '추모시설',
            pet: '반려동물 장례',
        };
        return map[category] || category;
    };

    const getUrgencyLabel = (urgency: string) => {
        const map: Record<string, string> = {
            immediate: '긴급(즉시)',
            imminent: '임박',
            prepare: '사전 준비',
            high: '높음',
            medium: '보통',
            low: '낮음',
        };
        return map[urgency] || urgency;
    };

    const getUrgencyBadgeClass = (urgency?: string) => {
        if (urgency === 'immediate' || urgency === 'high') {
            return 'bg-red-50 text-red-600 border-red-100';
        }
        if (urgency === 'imminent' || urgency === 'medium') {
            return 'bg-amber-50 text-amber-700 border-amber-100';
        }
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const maskPhone = (phone: string) => {
        if (!phone) return '-';
        const parts = phone.split('-');
        if (parts.length === 3) {
            return `${parts[0]}-****-${parts[2]}`;
        }
        return phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-****-$3');
    };

    // Empty phone rows should remain visible instead of being collapsed into one key.
    const processedLeads = Array.from(
        new Map(
            leads.map((lead) => {
                const phoneKey = (lead.contact_phone || lead.phone_number || '').trim();
                const dedupeKey = phoneKey || `lead:${lead.id}`;
                return [dedupeKey, lead] as const;
            })
        ).values()
    );

    if (loading) {
        return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" data-debug="super-admin-filter-bar">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">상담 리드 관리</h2>
                    <p className="text-sm text-slate-500">AI 및 직접 상담 진입에서 생성된 리드 목록입니다.</p>
                </div>
                <button
                    onClick={() => { void loadLeads(); }}
                    className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                    새로고침
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto" data-debug="super-admin-table-wrapper">
                <table className="w-full text-left text-sm text-slate-600 min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-4 md:px-6 py-4 min-w-[120px]">접수 일시</th>
                            <th className="px-4 md:px-6 py-4 min-w-[120px]">고객 정보</th>
                            <th className="px-4 md:px-6 py-4 min-w-[100px]">유형 / 긴급도</th>
                            <th className="px-4 md:px-6 py-4 min-w-[140px]">요청 내용</th>
                            <th className="px-4 md:px-6 py-4 min-w-[80px]">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedLeads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    접수된 상담 리드가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            processedLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            {new Date(lead.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="font-bold text-slate-800">{lead.contact_name || '이름 미입력'}</div>
                                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                            <Phone size={12} />
                                            {maskPhone(lead.contact_phone || lead.phone_number || '')}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                                {getCategoryLabel(lead.category)}
                                            </span>
                                            {lead.urgency && (
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getUrgencyBadgeClass(lead.urgency)}`}>
                                                    {getUrgencyLabel(lead.urgency)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="max-w-xs space-y-1">
                                            {lead.context_data?.text && (
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <MapPin size={12} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{lead.context_data.text}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                                {lead.priorities?.map((priority: string, index: number) => (
                                                    <span key={index} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                        #{priority}
                                                    </span>
                                                ))}
                                            </div>
                                            {lead.scale && (
                                                <div className="text-[11px] text-slate-400">
                                                    규모: {lead.scale}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        {getStatusBadge(lead.status)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
