import React from 'react';
import { ConsultationFormData } from './types';

interface UrgentFormBodyProps {
    formData: ConsultationFormData;
    setFormData: (data: ConsultationFormData) => void;
    borderColor: string;
    ringColor: string;
    preStepData?: { scale: string; religion: string };
}

export const UrgentFormBody: React.FC<UrgentFormBodyProps> = ({
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
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200">1</span>
                    고인 정보
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">성함</label>
                        <input
                            type="text" placeholder="고인 성함" required
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
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">현재 계신 곳 (출발지)</label>
                    <input
                        type="text" required placeholder="예: 서울 아산병원 응급실, 자택"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.deceasedLocation} onChange={e => setFormData({ ...formData, deceasedLocation: e.target.value, departureLocation: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">사망 원인 (운구 준비용)</label>
                    <input
                        type="text" placeholder="예: 병사, 사고, 자연사 등"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.deathCause} onChange={e => setFormData({ ...formData, deathCause: e.target.value })}
                    />
                </div>
            </div>

            {/* Section 2: Applicant Info */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200">2</span>
                    유가족(신청인) 정보
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
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">관계</label>
                        <input
                            type="text" placeholder="예: 자녀"
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

            {/* Section 3: Transport Info */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200">3</span>
                    운구 및 차량 정보
                </h3>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">운구 차량(앰뷸런스) 필요 여부</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isAmbulanceNeeded: '예' })}
                            className={`flex-1 py-2 text-xs rounded-lg border transition-all ${formData.isAmbulanceNeeded === '예' ? 'bg-red-600 text-white border-red-600 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            🚑 예, 필요합니다
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isAmbulanceNeeded: '아니요' })}
                            className={`flex-1 py-2 text-xs rounded-lg border transition-all ${formData.isAmbulanceNeeded === '아니요' ? 'bg-red-600 text-white border-red-600 font-bold' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            아니요
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 4: Preferences (hidden when preStepData provided) */}
            {!preStepData && (
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100 pb-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200">4</span>
                        장례 희망 사항
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">종교</label>
                            <select
                                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor} bg-white`}
                                value={formData.religion} onChange={e => setFormData({ ...formData, religion: e.target.value })}
                            >
                                <option value="">선택</option>
                                <option value="기독교">기독교</option>
                                <option value="천주교">천주교</option>
                                <option value="불교">불교</option>
                                <option value="무교/기타">무교/기타</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">장지 (화장/매장)</label>
                            <input
                                type="text" placeholder="예: 화장"
                                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                                value={formData.burialMethod} onChange={e => setFormData({ ...formData, burialMethod: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Section 4/5: Emergency Contact */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs border border-red-200">{preStepData ? '4' : '5'}</span>
                    비상 연락망
                </h3>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">가족/친지 비상 연락처</label>
                    <input
                        type="tel" placeholder="010-0000-0000"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${borderColor} focus:ring-1 ${ringColor}`}
                        value={formData.emergencyPhone} onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};
