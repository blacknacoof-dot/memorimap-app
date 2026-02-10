import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ViewState } from './types';

// Lazy load all route components
const AdminView = React.lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));
const MyPageView = React.lazy(() => import('./components/MyPageView').then(m => ({ default: m.MyPageView })));
const FacilityAdminView = React.lazy(() => import('./components/dashboard/FacilityAdminDashboard').then(m => ({ default: m.FacilityAdminDashboard })));
const FuneralCompanyView = React.lazy(() => import('./components/FuneralCompanyView').then(m => ({ default: m.FuneralCompanyView })));
const ConsultationView = React.lazy(() => import('./components/Consultation/ConsultationView').then(m => ({ default: m.ConsultationView })));
const ConsultationHistoryView = React.lazy(() => import('./components/Consultation/ConsultationHistoryView').then(m => ({ default: m.ConsultationHistoryView })));
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdmin/SuperAdminDashboard'));
const SubscriptionPlans = React.lazy(() => import('./components/SubscriptionPlans').then(m => ({ default: m.default })));
const PartnerInquiryView = React.lazy(() => import('./components/PartnerInquiryView').then(module => ({ default: module.PartnerInquiryView })));
const ShareJourneyView = React.lazy(() => import('./pages/ShareJourneyView'));
const ExternalBrowserGuidePage = React.lazy(() => import('./src/pages/ExternalBrowserGuidePage').then(m => ({ default: m.ExternalBrowserGuidePage })));

// Static views
const GuideView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.GuideView })));
const NoticesView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.NoticesView })));
const SupportView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.SupportView })));
const SettingsView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.SettingsView })));

const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-gray-400 text-sm">로딩중...</p>
    </div>
  </div>
);

interface AppRoutesProps {
  viewState: ViewState;
  facilities: any[];
  reservations: any[];
  userRole: string;
  userInfo: any;
  isSignedIn: boolean;
  onViewStateChange: (state: ViewState) => void;
  onUpdateReservationStatus: (id: string, status: 'confirmed' | 'cancelled') => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  viewState,
  facilities,
  reservations,
  userRole,
  userInfo,
  isSignedIn,
  onViewStateChange,
  onUpdateReservationStatus
}) => {
  // Admin routes
  if (viewState === ViewState.ADMIN) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminView
          facilities={facilities}
          reservations={reservations}
          onUpdateReservationStatus={onUpdateReservationStatus}
          onExitAdmin={() => onViewStateChange(ViewState.MAP)}
        />
      </Suspense>
    );
  }

  // Note: Other views are handled by viewState in the main App component
  // This component can be extended for URL-based routing if needed
  return null;
};
