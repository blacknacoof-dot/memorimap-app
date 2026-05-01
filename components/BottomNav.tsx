import React, { useRef, useCallback } from 'react';
import { Map as MapIcon, List, User, Award } from 'lucide-react';
import { ViewState } from '../types';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { analytics } from '../lib/analytics';

interface BottomNavProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
}

const VISIBLE_VIEWS = new Set<ViewState>([
  ViewState.MAP, ViewState.LIST, ViewState.MY_PAGE,
  ViewState.SETTINGS, ViewState.GUIDE, ViewState.FUNERAL_COMPANIES,
]);

const NAV_ITEMS = [
  { view: ViewState.MAP, icon: MapIcon, label: '지도' },
  { view: ViewState.LIST, icon: List, label: '목록' },
  { view: ViewState.FUNERAL_COMPANIES, icon: Award, label: '상조' },
  { view: ViewState.MY_PAGE, icon: User, label: '내 정보' },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ viewState, setViewState }) => {
  const firstInteractionFired = useRef(false);

  const handleTabClick = useCallback((targetView: ViewState) => {
    if (FEATURE_FLAGS.analytics) {
      analytics.tabSwitch(viewState, targetView);
      if (!firstInteractionFired.current) {
        firstInteractionFired.current = true;
        analytics.firstInteraction('tab');
      }
    }
    setViewState(targetView);
  }, [viewState, setViewState]);

  if (!VISIBLE_VIEWS.has(viewState)) return null;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-1.5 pb-safe" data-debug="bottom-nav">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => handleTabClick(view)}
            data-testid={`bottom-nav-${String(view).toLowerCase()}`}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] ${viewState === view ? 'text-primary' : 'text-gray-400'}`}
          >
            <Icon size={22} strokeWidth={viewState === view ? 2.5 : 2} />
            <span className="text-[11px] mt-0.5 font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
