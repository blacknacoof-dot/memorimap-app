import React from 'react';
import { ConsultationFormData } from './types';

interface MemorialFormBodyProps {
    formData: ConsultationFormData;
    setFormData: (data: ConsultationFormData) => void;
    borderColor: string;
    ringColor: string;
    preStepData?: { scale: string; religion: string };
}

export const MemorialFormBody: React.FC<MemorialFormBodyProps> = ({
    formData,
    setFormData,
    borderColor,
    ringColor,
    preStepData,
}) => {
    return (
        <div className="space-y-5">
            {/* Section 1: Deceased Info */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs border border-emerald-200">1</span>
                    고인 정보
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">고인 성함</label>
                        <input
                            type="text" placeholder="성함" required
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                            value={formData.deceasedName} onChange={e => setFormData({ ...formData, deceasedName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">성별</label>
                        <select
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} bg-white`}
                            value={formData.deceasedGender} onChange={e => setFormData({ ...formData, deceasedGender: e.target.value })}
                        >
                            <option value="남성">남성</option>
                            <option value="여성">여성</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">사망일 (또는 예정일)</label>
                    <input
                        type="date"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.deathDate} onChange={e => setFormData({ ...formData, deathDate: e.target.value })}
                    />
                </div>
            </div>

            {/* Section 2: Memorial Type */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs border border-emerald-200">2</span>
                    안치 유형 선택
                </h3>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: '봉안당', icon: '⛩️' },
                        { id: '수목장', icon: '🌳' },
                        { id: '공원묘지', icon: '🏞️' },
                        { id: '해양장', icon: '🌊' },
                    ].map(opt => (
                        <button
                            key={opt.id} type="button"
                            onClick={() => setFormData({ ...formData, memorialType: opt.id })}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${formData.memorialType === opt.id
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                                }`}
                        >
                            <span className="text-base">{opt.icon}</span>
                            {opt.id}
                        </button>
                    ))}
                </div>
                <div className={`grid ${preStepData?.religion ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">유골함 수량</label>
                        <select
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} bg-white`}
                            value={formData.urnCount} onChange={e => setFormData({ ...formData, urnCount: e.target.value })}
                        >
                            <option value="1기">1기</option>
                            <option value="2기">2기 (부부)</option>
                            <option value="3기">3기</option>
                            <option value="4기">4기</option>
                            <option value="5기 이상">5기 이상 (가족)</option>
                        </select>
                    </div>
                    {!preStepData?.religion && (
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">종교</label>
                        <select
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} bg-white`}
                            value={formData.religion} onChange={e => setFormData({ ...formData, religion: e.target.value })}
                        >
                            <option value="">선택 안함</option>
                            <option value="기독교">기독교</option>
                            <option value="천주교">천주교</option>
                            <option value="불교">불교</option>
                            <option value="무교/기타">무교/기타</option>
                        </select>
                    </div>
                    )}
                </div>
            </div>

            {/* Section 3: Applicant Info */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs border border-emerald-200">3</span>
                    신청인 정보
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">성함</label>
                        <input
                            type="text" placeholder="성함" required
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">고인과의 관계</label>
                        <input
                            type="text" placeholder="예: 자녀, 배우자"
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                            value={formData.relation} onChange={e => setFormData({ ...formData, relation: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">연락처</label>
                    <input
                        type="tel" placeholder="010-0000-0000" required
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            </div>

            {/* Section 4: Preferences */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs border border-emerald-200">4</span>
                    희망 사항
                </h3>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">희망 방문일</label>
                    <input
                        type="date"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.visitDate} onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">예산 범위</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['~300만원', '~500만원', '~1,000만원', '1,000만원~'].map(b => (
                            <button
                                key={b} type="button"
                                onClick={() => setFormData({ ...formData, memorialBudget: b })}
                                className={`py-2 text-xs rounded-lg border font-bold transition-all ${formData.memorialBudget === b
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                                    }`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">요청사항</label>
                    <textarea
                        placeholder="추가 요청사항이 있으면 입력해 주세요."
                        rows={2}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} resize-none`}
                        value={formData.requests} onChange={e => setFormData({ ...formData, requests: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};
