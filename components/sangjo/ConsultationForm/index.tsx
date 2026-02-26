import React, { useState } from 'react';
import { X, Phone, FileText, Smartphone, MapPin, Calendar, Info } from 'lucide-react';
import { FuneralCompany } from '../../../types';
import { ConsultationFormData } from './types';
import { MemorialFormBody } from './MemorialFormBody';
import { UrgentFormBody } from './UrgentFormBody';
import { StandardFormBody } from './StandardFormBody';

export { QuickMenuBtn } from './QuickMenuBtn';

interface FormProps {
    company: FuneralCompany;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => void;
    mode: 'phone' | 'chat' | 'urgent' | 'memorial';
    preStepData?: { scale: string; religion: string };
}

export const ConsultationForm: React.FC<FormProps> = ({ company, onClose, onSubmit, mode = 'phone', preStepData }) => {
    // Dynamic Styles based on company type
    const isPetCompany = company.id.startsWith('pet_');
    const isUrgent = mode === 'urgent';
    const isMemorial = mode === 'memorial';

    // Theme Colors
    let themeColor = isPetCompany ? "bg-[#8B5CF6]" : "bg-[#005B50]";
    let accentColor = isPetCompany ? "text-[#8B5CF6]" : "text-[#005B50]";
    let headerColor = isPetCompany ? "bg-[#78350F]" : "bg-gray-900";
    let lightBg = isPetCompany ? "bg-[#F3E8FF]" : "bg-[#E6F2F1]";

    // Urgent Mode Overrides
    if (isUrgent) {
        themeColor = "bg-red-600";
        accentColor = "text-red-600";
        headerColor = "bg-red-700";
        lightBg = "bg-red-50";
    }

    // Memorial Mode Overrides
    if (isMemorial) {
        themeColor = "bg-emerald-600";
        accentColor = "text-emerald-600";
        headerColor = "bg-emerald-800";
        lightBg = "bg-emerald-50";
    }

    const ringColor = isUrgent ? "focus:ring-red-500" : isMemorial ? "focus:ring-emerald-500" : (isPetCompany ? "focus:ring-amber-500" : "focus:ring-teal-500");
    const borderColor = isUrgent ? "focus:border-red-500" : isMemorial ? "focus:border-emerald-500" : (isPetCompany ? "focus:border-amber-500" : "focus:border-teal-500");

    const [formData, setFormData] = useState<ConsultationFormData>({
        // Applicant Info
        name: '',
        relation: '',
        phone: '',
        emergencyPhone: '',

        // Deceased Info
        deceasedName: '',
        deceasedGender: '남성',
        deceasedLocation: '',
        deathCause: '',

        // Transport Info
        isAmbulanceNeeded: '아니요',
        departureLocation: '',

        // Preferences (Funeral)
        region: '',
        scale: preStepData?.scale || '',
        religion: preStepData?.religion || '',
        funeralMethod: '3일장',
        burialMethod: '',

        // Common / Legacy
        time: '즉시 출동',
        type: isUrgent ? '긴급 출동 접수' : isMemorial ? '추모시설 상담' : '장례 예약 상담',
        location: '',

        // Pet Specific
        petName: '',
        petType: '강아지',
        weight: '',
        isStone: false,
        date: '',
        requests: '',

        // Memorial Specific
        memorialType: '',
        urnCount: '1기',
        deathDate: '',
        visitDate: '',
        memorialBudget: '',
    });

    const isPhoneMode = mode === 'phone';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as unknown as Record<string, unknown>);
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className={`bg-white w-full max-w-sm max-h-[calc(100dvh-2rem)] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp ${isUrgent ? 'border-2 border-red-500' : isMemorial ? 'border-2 border-emerald-500' : ''}`}>
                {/* Modal Header */}
                <div className={`${headerColor} text-white p-5 pt-6 shadow-md shrink-0 flex justify-between items-center relative overflow-hidden`}>
                    {isUrgent && (
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Smartphone size={64} />
                        </div>
                    )}
                    {isMemorial && (
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MapPin size={64} />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {isMemorial ? (
                                <>🕊️ 추모시설 상담 접수</>
                            ) : isUrgent ? (
                                <>🚨 긴급 출동 접수</>
                            ) : (
                                isPetCompany ? '장례 예약 신청' : (isPhoneMode ? '전화 상담 예약' : '채팅 상담 예약')
                            )}
                        </h3>
                        {isMemorial && <p className="text-xs text-white/80 mt-1">{company.name} 상담 신청서</p>}
                        {isUrgent && <p className="text-xs text-white/80 mt-1">가장 가까운 의전 팀이 즉시 출동합니다.</p>}
                    </div>
                    <button onClick={onClose} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors z-10">
                        <X size={24} className="text-white/80 hover:text-white" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {!isUrgent && (
                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-lg flex gap-2">
                            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>
                                {isPhoneMode
                                    ? (isPetCompany
                                        ? "연락처를 남겨주시면 반려동물 장례지도사가 10분 내로 연락드립니다."
                                        : "연락처를 남겨주시면 담당 팀장이 확인 후 10분 내로 연락드립니다.")
                                    : "원활한 상담을 위해 고객님의 기본 정보를 입력해 주세요."}
                            </span>
                        </p>
                    )}

                    {isMemorial ? (
                        <MemorialFormBody
                            formData={formData}
                            setFormData={setFormData}
                            borderColor={borderColor}
                            ringColor={ringColor}
                            preStepData={preStepData}
                        />
                    ) : isUrgent ? (
                        <UrgentFormBody
                            formData={formData}
                            setFormData={setFormData}
                            borderColor={borderColor}
                            ringColor={ringColor}
                            preStepData={preStepData}
                        />
                    ) : (
                        <StandardFormBody
                            formData={formData}
                            setFormData={setFormData}
                            borderColor={borderColor}
                            ringColor={ringColor}
                            isPetCompany={isPetCompany}
                            isPhoneMode={isPhoneMode}
                            lightBg={lightBg}
                            accentColor={accentColor}
                        />
                    )}

                    <div className="flex items-start gap-2 pt-2">
                        <input type="checkbox" id="privacy" required className={`mt-1 w-4 h-4 text-white focus:ring-0 border-gray-300 rounded checked:${isUrgent ? 'bg-red-600' : themeColor}`} />
                        <label htmlFor="privacy" className="text-xs text-gray-500 leading-tight cursor-pointer">
                            [필수] 개인정보 수집 및 이용에 동의합니다. <br />
                            <span className="text-gray-400 text-[10px]">(수집 목적: {isMemorial ? '추모시설 상담 및 방문 안내' : isUrgent ? '긴급 출동 연락' : '상담 예약 및 안내'})</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="p-4 pt-0 mt-auto z-20 bg-white border-t border-gray-100 safe-bottom">
                        <button
                            onClick={handleSubmit}
                            className={`w-full ${isMemorial ? 'bg-emerald-600 hover:bg-emerald-700' : isUrgent ? 'bg-red-600 hover:bg-red-700' : (isPetCompany ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900 hover:bg-gray-800')} text-white py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2`}
                        >
                            {isMemorial ? <Calendar size={18} /> : isUrgent ? <Smartphone size={18} className="animate-pulse" /> : (isPhoneMode ? <Phone size={18} /> : <FileText size={18} />)}
                            {isMemorial ? '상담 신청하기' : isUrgent ? '긴급 출동 요청하기' : (isPetCompany ? '예약 신청하기' : (isPhoneMode ? '전화 상담 예약' : '상담 신청하기'))}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};
