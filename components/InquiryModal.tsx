import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, MessageSquare, Building2, User, Phone, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/auth';
import { FUNERAL_COMPANIES } from '../constants';

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string;
    facilityId?: string;
    type?: 'facility' | 'sangjo';
}

export const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, initialPlan, facilityId, type }) => {
    const { user, isSignedIn } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [fetchedCompanyName, setFetchedCompanyName] = useState<string>('');

    const [formData, setFormData] = useState({
        inquiryType: '도입 상담',
        managerName: user?.fullName || user?.username || '',
        phone: '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        planInterest: initialPlan || 'premium',
        message: ''
    });

    // Auto-fetch facility name
    useEffect(() => {
        const fetchName = async () => {
            if (!facilityId) return;

            if (type === 'sangjo') {
                const company = FUNERAL_COMPANIES.find(c => c.id === facilityId);
                if (company) setFetchedCompanyName(company.name);
            } else {
                const { data, error } = await supabase
                    .from('memorial_spaces')
                    .select('name')
                    .eq('id', facilityId)
                    .maybeSingle();

                if (data) setFetchedCompanyName(data.name);
            }
        };

        if (isOpen) {
            fetchName();
            // Reset state
            setFormData(prev => ({
                ...prev,
                managerName: user?.fullName || user?.username || prev.managerName,
                email: user?.primaryEmailAddress?.emailAddress || prev.email
            }));
        }
    }, [isOpen, facilityId, type, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('partner_inquiries')
                .insert({
                    user_id: user?.id || null,
                    target_facility_id: (type === 'facility' && facilityId) ? parseInt(facilityId) : null,
                    target_brand_id: (type === 'sangjo' && facilityId) ? facilityId : null,
                    company_name: fetchedCompanyName || '알 수 없는 업체',
                    manager_name: formData.managerName,
                    phone: formData.phone,
                    email: formData.email,
                    type: type || 'other',
                    inquiry_type: 'consult',
                    plan_interest: formData.planInterest,
                    message: formData.message,
                    status: 'pending'
                });

            if (error) throw error;
            setIsSuccess(true);
        } catch (err) {
            console.error('Inquiry error:', err);
            alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 text-left">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all z-20"
                >
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">상담 신청 완료!</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            전문 상담사가 내용을 검토한 후<br />
                            빠른 시일 내에 연락드리겠습니다.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            닫기
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        {/* Header Overlay */}
                        <div className="p-8 pb-4 relative overflow-hidden bg-slate-50 border-b border-gray-100">
                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full mb-4 shadow-lg shadow-blue-200 uppercase tracking-widest">
                                    <Sparkles size={10} /> Partnership
                                </span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 size={18} className="text-blue-600" />
                                    <h2 className="text-sm font-black text-blue-600 tracking-tight">{fetchedCompanyName || '업체명 정보 불러오는 중...'}</h2>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">1:1 도입 문의</h2>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 pt-6 overflow-y-auto space-y-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2.5 block ml-1">문의 유형</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['도입 상담', '제휴 제안', '가격 문의', '기타'].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, inquiryType: t }))}
                                                className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all ${formData.inquiryType === t
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-50'
                                                        : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block ml-1">담당자명</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text" name="managerName" required value={formData.managerName} onChange={handleChange}
                                                placeholder="성함 입력"
                                                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-sm transition-all outline-none font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block ml-1">관심 플랜</label>
                                        <select
                                            name="planInterest" value={formData.planInterest} onChange={handleChange}
                                            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-sm transition-all outline-none font-bold"
                                        >
                                            <option value="basic">베이직 (실속형)</option>
                                            <option value="premium">프리미엄 (인기)</option>
                                            <option value="enterprise">엔터프라이즈 (VIP)</option>
                                            <option value="super_admin">슈퍼관리자 (MASTER)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block ml-1">연락처</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                                                placeholder="010-0000-0000"
                                                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-sm transition-all outline-none font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block ml-1">이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="email" name="email" required value={formData.email} onChange={handleChange}
                                                placeholder="example@email.com"
                                                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-sm transition-all outline-none font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block ml-1">상세 문의 내용</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-4 text-gray-400" size={16} />
                                        <textarea
                                            name="message" required value={formData.message} onChange={handleChange}
                                            placeholder="궁금하신 내용을 입력해 주세요. (예: 추가 기기 연동, 대량 입점 등)"
                                            rows={4}
                                            className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-sm transition-all outline-none font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:bg-gray-200 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        상담 신청하기
                                        <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
