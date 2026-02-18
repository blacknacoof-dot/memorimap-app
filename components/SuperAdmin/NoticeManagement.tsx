import React, { useState, useEffect } from 'react';
import {
    Bell, Plus, Search, Filter, Megaphone,
    AlertTriangle, Info, Trash2, Edit3,
    Eye, Users, Calendar
} from 'lucide-react';
import { getPlatformNotices } from '../../lib/sangjoQueries';
import { PlatformNotice } from '../../types';

export const NoticeManagement: React.FC = () => {
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        setLoading(true);
        try {
            const data = await getPlatformNotices();
            setNotices(data);
        } catch (err) {
            console.error('공지사항 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Megaphone className="text-blue-600" />
                        시스템 공지 관리
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">상조 파트너사에 전달되는 공식 공지사항을 관리합니다.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> 새 공지 작성
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input type="text" placeholder="공지 제목 검색..." className="bg-transparent text-xs outline-none w-48" />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 bg-white border rounded-xl">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 italic">공지사항 서버 연결 중...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <Megaphone className="mx-auto mb-4 opacity-10" size={48} />
                            <p>게시된 공지사항이 없습니다.</p>
                        </div>
                    ) : notices.map((notice) => (
                        <div key={notice.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notice.notice_type === 'urgent' ? 'bg-red-100 text-red-600' :
                                    notice.notice_type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {notice.notice_type === 'urgent' ? <AlertTriangle size={24} /> :
                                    notice.notice_type === 'warning' ? <Info size={24} /> : <Bell size={24} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-800 truncate">{notice.title}</h3>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${notice.notice_type === 'urgent' ? 'bg-red-500 text-white' :
                                            notice.notice_type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                        }`}>
                                        {notice.notice_type}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                    {notice.content}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(notice.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users size={12} />
                                        {notice.target_partner_ids ? `${notice.target_partner_ids.length}사 지정` : '전체 대상'}
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-500">
                                        <Eye size={12} />
                                        <span>{(notice as any).view_count ?? '-'}회 열람</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all">
                                    <Edit3 size={16} />
                                </button>
                                <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
