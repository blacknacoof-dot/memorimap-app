import React, { Suspense } from 'react';
import { Facility, Reservation, ViewState, FuneralCompany } from '../types';
import { Consultation } from '../types/consultation';
import MapComponent, { MapRef } from './MapContainer';
import { FacilityList } from './FacilityList';
import { Scale, Crosshair, Database, ArrowLeft, Building2, ShieldAlert, Shield, Loader2, Ticket, X } from 'lucide-react';
import { useSession } from '../lib/auth';
import { canAccessView, getRoleEntryView } from '../lib/rolePolicy';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { analytics } from '../lib/analytics';

// Lazy Load Components
const AdminView = React.lazy(() => import('./AdminView').then(m => ({ default: m.AdminView })));
const MyPageView = React.lazy(() => import('./MyPageView').then(m => ({ default: m.MyPageView })));
const FacilityAdminView = React.lazy(() => import('./dashboard/FacilityAdminDashboard').then(m => ({ default: m.FacilityAdminDashboard })));
const FuneralCompanyView = React.lazy(() => import('./FuneralCompanyView').then(m => ({ default: m.FuneralCompanyView })));
const ConsultationView = React.lazy(() => import('./Consultation/ConsultationView').then(m => ({ default: m.ConsultationView })));
const ConsultationHistoryView = React.lazy(() => import('./Consultation/ConsultationHistoryView').then(m => ({ default: m.ConsultationHistoryView })));
const SuperAdminDashboard = React.lazy(() => import('./SuperAdmin/SuperAdminDashboard'));
const SubscriptionPlans = React.lazy(() => import('./SubscriptionPlans').then(m => ({ default: m.default })));
const SangjoDashboard = React.lazy(() => import('./SangjoDashboard').then(m => ({ default: m.SangjoDashboard })));
const GuideView = React.lazy(() => import('./StaticViews').then(m => ({ default: m.GuideView })));
const NoticesView = React.lazy(() => import('./StaticViews').then(m => ({ default: m.NoticesView })));
const SupportView = React.lazy(() => import('./StaticViews').then(m => ({ default: m.SupportView })));
const SettingsView = React.lazy(() => import('./StaticViews').then(m => ({ default: m.SettingsView })));
const PartnerInquiryView = React.lazy(() => import('./PartnerInquiryView').then(m => ({ default: m.PartnerInquiryView })));
const PersonalSubscriptionPlans = React.lazy(() => import('./PersonalSubscriptionPlans'));
const AdministrativeChecklist = React.lazy(() => import('./AdministrativeChecklist').then(m => ({ default: m.AdministrativeChecklist })));

export const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-gray-400 text-sm">로딩중...</p>
    </div>
  </div>
);

type ToastType = 'success' | 'error' | 'info';

export interface ContentRouterProps {
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  keepMapMounted?: boolean;

  // Map
  mapRef: React.RefObject<MapRef>;
  filteredFacilities: Facility[];
  selectedFacilityId?: string;
  handleFacilitySelect: (f: Facility) => void;
  handleMapBoundsChange: (bounds: { getSouthWest: () => { lat: number; lng: number }; getNorthEast: () => { lat: number; lng: number } }) => void;
  targetMapCenter?: [number, number];
  targetMapZoom?: number;
  userLocation: { lat: number; lng: number; type: string };

  // Comparison
  compareList: Facility[];
  setShowComparison: (v: boolean) => void;
  toggleCompare: (f: Facility) => void;
  sangjoCompareList: FuneralCompany[];
  toggleSangjoCompare: (c: FuneralCompany) => void;
  setShowSangjoComparison: (v: boolean) => void;

  // Data
  facilities: Facility[];
  isDataLoading: boolean;
  showPromo: boolean;
  setShowPromo: (v: boolean) => void;

  // Auth
  isSignedIn: boolean | undefined;
  userInfo: { id: string; name: string; email: string; imageUrl?: string } | null;
  userRole: string | null;
  isLoadingRole: boolean;

  // Reservation
  reservations: Reservation[];
  handleUpdateReservation: (id: string, status: 'confirmed' | 'cancelled') => void;

  // Handlers
  handleReviewDeleted: (facilityId: string, reviewId: string, rating: number) => void;
  handleCompanySelect: (c: FuneralCompany) => void;
  handleLoginClick: () => void;
  showToast: (message: string, type?: ToastType) => void;
  setShowLoginModal: (v: boolean) => void;

  // Consultation
  consultingFacility: Facility | null;
  setConsultingFacility: (f: Facility | null) => void;
  selectedConsultation: Consultation | null;
  setSelectedConsultation: (c: Consultation | null) => void;

  // Admin
  adminFacilityId: string | null;
  setAdminFacilityId: (id: string | null) => void;
  adminSangjoId: string | null;
}

export const ContentRouter: React.FC<ContentRouterProps> = (props) => {
  const {
    viewState, setViewState, keepMapMounted = false,
    mapRef, filteredFacilities, selectedFacilityId, handleFacilitySelect, handleMapBoundsChange,
    targetMapCenter, targetMapZoom, userLocation,
    compareList, setShowComparison, toggleCompare,
    sangjoCompareList, toggleSangjoCompare, setShowSangjoComparison,
    facilities, isDataLoading, showPromo, setShowPromo,
    isSignedIn, userInfo, userRole, isLoadingRole,
    reservations, handleUpdateReservation,
    handleReviewDeleted, handleCompanySelect, handleLoginClick,
    showToast, setShowLoginModal,
    consultingFacility, setConsultingFacility,
    selectedConsultation, setSelectedConsultation,
    adminFacilityId, setAdminFacilityId, adminSangjoId,
  } = props;

  const { session } = useSession();
  const shouldKeepWarmMapMounted =
    keepMapMounted && (viewState === ViewState.MAP || viewState === ViewState.LIST);

  const mapView = (isVisible: boolean) => (
    <>
      <MapComponent
        ref={mapRef}
        facilities={filteredFacilities}
        selectedFacilityId={selectedFacilityId}
        onFacilitySelect={handleFacilitySelect}
        onBoundsChange={handleMapBoundsChange}
        initialCenter={targetMapCenter || [userLocation.lat, userLocation.lng]}
        initialZoom={targetMapZoom || (userLocation.type === 'gps' ? 14 : undefined)}
      />
      {isVisible && (
        <div className="absolute bottom-[4.75rem] left-3 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex flex-col gap-3 pointer-events-auto">
            {compareList.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="bg-white text-gray-800 p-3 rounded-full shadow-lg border-2 border-primary animate-in slide-in-from-bottom-2 flex items-center justify-center relative active:scale-95 transition-transform"
              >
                <Scale size={22} className="text-primary" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {compareList.length}
                </span>
              </button>
            )}
            <button
              className="bg-white p-2.5 rounded-xl shadow-lg text-slate-700 active:scale-95 transition-transform border border-slate-200"
              onClick={() => mapRef.current?.flyToLocation()}
            >
              <Crosshair size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  const promoBanner = showPromo ? (
    <div className="standalone-hide mb-3 md:hidden">
      <div className="bg-white text-slate-700 px-3 py-2.5 md:p-3 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg shrink-0">
            <Ticket size={16} className="md:hidden" />
            <Ticket size={18} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-[11px] text-slate-500 mb-0.5 leading-none">제휴 시설 혜택</p>
            <p className="text-xs md:text-sm font-bold leading-none truncate">상담·예약 전 혜택을 확인하세요</p>
          </div>
        </div>
        <button
          onClick={() => setShowPromo(false)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X size={14} className="md:hidden" />
          <X size={16} className="hidden md:block" />
        </button>
      </div>
    </div>
  ) : null;

  const listView = () => (
    <div className="h-full relative">
      <div className="list-view-shell h-full flex flex-col pt-[6.75rem] md:pt-36 pb-4 bg-slate-50">
        <div className="px-4 shrink-0">
          {promoBanner}
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-extrabold text-xl tracking-tight text-slate-950">추천 시설 목록</h2>
            {isDataLoading && (
              <div className="text-xs text-primary flex items-center gap-1">
                <Database size={12} className="animate-pulse" /> 로딩중...
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-2 md:hidden">내 주변 장례·추모 시설을 찾고 비교하세요</p>
        </div>
        <div className="flex-1 px-3 min-h-0">
          <FacilityList
            facilities={filteredFacilities}
            onSelect={(facility) => {
              if (FEATURE_FLAGS.analytics) {
                analytics.firstInteraction('card');
              }
              handleFacilitySelect(facility);
            }}
            compareList={compareList}
            onToggleCompare={toggleCompare}
          />
        </div>
      </div>
      <div className="absolute bottom-4 right-0 left-0 px-4 pointer-events-none z-30 flex justify-center items-end">
        {compareList.length > 0 && (
          <button
            onClick={() => setShowComparison(true)}
            className="pointer-events-auto absolute right-4 bottom-0 bg-white text-gray-800 p-3 rounded-full shadow-lg border-2 border-primary flex items-center justify-center mb-1 active:scale-95 transition-transform"
          >
            <Scale size={22} className="text-primary" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {compareList.length}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  // ADMIN - separate full-page layout (with role guard)
  if (viewState === ViewState.ADMIN) {
    if (isLoadingRole) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-primary mb-4" size={48} />
          <p className="text-gray-600 font-medium">관리자 권한 확인 중...</p>
        </div>
      );
    }
    if (!isSignedIn || !userRole || !canAccessView(userRole, ViewState.ADMIN)) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
            <p className="text-gray-500 mb-6">관리자 계정으로 로그인해야 합니다.</p>
            <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">메인으로 돌아가기</button>
          </div>
        </div>
      );
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
          <AdminView
            facilities={facilities}
            reservations={reservations}
            onUpdateReservationStatus={handleUpdateReservation}
            onExitAdmin={() => {
              setViewState(ViewState.MAP);
            }}
          />
      </Suspense>
    );
  }

  if (shouldKeepWarmMapMounted) {
    const mapVisible = viewState === ViewState.MAP;

    return (
      <div className="h-full relative bg-gray-50">
        <div
          className={`absolute inset-0 ${mapVisible ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'} transition-opacity duration-200`}
          aria-hidden={!mapVisible}
        >
          {mapView(mapVisible)}
        </div>
        {!mapVisible && (
          <div className="absolute inset-0 z-20 bg-gray-50">
            {listView()}
          </div>
        )}
      </div>
    );
  }

  switch (viewState) {
    case ViewState.MAP:
      return mapView(true);

    case ViewState.LIST:
      return (
        <div className="h-full relative">
          <div className="list-view-shell h-full flex flex-col pt-[6.75rem] md:pt-36 pb-4 bg-slate-50">
            <div className="px-4 shrink-0">
              {promoBanner}
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-extrabold text-xl tracking-tight text-slate-950">추천 시설 목록</h2>
                {isDataLoading && (
                  <div className="text-xs text-primary flex items-center gap-1">
                    <Database size={12} className="animate-pulse" /> 로딩중...
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-2 md:hidden">내 주변 장례·추모 시설을 찾고 비교하세요</p>
            </div>
            <div className="flex-1 px-3 min-h-0">
              <FacilityList
                facilities={filteredFacilities}
                onSelect={(facility) => {
                  if (FEATURE_FLAGS.analytics) {
                    analytics.firstInteraction('card');
                  }
                  handleFacilitySelect(facility);
                }}
                compareList={compareList}
                onToggleCompare={toggleCompare}
              />
            </div>
          </div>
          <div className="absolute bottom-4 right-0 left-0 px-4 pointer-events-none z-30 flex justify-center items-end">
            {compareList.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="pointer-events-auto absolute right-4 bottom-0 bg-white text-gray-800 p-3 rounded-full shadow-lg border-2 border-primary flex items-center justify-center mb-1 active:scale-95 transition-transform"
              >
                <Scale size={22} className="text-primary" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {compareList.length}
                </span>
              </button>
            )}
          </div>
        </div>
      );

    case ViewState.PARTNER_INQUIRY:
      return (
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-full bg-white pb-20 overflow-y-auto">
            <PartnerInquiryView
              onBack={() => { setViewState(ViewState.MAP); }}
              onLoginClick={handleLoginClick}
            />
          </div>
        </Suspense>
      );

    case ViewState.MY_PAGE:
      return (
        <Suspense fallback={<LoadingFallback />}>
          <MyPageView
            isLoggedIn={!!isSignedIn}
            user={userInfo}
            userRole={userRole ?? undefined}
            reservations={reservations}
            facilities={facilities}
            onLoginClick={handleLoginClick}
            onNavigate={setViewState}
            onReviewDeleted={handleReviewDeleted}
            onSelectFacility={handleFacilitySelect}
            onSelectCompany={handleCompanySelect}
          />
        </Suspense>
      );

    case ViewState.ADMIN_CHECKLIST:
      return (
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-full bg-white pt-16 pb-20 overflow-y-auto">
            <div className="px-4 py-4">
              <button onClick={() => setViewState(ViewState.MAP)} className="flex items-center gap-1 text-gray-600 mb-4 text-sm font-medium">
                <ArrowLeft size={18} /> 돌아가기
              </button>
              <AdministrativeChecklist />
            </div>
          </div>
        </Suspense>
      );

    case ViewState.GUIDE:
      return <Suspense fallback={<LoadingFallback />}><GuideView onBack={() => setViewState(ViewState.MAP)} /></Suspense>;
    case ViewState.NOTICES:
      return <Suspense fallback={<LoadingFallback />}><NoticesView onBack={() => setViewState(ViewState.MAP)} /></Suspense>;
    case ViewState.SUPPORT:
      return <Suspense fallback={<LoadingFallback />}><SupportView onBack={() => setViewState(ViewState.MAP)} /></Suspense>;
    case ViewState.SETTINGS:
      return <Suspense fallback={<LoadingFallback />}><SettingsView onBack={() => setViewState(ViewState.MAP)} user={userInfo} /></Suspense>;

    case ViewState.CONSULTATION:
      if (!consultingFacility) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <p className="text-gray-600 mb-4">상담할 시설 정보가 없습니다.</p>
            <button onClick={() => setViewState(ViewState.MAP)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">지도로 돌아가기</button>
          </div>
        );
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <ConsultationView
            facility={consultingFacility}
            existingConsultation={selectedConsultation}
            onBack={() => { setViewState(ViewState.MAP); setConsultingFacility(null); setSelectedConsultation(null); }}
            onOpenHistory={() => setViewState(ViewState.CONSULTATION_HISTORY)}
            onOpenLogin={() => setShowLoginModal(true)}
          />
        </Suspense>
      );

    case ViewState.CONSULTATION_HISTORY:
      return (
        <Suspense fallback={<LoadingFallback />}>
          <ConsultationHistoryView
            facilities={facilities}
            onBack={() => setViewState(ViewState.MY_PAGE)}
            onSelectConsultation={(consultation) => {
              const facility = facilities.find(f => f.id === consultation.facility_id);
              if (facility) {
                setConsultingFacility(facility);
                setSelectedConsultation(consultation);
                setViewState(ViewState.CONSULTATION);
              } else {
                showToast("해당 시설 정보를 찾을 수 없습니다.", 'error');
              }
            }}
          />
        </Suspense>
      );

    case ViewState.FACILITY_ADMIN:
      if (!isSignedIn || !userRole || !canAccessView(userRole, ViewState.FACILITY_ADMIN)) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-600 mb-8 break-keep">
                이 페이지는 <span className="font-bold text-gray-900">승인된 시설 관리자</span>만 접근할 수 있습니다.<br />
                시설 입점을 원하시면 아래 버튼을 눌러 신청해주세요.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setViewState(ViewState.PARTNER_INQUIRY)}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Building2 size={20} />
                  업체 입점 신청하기
                </button>
                <button
                  onClick={() => setViewState(ViewState.MAP)}
                  className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  메인으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-full relative flex flex-col">
            <FacilityAdminView
              user={userInfo}
              facilities={facilities}
              onNavigate={(view, context) => {
                if (context?.facilityId) setAdminFacilityId(context.facilityId);
                setViewState(view);
              }}
            />
          </div>
        </Suspense>
      );

    case ViewState.SUBSCRIPTION_PLANS:
      if (!isSignedIn || !userRole || !canAccessView(userRole, ViewState.SUBSCRIPTION_PLANS)) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-500 mb-6">요금제 화면 접근 권한이 있는 계정으로 로그인해 주세요.</p>
              <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">메인으로 돌아가기</button>
            </div>
          </div>
        );
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-full relative flex flex-col">
            <div className="bg-white p-4 shadow-sm border-b flex items-center gap-3">
              <button
                onClick={() => setViewState(userRole ? getRoleEntryView(userRole) : ViewState.MAP)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-lg">구독 플랜 설정</h1>
            </div>
            <div className="flex-1 overflow-auto">
              <SubscriptionPlans
                facilityId={adminFacilityId ?? undefined}
                type={userRole === 'sangjo_hq_admin' ? 'sangjo' : 'facility'}
                onOpenLogin={() => setShowLoginModal(true)}
                onSelectPlan={() => {
                  // 토스트는 SubscriptionPlans 내부에서 이미 표시
                }}
              />
            </div>
          </div>
        </Suspense>
      );

    case ViewState.PERSONAL_SUBSCRIPTION:
      return (
        <Suspense fallback={<LoadingFallback />}>
          <div className="h-full relative flex flex-col">
            <div className="bg-white p-4 shadow-sm border-b flex items-center gap-3">
              <button
                onClick={() => setViewState(ViewState.MY_PAGE)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-lg">나의 요금제</h1>
            </div>
            <div className="flex-1 overflow-auto">
              <PersonalSubscriptionPlans
                onBack={() => setViewState(ViewState.MY_PAGE)}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            </div>
          </div>
        </Suspense>
      );

    case ViewState.FUNERAL_COMPANIES:
      return (
        <FuneralCompanyView
          onCompanySelect={handleCompanySelect}
          onBack={() => setViewState(ViewState.MAP)}
          compareList={sangjoCompareList}
          onToggleCompare={toggleSangjoCompare}
          onShowComparison={() => setShowSangjoComparison(true)}
          isLoggedIn={!!isSignedIn}
          onOpenLogin={() => setShowLoginModal(true)}
        />
      );

    case ViewState.SANGJO_DASHBOARD:
      if (!isSignedIn || !userRole || !canAccessView(userRole, ViewState.SANGJO_DASHBOARD)) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-500 mb-6">상조 관리자 계정으로 로그인해야 합니다.</p>
              <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">메인으로 돌아가기</button>
            </div>
          </div>
        );
      }
      if (!adminSangjoId) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="text-yellow-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">상조 정보를 불러오는 중...</h2>
              <p className="text-gray-500 mb-6">연결된 상조 회사가 없을 수 있습니다. 관리자에게 문의해주세요.</p>
              <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">메인으로 돌아가기</button>
            </div>
          </div>
        );
      }
      return (
        <Suspense fallback={<LoadingFallback />}>
          <SangjoDashboard
            sangjoId={adminSangjoId}
            onBack={() => setViewState(ViewState.MAP)}
          />
        </Suspense>
      );

    case ViewState.SUPER_ADMIN:
      if (isLoadingRole) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-gray-600 font-medium">관리자 권한 확인 중...</p>
          </div>
        );
      }
      if (!isSignedIn || !userInfo) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-4">관리자 로그인 필요</h2>
            <p className="mb-6 text-gray-600">슈퍼 관리자 페이지에 접근하려면 로그인이 필요합니다.</p>
            <button onClick={() => setShowLoginModal(true)} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">로그인하기</button>
            <button onClick={() => setViewState(ViewState.MAP)} className="mt-4 text-gray-500 underline text-sm">메인으로 돌아가기</button>
          </div>
        );
      }
      if (!userRole || !canAccessView(userRole, ViewState.SUPER_ADMIN)) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4" data-testid="access-denied-super-admin">
            <Shield className="text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2 text-red-600">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-6">오직 승인된 슈퍼관리자만 접근할 수 있습니다.</p>
            <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">메인으로 돌아가기</button>
          </div>
        );
      }
      return (
        <div className="h-[100dvh] overflow-auto">
          <SuperAdminDashboard onBack={() => setViewState(ViewState.MAP)} />
        </div>
      );

    default:
      setViewState(ViewState.MAP);
      return null;
  }
};
