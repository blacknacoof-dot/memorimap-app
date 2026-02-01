import { useState } from 'react';
import { X, Clock, MessageSquare, CheckCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    consultationName: string;
    onClose: () => void;
    onConfirm: (data: { expectedTime: string; instruction: string }) => Promise<void>;
}

export const ConsultationActionModal: React.FC<Props> = ({ isOpen, consultationName, onClose, onConfirm }) => {
    const [expectedTime, setExpectedTime] = useState('');
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expectedTime) {
            alert('예상 소요 시간(또는 도착 예정 시간)을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm({ expectedTime, instruction });
            onClose();
        } catch (error) {
            console.error('Confirmation failed:', error);
            alert('처리에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b flex justify-between items-center bg-indigo-50/50">
                    <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                        <CheckCircle size={20} className="text-indigo-600" />
                        상담 접수 승인
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <p className="text-sm text-slate-600">
                            <span className="font-bold text-slate-800">{consultationName}</span> 님의 상담을 접수합니다.<br />
                            고객에게 전달할 안내 사항을 입력해주세요.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            <Clock size={16} className="text-indigo-500" />
                            예상 소요 / 도착 시간 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="예: 30분 이내 도착 예정, 오후 2시까지 방문 요망"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition"
                            value={expectedTime}
                            onChange={(e) => setExpectedTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            <MessageSquare size={16} className="text-indigo-500" />
                            전달 사항 / 준비물 (선택)
                        </label>
                        <textarea
                            placeholder="예: 사망진단서 3부 지참 부탁드립니다. 장례식장 입구에서 연락주세요."
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm min-h-[100px] resize-none transition"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? '처리 중...' : '확인 및 전송'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
