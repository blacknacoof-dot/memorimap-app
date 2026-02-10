import React from 'react';
import { MessageSquare, RefreshCw, ChevronRight, Phone, Clock, User } from 'lucide-react';



import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useState, useEffect } from 'react';
import { fetchLeads } from '@/lib/api/superAdmin';

export const AdminLeadsView: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]); // [FIX] Start with empty array
    const [isLoading, setIsLoading] = useState(true);

    // [New] Fetch Initial Data
    useEffect(() => {
        const loadLeads = async () => {
            try {
                const data = await fetchLeads();
                // Map the API Response to UI expected format if needed, but fetchLeads already does some mapping.
                // We'll trust fetchLeads mapping mostly, but ensure fields match MOCK structure
                const mapped = data.map((l: any) => ({
                    id: l.id,
                    name: l.user_name || '익명',
                    phone: l.phone_number || '',
                    facility: l.facility_name || '상담 요청', // fetchLeads might need update for facility_name if missing
                    time: new Date(l.created_at).toLocaleString(), // Simple format
                    status: l.status,
                    message: l.notes || l.type || '상담 요청',
                }));
                setLeads(mapped);
            } catch (e) {
                console.error('Failed to load leads:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadLeads();
    }, []);

    // [New] Realtime Integration mimicking the plan
    useRealtimeSubscription({
        table: 'consultations', // Asking to listen to leads/consultations
        event: 'INSERT',
        callback: (newLead: any) => {
            // Adapt DB payload to UI model if needed
            const adaptedLead = {
                id: newLead.id,
                name: newLead.user_name || '익명',
                phone: newLead.phone_number || '',
                facility: '새로운 문의', // facility name lookup might be needed
                time: 'Just now',
                status: 'new',
                message: '실시간 상담 요청',
            };
            setLeads(prev => [adaptedLead, ...prev]);
        }
    });
    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare size={16} className="text-emerald-600" />
                        상담 신청 관리 (AI Leads)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">챗봇을 통해 접수된 상담 요청 내역입니다.</p>
                </div>
                <button className="px-3 py-1.5 bg-white border rounded text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                    <RefreshCw size={12} /> 새로고침
                </button>
            </div>

            {/* List Header */}
            <div className="px-4 py-2 bg-slate-50/50 border-b flex items-center text-[10px] uppercase font-bold text-slate-400">
                <div className="w-40">접수 일시</div>
                <div className="flex-1">고객 정보</div>
                <div className="w-32 text-right">상태 / 액션</div>
            </div>

            {/* Compact Rows - High Density */}
            <div className="divide-y divide-slate-100">
                {leads.map((lead) => (
                    <div key={lead.id} className="px-3 py-2.5 flex items-start hover:bg-slate-50 transition-colors group cursor-pointer gap-3">
                        {/* Time & Indicator (Fixed Width, Tighter) */}
                        <div className="w-24 shrink-0 flex flex-col gap-1 mt-0.5">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${lead.status === 'new' ? 'bg-red-500 animate-pulse' : 'bg-gray-200'}`} />
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {lead.time}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-300 flex items-center gap-1 pl-3">
                                <Clock size={10} /> {lead.status === 'new' ? 'New' : 'Read'}
                            </div>
                        </div>

                        {/* Customer Info (Closer) */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 leading-none">{lead.name}</span>
                                <span className="px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-[10px] text-slate-600 font-medium leading-none border border-slate-200">
                                    {lead.facility}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                                <span className="flex items-center gap-1 text-slate-700 font-medium">
                                    <Phone size={10} /> {lead.phone}
                                </span>
                                <span className="text-slate-200">|</span>
                                <span className="truncate text-slate-500 max-w-[200px]">
                                    {lead.message}
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="shrink-0 self-center">
                            <button className="text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-all">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t text-center">
                <button className="text-xs text-slate-500 hover:text-slate-800 font-medium">더 보기</button>
            </div>
        </div>
    );
};
