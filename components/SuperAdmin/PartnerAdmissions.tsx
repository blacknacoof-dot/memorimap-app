import React, { useState } from 'react';
import { usePartnerInquiries } from '../../hooks/usePartnerInquiries';
import { useApprovePartner } from '../../hooks/useAdminActions';
import { CheckCircle, XCircle, Search, FileText, Phone, Building2, User, MessageSquare } from 'lucide-react';
import { PartnerInquiry } from '../../types/db';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { useSuperAdminClient } from './SuperAdminGuard';
import { toast } from 'sonner';

export const PartnerAdmissions: React.FC = () => {
    const client = useSuperAdminClient();
    const { data: inquiryData, isLoading, refetch } = usePartnerInquiries({ status: 'pending', client });
    const facilities = inquiryData?.data || [];
    const { approvePartner, loading: isApproving } = useApprovePartner(client);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const handleApprove = async (inquiry: PartnerInquiry) => {
        // 상조 타입 신청 시 기존 상조 관리자 여부 경고
        try {
            if (inquiry.business_type === 'sangjo' || inquiry.business_type === 'sangjo_hq' as string) {
                const { data: existing } = await client
                    .from('sangjo_dashboard_users')
                    .select('sangjo_id')
                    .eq('id', inquiry.user_id)
                    .maybeSingle();

                if (existing?.sangjo_id) {
                    const { data: existingFacility } = await client
                        .from('facilities')
                        .select('name')
                        .eq('id', existing.sangjo_id)
                        .maybeSingle();

                    const existingName = existingFacility?.name || existing.sangjo_id;
                    if (!await confirmAsync(
                        `이 사용자는 이미 "${existingName}" 상조를 관리 중입니다.\n승인하면 새 시설이 생성되지만, 기존 상조 매핑은 유지됩니다.\n계속 진행하시겠습니까?`,
                        '기존 상조 관리자 경고'
                    )) return;
                }
            }
        } catch (err) {
            console.error('상조 중복 체크 실패:', err);
            toast.error('상조 관리자 확인 중 오류가 발생했습니다.');
            return;
        }

        if (isApproving || isRejecting) return;
        if (!await confirmAsync(`${inquiry.company_name} 업체의 입점을 승인하시겠습니까?`, '입점 승인 확인')) return;
        try {
            const result = await approvePartner({ inquiryId: inquiry.id, action: 'approve' });
            if (result && 'warning' in result && result.warning) {
                toast.warning(result.warning as string);
            }
            toast.success('승인되었습니다.');
            refetch();
        } catch (error: unknown) {
            toast.error('승인 처리 중 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectTarget || isRejecting || isApproving) return;
        setIsRejecting(true);
        try {
            await approvePartner({
                inquiryId: rejectTarget.id,
                action: 'reject',
                rejectionReason: rejectReason.trim() || '운영팀 문의 요망'
            });
            toast.success('거절되었습니다.');
            setRejectTarget(null);
            setRejectReason('');
            refetch();
        } catch (error: unknown) {
            toast.error('거절 처리 중 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        } finally {
            setIsRejecting(false);
        }
    };

    const filtered = facilities.filter(f =>
        f.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-2">
                <Search className="text-gray-400" size={20} />
                <input
                    id="admission-search"
                    name="admission-search"
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
                                        <span className="px-2 py-0.5 text-xs rounded border font-bold flex items-center gap-1 whitespace-nowrap bg-amber-50 text-amber-600 border-amber-100">
                                            <FileText size={10} />
                                            승인 대기
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
                                    {f.business_license_url && /^https?:\/\//i.test(f.business_license_url) && (
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
                                    disabled={isApproving || isRejecting}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-md whitespace-nowrap min-w-[100px] ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'}`}
                                >
                                    <CheckCircle size={18} /> {isApproving ? '처리 중...' : '승인'}
                                </button>
                                <button
                                    onClick={() => { setRejectTarget({ id: f.id, name: f.company_name }); setRejectReason(''); }}
                                    data-testid="reject-button"
                                    disabled={isApproving || isRejecting}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm transition-all whitespace-nowrap min-w-[100px] ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100 active:scale-95'}`}
                                >
                                    <XCircle size={18} /> 거절
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 거절 사유 입력 모달 */}
            {rejectTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-slate-800">거절 사유 입력</h3>
                        <p className="text-sm text-slate-500">
                            <strong>{rejectTarget.name}</strong> 업체의 입점을 거절합니다.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="거절 사유를 입력하세요 (미입력 시 '운영팀 문의 요망')"
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-200 resize-none"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setRejectTarget(null)}
                                disabled={isRejecting || isApproving}
                                className="px-4 py-2 min-h-[44px] text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={isRejecting || isApproving}
                                className={`px-4 py-2 min-h-[44px] text-sm font-bold text-white bg-red-600 rounded-xl transition-colors ${(isRejecting || isApproving) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                            >
                                {isRejecting ? '처리 중...' : '거절 확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
