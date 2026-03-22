import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteStateSync } from './RouteStateSync';
import { ConfirmModal, PromptModal } from '../src/components/common/ConfirmModal';
import { ViewState } from '../types';
import { AppRouteLayout as RouteLayoutType } from '../lib/appRouteConfig';
import { ExternalBrowserGuidePage } from '../src/pages/ExternalBrowserGuidePage';
import ShareJourneyView from '../pages/ShareJourneyView';

interface AppRouteLayoutProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  setShowLoginModal: (open: boolean) => void;
  routeLayout: RouteLayoutType;
  onLayoutChange: (layout: RouteLayoutType) => void;
  isLoaded: boolean;
  isInApp: boolean;
  adminContent: React.ReactNode;
  mainContent: React.ReactNode;
}

export const AppRouteLayout: React.FC<AppRouteLayoutProps> = ({
  viewState,
  setViewState,
  setShowLoginModal,
  routeLayout,
  onLayoutChange,
  isLoaded,
  isInApp,
  adminContent,
  mainContent,
}) => {
  if (viewState === ViewState.ADMIN || viewState === ViewState.SUPER_ADMIN) {
    return (
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteStateSync
          viewState={viewState}
          setViewState={setViewState}
          setShowLoginModal={setShowLoginModal}
          onLayoutChange={onLayoutChange}
        />
        <ErrorBoundary>{adminContent}</ErrorBoundary>
        <ConfirmModal />
        <PromptModal />
        <Toaster richColors position="bottom-center" closeButton />
      </HashRouter>
    );
  }

  if (isInApp && routeLayout !== 'external-guide') {
    return <ExternalBrowserGuidePage />;
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (routeLayout === 'share') {
    return (
      <ErrorBoundary>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <RouteStateSync
            viewState={viewState}
            setViewState={setViewState}
            setShowLoginModal={setShowLoginModal}
            onLayoutChange={onLayoutChange}
          />
          <Routes>
            <Route path="/share/:token" element={<ShareJourneyView />} />
          </Routes>
        </HashRouter>
      </ErrorBoundary>
    );
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouteStateSync
        viewState={viewState}
        setViewState={setViewState}
        setShowLoginModal={setShowLoginModal}
        onLayoutChange={onLayoutChange}
      />
      <ErrorBoundary>{mainContent}</ErrorBoundary>
    </HashRouter>
  );
};
