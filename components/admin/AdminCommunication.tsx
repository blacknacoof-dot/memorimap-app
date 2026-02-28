import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createNotice, getNotices, getInquiries, Inquiry } from '../../lib/queries';
import { Loader2, Send, MessageSquare, Megaphone, CheckCircle } from 'lucide-react';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';

interface NoticeItem {
    id: string;
    title: string;
    content: string;
    date: string;
}

interface SupportInquiryItem {
    id: string;
    companyName?: string;
    managerName?: string;
    phone?: string;
    email?: string;
    message?: string;
    type?: string;
    inquiryType?: string;
    createdAt?: string;
    status: 'pending' | 'resolved';
}

export const AdminCommunication: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'notices' | 'inquiries' | 'customer_support'>('notices');
    const [notices, setNotices] = useState<NoticeItem[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [supportInquiries, setSupportInquiries] = useState<SupportInquiryItem[]>([]);
    const [expandedSupport, setExpandedSupport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { session } = useSession();

    // Notice Form
    const [noticeTitle, setNoticeTitle] = useState('');
    const [noticeContent, setNoticeContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            if (activeTab === 'notices') {
                const data = await getNotices();
                setNotices(data);
            } else if (activeTab === 'customer_support') {
                const data = await getInquiries(client);
                const all = data as unknown as SupportInquiryItem[];
                setSupportInquiries(all.filter((i) => i.type === 'customer_support' || i.inquiryType === 'customer_support'));
            } else {
                const data = await getInquiries(client);
                const all = data as unknown as (Inquiry & { inquiryType?: string })[];
                setInquiries(all.filter((i) => i.type !== 'customer_support' && i.inquiryType !== 'customer_support') as Inquiry[]);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '네트워크 오류';
            toast.error('데이터 로딩 실패: ' + message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) loadData();
    }, [activeTab, session]);

    const handleNoticeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const client = await getAuthClient(session, { strict: true });
            await createNotice(noticeTitle, noticeContent, client);
            toast.success('공지사항이 등록되었습니다.');
            setNoticeTitle('');
            setNoticeContent('');
            loadData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '권한 오류';
            toast.error('공지사항 등록 실패: ' + message);
        } finally {
            setIsSubmitting(false);
        }
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
                    파트너 문의
                </button>
                <button
                    onClick={() => setActiveTab('customer_support')}
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'customer_support' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    고객센터 문의
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
                                    <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {isSubmitting ? '등록 중...' : '등록하기'}
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

                    {activeTab === 'customer_support' && (
                        <div className="space-y-3">
                            {supportInquiries.map((i) => (
                                <div key={i.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedSupport(expandedSupport === i.id ? null : i.id)}
                                        className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{i.managerName || '고객'}</span>
                                                <span className="text-xs text-gray-400">{i.createdAt}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">{i.message}</p>
                                        </div>
                                        <span className={`ml-3 flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold ${i.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {i.status === 'pending' ? '대기중' : '처리완료'}
                                        </span>
                                    </button>
                                    {expandedSupport === i.id && (
                                        <div className="px-4 pb-4 border-t pt-3 space-y-2 text-sm">
                                            <div className="flex gap-4">
                                                <span className="text-gray-400 w-16 flex-shrink-0">연락처</span>
                                                <a href={`tel:${i.phone}`} className="text-primary font-medium">{i.phone || '-'}</a>
                                            </div>
                                            {i.email && (
                                                <div className="flex gap-4">
                                                    <span className="text-gray-400 w-16 flex-shrink-0">이메일</span>
                                                    <span className="text-gray-700">{i.email}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-4">
                                                <span className="text-gray-400 w-16 flex-shrink-0">문의내용</span>
                                                <p className="text-gray-700 whitespace-pre-wrap">{i.message}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {supportInquiries.length === 0 && (
                                <div className="text-center text-gray-400 py-8 bg-white rounded-xl border">접수된 고객 문의가 없습니다.</div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
