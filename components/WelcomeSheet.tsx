import React, { useEffect, useCallback, useRef } from 'react';
import { MapPin, Award, Phone } from 'lucide-react';
import { markWelcomeSeen } from '../src/utils/onboarding';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { analytics } from '../lib/analytics';

interface WelcomeSheetProps {
  onNavigateList: () => void;
  onNavigateSangjo: () => void;
  onNavigateSOS: () => void;
  onClose: () => void;
}

const CTA_ITEMS = [
  { key: 'nearby_facilities', icon: MapPin, label: '주변 시설 보기', action: 'onNavigateList' },
  { key: 'sangjo_compare', icon: Award, label: '상조 비교하기', action: 'onNavigateSangjo' },
  { key: 'sos_consult', icon: Phone, label: '급할 때 바로 상담', action: 'onNavigateSOS' },
] as const;

type ActionKey = typeof CTA_ITEMS[number]['action'];

export const WelcomeSheet: React.FC<WelcomeSheetProps> = ({
  onNavigateList,
  onNavigateSangjo,
  onNavigateSOS,
  onClose,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstInteractionFired = useRef(false);

  const actionMap: Record<ActionKey, () => void> = {
    onNavigateList,
    onNavigateSangjo,
    onNavigateSOS,
  };

  const handleClose = useCallback(() => {
    markWelcomeSeen();
    onClose();
  }, [onClose]);

  const handleCtaClick = useCallback((ctaKey: string, actionKey: ActionKey) => {
    markWelcomeSeen();
    if (FEATURE_FLAGS.analytics) {
      analytics.ctaClick(ctaKey, 'welcome_sheet');
      if (!firstInteractionFired.current) {
        firstInteractionFired.current = true;
        analytics.firstInteraction('cta');
      }
    }
    actionMap[actionKey]();
  }, [actionMap]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // 배경 클릭으로 닫기
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      data-debug="welcome-sheet"
      aria-label="추모맵 시작하기"
    >
      {/* 반투명 배경 - 앱 맥락 유지 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 하프시트 */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl animate-slide-up"
        style={{ maxHeight: '55vh' }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 pb-8 pt-2">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            주변 장례·추모 시설을<br />빠르게 찾고 비교하세요
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            장례식장, 봉안당, 자연장, 상조를 한곳에서 확인할 수 있습니다
          </p>

          {/* CTA 버튼 3개 */}
          <div className="flex flex-col gap-3">
            {CTA_ITEMS.map(({ key, icon: Icon, label, action }) => (
              <button
                key={key}
                onClick={() => handleCtaClick(key, action)}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="text-[15px] font-medium text-gray-800">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
