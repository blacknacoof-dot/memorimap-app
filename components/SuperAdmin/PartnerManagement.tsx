import React, { useState, useEffect } from 'react';
import {
    Search, CheckCircle2, AlertCircle, XCircle, PauseCircle,
    Building2, Mail, Phone, Calendar, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { getPartners, updatePartnerStatus } from '../../lib/sangjoQueries';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { Partner } from '../../types';
import { useSuperAdminClient } from './SuperAdminGuard';
import { PartnerDetailModal } from './PartnerDetailModal';

export const PartnerManagement: React.FC = () => {
    const client = useSuperAdminClient();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

    useEffect(() => {
        loadPartners();
    }, [client]);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await getPartners(client);
            setPartners(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            toast.error(`파트너 목록 로딩 실패: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: Partner['status']) => {
        const labelMap: Record<string, string> = {
            approved: '서비스 재개',
            suspended: '서비스 일시정지',
            rejected: '승인 취소',
        };
        const label = labelMap[status] || status;

        const confirmMsg = status === 'rejected'
            ? `"${label}"하면 파트너 자격이 영구 취소됩니다. 진행하시겠습니까?`
            : `상태를 "${label}" 하시겠습니까?`;

        if (!await confirmAsync(confirmMsg)) return false;

        try {
            const { data: { user } } = await client.auth.getUser();
            const approvedBy = status === 'approved' ? user?.id : undefined;
            await updatePartnerStatus(id, status, approvedBy, client);
            toast.success(`${label} 처리되었습니다.`);
            await loadPartners();
            return true;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류';
            toast.error(`업데이트 실패: ${msg}`);
            return false;
        }
    };

    const filteredPartners = partners.filter(p => {
        const matchesSearch = p.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">전체 파트너</p>
                    <p className="text-2xl font-black text-slate-800">{partners.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">승인 대기</p>
                    <p className="text-2xl font-black text-blue-600">{partners.filter(p => p.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-green-400 uppercase mb-1">활성 파트너</p>
                    <p className="text-2xl font-black text-green-600">{partners.filter(p => p.status === 'approved').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">정지</p>
                    <p className="text-2xl font-black text-orange-600">{partners.filter(p => p.status === 'suspended').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">반려</p>
                    <p className="text-2xl font-black text-red-600">{partners.filter(p => p.status === 'rejected').length}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        id="partner-search"
                        name="partner-search"
                        type="text"
                        placeholder="회사명 검색..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'pending', 'approved', 'suspended', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'all' ? '전체' :
                                status === 'pending' ? '대기' :
                                    status === 'approved' ? '승인' :
                                        status === 'suspended' ? '정지' : '반려'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Partners Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400">데이터를 불러오는 중...</div>
                ) : filteredPartners.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400">해당하는 파트너가 없습니다.</div>
                ) : filteredPartners.map((partner) => (
                    <div key={partner.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                    {partner.company_logo_url ? (
                                        <img src={partner.company_logo_url} alt={partner.company_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {partner.company_name}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${partner.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                partner.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                                                    partner.status === 'suspended' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-red-100 text-red-600'
                                            }`}>
                                            {partner.status === 'approved' ? '승인' :
                                                partner.status === 'pending' ? '대기' :
                                                    partner.status === 'suspended' ? '정지' : '반려'}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400">{partner.contact_person || '담당자 미정'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPartner(partner)}
                                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                                title="상세보기"
                            >
                                <ExternalLink size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate">{partner.contact_email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{partner.contact_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>가입일: {new Date(partner.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-bold text-blue-600 capitalize">{partner.subscription_plan} 플랜</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                            {partner.status === 'pending' && (
                                <div className="flex-1 text-center py-2 text-xs text-amber-600 bg-amber-50 rounded-xl border border-amber-100 font-medium">
                                    상단 "신규 입점 신청"에서 승인/거절 처리
                                </div>
                            )}
                            {partner.status === 'approved' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'suspended')}
                                        className="flex-1 bg-white text-orange-600 border border-orange-200 py-2 rounded-xl text-xs font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-1"
                                    >
                                        <PauseCircle size={14} /> 일시정지
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'rejected')}
                                        className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={14} /> 승인 취소
                                    </button>
                                </>
                            )}
                            {partner.status === 'suspended' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'approved')}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 size={14} /> 서비스 재개
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'rejected')}
                                        className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={14} /> 승인 취소
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedPartner(partner)}
                                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                            >
                                <ExternalLink size={14} /> 상세보기
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Partner Detail Modal */}
            {selectedPartner && (
                <PartnerDetailModal
                    partner={selectedPartner}
                    onClose={() => setSelectedPartner(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
};
