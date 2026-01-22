import React, { useState } from 'react';
import { useNotices } from '../../../hooks/useNotices';
import { Notice } from '../../../types/db';
import { Megaphone, Plus, Trash2, Tag, User } from 'lucide-react';
import { format } from 'date-fns';

export const NoticeManager: React.FC = () => {
    const { data: notices, create, remove } = useNotices();
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [target, setTarget] = useState<'all' | 'facility_admin' | 'user'>('all');
    const [isPublished, setIsPublished] = useState(true);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await create({
                title: newTitle,
                content: newContent,
                target_audience: target,
                is_published: isPublished,
            });
            alert('공지사항이 등록되었습니다.');
            setIsCreating(false);
            setNewTitle('');
            setNewContent('');
            setTarget('all');
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('공지 등록 실패');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await remove(id);
                window.location.reload();
            } catch (e) {
                console.error(e);
                alert('삭제 실패');
            }
        }
    };

    const getTargetBadge = (target: string) => {
        switch (target) {
            case 'all': return <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">전체</span>;
            case 'facility_admin': return <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-xs">파트너용</span>;
            case 'user': return <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-xs">유저용</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Megaphone className="text-red-500" />
                    공지사항 관리
                </h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} />
                    {isCreating ? '목록 보기' : '공지 작성'}
                </button>
            </div>

            {isCreating ? (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-lg mb-4">새 공지사항 작성</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">제목</label>
                        <input
                            required
                            value={newTitle} onChange={e => setNewTitle(e.target.value)}
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="공지 제목을 입력하세요"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">대상</label>
                            <select
                                value={target} onChange={e => setTarget(e.target.value as any)}
                                className="w-full p-2 border rounded-lg bg-white"
                            >
                                <option value="all">전체 공개</option>
                                <option value="facility_admin">시설 파트너 (Admin)</option>
                                <option value="user">일반 유저</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm font-medium text-green-600">즉시 게시 (Publish)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">내용</label>
                        <textarea
                            required
                            value={newContent} onChange={e => setNewContent(e.target.value)}
                            className="w-full p-2 border rounded-lg h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="공지 내용을 입력하세요"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">등록하기</button>
                    </div>
                </form>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {notices.map(notice => (
                            <li key={notice.id} className="p-5 hover:bg-gray-50 flex items-start justify-between group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {!notice.is_published && <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded">비공개</span>}
                                        {getTargetBadge(notice.target_audience)}
                                        <span className="text-xs text-gray-400">{format(new Date(notice.created_at || new Date()), 'yyyy-MM-dd')}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-lg">{notice.title}</h4>
                                    <p className="text-gray-600 text-sm line-clamp-1">{notice.content}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(notice.id)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
