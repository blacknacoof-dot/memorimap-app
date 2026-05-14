import React, { useState, useEffect, Suspense } from 'react';
import { MapRef } from './components/MapContainer';
import { Facility, ViewState } from './types';
import { Consultation } from './types/consultation';
import { ConfirmModal, PromptModal } from './src/components/common/ConfirmModal';
import { useUser, useClerk, useSession } from './lib/auth';
import { useProfileSync } from './hooks/useProfileSync';
import { useLocation } from './hooks/useLocation';
import { useFilterStore } from './stores/useFilterStore';
import { useToast } from './hooks/useToast';
import { useComparison } from './hooks/useComparison';
import { useReservations } from './hooks/useReservations';
import { useFacilityData } from './hooks/useFacilityData';
import { useMapViewport } from './hooks/useMapViewport';
import { useUserRole } from './hooks/useUserRole';
import { useReviews } from './hooks/useReviews';
import { useCompanySelect } from './hooks/useCompanySelect';
import { isInAppBrowser } from './src/utils/browserDetection';
import { isMobileViewport } from './src/utils/device';
import { FEATURE_FLAGS } from './config/featureFlags';
import { analytics } from './lib/analytics';
import { hasSeenWelcome } from './src/utils/onboarding';
import { WelcomeSheet } from './components/WelcomeSheet';

// Phase 4-4/4-5 Components
import { ContentRouter, ContentRouterProps, LoadingFallback } from './components/ContentRouter';
import { ModalContainerProps } from './components/ModalContainer';
import { AppMainLayout } from './components/AppMainLayout';
import { AppRouteLayout } from './components/AppRouteLayout';
import { useChatStore } from './stores/useChatStore';
import { AppRouteLayout as RouteLayoutType, getInitialLayoutFromHash, resolveLegacyPathToHashUrl } from './lib/appRouteConfig';

const App: React.FC = () => {
  useProfileSync();
  const openChat = useChatStore(s => s.openChat);
  const isNativeAppRuntime = () =>
    typeof document !== 'undefined' && document.body.classList.contains('native-app');

  const mapRef = React.useRef<MapRef>(null);
  // Bootstrap refs: keep the map warmed from first mobile render and allow only one automatic list handoff.
  const startedFromBootstrapMapRef = React.useRef(false);
  const hasInitialViewportDataRef = React.useRef(false);
  const hasAutoSwitchedToListRef = React.useRef(false);
  const userInteractedWithViewToggleRef = React.useRef(false);
  const { location: userLocation, getCurrentPosition } = useLocation();
  const [shouldKeepMapMounted] = useState(() =>
    FEATURE_FLAGS.mobileListDefault && isMobileViewport()
  );
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (isNativeAppRuntime()) {
      return ViewState.MAP;
    }
    if (FEATURE_FLAGS.mobileListDefault) {
      if (shouldKeepMapMounted) {
        startedFromBootstrapMapRef.current = true;
      }
      return ViewState.LIST;
    }
    if (isMobileViewport()) {
      startedFromBootstrapMapRef.current = true;
    }
    return ViewState.MAP; // 기존 로직 보존 (fallback)
  });
  const { toast, showToast } = useToast();

  // Facility Data Hook
  const {
    facilities, setFacilities,
    selectedFacility, setSelectedFacility,
    isDataLoading, filteredFacilities,
    fetchFacilityDetails: _fetchFacilityDetails, handleFacilitySelect,
    setCurrentBounds, viewportFetchStartedRef, viewportFetchedRef,
  } = useFacilityData({
    viewState,
    showToast,
    disableInitialFetch: viewState !== ViewState.LIST,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() =>
    FEATURE_FLAGS.mobileWelcomeSheet && !hasSeenWelcome()
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [routeLayout, setRouteLayout] = useState<RouteLayoutType>(() => getInitialLayoutFromHash(window.location.hash));
  const _setSearchQuery = useFilterStore(state => state.setSearchQuery);

  // Consultation State
  const [consultingFacility, setConsultingFacility] = useState<Facility | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Funeral Company Hook
  const {
    selectedFuneralCompany, setSelectedFuneralCompany,
    showSangjoAIConsult, setShowSangjoAIConsult,
    showSangjoContract, setShowSangjoContract,
    handleCompanySelect,
  } = useCompanySelect({ facilities });

  // Comparison
  const {
    compareList, showComparison, setShowComparison, toggleCompare, removeFromCompare,
    sangjoCompareList, showSangjoComparison, setShowSangjoComparison,
    toggleSangjoCompare, removeFromSangjoCompare,
  } = useComparison(showToast);

  const [aiChatFacility, setAiChatFacility] = useState<Facility | null>(null);
  const [isUrgentBooking, setIsUrgentBooking] = useState(false);

  // Auth
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { session } = useSession();

  const [initialChatIntent, setInitialChatIntent] = useState<'funeral_home' | 'memorial_facility' | 'pet_funeral' | null>(null);
  const [handoverContext, setHandoverContext] = useState<Record<string, unknown> | string | null>(null);
  // User-driven view changes opt out of the one-time bootstrap auto-switch.
  const handleChangeView = React.useCallback((nextView: ViewState) => {
    userInteractedWithViewToggleRef.current = true;
    setViewState(nextView);
  }, []);

  // Map Viewport Hook — 뷰포트 fetch 시 viewportFetchedRef 플래그 설정
  const setFacilitiesFromViewport = React.useCallback((data: Facility[] | ((prev: Facility[]) => Facility[])) => {
    viewportFetchedRef.current = true;
    setFacilities(data);
    if (!Array.isArray(data) || data.length === 0) return;

    // First successful viewport payload completes the bootstrap flow.
    hasInitialViewportDataRef.current = true;

    if (
      startedFromBootstrapMapRef.current &&
      !hasAutoSwitchedToListRef.current &&
      !userInteractedWithViewToggleRef.current
    ) {
      hasAutoSwitchedToListRef.current = true;
      setViewState(ViewState.LIST);
    }
  }, [setFacilities, viewportFetchedRef]);
  const {
    targetMapCenter, setTargetMapCenter,
    targetMapZoom, setTargetMapZoom,
    handleMapBoundsChange,
  } = useMapViewport({
    setFacilities: setFacilitiesFromViewport,
    setCurrentBounds,
    session,
    onViewportFetchStart: () => {
      viewportFetchStartedRef.current = true;
    },
  });

  // Reservations
  const {
    reservations, setReservations: _setReservations,
    handleBookingConfirm, handleCreatePendingReservation, handleFinalizePendingReservation, handleCleanupPendingReservation, handleUpdateReservation,
    isBooking, setIsBooking,
  } = useReservations(isSignedIn || false, user, showToast, setShowLoginModal, setSelectedFacility, setViewState);

  const userInfo = React.useMemo(() => {
    if (!user) return null;

    const email = user.primaryEmailAddress?.emailAddress || '';
    const emailLocalPart = email.split('@')[0] || '';
    const safeUsername = user.username && !user.username.includes('@') ? user.username : '';
    const displayName =
      user.fullName?.trim() ||
      user.firstName?.trim() ||
      safeUsername ||
      emailLocalPart ||
      '회원';

    return {
      id: user.id,
      name: displayName,
      email,
      imageUrl: user.imageUrl,
    };
  }, [user]);

  useEffect(() => { getCurrentPosition(); }, [getCurrentPosition]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleOpenConsultationView = (event: Event) => {
      const detail = (event as CustomEvent<{ facilityId?: string; consultation?: Consultation | null }>).detail;
      const facilityId = detail?.facilityId;
      if (!facilityId) return;

      const targetFacility = facilities.find(f => String(f.id) === String(facilityId));
      if (!targetFacility) return;

      setSelectedFacility(null);
      setAiChatFacility(null);
      setSelectedConsultation(detail?.consultation ?? null);
      setConsultingFacility(targetFacility);
      setViewState(ViewState.CONSULTATION);
    };

    window.addEventListener('e2e-open-consultation-view', handleOpenConsultationView as EventListener);
    return () => {
      window.removeEventListener('e2e-open-consultation-view', handleOpenConsultationView as EventListener);
    };
  }, [facilities]);

  // Phase 0: 온보딩 계측 — screenView + bounce
  useEffect(() => {
    if (!FEATURE_FLAGS.analytics) return;
    const device = isMobileViewport() ? 'mobile' : 'desktop';
    const isFirstVisit = !localStorage.getItem('memorimap_visited');
    analytics.screenView(viewState, device, isFirstVisit);
    if (isFirstVisit) {
      localStorage.setItem('memorimap_visited', 'true');
    }

    // bounce: 10초 후 상호작용 없으면 기록
    let interacted = false;
    const onInteract = () => { interacted = true; };
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('scroll', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });
    const bounceTimer = setTimeout(() => {
      if (!interacted) {
        analytics.bounce(viewState, device);
      }
    }, 10_000);
    return () => {
      clearTimeout(bounceTimer);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 1회만

  // Legacy path entry canonicalization: /foo -> /#/foo
  useEffect(() => {
    if (window.location.hash) return;
    const canonicalHashUrl = resolveLegacyPathToHashUrl(window.location.pathname, window.location.search);
    if (!canonicalHashUrl) return;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== canonicalHashUrl) {
      window.history.replaceState(null, '', canonicalHashUrl);
    }
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => setShowLoginModal(true);
    window.addEventListener('open-login-modal', handleOpenLogin);
    return () => {
      window.removeEventListener('open-login-modal', handleOpenLogin);
    };
  }, []);

  // User Role Hook
  const {
    userRole, roleError, setRoleError, isLoadingRole,
    adminFacilityId, setAdminFacilityId, adminSangjoId, sangjoOrgType: _sangjoOrgType,
  } = useUserRole({ isSignedIn, userInfo, viewState, setViewState, showToast });

  // Reviews Hook
  const { handleAddReview, handleReviewDeleted } = useReviews({
    userId: user?.id,
    userName: userInfo?.name || '익명',
    setFacilities, selectedFacility, setSelectedFacility, showToast,
  });

  // Handlers
  const handleLoginClick = () => { setIsMenuOpen(false); setShowLoginModal(true); };
  const handleLogout = async () => {
    try {
      await signOut();
      showToast('로그아웃되었습니다.', 'info');
      return;
    } catch {
      showToast('로그아웃 처리 중 오류가 발생했습니다.', 'error');
      return;
    } finally {
      handleChangeView(ViewState.MAP);
    }
  };
  const handleBottomNavChange = (view: ViewState) => {
    if (view === ViewState.LIST) {
      const latestBounds = mapRef.current?.getBounds();
      if (latestBounds) {
        setCurrentBounds(latestBounds);
      }
    }
    setSelectedFacility(null);
    setShowComparison(false);
    setSelectedFuneralCompany(null);
    setShowSangjoAIConsult(false);
    setShowSangjoContract(false);
    setShowSangjoComparison(false);
    setAiChatFacility(null);
    setInitialChatIntent(null);
    setIsBooking(false);
    setIsMenuOpen(false);
    setShowLoginModal(false);
    setShowSignUpModal(false);
    handleChangeView(view);
  };
  const handleViewOnMap = () => {
    if (selectedFacility) {
      setTargetMapCenter([selectedFacility.lat || 0, selectedFacility.lng || 0]);
      setTargetMapZoom(16);
      setSelectedFacility(null);
    }
    handleChangeView(ViewState.MAP);
  };

  const isInApp = isInAppBrowser();

  const contentRouterProps: ContentRouterProps = {
    viewState,
    setViewState: handleChangeView,
    keepMapMounted: shouldKeepMapMounted,
    mapRef,
    filteredFacilities,
    selectedFacilityId: selectedFacility?.id,
    handleFacilitySelect,
    handleMapBoundsChange,
    targetMapCenter,
    targetMapZoom,
    userLocation,
    compareList,
    setShowComparison,
    toggleCompare,
    sangjoCompareList,
    toggleSangjoCompare,
    setShowSangjoComparison,
    facilities,
    isDataLoading,
    showPromo,
    setShowPromo,
    isSignedIn,
    userInfo,
    userRole,
    isLoadingRole,
    reservations,
    handleUpdateReservation,
    handleReviewDeleted,
    handleCompanySelect,
    handleLoginClick,
    showToast,
    setShowLoginModal,
    consultingFacility,
    setConsultingFacility,
    selectedConsultation,
    setSelectedConsultation,
    adminFacilityId,
    setAdminFacilityId,
    adminSangjoId,
  };

  const modalContainerProps: ModalContainerProps = {
    viewState,
    setViewState: handleChangeView,
    facilities,
    isSignedIn,
    userInfo,
    userRole,
    userId: user?.id,
    showToast,
    isMenuOpen,
    setIsMenuOpen,
    reservations,
    handleLogout,
    handleLoginClick,
    showLoginModal,
    setShowLoginModal,
    showSignUpModal,
    setShowSignUpModal,
    selectedFacility,
    setSelectedFacility,
    handleViewOnMap,
    handleAddReview,
    compareList,
    showComparison,
    setShowComparison,
    toggleCompare,
    removeFromCompare,
    isBooking,
    setIsBooking,
    isUrgentBooking,
    setIsUrgentBooking,
    handleBookingConfirm,
    handleCreatePendingReservation,
    handleFinalizePendingReservation,
    handleCleanupPendingReservation,
    selectedFuneralCompany,
    setSelectedFuneralCompany,
    showSangjoAIConsult,
    setShowSangjoAIConsult,
    showSangjoContract,
    setShowSangjoContract,
    sangjoCompareList,
    showSangjoComparison,
    setShowSangjoComparison,
    removeFromSangjoCompare,
    aiChatFacility,
    setAiChatFacility,
    initialChatIntent,
    setInitialChatIntent,
    userLocation,
    getCurrentPosition,
    handoverContext,
    setHandoverContext,
  };

  const adminContent = (
    <Suspense fallback={<LoadingFallback />}>
      <ContentRouter {...contentRouterProps} />
    </Suspense>
  );

  const mainContent = (
    <>
      <AppMainLayout
        viewState={viewState}
        setViewState={handleChangeView}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={(open) => { if (open) setSelectedFacility(null); setIsMenuOpen(open); }}
        showPromo={showPromo}
        setShowPromo={setShowPromo}
        showSOS={showSOS}
        setShowSOS={setShowSOS}
        onOpenSOSChat={() => openChat('funeral_home')}
        onBottomNavChange={handleBottomNavChange}
        roleError={roleError}
        onClearRoleError={() => setRoleError(null)}
        toast={toast}
        compareListCount={compareList.length}
        onOpenComparison={() => setShowComparison(true)}
        contentRouterProps={contentRouterProps}
        modalContainerProps={modalContainerProps}
      />
      {showWelcome && (
        <WelcomeSheet
          onNavigateList={() => { setShowWelcome(false); handleChangeView(ViewState.LIST); }}
          onNavigateSangjo={() => { setShowWelcome(false); handleChangeView(ViewState.FUNERAL_COMPANIES); }}
          onNavigateSOS={() => { setShowWelcome(false); setShowSOS(true); openChat('funeral_home'); }}
          onClose={() => setShowWelcome(false)}
        />
      )}
      <ConfirmModal />
      <PromptModal />
    </>
  );

  return (
    <AppRouteLayout
      viewState={viewState}
      setViewState={setViewState}
      setShowLoginModal={setShowLoginModal}
      routeLayout={routeLayout}
      onLayoutChange={setRouteLayout}
      isLoaded={isLoaded}
      isInApp={isInApp}
      adminContent={adminContent}
      mainContent={mainContent}
    />
  );
};

export default App;
