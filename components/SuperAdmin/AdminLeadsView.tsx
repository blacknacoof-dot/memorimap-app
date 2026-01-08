import React, { useEffect, useState } from 'react';
import { getAllLeads } from '../../lib/queries';
import { FileText, Phone, MapPin, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AdminLeadsView: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const data = await getAllLeads();
            setLeads(data || []);
        } catch (error) {
            console.error('Failed to load leads', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">신규 접수</span>;
            case 'in_progress': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold border border-amber-200">처리중</span>;
            case 'contacted': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">연락 완료</span>;
            case 'closed': return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold border border-slate-200">종료됨</span>;
            default: return <span className="text-xs text-slate-500">{status}</span>;
        }
    };

    const getCategoryLabel = (cat: string) => {
        const map: any = { 'funeral': '장례식장', 'memorial': '추모시설', 'pet': '동물장례' };
        return map[cat] || cat;
    };

    const getUrgencyLabel = (u: string) => {
        const map: any = { 'immediate': '긴급(임종직후)', 'imminent': '위독(임종임박)', 'prepare': '사전준비' };
        return map[u] || u;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">데이터를 불러오는 중...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">상담 신청 관리 (AI Leads)</h2>
                    <p className="text-sm text-slate-500">챗봇을 통해 접수된 상담 요청 내역입니다.</p>
                </div>
                <button onClick={loadLeads} className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                    새로고침
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">접수 일시</th>
                            <th className="px-6 py-4">고객 정보</th>
                            <th className="px-6 py-4">상담 유형 / 긴급도</th>
                            <th className="px-6 py-4">요청 세부사항</th>
                            <th className="px-6 py-4">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    접수된 상담 내역이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            {new Date(lead.created_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{lead.contact_name}</div>
                                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                            <Phone size={12} />
                                            {lead.contact_phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                                {getCategoryLabel(lead.category)}
                                            </span>
                                            {lead.urgency && (
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${lead.urgency === 'immediate' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {getUrgencyLabel(lead.urgency)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs space-y-1">
                                            {lead.context_data?.text && (
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <MapPin size={12} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{lead.context_data.text}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                                {lead.priorities?.map((p: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                        #{p}
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
                                    <td className="px-6 py-4">
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
