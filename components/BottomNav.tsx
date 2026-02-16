import React from 'react';
import { Map as MapIcon, List, User, Award } from 'lucide-react';
import { ViewState } from '../types';

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
  if (!VISIBLE_VIEWS.has(viewState)) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-1.5 flex justify-around items-center z-[200] pb-safe">
      {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => setViewState(view)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] ${viewState === view ? 'text-primary' : 'text-gray-400'}`}
        >
          <Icon size={22} strokeWidth={viewState === view ? 2.5 : 2} />
          <span className="text-[11px] mt-0.5 font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};
