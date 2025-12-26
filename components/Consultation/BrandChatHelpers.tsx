import React, { useState } from 'react';
import { X, Phone, FileText, MessageSquare, Info, User, Smartphone, ChevronDown, Clock } from 'lucide-react';
import { FuneralCompany } from '../../types';

interface FormProps {
    company: FuneralCompany;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode: 'phone' | 'chat';
}

export const ConsultationForm: React.FC<FormProps> = ({ company, onClose, onSubmit, mode = 'phone' }) => {
    // Dynamic Styles based on company type
    // Pet: Amber/Brown Theme (to match screenshot/snippet)
    // General: Teal Theme
    const isPetCompany = company.id.startsWith('pet_');
    const themeColor = isPetCompany ? "bg-[#8B5CF6]" : "bg-[#005B50]"; // This is the original themeColor, not explicitly changed in instruction, keeping it.
    const accentColor = isPetCompany ? "text-[#8B5CF6]" : "text-[#005B50]"; // This is the original accentColor, not explicitly changed in instruction, keeping it.
    const ringColor = isPetCompany ? "focus:ring-amber-500" : "focus:ring-teal-500";
    const borderColor = isPetCompany ? "focus:border-amber-500" : "focus:border-teal-500";
    const headerColor = isPetCompany ? "bg-[#78350F]" : "bg-gray-900";
    const lightBg = isPetCompany ? "bg-[#F3E8FF]" : "bg-[#E6F2F1]";

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        time: '빠른 통화',
        type: isPetCompany ? '기본 장례 상담' : '상품 가입 문의',
        // Pet Specific & New Fields
        petName: '',
        petType: '강아지',
        weight: '',
        isStone: false,
        date: '',
        requests: ''
    });

    const isPhoneMode = mode === 'phone';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Modal Header */}
                <div className={`${headerColor} text-white p-5 pt-6 shadow-md shrink-0 flex justify-between items-center`}>
                    <h3 className="font-bold text-lg">
                        {isPetCompany ? '장례 예약 신청' : (isPhoneMode ? '전화 상담 예약' : '채팅 상담 예약')}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-amber-200" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                    {/* 0. Guardian Info (Common) */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <span className={`w-1 h-3 ${isPetCompany ? 'bg-amber-500' : 'bg-teal-500'} rounded-full`}></span>
                            {isPetCompany ? '보호자 정보' : '신청자 정보'}
                        </h3>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-400" /> 성함
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="홍길동"
                                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-gray-400" /> 연락처
                            </label>
                            <input
                                type="tel"
                                required
                                placeholder="010-1234-5678"
                                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 신청 내용 (Dropdown) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-gray-400" /> 신청 내용
                        </label>
                        <div className="relative">
                            <select
                                className={`w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} appearance-none bg-white text-gray-700`}
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {isPetCompany ? (
                                    <>
                                        <option value="기본 장례 상담">기본 장례 상담 (비용/절차)</option>
                                        <option value="긴급 장례 접수">긴급 장례 접수 (지금 출발)</option>
                                        <option value="픽업/이송 문의">픽업/이송 요청</option>
                                        <option value="메모리얼 스톤 제작">메모리얼 스톤 제작</option>
                                        <option value="기타 문의">기타 문의</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="상품 가입 문의">상품 가입 문의</option>
                                        <option value="상품 계약 진행">상품 계약 진행</option>
                                        <option value="장례 접수 (긴급)">장례 접수 (긴급)</option>
                                        <option value="멤버십/제휴 혜택">멤버십/제휴 혜택</option>
                                        <option value="서비스 선택/변경">서비스 선택/변경</option>
                                        <option value="기타 상담">기타 상담</option>
                                    </>
                                )}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>


                    {/* Pet Specific Fields - Updated Structure */}
                    {isPetCompany && (
                        <div className="space-y-4">
                            {/* 1. Pet Info */}
                            <div className="space-y-3 pt-2">
                                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                                    아이 정보
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">종류</label>
                                        <select
                                            className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} bg-white`}
                                            value={formData.petType}
                                            onChange={e => setFormData({ ...formData, petType: e.target.value })}
                                        >
                                            <option value="강아지">강아지</option>
                                            <option value="고양이">고양이</option>
                                            <option value="소동물">소동물</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">이름</label>
                                        <input
                                            type="text"
                                            placeholder="ex. 몽이"
                                            className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                            value={formData.petName}
                                            onChange={e => setFormData({ ...formData, petName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">몸무게 (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="ex. 3.5"
                                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                        value={formData.weight}
                                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* 2. Reservation Detail */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <span className="w-1 h-3 bg-amber-500 rounded-full"></span>
                                    예약 상세
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">희망 방문 일시</label>
                                    <input
                                        type="datetime-local"
                                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">요청사항</label>
                                    <textarea
                                        placeholder="ex. 픽업 서비스가 필요합니다."
                                        rows={2}
                                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} resize-none`}
                                        value={formData.requests}
                                        onChange={e => setFormData({ ...formData, requests: e.target.value })}
                                    />
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className={`w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500`}
                                            checked={formData.isStone}
                                            onChange={e => setFormData({ ...formData, isStone: e.target.checked })}
                                        />
                                        <span className="text-xs font-bold text-amber-900">메모리얼 스톤(보석) 상담 희망</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {isPhoneMode && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" /> 희망 통화 시간
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['빠른 통화', '오후 12시~2시', '오후 2시~4시', '오후 4시 이후'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, time: t })}
                                        className={`text-xs py-2.5 rounded-lg border font-medium transition-all
                                            ${formData.time === t
                                                ? `border-transparent ${lightBg} ${accentColor}`
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-2 pt-2">
                        <input type="checkbox" id="privacy" required className={`mt-1 w-4 h-4 text-white focus:ring-0 border-gray-300 rounded checked:${themeColor}`} />
                        <label htmlFor="privacy" className="text-xs text-gray-500 leading-tight cursor-pointer">
                            [필수] 개인정보 수집 및 이용에 동의합니다. <br />
                            <span className="text-gray-400 text-[10px]">(수집 목적: 상담 예약 및 안내)</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="p-4 pt-0 mt-auto z-20 bg-white border-t border-gray-100 safe-bottom">
                        <button
                            onClick={handleSubmit}
                            className={`w-full ${isPetCompany ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900 hover:bg-gray-800'} text-white py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2`}
                        >
                            {isPhoneMode ? <Phone size={18} /> : <FileText size={18} />}
                            {isPetCompany ? '예약 신청하기' : (isPhoneMode ? '전화 상담 예약' : '상담 신청하기')}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export const QuickMenuBtn: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }> = ({ icon, label, onClick, active = false }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all active:scale-95
            ${active
                    ? 'bg-[#E6F2F1] text-[#005B50]'
                    : 'bg-white hover:bg-gray-50 text-gray-600'
                }`}
        >
            <div className={`mb-1 ${active ? 'text-[#005B50]' : 'text-gray-400'}`}>
                {icon}
            </div>
            <span className="text-[10px] font-bold tracking-tight">{label}</span>
        </button>
    );
};
