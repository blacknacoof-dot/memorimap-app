import React, { useState } from 'react';
import { usePartnerInquiries } from '../../hooks/useSuperAdmin';
import { CheckCircle, XCircle, Search, FileText, Phone, MapPin, Building2, User, MessageSquare } from 'lucide-react';
import { PartnerInquiry } from '../../types/db';

export const PartnerAdmissions: React.FC = () => {
    const { data: facilities, loading: isLoading, refresh, approve, reject } = usePartnerInquiries();
    const [searchTerm, setSearchTerm] = useState('');

    const handleApprove = async (inquiry: PartnerInquiry) => {
        if (!confirm(`${inquiry.company_name} 업체의 입점을 승인하시겠습니까?`)) return;
        try {
            await approve(inquiry);
            alert('승인되었습니다.');
            refresh();
        } catch (error) {
            console.error('Approve failed:', error);
            alert('승인 처리 중 오류가 발생했습니다.');
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (!confirm(`${name} 업체의 입점을 거절하시겠습니까?`)) return;
        try {
            await reject(id);
            alert('거절되었습니다.');
            refresh();
        } catch (error) {
            console.error('Reject failed:', error);
            alert('거절 처리 중 오류가 발생했습니다.');
        }
    };

    const [selectedTab, setSelectedTab] = useState('all');

    const filtered = facilities.filter(f => {
        const matchesSearch = f.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.contact_person.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedTab === 'all') return true;
        // Simple mapping if needed, or just partial match
        if (selectedTab === 'funeral' && f.business_type === 'funeral_home') return true;
        if (selectedTab === 'memorial' && f.business_type === 'memorial_park') return true;
        if (selectedTab === 'sangjo' && f.business_type === 'sangjo') return true;
        if (selectedTab === 'pet' && f.business_type === 'pet_funeral') return true;

        return false;
    });

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-2">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="업체명, 담당자 검색..."
                    className="flex-1 outline-none text-sm"
                />
                <div onClick={refresh} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full" title="새로고침">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                        {isLoading ? '데이터를 불러오는 중...' : '승인 대기 중인 업체가 없습니다.'}
                    </div>
                ) : (
                    filtered.map(f => (
                        <div key={f.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-blue-200 transition-all">
                            <div className="flex-1 space-y-2 w-full">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900">{f.company_name}</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-medium whitespace-nowrap">
                                            {f.business_type === 'funeral_home' ? '장례식장' :
                                                f.business_type === 'memorial_park' ? '봉안/묘지' :
                                                    f.business_type === 'sangjo' ? '상조회사' :
                                                        f.business_type === 'pet_funeral' ? '동물장묘' : f.business_type}
                                        </span>
                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded border border-amber-100 font-bold flex items-center gap-1 whitespace-nowrap">
                                            <FileText size={10} /> 승인 대기
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <p className="flex items-center gap-1.5"><User size={14} className="text-gray-400 shrink-0" /> {f.contact_person}</p>
                                        <p className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400 shrink-0" /> {f.contact_number}</p>
                                    </div>
                                    <p className="flex items-center gap-1.5 text-gray-400 text-xs"><Building2 size={12} className="shrink-0" /> 신청일: {new Date(f.created_at).toLocaleDateString()}</p>
                                    {f.message && (
                                        <div className="mt-2 bg-gray-50 p-3 rounded-lg text-gray-600 text-xs flex gap-2">
                                            <MessageSquare size={14} className="shrink-0 mt-0.5 text-gray-400" />
                                            <p>{f.message}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                <button
                                    onClick={() => handleApprove(f)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    <CheckCircle size={18} /> 승인
                                </button>
                                <button
                                    onClick={() => handleReject(f.id, f.company_name)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-bold text-sm transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <XCircle size={18} /> 거절
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
