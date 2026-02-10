import React, { useState } from 'react';
import { FuneralCompany } from '../../types';
import { X, Check, Phone, User, Clock, ShieldCheck, HeartHandshake, Loader2 } from 'lucide-react';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onConfirm: (data: any) => void;
}

export const SangjoContractModal: React.FC<Props> = ({ company, onClose, onConfirm }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [callTime, setCallTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onConfirm({
                companyId: company.id,
                companyName: company.name,
                name,
                phone,
                callTime,
                status: 'pending'
            });
            setStep(3);
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <HeartHandshake className="text-primary" size={20} />
                        <h3 className="font-bold text-gray-900">상조 가입 신청</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
                                <p className="text-xs text-primary font-bold mb-1 uppercase">Selected Company</p>
                                <div className="flex items-center gap-3">
                                    <img src={company.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt={company.name} />
                                    <span className="font-bold text-gray-900">{company.name}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={16} className="text-blue-600" />
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        추모맵 제휴 혜택이 적용된 최적의 견적으로 안내해 드리며, 업체 담당자가 직접 상세 상담을 진행합니다.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                        <Check size={16} className="text-green-600" />
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        가입 신청 시 24시간 이내에 전문 상담원이 연락을 드려 계약 절차를 마무리를 도와드립니다.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all"
                            >
                                신청 정보 입력하기
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                                        <User size={14} /> 성함
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="이름을 입력하세요"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                                        <Phone size={14} /> 연락처
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="010-0000-0000"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                                        <Clock size={14} /> 상담 희망 시간
                                    </label>
                                    <select
                                        value={callTime}
                                        onChange={(e) => setCallTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900"
                                    >
                                        <option value="">시간대를 선택하세요</option>
                                        <option value="오전 (09:00~12:00)">오전 (09:00~12:00)</option>
                                        <option value="오후 (12:00~18:00)">오후 (12:00~18:00)</option>
                                        <option value="저녁 (18:00~21:00)">저녁 (18:00~21:00)</option>
                                        <option value="언제나 가능">언제나 가능</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 border border-gray-200 text-gray-500 rounded-2xl font-bold active:scale-[0.98] transition-all"
                                >
                                    이전
                                </button>
                                <button
                                    disabled={!name || !phone || !callTime || isSubmitting}
                                    onClick={handleSubmit}
                                    className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : '상담 신청 완료'}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">
                                본 신청은 예약 대기 상태이며, 최종 계약은 업체 담당자와의 유선 상담 후 확정됩니다.
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <Check size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900 mb-1">신청이 완료되었습니다!</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    곧 <strong>{company.name}</strong>의 전문 상담사가<br />
                                    남겨주신 번호로 연락드릴 예정입니다.
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-400 text-left">
                                <p className="font-bold mb-1 text-gray-500 uppercase tracking-wider">Dashboard Notification</p>
                                <p>업체 관리자 대시보드에 상담 요청이 실시간으로 등록되었습니다. 안전하고 품격 있는 마지막을 추모맵이 함께 준비하겠습니다.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
                            >
                                닫기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
