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

  const mapRef = React.useRef<MapRef>(null);
  const { location: userLocation, getCurrentPosition } = useLocation();
  const [viewState, setViewState] = useState<ViewState>(ViewState.MAP);
  const { toast, showToast } = useToast();

  // Facility Data Hook
  const {
    facilities, setFacilities,
    selectedFacility, setSelectedFacility,
    isDataLoading, filteredFacilities,
    fetchFacilityDetails: _fetchFacilityDetails, handleFacilitySelect,
    setCurrentBounds, viewportFetchedRef,
  } = useFacilityData({ viewState, showToast });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
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

  // Map Viewport Hook — 뷰포트 fetch 시 viewportFetchedRef 플래그 설정
  const setFacilitiesFromViewport = React.useCallback((data: Facility[] | ((prev: Facility[]) => Facility[])) => {
    viewportFetchedRef.current = true;
    setFacilities(data);
  }, [setFacilities, viewportFetchedRef]);
  const {
    targetMapCenter, setTargetMapCenter,
    targetMapZoom, setTargetMapZoom,
    handleMapBoundsChange,
  } = useMapViewport({ setFacilities: setFacilitiesFromViewport, setCurrentBounds, session });

  // Reservations
  const {
    reservations, setReservations: _setReservations,
    handleBookingConfirm, handleUpdateReservation,
    isBooking, setIsBooking,
  } = useReservations(isSignedIn || false, user, showToast, setShowLoginModal, setSelectedFacility, setViewState);

  const userInfo = React.useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.firstName || user.username || '?�원',
      email: user.primaryEmailAddress?.emailAddress || '',
      imageUrl: user.imageUrl,
    };
  }, [user]);

  useEffect(() => { getCurrentPosition(); }, [getCurrentPosition]);

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
    userName: userInfo?.name || '?�명',
    setFacilities, selectedFacility, setSelectedFacility, showToast,
  });

  // Handlers
  const handleLoginClick = () => { setIsMenuOpen(false); setShowLoginModal(true); };
  const handleLogout = async () => {
    try {
      await signOut();
      showToast('로그아웃 되었습니다.', 'info');
      return;
      showToast('로그?�웃 ?�었?�니??', 'info');
    } catch {
      showToast('로그아웃 처리 중 오류가 발생했습니다.', 'error');
      return;
      showToast('로그?�웃 처리 �??�류가 발생?�습?�다.', 'error');
    } finally {
      setViewState(ViewState.MAP);
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
    setViewState(view);
  };
  const handleViewOnMap = () => {
    if (selectedFacility) {
      setTargetMapCenter([selectedFacility.lat || 0, selectedFacility.lng || 0]);
      setTargetMapZoom(16);
      setSelectedFacility(null);
    }
    setViewState(ViewState.MAP);
  };

  const isInApp = isInAppBrowser();

  const contentRouterProps: ContentRouterProps = {
    viewState,
    setViewState,
    mapRef,
    filteredFacilities,
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
    setViewState,
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
        setViewState={setViewState}
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
