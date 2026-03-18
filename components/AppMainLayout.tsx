import React, { Suspense } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Toaster } from 'sonner';
import { ViewState } from '../types';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { ContentRouter, ContentRouterProps, LoadingFallback } from './ContentRouter';
import { ModalContainer, ModalContainerProps } from './ModalContainer';
import { SOSEmergencyMode } from './SOSEmergencyMode';

type ToastPayload = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

interface AppMainLayoutProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  showPromo: boolean;
  setShowPromo: (open: boolean) => void;
  showSOS: boolean;
  setShowSOS: (open: boolean) => void;
  onOpenSOSChat: () => void;
  onBottomNavChange: (view: ViewState) => void;
  roleError: string | null;
  onClearRoleError: () => void;
  toast: ToastPayload;
  compareListCount: number;
  onOpenComparison: () => void;
  contentRouterProps: ContentRouterProps;
  modalContainerProps: ModalContainerProps;
}

export const AppMainLayout: React.FC<AppMainLayoutProps> = ({
  viewState,
  setViewState,
  isMenuOpen,
  setIsMenuOpen,
  showPromo,
  setShowPromo,
  showSOS,
  setShowSOS,
  onOpenSOSChat,
  onBottomNavChange,
  roleError,
  onClearRoleError,
  toast,
  compareListCount,
  onOpenComparison,
  contentRouterProps,
  modalContainerProps,
}) => {
  return (
    <div className="app-mobile-shell h-full w-full relative bg-gray-100 flex justify-center overflow-hidden">
      <div className="w-full h-full md:max-w-md bg-white relative shadow-2xl flex flex-col">
        {roleError && import.meta.env.DEV && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-sm">역할 조회 오류</h3>
              <p className="text-red-600 text-[10px] mt-1 break-all">{roleError}</p>
            </div>
            <button onClick={onClearRoleError} className="text-red-400 hover:text-red-600"><X size={16} /></button>
          </div>
        )}

        <TopBar
          viewState={viewState}
          setViewState={setViewState}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          showPromo={showPromo}
          setShowPromo={setShowPromo}
          onSOS={() => setShowSOS(true)}
        />

        {showSOS && (
          <SOSEmergencyMode
            onClose={() => setShowSOS(false)}
            onOpenChat={() => {
              setShowSOS(false);
              setViewState(ViewState.MAP);
              onOpenSOSChat();
            }}
          />
        )}

        <div className="flex-1 relative overflow-hidden">
          <Suspense fallback={<LoadingFallback />}>
            <ContentRouter {...contentRouterProps} />
          </Suspense>
        </div>

        <BottomNav viewState={viewState} setViewState={onBottomNavChange} />

        {toast && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full px-4 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
            <div className={`bg-gray-900/90 text-white px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm flex items-center justify-between gap-3 ${
              toast.type === 'error' ? 'bg-red-900/90' : toast.type === 'info' ? 'bg-blue-900/90' : 'bg-gray-900/90'
            }`}>
              <span className="text-sm font-medium">{toast.message}</span>
              {compareListCount > 0 && toast.message.includes('비교') && (
                <button
                  onClick={onOpenComparison}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white font-bold pointer-events-auto"
                >
                  비교하기
                </button>
              )}
            </div>
          </div>
        )}

        <Toaster richColors position="bottom-center" closeButton />

        <ModalContainer {...modalContainerProps} />
      </div>
    </div>
  );
};
