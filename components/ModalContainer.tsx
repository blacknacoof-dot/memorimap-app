import React, { Suspense } from 'react';
import { Facility, Reservation, ViewState, FuneralCompany } from '../types';
import { SideMenu } from './SideMenu';
import { LoginModal } from './LoginModal';
import { SignUpModal } from './SignUpModal';
import { FacilitySheet } from './FacilitySheet';
import { ReservationModal } from './ReservationModal';
import { ComparisonModal } from './ComparisonModal';
import { RecommendationStarter } from './RecommendationStarter';
import { ChatInterface } from './AI/ChatInterface';
import { toast as sonnerToast } from 'sonner';
import { useConversationStore, generateContextSummary } from '../stores/conversationStore';
import { useFilterStore } from '../stores/useFilterStore';
import { useChatStore } from '../stores/useChatStore';
import { useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { saveSangjoContract, resolveSangjoDbId } from '../lib/sangjoQueries';

const FuneralCompanySheet = React.lazy(() => import('./FuneralCompanySheet').then(m => ({ default: m.FuneralCompanySheet })));
const SangjoConsultationModal = React.lazy(() => import('./Consultation/SangjoConsultationModal').then(m => ({ default: m.SangjoConsultationModal })));
const SangjoContractModal = React.lazy(() => import('./Consultation/SangjoContractModal').then(m => ({ default: m.SangjoContractModal })));
const SangjoComparisonModal = React.lazy(() => import('./SangjoComparisonModal').then(m => ({ default: m.SangjoComparisonModal })));

const SuspenseSpinner = () => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20">
    <div className="bg-white p-3 rounded-full shadow-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  </div>
);

type ToastType = 'success' | 'error' | 'info';

export interface ModalContainerProps {
  // Core
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  facilities: Facility[];
  isSignedIn: boolean | undefined;
  userInfo: { id: string; name: string; email: string; imageUrl?: string } | null;
  userRole: string | null;
  userId?: string;
  showToast: (message: string, type?: ToastType) => void;

  // Side Menu
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  reservations: Reservation[];
  handleLogout: () => void;
  handleLoginClick: () => void;

  // Auth Modals
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  showSignUpModal: boolean;
  setShowSignUpModal: (v: boolean) => void;

  // Facility Sheet
  selectedFacility: Facility | null;
  setSelectedFacility: (f: Facility | null) => void;
  handleViewOnMap: () => void;
  handleAddReview: (facilityId: string, content: string, rating: number) => void;

  // Comparison
  compareList: Facility[];
  showComparison: boolean;
  setShowComparison: (v: boolean) => void;
  toggleCompare: (f: Facility) => void;
  removeFromCompare: (id: string) => void;

  // Booking
  isBooking: boolean;
  setIsBooking: (v: boolean) => void;
  isUrgentBooking: boolean;
  setIsUrgentBooking: (v: boolean) => void;
  handleBookingConfirm: (r: Reservation) => void;

  // Funeral Company
  selectedFuneralCompany: FuneralCompany | null;
  setSelectedFuneralCompany: (c: FuneralCompany | null) => void;
  showSangjoAIConsult: boolean;
  setShowSangjoAIConsult: (v: boolean) => void;
  showSangjoContract: boolean;
  setShowSangjoContract: (v: boolean) => void;

  // Sangjo Comparison
  sangjoCompareList: FuneralCompany[];
  showSangjoComparison: boolean;
  setShowSangjoComparison: (v: boolean) => void;
  removeFromSangjoCompare: (id: string) => void;

  // AI Chat
  aiChatFacility: Facility | null;
  setAiChatFacility: (f: Facility | null) => void;
  initialChatIntent: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | null;
  setInitialChatIntent: (i: 'funeral_home' | 'memorial_facility' | 'pet_funeral' | null) => void;
  userLocation: { lat: number; lng: number; type: string };
  getCurrentPosition: () => void;
  handoverContext: Record<string, unknown> | string | null;
  setHandoverContext: (ctx: Record<string, unknown> | string | null) => void;
}

export const ModalContainer: React.FC<ModalContainerProps> = (props) => {
  const {
    viewState, setViewState, facilities, isSignedIn, userInfo, userRole, userId,
    showToast, isMenuOpen, setIsMenuOpen, reservations, handleLogout, handleLoginClick,
    showLoginModal, setShowLoginModal, showSignUpModal, setShowSignUpModal,
    selectedFacility, setSelectedFacility, handleViewOnMap, handleAddReview,
    compareList, showComparison, setShowComparison, toggleCompare, removeFromCompare,
    isBooking, setIsBooking, isUrgentBooking, setIsUrgentBooking, handleBookingConfirm,
    selectedFuneralCompany, setSelectedFuneralCompany,
    showSangjoAIConsult, setShowSangjoAIConsult, showSangjoContract, setShowSangjoContract,
    sangjoCompareList, showSangjoComparison, setShowSangjoComparison, removeFromSangjoCompare,
    aiChatFacility, setAiChatFacility, initialChatIntent, setInitialChatIntent,
    userLocation, getCurrentPosition, handoverContext, setHandoverContext,
  } = props;

  const setSearchQuery = useFilterStore(state => state.setSearchQuery);
  const { session } = useSession();

  // 글로벌 채팅 스토어 구독 (TopBar 긴급 버튼 등에서 채팅 열기)
  const { isOpen: globalChatOpen, intent: globalChatIntent, closeChat: globalCloseChat } = useChatStore();
  React.useEffect(() => {
    if (globalChatOpen && globalChatIntent) {
      setInitialChatIntent(globalChatIntent);
      setAiChatFacility({ name: '통합 AI 마음이', id: 'maum-i', type: 'assistant', address: '' } as Facility);
      globalCloseChat();
    }
  }, [globalChatOpen, globalChatIntent, globalCloseChat, setInitialChatIntent, setAiChatFacility]);

  const handleAiChatAction = (action: string, data?: unknown) => {
    const isGlobalAI = aiChatFacility?.id === 'maum-i';

    if (action === 'RESERVE') {
      if (data && typeof data === 'object' && 'id' in data) {
        if (!isSignedIn) {
          showToast('예약을 위해 로그인이 필요합니다.', 'error');
          setAiChatFacility(null);
          setShowLoginModal(true);
          return;
        }
        setAiChatFacility(null);
        setSelectedFacility(data as Facility);
        setIsUrgentBooking(true);
        setIsBooking(true);
        return;
      }
      setAiChatFacility(null);
      if (isGlobalAI) { setViewState(ViewState.LIST); return; }
      setSelectedFacility(aiChatFacility);
      setIsBooking(true);
    } else if (action === 'MAP') {
      setAiChatFacility(null);
      if (isGlobalAI) { handleViewOnMap(); return; }
      setSelectedFacility(aiChatFacility);
      handleViewOnMap();
    } else if (action === 'CALL_MANAGER') {
      if (isGlobalAI) {
        sonnerToast.info('고객센터(1588-0000)로 연결합니다.');
        setTimeout(() => window.location.href = 'tel:1588-0000', 500);
        return;
      }
      sonnerToast.info(`담당자(${aiChatFacility?.phone})에게 연결합니다.`);
      setTimeout(() => window.location.href = `tel:${aiChatFacility?.phone}`, 500);
    } else if (action === 'RECOMMEND') {
      setAiChatFacility(null);
      if (isGlobalAI) {
        if (data && typeof data === 'string' && !data.includes('내 위치') && !data.includes('GPS')) {
          setSearchQuery(data);
        }
        setViewState(ViewState.LIST);
        return;
      }
      setSearchQuery(aiChatFacility?.address?.split(' ')[0] || '');
      setViewState(ViewState.LIST);
    }
  };

  const handleSearchFacilities = (region: string) => {
    const exactMatches = facilities.filter(f => f.address.includes(region));
    const sorted = exactMatches.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    return sorted.slice(0, 3);
  };

  const handleSwitchToFacility = (target: Facility | { id: string; name: string; address?: string; phone?: string }, context?: Record<string, unknown> | string) => {
    const globalContext = useConversationStore.getState().mainBotContext;
    const summary = generateContextSummary(globalContext);
    setAiChatFacility(target as Facility);
    setHandoverContext(context || summary);
  };

  return (
    <>
      {/* Side Menu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(view) => setViewState(view)}
        reservationCount={reservations.length}
        isLoggedIn={!!isSignedIn}
        user={userInfo}
        onLogin={handleLoginClick}
        onLogout={handleLogout}
        userRole={userRole ?? undefined}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={() => { setShowLoginModal(false); showToast("로그인 되었습니다!"); }}
          onSignUpClick={() => { setShowLoginModal(false); setShowSignUpModal(true); }}
          onAdminLogin={() => { setShowLoginModal(false); setViewState(ViewState.ADMIN); showToast("관리자 모드로 접속합니다.", 'success'); }}
        />
      )}

      {/* SignUp Modal */}
      {showSignUpModal && (
        <SignUpModal
          onClose={() => setShowSignUpModal(false)}
          onSignUp={() => { setShowSignUpModal(false); showToast("환영합니다! 회원가입이 완료되었습니다."); }}
          onLoginClick={() => { setShowSignUpModal(false); setShowLoginModal(true); }}
        />
      )}

      {/* Facility Sheet */}
      {selectedFacility && (
        <FacilitySheet
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          onBook={() => setIsBooking(true)}
          onViewMap={handleViewOnMap}
          isLoggedIn={!!isSignedIn}
          currentUser={userInfo}
          onAddReview={handleAddReview}
          onLoginRequired={() => { setSelectedFacility(null); setShowLoginModal(true); }}
          isInCompareList={compareList.some(f => f.id === selectedFacility.id)}
          onToggleCompare={() => toggleCompare(selectedFacility)}
          reservations={reservations}
          onOpenConsultation={() => setAiChatFacility(selectedFacility)}
          onOpenAiChat={() => setAiChatFacility(selectedFacility)}
          onViewSangjoList={() => { setViewState(ViewState.FUNERAL_COMPANIES); setSelectedFacility(null); }}
        />
      )}

      {/* AI Helper - Maum-i (hide when side menu is open) */}
      {viewState === ViewState.MAP && !selectedFacility && !showComparison && !aiChatFacility && !isMenuOpen && (
        <RecommendationStarter
          onSelectIntent={(intent) => {
            setInitialChatIntent(intent);
            setAiChatFacility({ name: '통합 AI 마음이', id: 'maum-i', type: 'assistant', address: '' } as Facility);
          }}
        />
      )}

      {/* Reservation Modal */}
      {isBooking && selectedFacility && (
        <ReservationModal
          facility={selectedFacility}
          onClose={() => { setIsBooking(false); setIsUrgentBooking(false); }}
          onConfirm={handleBookingConfirm}
          reservationMode={isUrgentBooking ? 'URGENT' : 'STANDARD'}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          facilities={compareList}
          onClose={() => setShowComparison(false)}
          onRemove={(id) => removeFromCompare(id)}
          onBook={(facility) => { setShowComparison(false); setSelectedFacility(facility); setIsBooking(true); }}
        />
      )}

      {/* Funeral Company Sheet */}
      {selectedFuneralCompany && (
        <Suspense fallback={<SuspenseSpinner />}>
          <FuneralCompanySheet
            company={selectedFuneralCompany}
            onClose={() => setSelectedFuneralCompany(null)}
            onOpenAIConsult={() => setShowSangjoAIConsult(true)}
            onOpenContract={() => setShowSangjoContract(true)}
            currentUser={userInfo}
            isLoggedIn={isSignedIn}
            onOpenLogin={() => { setShowLoginModal(true); setSelectedFuneralCompany(null); }}
          />
        </Suspense>
      )}

      {/* Sangjo AI Consultation */}
      {showSangjoAIConsult && (
        <Suspense fallback={<SuspenseSpinner />}>
          <SangjoConsultationModal
            company={selectedFuneralCompany}
            onClose={() => { setShowSangjoAIConsult(false); setSelectedFuneralCompany(null); }}
            currentUser={userInfo ? { id: userInfo.id, name: userInfo.name } : null}
          />
        </Suspense>
      )}

      {/* Sangjo Contract */}
      {showSangjoContract && selectedFuneralCompany && (
        <Suspense fallback={<SuspenseSpinner />}>
          <SangjoContractModal
            company={selectedFuneralCompany}
            onClose={() => { setShowSangjoContract(false); setSelectedFuneralCompany(null); }}
            onConfirm={async (data) => {
              try {
                const client = await getAuthClient(session, { strict: true });
                const sangjoId = await resolveSangjoDbId(String(data.companyId), data.companyName, client);
                await saveSangjoContract({
                  id: crypto.randomUUID(),
                  contract_number: `SC-${Date.now()}`,
                  sangjo_id: sangjoId,
                  customer_name: data.name,
                  customer_phone: data.phone,
                  total_price: 0,
                  status: '상담신청',
                  application_type: 'CONSULTATION',
                  preferred_call_time: data.callTime,
                  created_at: new Date().toISOString(),
                }, client);
                showToast('상담 신청이 완료되었습니다!');
              } catch (err) {
                console.error('Sangjo contract error:', err);
                showToast('상담 신청 중 오류가 발생했습니다.', 'error');
              }
            }}
          />
        </Suspense>
      )}

      {/* Sangjo Comparison */}
      {showSangjoComparison && (
        <Suspense fallback={<SuspenseSpinner />}>
          <SangjoComparisonModal
            companies={sangjoCompareList}
            onClose={() => setShowSangjoComparison(false)}
            onRemove={(id) => removeFromSangjoCompare(id)}
            onSelect={(company) => { setShowSangjoComparison(false); setSelectedFuneralCompany(company); }}
          />
        </Suspense>
      )}

      {/* Global AI Chat Overlay */}
      {aiChatFacility && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full h-full md:w-[420px] md:h-[85dvh] md:rounded-2xl overflow-hidden bg-white shadow-2xl relative animate-in zoom-in-95 duration-300">
            <ChatInterface
              facility={aiChatFacility}
              currentUser={userInfo}
              initialIntent={initialChatIntent}
              userLocation={userLocation}
              onGetCurrentPosition={getCurrentPosition}
              handoverContext={typeof handoverContext === 'object' && handoverContext ? handoverContext as { urgency?: string; location?: { text?: string }; [key: string]: unknown } : undefined}
              onClose={() => { setAiChatFacility(null); setInitialChatIntent(null); }}
              onGoToMyPage={() => { setAiChatFacility(null); setInitialChatIntent(null); setViewState(ViewState.MY_PAGE); }}
              onSearchFacilities={handleSearchFacilities}
              onSwitchToFacility={(f, ctx) => handleSwitchToFacility(f as Facility, ctx)}
              onAction={handleAiChatAction}
            />
          </div>
        </div>
      )}
    </>
  );
};
