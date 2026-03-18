import React from 'react';
import { X, Crown, TrendingUp } from 'lucide-react';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  current: number;
  limit: number;
  onNavigateToPlan?: () => void;
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  featureName,
  current,
  limit,
  onNavigateToPlan,
}: UpgradePromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* Header */}
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Crown size={16} className="text-amber-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">이용 한도 도달</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-center">
          <div className="mb-4">
            <p className="text-sm text-gray-700 font-medium mb-2">{featureName}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <TrendingUp size={14} className="text-amber-500" />
              <span>이번 달 <strong className="text-gray-900">{current}</strong> / {limit}회 사용</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-red-400 rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>

          <p className="text-xs text-gray-500 mb-5">
            무료 플랜의 월간 이용 한도에 도달했습니다.<br />
            베이직 이상 플랜으로 업그레이드하시면 더 많이 이용할 수 있습니다.
          </p>

          {/* CTA */}
          <button
            onClick={() => {
              onNavigateToPlan?.();
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            플랜 업그레이드
          </button>
        </div>
      </div>
    </div>
  );
}
