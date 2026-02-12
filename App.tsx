import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MapRef } from './components/MapContainer';
import { Facility, ViewState } from './types';
import { Consultation } from './types/consultation';
import { AlertCircle, X } from 'lucide-react';
import { Toaster } from 'sonner';
import { useUser, useClerk, useSession } from './lib/auth';
import { useAuthSync } from './lib/useAuthSync';
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
import { ExternalBrowserGuidePage } from './src/pages/ExternalBrowserGuidePage';
import { isInAppBrowser } from './src/utils/browserDetection';
import ShareJourneyView from './pages/ShareJourneyView';

// Phase 4-4/4-5 Components
import { ContentRouter, LoadingFallback } from './components/ContentRouter';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ModalContainer } from './components/ModalContainer';

const App: React.FC = () => {
  useAuthSync();

  const mapRef = React.useRef<MapRef>(null);
  const { location: userLocation, getCurrentPosition } = useLocation();
  const [viewState, setViewState] = useState<ViewState>(ViewState.MAP);
  const { toast, showToast } = useToast();

  // Facility Data Hook
  const {
    facilities, setFacilities,
    selectedFacility, setSelectedFacility,
    isDataLoading, filteredFacilities,
    fetchFacilityDetails, handleFacilitySelect,
    setCurrentBounds,
  } = useFacilityData({ viewState, showToast });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const setSearchQuery = useFilterStore(state => state.setSearchQuery);

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

  const [initialChatIntent, setInitialChatIntent] = useState<'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general' | null>(null);
  const [handoverContext, setHandoverContext] = useState<any>(null);

  // Map Viewport Hook
  const {
    targetMapCenter, setTargetMapCenter,
    targetMapZoom, setTargetMapZoom,
    handleMapBoundsChange,
  } = useMapViewport({ setFacilities, setCurrentBounds, session });

  // Reservations
  const {
    reservations, setReservations,
    handleBookingConfirm, handleUpdateReservation,
    isBooking, setIsBooking,
  } = useReservations(isSignedIn || false, user, showToast, setShowLoginModal, setSelectedFacility, setViewState);

  const userInfo = React.useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.firstName || user.username || '회원',
      email: user.primaryEmailAddress?.emailAddress || '',
      imageUrl: user.imageUrl,
    };
  }, [user]);

  useEffect(() => { getCurrentPosition(); }, [getCurrentPosition]);

  useEffect(() => {
    if (session) console.log('✅ [Session Sync] Clerk session active (handled by useAuthSync)');
  }, [session, isSignedIn]);

  // Route Handling
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/admin' || path === '/admin/') {
        setViewState(ViewState.FACILITY_ADMIN);
        window.history.replaceState(null, '', '/#/facility-admin');
        return;
      }
      if (path === '/facility-admin') { setViewState(ViewState.FACILITY_ADMIN); return; }
      if (path === '/super-admin') { setViewState(ViewState.SUPER_ADMIN); return; }
      if (path === '/funeral-company') { setViewState(ViewState.FUNERAL_COMPANIES); return; }
      if (path.startsWith('/share/')) return;

      if (hash === '#/admin') setViewState(ViewState.ADMIN);
      else if (hash === '#/super-admin') setViewState(ViewState.SUPER_ADMIN);
      else if (hash === '#/facility-admin') setViewState(ViewState.FACILITY_ADMIN);
      else if (hash === '#/funeral-company') setViewState(ViewState.FUNERAL_COMPANIES);
      else if (hash === '#/partner-inquiry') setViewState(ViewState.PARTNER_INQUIRY);
    };

    checkRoute();
    const handleOpenLogin = () => setShowLoginModal(true);
    window.addEventListener('open-login-modal', handleOpenLogin);
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('open-login-modal', handleOpenLogin);
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // User Role Hook
  const {
    userRole, roleError, setRoleError, isLoadingRole,
    adminFacilityId, setAdminFacilityId, adminSangjoId, sangjoOrgType,
  } = useUserRole({ isSignedIn, userInfo, viewState, setViewState, showToast });

  // Reviews Hook
  const { handleAddReview, handleReviewDeleted } = useReviews({
    userId: user?.id,
    userName: userInfo?.name || '익명',
    setFacilities, selectedFacility, setSelectedFacility, showToast,
  });

  // Handlers
  const handleLoginClick = () => { setIsMenuOpen(false); setShowLoginModal(true); };
  const handleLogout = async () => { await signOut(); setViewState(ViewState.MAP); showToast("로그아웃 되었습니다.", 'info'); };
  const handleViewOnMap = () => {
    if (selectedFacility) {
      setTargetMapCenter([selectedFacility.lat || 0, selectedFacility.lng || 0]);
      setTargetMapZoom(16);
      setSelectedFacility(null);
    }
    setViewState(ViewState.MAP);
  };

  // ADMIN - full page (no layout chrome)
  if (viewState === ViewState.ADMIN) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ContentRouter
          viewState={viewState} setViewState={setViewState}
          mapRef={mapRef} filteredFacilities={filteredFacilities}
          handleFacilitySelect={handleFacilitySelect} handleMapBoundsChange={handleMapBoundsChange}
          targetMapCenter={targetMapCenter} targetMapZoom={targetMapZoom} userLocation={userLocation}
          compareList={compareList} setShowComparison={setShowComparison} toggleCompare={toggleCompare}
          sangjoCompareList={sangjoCompareList} toggleSangjoCompare={toggleSangjoCompare} setShowSangjoComparison={setShowSangjoComparison}
          facilities={facilities} isDataLoading={isDataLoading} showPromo={showPromo}
          isSignedIn={isSignedIn} userInfo={userInfo} userRole={userRole} isLoadingRole={isLoadingRole}
          reservations={reservations} handleUpdateReservation={handleUpdateReservation}
          handleReviewDeleted={handleReviewDeleted} handleCompanySelect={handleCompanySelect}
          handleLoginClick={handleLoginClick} showToast={showToast} setShowLoginModal={setShowLoginModal}
          consultingFacility={consultingFacility} setConsultingFacility={setConsultingFacility}
          selectedConsultation={selectedConsultation} setSelectedConsultation={setSelectedConsultation}
          adminFacilityId={adminFacilityId} setAdminFacilityId={setAdminFacilityId} adminSangjoId={adminSangjoId}
        />
      </Suspense>
    );
  }

  // In-App Browser Guard
  const isInApp = isInAppBrowser();
  const isGuidePage = window.location.hash.includes('external-browser-guide');
  if (isInApp && !isGuidePage) return <ExternalBrowserGuidePage />;

  // Auth Loading
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isShareRoute = window.location.hash.startsWith('#/share/');

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <div className="h-full w-full relative bg-gray-100 flex justify-center overflow-hidden">
          <div className="w-full h-full md:max-w-md bg-white relative shadow-2xl flex flex-col">

            {/* Share Route */}
            {isShareRoute && (
              <Routes>
                <Route path="/share/:token" element={<ShareJourneyView />} />
              </Routes>
            )}

            {/* Role Error (Dev Only) */}
            {roleError && import.meta.env.DEV && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 text-sm">역할 조회 오류</h3>
                  <p className="text-red-600 text-[10px] mt-1 break-all">{roleError}</p>
                </div>
                <button onClick={() => setRoleError(null)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
              </div>
            )}

            {/* Top Bar */}
            <TopBar
              viewState={viewState} setViewState={setViewState}
              isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
              showPromo={showPromo} setShowPromo={setShowPromo}
            />

            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <ContentRouter
                  viewState={viewState} setViewState={setViewState}
                  mapRef={mapRef} filteredFacilities={filteredFacilities}
                  handleFacilitySelect={handleFacilitySelect} handleMapBoundsChange={handleMapBoundsChange}
                  targetMapCenter={targetMapCenter} targetMapZoom={targetMapZoom} userLocation={userLocation}
                  compareList={compareList} setShowComparison={setShowComparison} toggleCompare={toggleCompare}
                  sangjoCompareList={sangjoCompareList} toggleSangjoCompare={toggleSangjoCompare} setShowSangjoComparison={setShowSangjoComparison}
                  facilities={facilities} isDataLoading={isDataLoading} showPromo={showPromo}
                  isSignedIn={isSignedIn} userInfo={userInfo} userRole={userRole} isLoadingRole={isLoadingRole}
                  reservations={reservations} handleUpdateReservation={handleUpdateReservation}
                  handleReviewDeleted={handleReviewDeleted} handleCompanySelect={handleCompanySelect}
                  handleLoginClick={handleLoginClick} showToast={showToast} setShowLoginModal={setShowLoginModal}
                  consultingFacility={consultingFacility} setConsultingFacility={setConsultingFacility}
                  selectedConsultation={selectedConsultation} setSelectedConsultation={setSelectedConsultation}
                  adminFacilityId={adminFacilityId} setAdminFacilityId={setAdminFacilityId} adminSangjoId={adminSangjoId}
                />
              </Suspense>
            </div>

            {/* Bottom Navigation */}
            <BottomNav viewState={viewState} setViewState={setViewState} />

            {/* Toast */}
            {toast && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full px-4 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                <div className={`bg-gray-900/90 text-white px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm flex items-center justify-between gap-3 ${
                  toast.type === 'error' ? 'bg-red-900/90' : toast.type === 'info' ? 'bg-blue-900/90' : 'bg-gray-900/90'
                }`}>
                  <span className="text-sm font-medium">{toast.message}</span>
                  {compareList.length > 0 && toast.message.includes('비교함') && (
                    <button
                      onClick={() => setShowComparison(true)}
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white font-bold pointer-events-auto"
                    >
                      비교하기
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Global Toaster */}
            <Toaster richColors position="top-center" closeButton />

            {/* All Modals & Overlays */}
            <ModalContainer
              viewState={viewState} setViewState={setViewState}
              facilities={facilities} isSignedIn={isSignedIn} userInfo={userInfo}
              userRole={userRole} userId={user?.id} showToast={showToast}
              isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
              reservations={reservations} handleLogout={handleLogout} handleLoginClick={handleLoginClick}
              showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal}
              showSignUpModal={showSignUpModal} setShowSignUpModal={setShowSignUpModal}
              selectedFacility={selectedFacility} setSelectedFacility={setSelectedFacility}
              handleViewOnMap={handleViewOnMap} handleAddReview={handleAddReview}
              compareList={compareList} showComparison={showComparison} setShowComparison={setShowComparison}
              toggleCompare={toggleCompare} removeFromCompare={removeFromCompare}
              isBooking={isBooking} setIsBooking={setIsBooking}
              isUrgentBooking={isUrgentBooking} setIsUrgentBooking={setIsUrgentBooking}
              handleBookingConfirm={handleBookingConfirm}
              selectedFuneralCompany={selectedFuneralCompany} setSelectedFuneralCompany={setSelectedFuneralCompany}
              showSangjoAIConsult={showSangjoAIConsult} setShowSangjoAIConsult={setShowSangjoAIConsult}
              showSangjoContract={showSangjoContract} setShowSangjoContract={setShowSangjoContract}
              sangjoCompareList={sangjoCompareList} showSangjoComparison={showSangjoComparison}
              setShowSangjoComparison={setShowSangjoComparison} removeFromSangjoCompare={removeFromSangjoCompare}
              aiChatFacility={aiChatFacility} setAiChatFacility={setAiChatFacility}
              initialChatIntent={initialChatIntent} setInitialChatIntent={setInitialChatIntent}
              userLocation={userLocation} getCurrentPosition={getCurrentPosition}
              handoverContext={handoverContext} setHandoverContext={setHandoverContext}
            />
          </div>

          {/* Global Toast (outer) */}
          {toast && (
            <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[10001] px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 ${
              toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white font-medium max-w-md`}>
              {toast.message}
            </div>
          )}
        </div>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;
