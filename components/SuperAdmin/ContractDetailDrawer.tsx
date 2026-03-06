import React, { useState, useEffect } from 'react';
import { X, FileText, MapPin, Clock, User, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SangjoContract } from '../../types';

interface ContractDetailDrawerProps {
    contract: SangjoContract | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveMemo: (contractId: string, memo: string) => Promise<void>;
}

const EMERGENCY_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    urgent:   'bg-amber-100 text-amber-700',
    normal:   'bg-green-100 text-green-700',
};

const EMERGENCY_LABEL: Record<string, string> = {
    critical: '긴급',
    urgent:   '중요',
    normal:   '일반',
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
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleSave = async () => {
        if (isSaving || !contract) return;
        setIsSaving(true);
        try {
            await onSaveMemo(contract.id, memo);
            toast.success('메모가 저장되었습니다.');
        } catch (e: unknown) {
            toast.error('저장 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
        } finally {
            setIsSaving(false);
        }
    };

    const level = contract?.emergency_level ?? 'normal';
    const badgeClass = EMERGENCY_BADGE[level] ?? EMERGENCY_BADGE.normal;
    const badgeLabel = EMERGENCY_LABEL[level] ?? '일반';

    return (
        <>
            {/* 배경 오버레이 */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[299] bg-black/40"
                    onClick={onClose}
                />
            )}

            {/* Drawer 패널 */}
            <div
                className={`fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[300] shadow-2xl transform transition-transform duration-300 flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        계약 관제 상세
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="닫기"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {!contract ? (
                        <p className="text-sm text-slate-400 text-center py-10">계약을 선택해주세요.</p>
                    ) : (
                        <>
                            {/* 긴급도 + 상태 배지 */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>
                                    {badgeLabel}
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {contract.status}
                                </span>
                                {contract.application_type && (
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                                        {contract.application_type === 'CONTRACT' ? '계약' : '상담'}
                                    </span>
                                )}
                            </div>

                            {/* 기본 정보 */}
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <InfoRow
                                    icon={<FileText size={14} />}
                                    label="계약번호"
                                    value={contract.contract_number}
                                />
                                <InfoRow
                                    icon={<User size={14} />}
                                    label="고객명"
                                    value={contract.customer_name}
                                />
                                <InfoRow
                                    icon={<Phone size={14} />}
                                    label="연락처"
                                    value={contract.customer_phone}
                                />
                                <InfoRow
                                    icon={<MapPin size={14} />}
                                    label="지역"
                                    value={contract.region ?? '미입력'}
                                />
                                <InfoRow
                                    icon={<Clock size={14} />}
                                    label="접수일시"
                                    value={new Date(contract.created_at).toLocaleString('ko-KR', {
                                        year: 'numeric', month: '2-digit', day: '2-digit',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                />
                                {contract.service_type && (
                                    <InfoRow icon={<FileText size={14} />} label="서비스유형" value={contract.service_type} />
                                )}
                                {contract.sangjo_id && (
                                    <InfoRow icon={<User size={14} />} label="담당 상조사" value={contract.sangjo_id} />
                                )}
                                {contract.assigned_counselor && (
                                    <InfoRow icon={<User size={14} />} label="담당 상담사" value={contract.assigned_counselor} />
                                )}
                            </div>

                            {/* 관리자 메모 */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    관리자 메모
                                    <span className="ml-1 text-slate-300 font-normal">(파트너/고객 비공개)</span>
                                </label>
                                <textarea
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                    rows={5}
                                    maxLength={500}
                                    placeholder="관제 메모를 입력하세요..."
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">{memo.length} / 500</span>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                저장 중...
                                            </>
                                        ) : '저장'}
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
        <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-slate-700 font-medium break-words">{value}</p>
        </div>
    </div>
);
