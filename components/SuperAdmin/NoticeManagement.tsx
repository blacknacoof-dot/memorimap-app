import React, { useState, useEffect } from 'react';
import {
    Bell, Plus, Search, Megaphone,
    AlertTriangle, Info, Trash2, Edit3,
    Eye, Users, Calendar, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformNotices, createPlatformNotice, updatePlatformNotice, deletePlatformNotice } from '../../lib/sangjoQueries';
import { PlatformNotice } from '../../types';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';

export const NoticeManagement: React.FC = () => {
    const [notices, setNotices] = useState<PlatformNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<PlatformNotice | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ title: '', content: '', notice_type: 'info' as string });
    const { session } = useSession();

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }
        loadNotices();
    }, [session]);

    const loadNotices = async () => {
        setLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            const data = await getPlatformNotices(undefined, client);
            setNotices(data);
        } catch (err) {
            toast.error('공지사항 로딩 실패');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingNotice(null);
        setFormData({ title: '', content: '', notice_type: 'info' });
        setIsModalOpen(true);
    };

    const handleEdit = (notice: PlatformNotice) => {
        setEditingNotice(notice);
        setFormData({ title: notice.title, content: notice.content, notice_type: notice.notice_type });
        setIsModalOpen(true);
    };

    const handleDelete = async (notice: PlatformNotice) => {
        if (!await confirmAsync(`"${notice.title}" 공지를 삭제하시겠습니까?`)) return;
        try {
            const client = await getAuthClient(session, { strict: true });
            await deletePlatformNotice(notice.id, client);
            setNotices(prev => prev.filter(n => n.id !== notice.id));
            toast.success('공지가 삭제되었습니다.');
        } catch (err) {
            toast.error('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('제목과 내용을 입력해주세요.');
            return;
        }
        try {
            const client = await getAuthClient(session, { strict: true });
            if (editingNotice) {
                await updatePlatformNotice(editingNotice.id, formData, client);
                toast.success('공지가 수정되었습니다.');
            } else {
                await createPlatformNotice(formData, client);
                toast.success('공지가 등록되었습니다.');
            }
            setIsModalOpen(false);
            loadNotices();
        } catch (err) {
            toast.error('저장 중 오류가 발생했습니다.');
        }
    };

    const filteredNotices = notices.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Megaphone className="text-blue-600" />
                        시스템 공지 관리
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">상조 파트너사에 전달되는 공식 공지사항을 관리합니다.</p>
                </div>
                <button
                    onClick={handleCreate}
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
                        <input
                            id="notice-search"
                            name="notice-search"
                            type="text"
                            placeholder="공지 제목 검색..."
                            className="bg-transparent text-xs outline-none w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className="text-xs text-slate-400">총 {filteredNotices.length}건</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="py-20 text-center text-slate-400 italic">공지사항 서버 연결 중...</div>
                    ) : filteredNotices.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <Megaphone className="mx-auto mb-4 opacity-10" size={48} />
                            <p>{searchTerm ? '검색 결과가 없습니다.' : '게시된 공지사항이 없습니다.'}</p>
                        </div>
                    ) : filteredNotices.map((notice) => (
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
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => handleEdit(notice)}
                                    className="p-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(notice)}
                                    className="p-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingNotice ? '공지 수정' : '새 공지 작성'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">공지 유형</label>
                                <div className="flex gap-2">
                                    {(['info', 'warning', 'urgent'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData(prev => ({ ...prev, notice_type: type }))}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.notice_type === type
                                                    ? type === 'urgent' ? 'bg-red-500 text-white' :
                                                        type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                                    : 'bg-slate-100 text-slate-500'
                                                }`}
                                        >
                                            {type === 'info' ? '일반' : type === 'warning' ? '주의' : '긴급'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">제목</label>
                                <input
                                    id="notice-title"
                                    name="notice-title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="공지 제목을 입력하세요"
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">내용</label>
                                <textarea
                                    id="notice-content"
                                    name="notice-content"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="공지 내용을 입력하세요"
                                    rows={5}
                                    className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                            >
                                {editingNotice ? '수정하기' : '등록하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
