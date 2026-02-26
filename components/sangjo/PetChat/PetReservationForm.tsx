import React, { useState } from 'react';
import { X, CalendarCheck, Loader2, CheckCircle } from 'lucide-react';

interface PetReservationFormProps {
    onClose: () => void;
    companyName: string;
}

const PetReservationForm: React.FC<PetReservationFormProps> = ({ onClose, companyName }) => {
    const [formData, setFormData] = useState({
        guardianName: '',
        phone: '',
        petType: '강아지',
        petName: '',
        weight: '',
        date: '',
        requests: '',
        stone: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 rounded-[32px]">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">예약 신청 완료</h3>
                <p className="text-stone-500 text-center mb-6 text-sm">
                    {formData.petName}의 장례 예약이 접수되었습니다.<br />
                    입력하신 연락처로 담당자가<br />확인 후 10분 내로 연락드리겠습니다.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition"
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300 sm:rounded-[32px]">
            {/* Form Header */}
            <div className="bg-amber-900 text-white p-5 pt-6 shadow-md shrink-0 flex justify-between items-center sm:rounded-t-[32px]">
                <h2 className="font-bold text-lg">장례 예약 신청</h2>
                <button onClick={onClose} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-amber-800 rounded-full">
                    <X className="w-6 h-6 text-amber-200" />
                </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50 scrollbar-hide">
                <form onSubmit={handleSubmit} className="space-y-5 pb-6">

                    {/* 보호자 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            보호자 정보
                        </h3>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">성함</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="홍길동"
                                value={formData.guardianName}
                                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">연락처 (핸드폰)</label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="010-0000-0000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 my-2"></div>

                    {/* 아이 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            아이 정보
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-1.5">종류</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm appearance-none"
                                    value={formData.petType}
                                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                                >
                                    <option value="강아지">강아지</option>
                                    <option value="고양이">고양이</option>
                                    <option value="소동물">소동물 (햄스터/토끼 등)</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-1.5">이름</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                    placeholder="ex. 몽이"
                                    value={formData.petName}
                                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">몸무게 (kg)</label>
                            <input
                                required
                                type="number"
                                step="0.1"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                placeholder="ex. 3.5"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-stone-200 my-2"></div>

                    {/* 예약 정보 그룹 */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                            <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                            예약 상세
                        </h3>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">희망 방문 일시</label>
                            <input
                                required
                                type="datetime-local"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm text-stone-600"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1.5">추가 요청사항 (선택)</label>
                            <textarea
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm resize-none"
                                placeholder="ex. 픽업 서비스가 필요합니다."
                                rows={2}
                                value={formData.requests}
                                onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                checked={formData.stone}
                                onChange={(e) => setFormData({ ...formData, stone: e.target.checked })}
                            />
                            <span className="text-sm font-medium text-amber-900">
                                메모리얼 스톤(보석) 제작 상담 희망
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                            예약 신청하기
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export { PetReservationForm };
