import React from 'react';
import { Loader2, Send, MessageSquare, Megaphone, Search } from 'lucide-react';
import { useSuperAdminClient } from '../SuperAdmin/SuperAdminGuard';
import { useAdminCommunication } from './useAdminCommunication';

interface AdminCommunicationProps {
    initialFilter?: string;
}

export const AdminCommunication: React.FC<AdminCommunicationProps> = ({ initialFilter }) => {
    const client = useSuperAdminClient();
    const {
        activeTab, setActiveTab,
        filterText, setFilterText,
        notices, inquiries, supportInquiries,
        expandedSupport, setExpandedSupport,
        isLoading,
        noticeTitle, setNoticeTitle,
        noticeContent, setNoticeContent,
        isSubmitting, handleNoticeSubmit,
    } = useAdminCommunication(client, initialFilter);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-green-600" /> 소통 센터
            </h2>

            {/* Tabs */}
            <div className="flex space-x-2 border-b overflow-x-auto">
                <button
                    onClick={() => setActiveTab('notices')}
                    className={`px-4 py-2 min-h-[44px] font-medium text-sm whitespace-nowrap ${activeTab === 'notices' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    공지사항 관리
                </button>
                <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-4 py-2 min-h-[44px] font-medium text-sm whitespace-nowrap ${activeTab === 'inquiries' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
                >
                    파트너 문의
                </button>
                <button
                    onClick={() => setActiveTab('customer_support')}
                    className={`px-4 py-2 min-h-[44px] font-medium text-sm whitespace-nowrap ${activeTab === 'customer_support' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
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
                                            <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {notices.length === 0 && <div className="text-center text-gray-400 py-8">등록된 공지사항이 없습니다.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inquiries' && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="업체명으로 검색"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                            </div>
                            <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[480px]">
                                    <thead className="bg-gray-50 text-gray-500 border-b">
                                        <tr>
                                            <th className="p-4">업체명</th>
                                            <th className="p-4">유형</th>
                                            <th className="p-4">접수일</th>
                                            <th className="p-4 text-right">상태</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {inquiries
                                            .filter((i) => {
                                                if (!filterText) return true;
                                                const keyword = filterText.toLowerCase();
                                                return (
                                                    i.companyName?.toLowerCase().includes(keyword) ||
                                                    i.targetFacilityId?.toLowerCase().includes(keyword)
                                                );
                                            })
                                            .map((i) => (
                                                <tr key={i.id} className="hover:bg-gray-50 cursor-pointer">
                                                    <td className="p-4 font-medium">{i.companyName}</td>
                                                    <td className="p-4">{i.type}</td>
                                                    <td className="p-4 text-gray-500">{i.createdAt}</td>
                                                    <td className="p-4 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${i.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
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
