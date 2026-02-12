import React from 'react';
import { Map as MapIcon, Menu, Settings, X, Ticket } from 'lucide-react';
import { ViewState } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { FilterBar } from './FilterBar';

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
      {/* FilterBar */}
      {viewState !== ViewState.MY_PAGE && !isMenuOpen && (
        <div className="absolute top-20 left-0 right-0 z-40 px-4 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="pointer-events-auto">
            <FilterBar />
          </div>
        </div>
      )}

      {/* Header Buttons */}
      <div className={`absolute z-30 flex gap-2 transition-all duration-300 ${
        viewState === ViewState.LIST
          ? 'top-0 left-0 right-0 p-4 bg-white/95 backdrop-blur shadow-sm'
          : 'top-4 left-4 right-4'
      }`}>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="bg-white p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>

        <div className="bg-white rounded-xl shadow-md flex items-center justify-center">
          <NotificationCenter />
        </div>

        {viewState === ViewState.MY_PAGE ? (
          <div className="flex-1 bg-white rounded-xl shadow-md flex items-center justify-center h-12">
            <span className="font-bold text-gray-800">내 정보</span>
          </div>
        ) : (
          <div className="flex-1 h-12" />
        )}

        {viewState === ViewState.LIST && (
          <button
            onClick={() => setViewState(ViewState.MAP)}
            className="bg-white p-3 rounded-xl shadow-md text-primary active:scale-95 transition-transform border border-primary/20"
            title="지도 보기"
          >
            <MapIcon size={20} />
          </button>
        )}

        {viewState === ViewState.MY_PAGE && (
          <button
            onClick={() => setViewState(ViewState.SETTINGS)}
            className="bg-white p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Promo Banner */}
      {showPromo && (viewState === ViewState.MAP || viewState === ViewState.LIST) && (
        <div className="absolute left-4 right-4 z-20 animate-in fade-in slide-in-from-top-2 transition-all duration-300 top-48">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-amber-400 p-3 rounded-xl shadow-xl border border-amber-500/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-1.5 rounded-lg shrink-0">
                <Ticket size={18} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5 leading-none">오직 추모맵에서만</p>
                <p className="text-sm font-bold leading-none">계약 시 5% 할인권 증정 🎁</p>
              </div>
            </div>
            <button
              onClick={() => setShowPromo(false)}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
