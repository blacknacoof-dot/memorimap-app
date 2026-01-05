import React, { useEffect, useState } from 'react';
import { createNotice, getNotices, getInquiries, Inquiry } from '../../lib/queries';
import { Loader2, Send, MessageSquare, Megaphone, CheckCircle } from 'lucide-react';

export const AdminCommunication: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'notices' | 'inquiries'>('notices');
    const [notices, setNotices] = useState<any[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Notice Form
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeContent, setNoticeContent] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        if (activeTab === 'notices') {
            const data = await getNotices();
            setNotices(data);
        } else {
            const data = await getInquiries();
            setInquiries(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleNoticeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createNotice(noticeTitle, noticeContent);
        alert('공지사항이 등록되었습니다.');
        setNoticeTitle('');
        setNoticeContent('');
        loadData();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-green-600" /> 소통 센터
            </h2>

            {/* Tabs */}
            <div className="flex space-x-2 border-b">
                <button
                    onClick={() => setActiveTab('notices')}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'notices' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    공지사항 관리
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'inquiries' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    1:1 파트너 문의
                </button>
            </div>

            {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
                <>
                    {activeTab === 'notices' && (
                        <div className="space-y-6">
                            {/* Write Notice */}
                            <form onSubmit={handleNoticeSubmit} className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Megaphone size={18} /> 새 공지사항 작성
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        value={noticeTitle}
                                        onChange={(e) => setNoticeTitle(e.target.value)}
                                        placeholder="공지 제목을 입력하세요"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                                    <textarea
                                        required
                                        className="w-full border rounded-lg p-2 h-32 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                        value={noticeContent}
                                        onChange={(e) => setNoticeContent(e.target.value)}
                                        placeholder="공지 내용을 입력하세요"
                                    />
                                </div>
                                <div className="text-right">
                                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 ml-auto">
                                        <Send size={16} /> 등록하기
                                    </button>
                                </div>
                            </form>

                            {/* Notice List */}
                            <div className="space-y-2">
                                {notices.map((n) => (
                                    <div key={n.id} className="bg-white p-4 rounded-lg border hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{n.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.content}</p>
                                            </div>
                                            <span className="text-xs text-gray-400">{n.date}</span>
                                        </div>
                                    </div>
                                ))}
                                {notices.length === 0 && <div className="text-center text-gray-400 py-8">등록된 공지사항이 없습니다.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inquiries' && (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 border-b">
                                    <tr>
                                        <th className="p-4">업체명</th>
                                        <th className="p-4">유형</th>
                                        <th className="p-4">접수일</th>
                                        <th className="p-4 text-right">상태</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {inquiries.map((i) => (
                                        <tr key={i.id} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="p-4 font-medium">{i.companyName}</td>
                                            <td className="p-4">{i.type}</td>
                                            <td className="p-4 text-gray-500">{i.createdAt}</td>
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${i.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {i.status === 'pending' ? '대기중' : '답변완료'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {inquiries.length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">접수된 문의가 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
