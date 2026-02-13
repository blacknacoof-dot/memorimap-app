import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface BookingPreStepProps {
    facilityName: string;
    onNext: (data: { scale: string; religion: string }) => void;
    onClose: () => void;
}

const SCALE_OPTIONS = ['소규모', '중규모', '대규모'];
const RELIGION_OPTIONS = ['무교', '기독교', '천주교', '불교'];

const BookingPreStep: React.FC<BookingPreStepProps> = ({ facilityName, onNext, onClose }) => {
    const [scale, setScale] = useState('');
    const [religion, setReligion] = useState('');

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-red-700 text-white p-5 pt-6 shadow-md flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span>🏥</span> {facilityName} 예약
                        </h3>
                        <p className="text-xs text-white/80 mt-1">빈소 규모와 종교를 선택해 주세요.</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-white/80 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Scale */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">빈소 규모</label>
                        <div className="flex gap-2">
                            {SCALE_OPTIONS.map(opt => (
                                <button
                                    key={opt} type="button"
                                    onClick={() => setScale(opt)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${scale === opt
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Religion */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-2 block">종교</label>
                        <div className="flex flex-wrap gap-2">
                            {RELIGION_OPTIONS.map(opt => (
                                <button
                                    key={opt} type="button"
                                    onClick={() => setReligion(opt)}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition-all ${religion === opt
                                        ? 'bg-red-600 border-red-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => onNext({ scale: scale || '미선택', religion: religion || '미선택' })}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        다음 <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPreStep;
