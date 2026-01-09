import React from 'react';
import { MessageSquare, RefreshCw, ChevronRight, Phone, Clock, User } from 'lucide-react';

// MOCK DATA - Leads
const MOCK_LEADS = [
    { id: 1, name: '김철수', phone: '010-1234-5678', facility: '하늘공원 추모관', time: '10 min ago', status: 'new', message: '장례 비용 견적 문의드립니다.' },
    { id: 2, name: '이영희', phone: '010-9876-5432', facility: '평화의 숲', time: '1 hour ago', status: 'read', message: '방문 예약 가능한가요?' },
    { id: 3, name: '박민수', phone: '010-5555-7777', facility: '부산 추모 공원', time: '3 hours ago', status: 'read', message: '안치단 가격 문의' },
    { id: 4, name: '정수진', phone: '010-3333-2222', facility: '분당 메모리얼', time: 'Yesterday', status: 'read', message: '상담 요청합니다.' },
    { id: 5, name: '최동욱', phone: '010-1111-9999', facility: '인천 가족 공원', time: '2 days ago', status: 'read', message: '주말 방문 예약' },
];

export const AdminLeadsView: React.FC = () => {
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
                {MOCK_LEADS.map((lead) => (
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
