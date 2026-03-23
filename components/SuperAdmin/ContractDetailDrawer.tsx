import React, { useEffect, useState } from 'react';
import { Clock, FileText, Loader2, MapPin, Phone, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { SangjoContract } from '../../types';

interface ContractDetailDrawerProps {
    contract: SangjoContract | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveMemo: (contract: SangjoContract, memo: string) => Promise<void>;
}

const EMERGENCY_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    urgent: 'bg-amber-100 text-amber-700',
    normal: 'bg-green-100 text-green-700',
};

const EMERGENCY_LABEL: Record<string, string> = {
    critical: '긴급',
    urgent: '중요',
    normal: '일반',
};

export const ContractDetailDrawer: React.FC<ContractDetailDrawerProps> = ({
    contract,
    isOpen,
    onClose,
    onSaveMemo,
}) => {
    const [memo, setMemo] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMemo(contract?.admin_memo ?? '');
    }, [contract?.id]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKey);
        }

        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleSave = async () => {
        if (isSaving || !contract) return;

        setIsSaving(true);
        try {
            await onSaveMemo(contract, memo);
            toast.success('관리자 메모를 저장했습니다.');
        } catch (error: unknown) {
            toast.error(`메모 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const level = contract?.emergency_level ?? 'normal';
    const badgeClass = EMERGENCY_BADGE[level] ?? EMERGENCY_BADGE.normal;
    const badgeLabel = EMERGENCY_LABEL[level] ?? EMERGENCY_LABEL.normal;

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-[299] bg-black/40" onClick={onClose} />}

            <div
                data-testid="contract-detail-drawer"
                className={`fixed inset-y-0 right-0 z-[300] flex w-full max-w-sm transform flex-col bg-white shadow-2xl transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="flex items-center gap-2 font-bold text-slate-800">
                        <FileText className="h-4 w-4 text-blue-600" />
                        계약 관제 상세
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                        aria-label="닫기"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    {!contract ? (
                        <p className="py-10 text-center text-sm text-slate-400">계약을 선택해주세요.</p>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass}`}>
                                    {badgeLabel}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                    {contract.status}
                                </span>
                                {contract.application_type && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                                        {contract.application_type === 'CONTRACT' ? '계약' : '상담'}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                                <InfoRow icon={<FileText size={14} />} label="계약번호" value={contract.contract_number} />
                                <InfoRow icon={<User size={14} />} label="고객명" value={contract.customer_name} />
                                <InfoRow icon={<Phone size={14} />} label="연락처" value={contract.customer_phone} />
                                <InfoRow icon={<MapPin size={14} />} label="지역" value={contract.region ?? '미입력'} />
                                <InfoRow
                                    icon={<Clock size={14} />}
                                    label="접수일시"
                                    value={new Date(contract.created_at).toLocaleString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                />
                                {contract.service_type && (
                                    <InfoRow icon={<FileText size={14} />} label="서비스유형" value={contract.service_type} />
                                )}
                                {contract.sangjo_id && (
                                    <InfoRow icon={<User size={14} />} label="배정 상조" value={contract.sangjo_id} />
                                )}
                                {contract.assigned_counselor && (
                                    <InfoRow icon={<User size={14} />} label="담당 상담사" value={contract.assigned_counselor} />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    관리자 메모
                                    <span className="ml-1 font-normal text-slate-300">(파트너 및 고객 비공개)</span>
                                </label>
                                <textarea
                                    data-testid="contract-admin-memo"
                                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    rows={5}
                                    maxLength={500}
                                    placeholder="관제 메모를 입력하세요..."
                                    value={memo}
                                    onChange={(event) => setMemo(event.target.value)}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">{memo.length} / 500</span>
                                    <button
                                        type="button"
                                        data-testid="contract-admin-memo-save"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            '저장'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="break-words text-sm font-medium text-slate-700">{value}</p>
        </div>
    </div>
);
