import React from 'react';
import {
    AlertTriangle, MessageCircle, X,
} from 'lucide-react';

interface SOSEmergencyModeProps {
    onClose: () => void;
    onOpenChat?: (intent: 'funeral_home') => void;
}

export const SOSEmergencyMode: React.FC<SOSEmergencyModeProps> = ({
    onClose, onOpenChat,
}) => {
    return (
        <div className="fixed inset-0 z-[250] bg-white overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 z-10 bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <h1 className="text-base font-black">긴급 장례 안내</h1>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-700 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="px-4 py-5 space-y-5 pb-24">
                {/* 마음이 AI 긴급 상담 */}
                {onOpenChat && (
                    <section>
                        <button
                            onClick={() => onOpenChat('funeral_home')}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            마음이 AI 긴급 상담 시작
                        </button>
                    </section>
                )}

                {/* 면책 조항 */}
                <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-4">
                    본 서비스는 정보 제공 목적이며, 의료/법률 자문을 대체하지 않습니다.<br />
                    응급 상황 시 119에 먼저 연락해주세요.
                </p>
            </div>
        </div>
    );
};
