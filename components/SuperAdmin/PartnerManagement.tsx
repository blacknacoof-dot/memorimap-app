import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, CheckCircle2,
    XCircle, AlertCircle, MoreVertical,
    Building2, Mail, Phone, Calendar, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner'; // [Phase 2] Error Handler
import { getPartners, updatePartnerStatus } from '../../lib/sangjoQueries';
import { Partner } from '../../types';

export const PartnerManagement: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await getPartners();
            setPartners(data);
        } catch (err) {
            console.error('파트너 로딩 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: Partner['status']) => {
        if (!confirm(`상태를 ${status === 'approved' ? '승인' : '반려/정지'} 하시겠습니까?`)) return;

        try {
            await updatePartnerStatus(id, status);
            toast.success('상태가 업데이트되었습니다.');
            loadPartners();
        } catch (err) {
            toast.error('업데이트 중 오류가 발생했습니다.');
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">정지/반려</p>
                    <p className="text-2xl font-black text-red-600">{partners.filter(p => ['rejected', 'suspended'].includes(p.status)).length}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="회사명 검색..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {['all', 'pending', 'approved', 'suspended'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === status
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'all' ? '전체' :
                                status === 'pending' ? '대기' :
                                    status === 'approved' ? '승인' : '정지'}
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
                                                partner.status === 'pending' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {partner.status.toUpperCase()}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-slate-400">{partner.contact_person || '담당자 미정'}</p>
                                </div>
                            </div>
                            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                                <MoreVertical size={18} />
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

                        <div className="flex gap-2 pt-4 border-t border-slate-50">
                            {partner.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'approved')}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle2 size={14} /> 승인하기
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(partner.id, 'rejected')}
                                        className="flex-1 bg-white text-red-500 border border-red-200 py-2 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <XCircle size={14} /> 거절하기
                                    </button>
                                </>
                            )}
                            {partner.status === 'approved' && (
                                <button
                                    onClick={() => handleStatusChange(partner.id, 'suspended')}
                                    className="flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                                >
                                    서비스 일시정지
                                </button>
                            )}
                            <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5">
                                <ExternalLink size={14} /> 상세보기
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
