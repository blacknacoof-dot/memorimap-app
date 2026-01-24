import React, { useState } from 'react';
import { usePartnerInquiries } from '../../hooks/usePartnerInquiries';
import { useApprovePartner } from '../../hooks/useAdminActions';
import { CheckCircle, XCircle, Search, FileText, Phone, MapPin, Building2, User, MessageSquare } from 'lucide-react';
import { PartnerInquiry } from '../../types/db';
import { useConfirmModal } from '../../src/components/common/ConfirmModal';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';

export const PartnerAdmissions: React.FC = () => {
    const { isSuperAdmin } = useIsSuperAdmin();


    const { data: inquiryData, isLoading, refetch } = usePartnerInquiries({ status: 'pending' });
    const facilities = inquiryData?.data || [];

    const { approvePartner } = useApprovePartner();
    const [searchTerm, setSearchTerm] = useState('');
    const confirmModal = useConfirmModal();

    if (!isSuperAdmin) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 font-bold shrink-0">!</div>
                <div>
                    <h3 className="text-red-800 font-bold">권한이 없습니다</h3>
                    <p className="text-red-600 text-sm mt-0.5">이 페이지는 슈퍼관리자(blacknacoof@gmail.com)만 접근할 수 있습니다.</p>
                </div>
            </div>
        );
    }

    const handleApprove = (inquiry: PartnerInquiry) => {
        confirmModal.open({
            title: '입점 승인 확인',
            message: `${inquiry.company_name} 업체의 입점을 승인하시겠습니까?`,
            onConfirm: async () => {
                try {
                    await approvePartner({ inquiryId: inquiry.id, action: 'approve' });
                    alert('승인되었습니다.');
                    refetch();
                } catch (error: any) {
                    console.error('Approve failed:', error);
                    alert('승인 처리 중 오류가 발생했습니다: ' + error.message);
                }
            }
        });
    };

    const handleReject = (id: string, name: string) => {
        confirmModal.open({
            title: '입점 반려 확인',
            message: `${name} 업체의 입점을 거절하시겠습니까? (반려 사유: "운영팀 문의 요망")`,
            onConfirm: async () => {
                try {
                    await approvePartner({ inquiryId: id, action: 'reject', rejectionReason: '운영팀 문의 요망' });
                    alert('거절되었습니다.');
                    refetch();
                } catch (error: any) {
                    console.error('Reject failed:', error);
                    alert('거절 처리 중 오류가 발생했습니다: ' + error.message);
                }
            }
        });
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
                <div onClick={() => refetch()} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full" title="새로고침">
                    <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3" data-testid="pending-list">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                        {isLoading ? '데이터를 불러오는 중...' : '승인 대기 중인 업체가 없습니다.'}
                    </div>
                ) : (
                    filtered.map(f => (
                        <div key={f.id} data-testid="pending-item" className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-blue-200 transition-all">
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
                                        <span className={`px-2 py-0.5 text-xs rounded border font-bold flex items-center gap-1 whitespace-nowrap ${f.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                f.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                            <FileText size={10} />
                                            {f.status === 'pending' ? '승인 대기' :
                                                f.status === 'rejected' ? '반려됨' : '승인됨'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <p className="flex items-center gap-1.5"><User size={14} className="text-gray-400 shrink-0" /> {f.contact_person} ({f.manager_mobile})</p>
                                        <p className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400 shrink-0" /> {f.contact_number}</p>
                                        <p className="flex items-center gap-1.5"><Building2 size={12} className="text-gray-400 shrink-0" /> {f.address}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 text-xs">
                                        <p className="text-gray-400">Email: {f.company_email}</p>
                                        <p className="text-gray-400">신청일: {new Date(f.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {f.business_license_url && (
                                        <div className="mt-2">
                                            <a href={f.business_license_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline flex items-center gap-1">
                                                <FileText size={12} /> 사업자등록증 보기
                                            </a>
                                        </div>
                                    )}
                                    {f.message && (
                                        <div className="mt-2 bg-gray-50 p-3 rounded-lg text-gray-600 text-xs flex gap-2">
                                            <MessageSquare size={14} className="shrink-0 mt-0.5 text-gray-400" />
                                            <p>{f.message}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                                <button
                                    onClick={() => handleApprove(f)}
                                    data-testid="approve-button"
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap min-w-[100px]"
                                >
                                    <CheckCircle size={18} /> 승인
                                </button>
                                <button
                                    onClick={() => handleReject(f.id, f.company_name)}
                                    data-testid="reject-button"
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-bold text-sm transition-all active:scale-95 whitespace-nowrap min-w-[100px]"
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
