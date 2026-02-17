import React from 'react';
import { Menu, Settings, X, Ticket } from 'lucide-react';
import { ViewState } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { FilterBar } from './FilterBar';
import { SmartSearchInput } from './AI/SmartSearchInput';

interface TopBarProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  showPromo: boolean;
  setShowPromo: (v: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewState, setViewState, isMenuOpen, setIsMenuOpen, showPromo, setShowPromo,
}) => {
  const isMainView = viewState === ViewState.MAP || viewState === ViewState.LIST || viewState === ViewState.MY_PAGE;
  if (!isMainView) return null;

  return (
    <>
      {/* Header — 검색창 통합 레이아웃 */}
      <div className={`absolute z-30 flex items-center gap-1.5 md:gap-2 transition-all duration-300 ${
        viewState === ViewState.LIST
          ? 'top-0 left-0 right-0 p-2 md:p-4 bg-white/95 backdrop-blur shadow-sm'
          : 'top-2 left-3 right-3 md:top-4 md:left-4 md:right-4'
      }`}>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="bg-white p-2.5 md:p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform shrink-0"
        >
          <Menu size={18} className="md:hidden" />
          <Menu size={20} className="hidden md:block" />
        </button>

        {viewState === ViewState.MY_PAGE ? (
          <div className="flex-1 bg-white rounded-xl shadow-md flex items-center justify-center h-10 md:h-12">
            <span className="font-bold text-gray-800 text-sm md:text-base">내 정보</span>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <SmartSearchInput compact />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md flex items-center justify-center shrink-0">
          <NotificationCenter />
        </div>

        {viewState === ViewState.MY_PAGE && (
          <button
            onClick={() => setViewState(ViewState.SETTINGS)}
            className="bg-white p-2.5 md:p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform shrink-0"
          >
            <Settings size={18} className="md:hidden" />
            <Settings size={20} className="hidden md:block" />
          </button>
        )}
      </div>

      {/* FilterBar (카테고리만) — 검색창 아래 */}
      {viewState !== ViewState.MY_PAGE && !isMenuOpen && (
        <div className="absolute top-14 md:top-18 left-0 right-0 z-40 px-3 md:px-4 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="pointer-events-auto">
            <FilterBar />
          </div>
        </div>
      )}

      {/* Promo Banner — 모바일: 컴팩트, 데스크톱: 기존 유지 */}
      {showPromo && (viewState === ViewState.MAP || viewState === ViewState.LIST) && (
        <div className="absolute left-3 right-3 md:left-4 md:right-4 z-20 animate-in fade-in slide-in-from-top-2 transition-all duration-300 top-[6.5rem] md:top-[7.5rem]">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-amber-400 p-2.5 md:p-3 rounded-xl shadow-xl border border-amber-500/30 flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-amber-500/20 p-1 md:p-1.5 rounded-lg shrink-0">
                <Ticket size={16} className="md:hidden" />
                <Ticket size={18} className="hidden md:block" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] text-gray-400 mb-0.5 leading-none">오직 추모맵에서만</p>
                <p className="text-xs md:text-sm font-bold leading-none">계약 시 5% 할인권 증정 🎁</p>
              </div>
            </div>
            <button
              onClick={() => setShowPromo(false)}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <X size={14} className="md:hidden" />
              <X size={16} className="hidden md:block" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
