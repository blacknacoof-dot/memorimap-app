import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter } from 'react-router-dom';
import MapComponent, { MapRef } from './components/MapContainer';
import { FacilitySheet } from './components/FacilitySheet';
import { ReservationModal } from './components/ReservationModal';
import { SideMenu } from './components/SideMenu';
import { ComparisonModal } from './components/ComparisonModal';
import { LoginModal } from './components/LoginModal';
import { SignUpModal } from './components/SignUpModal';
import { Facility, Reservation, ViewState, Review, FuneralCompany, FacilityCategoryType } from './types';
import { RecommendationStarter } from './components/RecommendationStarter';
import { Consultation } from './types/consultation';
import { Map as MapIcon, List, User, Settings, Menu, X, Plus, Search, ChevronRight, Star, Share2, Navigation, Phone, Calendar, Clock, Info, Check, AlertCircle, Loader2, ArrowLeft, Building2, ExternalLink, MessageCircle, Heart, Filter, Shield, AlertTriangle, ShieldAlert, Ticket, Crosshair, Award, Scale, Database } from 'lucide-react';
import { FACILITIES } from './constants';
import { useUser, useClerk, useSession } from './lib/auth';
import { supabase, isSupabaseConfigured, setSupabaseAuth } from './lib/supabaseClient';
import L from 'leaflet';
import { useAuthSync } from './lib/useAuthSync';
import { getFacilitySubscription, incrementAiUsage, fetchFacilitiesInView } from './lib/queries';
import { FacilityList } from './components/FacilityList';
import { useLocation } from './hooks/useLocation';
import { SkeletonCard } from './components/ui/SkeletonCard';
import { FilterBar } from './components/FilterBar';
import { useFilterStore } from './stores/useFilterStore';

// Lazy Load Components
const AdminView = React.lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));
const MyPageView = React.lazy(() => import('./components/MyPageView').then(m => ({ default: m.MyPageView })));
const FacilityAdminView = React.lazy(() => import('./components/FacilityAdminView').then(m => ({ default: m.FacilityAdminView })));
const FuneralCompanyView = React.lazy(() => import('./components/FuneralCompanyView').then(m => ({ default: m.FuneralCompanyView })));
const FuneralCompanySheet = React.lazy(() => import('./components/FuneralCompanySheet').then(m => ({ default: m.FuneralCompanySheet })));
const ConsultationView = React.lazy(() => import('./components/Consultation/ConsultationView').then(m => ({ default: m.ConsultationView })));
const ConsultationHistoryView = React.lazy(() => import('./components/Consultation/ConsultationHistoryView').then(m => ({ default: m.ConsultationHistoryView })));
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdmin/SuperAdminDashboard'));
const SubscriptionPlans = React.lazy(() => import('./components/SubscriptionPlans').then(m => ({ default: m.default })));
const SangjoConsultationModal = React.lazy(() => import('./components/Consultation/SangjoConsultationModal').then(m => ({ default: m.SangjoConsultationModal })));
const SangjoContractModal = React.lazy(() => import('./components/Consultation/SangjoContractModal').then(m => ({ default: m.SangjoContractModal })));
const SangjoComparisonModal = React.lazy(() => import('./components/SangjoComparisonModal').then(m => ({ default: m.SangjoComparisonModal })));
const SangjoDashboard = React.lazy(() => import('./components/SangjoDashboard').then(m => ({ default: m.SangjoDashboard })));
import { ChatInterface } from './components/AI/ChatInterface';

// Lazy Load Static Views (Named Exports)
const GuideView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.GuideView })));
const NoticesView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.NoticesView })));
const SupportView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.SupportView })));
const SettingsView = React.lazy(() => import('./components/StaticViews').then(module => ({ default: module.SettingsView })));
const PartnerInquiryView = React.lazy(() => import('./components/PartnerInquiryView').then(module => ({ default: module.PartnerInquiryView })));

// Constants
const REGION_COORDINATES: Record<string, { center: [number, number], zoom: number }> = {
  '서울': { center: [37.5665, 126.9780], zoom: 11 },
  '경기': { center: [37.4138, 127.5183], zoom: 9 },
  '인천': { center: [37.4563, 126.7052], zoom: 11 },
  '강원': { center: [37.8228, 128.1555], zoom: 9 },
  '충북': { center: [36.6356, 127.4913], zoom: 9 },
  '충남': { center: [36.6588, 126.6728], zoom: 9 },
  '전북': { center: [35.8204, 127.1087], zoom: 9 },
  '전남': { center: [34.8160, 126.4629], zoom: 9 },
  '경북': { center: [36.5760, 128.5056], zoom: 9 },
  '경남': { center: [35.2377, 128.6919], zoom: 9 },
  '제주': { center: [33.4890, 126.4983], zoom: 10 },
  '부산': { center: [35.1796, 129.0756], zoom: 11 },
  '대구': { center: [35.8714, 128.6014], zoom: 11 },
  '대전': { center: [36.3504, 127.3845], zoom: 11 },
  '광주': { center: [35.1595, 126.8526], zoom: 11 },
  '울산': { center: [35.5384, 129.3113], zoom: 11 },
  '세종': { center: [36.4800, 127.2890], zoom: 11 },
};

// Loading Component
const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      <p className="text-gray-400 text-sm">로딩중...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // Sync Auth State to Supabase
  useAuthSync();

  const mapRef = React.useRef<MapRef>(null);
  const { location: userLocation, getCurrentPosition } = useLocation();
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [viewState, setViewState] = useState<ViewState>(ViewState.MAP);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true); // Promo Banner State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // 🚑 Hotfix: Connect to Store to keep existing logic working
  const setSearchQuery = useFilterStore(state => state.setSearchQuery);
  const selectedFilter = '전체'; // For now, force pass-through since Map/List handle filtering

  // Comparison State
  const [compareList, setCompareList] = useState<Facility[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Consultation State
  const [consultingFacility, setConsultingFacility] = useState<Facility | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Pagination State


  // User Role State
  const [userRole, setUserRole] = useState<string>('user');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Funeral Company State
  const [selectedFuneralCompany, setSelectedFuneralCompany] = useState<FuneralCompany | null>(null);
  const [showSangjoAIConsult, setShowSangjoAIConsult] = useState(false);
  const [showSangjoContract, setShowSangjoContract] = useState(false);
  const [sangjoCompareList, setSangjoCompareList] = useState<FuneralCompany[]>([]);
  const [showSangjoComparison, setShowSangjoComparison] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Facility Admin Context
  const [adminFacilityId, setAdminFacilityId] = useState<string | null>(null);
  const [adminSangjoId, setAdminSangjoId] = useState<string | null>(null);
  const [sangjoOrgType, setSangjoOrgType] = useState<'branch' | 'headquarters'>('branch');

  // Map Search State
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);
  const [targetMapCenter, setTargetMapCenter] = useState<[number, number] | undefined>(undefined);
  const [targetMapZoom, setTargetMapZoom] = useState<number | undefined>(undefined);
  const [aiChatFacility, setAiChatFacility] = useState<Facility | null>(null);
  const [isUrgentBooking, setIsUrgentBooking] = useState(false);

  // Auth State
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [initialChatIntent, setInitialChatIntent] = useState<'funeral_home' | 'memorial_facility' | 'pet_funeral' | 'general' | null>(null);
  const [handoverContext, setHandoverContext] = useState<any>(null);

  // --- Clerk -> Supabase Token Injection ---
  const { session } = useSession();

  useEffect(() => {
    const syncSupabaseAuth = async () => {
      if (!session) {
        // [Fix] Clear Supabase session on logout
        // setSupabaseAuth(null); // Deprecated local helper
        await supabase.auth.signOut();
        return;
      }
      try {
        const token = await session.getToken({ template: 'supabase' });
        if (token) {
          console.log("🔄 Injecting Clerk Token into Supabase Client...");
          // [Fix] Explicitly set session on the global Supabase client
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '', // Clerk manages refresh, so empty string is fine
          });
          console.log('✅ Supabase Session Synced!');
        } else {
          console.warn("⚠️ Clerk getToken returned null. Check 'supabase' template.");
        }
      } catch (err) {
        console.error("Failed to sync Supabase auth:", err);
      }
    };
    syncSupabaseAuth();
  }, [session]);

  // ------------------------------------------

  // Helper to get display user info (Memoize to prevent infinite re-fetches)
  const userInfo = React.useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.firstName || user.username || '회원',
      email: user.primaryEmailAddress?.emailAddress || '',
      imageUrl: user.imageUrl
    };
  }, [user]);

  // 🔍 임시: User ID 확인용 (나중에 삭제 가능)
  useEffect(() => {
    // Attempt to get user location on mount
    getCurrentPosition();
  }, [getCurrentPosition]);

  useEffect(() => {
    if (isSignedIn && userInfo) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔑 Clerk User ID:', userInfo.id);
      console.log('📧 이메일:', userInfo.email);
      console.log('👤 이름:', userInfo.name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, [isSignedIn, userInfo]);

  // Route Handling (Pathname & Hash)
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // 1. Pathname Handling (SPA Fallback)
      if (path === '/admin' || path === '/admin/') {
        // Handle /admin specifically if not handled by public/admin/index.html
        setViewState(ViewState.FACILITY_ADMIN);
        window.history.replaceState(null, '', '/#/facility-admin');
        return;
      }
      if (path === '/facility-admin') {
        setViewState(ViewState.FACILITY_ADMIN);
        return;
      }
      if (path === '/super-admin') {
        setViewState(ViewState.SUPER_ADMIN);
        return;
      }
      if (path === '/funeral-company') {
        setViewState(ViewState.FUNERAL_COMPANIES);
        return;
      }

      // 2. Hash Routing
      if (hash === '#/admin') {
        setViewState(ViewState.ADMIN);
      } else if (hash === '#/super-admin') {
        setViewState(ViewState.SUPER_ADMIN);
      } else if (hash === '#/facility-admin') {
        setViewState(ViewState.FACILITY_ADMIN);
      } else if (hash === '#/funeral-company') { // Additional route for Sangjo
        setViewState(ViewState.FUNERAL_COMPANIES);
      } else if (hash === '#/partner-inquiry') {
        setViewState(ViewState.PARTNER_INQUIRY);
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute); // Handle browser back/forward buttons
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Fetch User Role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isSignedIn && userInfo) {
        setIsLoadingRole(true);
        try {
          const { getUserRole } = await import('./lib/queries');
          const result = await getUserRole(userInfo.id);

          setUserRole(result.role);

          if (result.isError) {
            setRoleError(result.error || 'Unknown role error');
            console.error('❌ Role fetch error:', result.error);
            showToast(`권한 확인 중 문제가 발생했습니다: ${result.error}`, 'error');
          } else {
            setRoleError(null);

            // Auto-route based on role
            if (result.role === 'facility_admin' && viewState === ViewState.MAP) {
              setViewState(ViewState.FACILITY_ADMIN);
            } else if (result.role.startsWith('sangjo_') && viewState === ViewState.MAP) {
              setViewState(ViewState.FUNERAL_COMPANIES);
            }
          }

          // Fetch Sangjo Info if role is sangjo-related
          if (result.role.includes('sangjo')) {
            const { getSangjoUser } = await import('./lib/sangjoQueries');
            const sangjoInfo = await getSangjoUser(userInfo.id);
            if (sangjoInfo) {
              setAdminSangjoId(sangjoInfo.sangjo_id);
              setSangjoOrgType(result.role === 'sangjo_hq_admin' ? 'headquarters' : 'branch');
            }
          }
        } catch (err: any) {
          console.error('❌ Unexpected fetchUserRole error:', err);
          setRoleError('Unexpected error');
          showToast('권한 정보를 불러오지 못했습니다.', 'error');
        } finally {
          setIsLoadingRole(false);
        }
      } else {
        setUserRole('user');
        setRoleError(null);
        setIsLoadingRole(false);
      }
    };
    fetchUserRole();
  }, [isSignedIn, userInfo?.id]);

  // Fetch Facilities from Supabase (Via RPC)
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!isSupabaseConfigured()) {
        return;
      }

      setIsDataLoading(true);
      try {
        const center = REGION_COORDINATES['서울'].center; // Default Center

        // 🛰️ Stable Data Fetching: Using .select() with fallback fields
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedFacilities = data.map((item: any) => {
            // 🔄 Category/Type Normalization (Use item.type as primary)
            const resolvedCategory = item.type || item.category || 'charnel';

            let type: any = 'charnel';
            const name = item.name || '';

            if (resolvedCategory === 'funeral_home' || resolvedCategory === 'funeral' || resolvedCategory === 'funeral_home') type = 'funeral';
            else if (resolvedCategory === 'charnel_house' || resolvedCategory === 'charnel' || resolvedCategory === 'memorial' || resolvedCategory === 'columbarium') type = 'charnel';
            else if (resolvedCategory === 'natural_burial' || resolvedCategory === 'natural' || resolvedCategory === 'tree_burial') type = 'natural';
            else if (resolvedCategory === 'park_cemetery' || resolvedCategory === 'park' || resolvedCategory === 'complex' || resolvedCategory === 'cemetery') type = 'park';
            else if (resolvedCategory === 'pet_funeral' || resolvedCategory === 'pet' || resolvedCategory === 'pet_memorial') type = 'pet';
            else if (resolvedCategory === 'sea_burial' || resolvedCategory === 'sea') type = 'sea';

            const categoryMap: Record<string, any> = {
              'funeral': 'funeral_home',
              'charnel': 'columbarium',
              'natural': 'natural_burial',
              'park': 'cemetery',
              'pet': 'pet_funeral',
              'sea': 'sea_burial',
              'sangjo': 'sangjo'
            };
            const mappedCategory = categoryMap[type] || 'columbarium';

            // Simulation Logic (Preserved)
            const idNum = item.id ? item.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
            const pseudoRandom = (idNum % 10);
            const simulatedRating = pseudoRandom < 2 ? 3 : (pseudoRandom < 6 ? 4 : 5);
            const simulatedReviewCount = 3 + (idNum % 6);

            // 🖼️ Image Logic Refinement (User suggestion #1 & #3)
            // Prioritize high-quality URLs and filter out known bad ones (guitar placeholders, etc.)
            const rawImages = item.images || [];
            const dbImageUrl = item.image_url || '';

            const isBadUrl = (url: string) => {
              if (!url) return true;
              const badPatterns = [
                'placeholder', 'placehold.it', 'placehold.co',
                'unsplash',
                'mediahub.seoul.go.kr',
                'noimage', 'no-image', 'guitar',
                '_random', '/defaults/' // [FIX] These are our placeholders, not real facility photos
              ];
              return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
            };

            // Selection Logic: Pick the first good one from images[] or use image_url
            // 1. First Pass: Look for a REAL photo (Not a placeholder)
            let selectedImage = rawImages.find((url: string) => !isBadUrl(url));
            if (!selectedImage && dbImageUrl && !isBadUrl(dbImageUrl)) {
              selectedImage = dbImageUrl;
            }

            // 2. Second Pass: If no real photo, allow our own placeholders from images/image_url
            if (!selectedImage) {
              const isOnlyMissing = (url: string) => {
                if (!url) return true;
                return ['placeholder', 'noimage', 'guitar'].some(p => url.toLowerCase().includes(p));
              };
              selectedImage = rawImages.find((url: string) => !isOnlyMissing(url)) || (isOnlyMissing(dbImageUrl) ? null : dbImageUrl);
            }

            // Ultimate Fallback: Category-based placeholder if nothing found
            // Ultimate Fallback: Category-based placeholder if NO GOOD IMAGE exists at all
            if (!selectedImage) {
              const defaultMap: Record<string, string[]> = {
                'funeral': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
                  'https://images.unsplash.com/photo-1516733968668-dbdce39c4a41?q=80&w=800', // Alternative interior
                  'https://images.unsplash.com/photo-1544161515-4af62f4b92ba?q=80&w=800'  // Calm interior
                ],
                'charnel': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg',
                  'https://images.unsplash.com/photo-1518135714426-c18f5fe26967?q=80&w=800',
                  'https://images.unsplash.com/photo-1471623197343-ccb79a1bd717?q=80&w=800'
                ],
                'natural': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg',
                  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800',
                  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800'
                ],
                'park': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
                  'https://images.unsplash.com/photo-1531171012276-10f293385226?q=80&w=800',
                  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800'
                ],
                'pet': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
                  'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800',
                  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800'
                ],
                'sea': [
                  'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
                  'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=800',
                  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800'
                ]
              };

              const options = defaultMap[type] || defaultMap['funeral'];
              // Use ID or name to pick a stable variation
              const variantIndex = (idNum || 0) % options.length;
              selectedImage = options[variantIndex];
            }

            return {
              id: item.id?.toString(),
              name: item.name || '이름 없음',
              category: mappedCategory,
              type: type, // This is 'funeral', 'charnel', etc.
              db_type: item.type, // Preserving original DB type for detail queries
              religion: 'none',
              address: item.address || '',
              lat: Number(item.lat || item.latitude),
              lng: Number(item.lng || item.longitude),
              priceRange: '가격 정보 상담',
              rating: simulatedRating,
              reviewCount: simulatedReviewCount,
              imageUrl: selectedImage,
              description: '',
              features: [],
              phone: '',
              prices: [],
              galleryImages: rawImages,
              reviews: [],
              isDetailLoaded: false,
              isVerified: true,
              dataSource: 'db',
              priceInfo: item.price_info || null,
              products: item.price_info?.products || []
            };
          });
          setFacilities(mappedFacilities);
          // Initial toast removed as per user request (too verbose)
          // showToast(`총 ${mappedFacilities.length}개의 시설 정보를 불러왔습니다.`, 'info');
        } else {
          console.log("Supabase DB is empty or RPC error");
        }
      } catch (err: any) {
        console.error("Failed to fetch facilities:", err);
        showToast(`데이터 불러오기 실패: ${err.message || "연결 오류"}`, 'error');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchFacilities();
  }, []);




  // Filtered Facilities Logic
  // 🚧 Phase 4: Filtering Logic Removed (Moved to Store & Components)
  // const filteredFacilities = facilities.filter(facility => { ... });
  const filteredFacilities = facilities; // Pass through raw data - components handle exclusion now

  const handleBoundsChange = (bounds: L.LatLngBounds) => {
    setCurrentBounds(bounds);
  };

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Handlers
  const handleLoginClick = () => {
    setIsMenuOpen(false);
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    setViewState(ViewState.MAP); // Go back to map on logout
    showToast("로그아웃 되었습니다.", 'info');
  };

  // Validate & Fetch Details Helper
  const fetchFacilityDetails = async (facilityId: string) => {
    try {
      // Determine table based on ID format (UUID vs BigInt)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

      let query = supabase.from('facilities').select('*');

      if (isUUID) {
        query = query.eq('id', facilityId);
      } else {
        query = query.eq('legacy_id', facilityId);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      console.log(`✅ [DEBUG] Fetched Data from facilities:`, data);

      if (data) {
        const realUuid = data.id;

        const [subscription, rawReviews, images] = await Promise.all([
          getFacilitySubscription(realUuid),
          import('./lib/queries').then(m => m.getReviewsBySpace(realUuid)),
          import('./lib/queries').then(m => m.getFacilityImages(realUuid))
        ]);

        const reviews = (rawReviews || []).map((r: any) => ({
          ...r,
          userName: r.userName || r.user_name || '익명',
          date: r.date || (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '')
        }));

        // 🔄 Category/Type Normalization (Use item.type as primary)
        const name = data.name || '';
        const resolvedCategory = data.type || data.category || 'charnel';

        let type: any = 'charnel';
        if (resolvedCategory === 'funeral_hall' || resolvedCategory === 'funeral' || resolvedCategory === 'funeral_home') type = 'funeral';
        else if (resolvedCategory === 'charnel_house' || resolvedCategory === 'charnel' || resolvedCategory === 'memorial' || resolvedCategory === 'columbarium') type = 'charnel';
        else if (resolvedCategory === 'natural_burial' || resolvedCategory === 'natural' || resolvedCategory === 'tree_burial') type = 'natural';
        else if (resolvedCategory === 'park_cemetery' || resolvedCategory === 'park' || resolvedCategory === 'complex' || resolvedCategory === 'cemetery') type = 'park';
        else if (resolvedCategory === 'pet_funeral' || resolvedCategory === 'pet' || resolvedCategory === 'pet_memorial') type = 'pet';
        else if (resolvedCategory === 'sea_burial' || resolvedCategory === 'sea') type = 'sea';
        else if (name.includes('프리드라이프') || name.includes('대명스테이션') || name.includes('보람상조') || name.includes('교원라이프')) type = 'sangjo';

        const categoryLabels: Record<string, FacilityCategoryType> = {
          'funeral': '장례식장',
          'charnel': '봉안시설',
          'natural': '자연장',
          'park': '공원묘지',
          'pet': '동물장례',
          'sea': '해양장',
          'sangjo': '상조'
        };
        const mappedCategory = categoryLabels[type] || '봉안시설';

        // 🖼️ Image Logic (Sync with fetchFacilities)
        const rawImages = data.images || [];
        const dbImageUrl = data.image_url || '';
        const isBadUrl = (url: string) => {
          if (!url) return true;
          const bad = ['placeholder', 'placehold.it', 'placehold.co', 'unsplash', 'noimage', 'guitar', '_random', '/defaults/'];
          return bad.some(p => url.toLowerCase().includes(p));
        };

        // 1. First Pass: REAL photo
        let selectedImage = rawImages.find((url: string) => !isBadUrl(url)) || (isBadUrl(dbImageUrl) ? null : dbImageUrl);

        // 2. Second Pass: Allow internal placeholders if no real photo
        if (!selectedImage) {
          const isOnlyMissing = (url: string) => {
            if (!url) return true;
            return ['placeholder', 'noimage', 'guitar'].some(p => url.toLowerCase().includes(p));
          };
          selectedImage = rawImages.find((url: string) => !isOnlyMissing(url)) || (isOnlyMissing(dbImageUrl) ? null : dbImageUrl);
        }

        if (!selectedImage) {
          const defaultMap: Record<string, string[]> = {
            'funeral': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
              'https://images.unsplash.com/photo-1516733968668-dbdce39c4a41?q=80&w=800',
              'https://images.unsplash.com/photo-1544161515-4af62f4b92ba?q=80&w=800'
            ],
            'charnel': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg',
              'https://images.unsplash.com/photo-1518135714426-c18f5fe26967?q=80&w=800',
              'https://images.unsplash.com/photo-1471623197343-ccb79a1bd717?q=80&w=800'
            ],
            'natural': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg',
              'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800',
              'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800'
            ],
            'park': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
              'https://images.unsplash.com/photo-1531171012276-10f293385226?q=80&w=800',
              'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800'
            ],
            'pet': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
              'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800',
              'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800'
            ],
            'sea': [
              'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
              'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=800',
              'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800'
            ]
          };

          const idNum = data.id ? data.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
          const options = defaultMap[type] || defaultMap['funeral'];
          const variantIndex = idNum % options.length;
          selectedImage = options[variantIndex];
        }

        const updatedFacility: Facility = {
          id: data.id?.toString(),
          name: data.name,
          category: mappedCategory as any,
          type: type,
          religion: data.religion || 'none',
          address: data.address,
          lat: Number(data.lat || data.latitude || (data.location?.coordinates ? data.location.coordinates[1] : 0)),
          lng: Number(data.lng || data.longitude || (data.location?.coordinates ? data.location.coordinates[0] : 0)),
          priceRange: data.price_min ? `${(data.price_min / 10000).toLocaleString()}만원~` : '가격 정보 상담',
          rating: Number(data.rating || 0),
          reviewCount: Number(data.reviews_count || 0),
          imageUrl: selectedImage,
          description: data.description || '',
          features: data.ai_features || data.features || [],
          phone: data.phone || data.contact || '',
          prices: data.prices || [],
          galleryImages: rawImages,
          reviews: reviews.length > 0 ? reviews : [],
          naverBookingUrl: data.naver_booking_url,
          isDetailLoaded: true,
          isVerified: data.is_verified || false,
          dataSource: 'db',
          priceInfo: data.price_info || null,
          products: data.price_info?.products || [],
          aiContext: data.ai_context || '',
          subscription: subscription || undefined
        };

        if (!updatedFacility.lat && data.location && data.location.type === 'Point') {
          updatedFacility.lng = data.location.coordinates[0];
          updatedFacility.lat = data.location.coordinates[1];
        }

        const existing = facilities.find(f => f.id === realUuid || f.id === facilityId);
        if (existing) {
          if (!updatedFacility.lat) { updatedFacility.lat = existing.lat; updatedFacility.lng = existing.lng; }
          if (updatedFacility.rating === 0) updatedFacility.rating = existing.rating;
          if (updatedFacility.reviewCount === 0) updatedFacility.reviewCount = existing.reviewCount;
        }

        setFacilities(prev => prev.map(f => f.id === realUuid || f.id === facilityId ? updatedFacility : f));
        setSelectedFacility(updatedFacility);
      }
    } catch (err) {
      console.error("Detail fetch error:", err);
    }
  };

  const handleFacilitySelect = async (facility: Facility) => {
    console.log('👆 [DEBUG] handleFacilitySelect CLICKED:', facility.name, facility.id, 'Loaded:', facility.isDetailLoaded);
    setSelectedFacility(facility);

    // Lazy Load Details
    if (isSupabaseConfigured() && !facility.isDetailLoaded && facility.id.startsWith('db-') === false) { // Assuming db- random ID means not real Supabase ID? No, fetch map uses random if id missing? 
      // Actually my mapping uses `item.id` OR random. If real DB, it has item.id.
      // If facility.isDetailLoaded is undefined or false.
      // Fallback data (constants) doesn't have isDetailLoaded, so it's undefined. 
      // But we shouldn't fetch for constants.
      // fetchFacilities sets isDetailLoaded: false.
      // So checks: isSupabaseConfigured() AND facility.isDetailLoaded === false.

      // showToast("상세 정보를 불러옵니다...", 'info');
      await fetchFacilityDetails(facility.id);
    }
  };

  const handleViewOnMap = () => {
    if (selectedFacility) {
      setTargetMapCenter([selectedFacility.lat || 0, selectedFacility.lng || 0]);
      setTargetMapZoom(16);
      // Also close the sheet so user sees the map
      setSelectedFacility(null);
    }
    setViewState(ViewState.MAP);
  };

  const toggleCompare = (facility: Facility) => {
    setCompareList(prev => {
      const exists = prev.find(f => f.id === facility.id);
      if (exists) {
        showToast("비교함에서 제거되었습니다.", 'info');
        return prev.filter(f => f.id !== facility.id);
      }
      if (prev.length >= 3) {
        showToast("비교함에는 최대 3개까지만 담을 수 있습니다.", 'error');
        return prev;
      }
      showToast("비교함에 추가되었습니다. 하단 아이콘을 눌러 비교해보세요!", 'success');
      return [...prev, facility];
    });
  };

  const handleAddReview = (facilityId: string, content: string, rating: number) => {
    const newReview: Review = {
      id: `r-new-${Date.now()}`,
      userId: user?.id || 'anon',
      user_id: user?.id || 'anon',
      facility_id: facilityId,
      userName: userInfo?.name || '익명',
      rating,
      date: new Date().toLocaleDateString(),
      content
    };

    const updateFacility = (f: Facility) => {
      const currentReviews = f.reviews || [];
      const newCount = (f.reviewCount || 0) + 1;
      const newRating = Number((((f.rating || 0) * (f.reviewCount || 0) + rating) / newCount).toFixed(1));

      return {
        ...f,
        reviews: [newReview, ...currentReviews],
        reviewCount: newCount,
        rating: newRating
      };
    };

    setFacilities(prev => prev.map(f => f.id === facilityId ? updateFacility(f) : f));

    if (selectedFacility && selectedFacility.id === facilityId) {
      setSelectedFacility(prev => prev ? updateFacility(prev) : null);
    }
    showToast("리뷰가 등록되었습니다.");
  };

  const handleReviewDeleted = (facilityId: string, reviewId: string, rating: number) => {
    const updateFacility = (f: Facility) => {
      const currentReviews = f.reviews || [];
      const newReviews = currentReviews.filter(r => r.id !== reviewId);
      const newCount = Math.max(0, (f.reviewCount || 0) - 1);

      // Calculate new average rating
      let newRating = 0;
      if (newCount > 0) {
        // (Current Total Score - Deleted Rating) / New Count
        // Current Total Score = Current Rating * Current Count
        // Note: Using stored review data if available might be more accurate, 
        // but simple calculation is often enough for optimistic UI.
        const currentTotalScore = (f.rating || 0) * (f.reviewCount || 0);
        newRating = Number(((currentTotalScore - rating) / newCount).toFixed(1));
        // Clamp between 0 and 5 just in case
        newRating = Math.max(0, Math.min(5, newRating));
      }

      return {
        ...f,
        reviews: newReviews,
        reviewCount: newCount,
        rating: newRating
      };
    };

    setFacilities(prev => prev.map(f => f.id === facilityId ? updateFacility(f) : f));

    if (selectedFacility && selectedFacility.id === facilityId) {
      setSelectedFacility(prev => prev ? updateFacility(prev) : null);
    }
    showToast("리뷰가 삭제되었습니다.", 'info');
  };

  const handleBookingConfirm = async (reservation: Reservation) => {
    if (!isSignedIn) {
      showToast("예약을 위해 로그인이 필요합니다.", 'error');
      setShowLoginModal(true);
      setIsBooking(false);
      return;
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user?.id,
          facility_id: reservation.facilityId,
          facility_name: reservation.facilityName,
          visit_date: reservation.date.toISOString(),
          time_slot: reservation.timeSlot,
          visitor_name: reservation.visitorName,
          visitor_count: reservation.visitorCount,
          purpose: reservation.purpose,
          special_requests: reservation.specialRequests,
          status: reservation.status,
          payment_amount: reservation.paymentAmount
        })
        .select()
        .single();

      if (error) throw error;

      setReservations(prev => [...prev, reservation]);
      setIsBooking(false);
      setSelectedFacility(null);
      setViewState(ViewState.MY_PAGE);
      showToast("예약이 확정되었습니다!");
    } catch (err) {
      console.error('Reservation error:', err);
      showToast("예약 중 오류가 발생했습니다.", 'error');
    }
  };

  const toggleSangjoCompare = (company: FuneralCompany) => {
    setSangjoCompareList(prev => {
      const exists = prev.find(c => c.id === company.id);
      if (exists) {
        showToast("비교함에서 제외되었습니다.");
        return prev.filter(c => c.id !== company.id);
      }
      if (prev.length >= 3) {
        showToast("최대 3개 업체까지만 비교 가능합니다.", 'info');
        return prev;
      }
      showToast("비교함에 추가되었습니다.");
      return [...prev, company];
    });
  };

  // Admin Actions
  const handleUpdateReservation = (id: string, status: 'confirmed' | 'cancelled') => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // If Admin View, render completely separate layout
  if (viewState === ViewState.ADMIN) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminView
          facilities={facilities}
          reservations={reservations}
          onUpdateReservationStatus={handleUpdateReservation}
          onExitAdmin={() => {
            window.location.hash = '';
            setViewState(ViewState.MAP);
          }}
        />
      </Suspense>
    );
  }

  // Normal User App Layout
  const mapDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMapBoundsChange = (bounds: L.LatLngBounds) => {
    setMapBounds(bounds);

    // Server-Side Viewport Fetching (Debounced)
    if (mapDebounceRef.current) {
      clearTimeout(mapDebounceRef.current);
    }

    mapDebounceRef.current = setTimeout(async () => {
      const fetchedData = await fetchFacilitiesInView(bounds);
      if (fetchedData && fetchedData.length > 0) {
        // Transform fetched data to match Facility interface if needed
        // The SQL returns consistent columns, but we need to map to Facility type
        const mappedFacilities: Facility[] = fetchedData.map((f: any) => {
          // 🔄 Robust Normalization (Same as fetchFacilities)
          const rawType = f.type || f.category || 'charnel';
          let normalizedType = 'charnel';

          if (rawType === 'funeral_home' || rawType === 'funeral' || rawType === 'funeral_hall') normalizedType = 'funeral';
          else if (rawType === 'charnel_house' || rawType === 'charnel' || rawType === 'memorial' || rawType === 'columbarium') normalizedType = 'charnel';
          else if (rawType === 'natural_burial' || rawType === 'natural' || rawType === 'tree_burial') normalizedType = 'natural';
          else if (rawType === 'park_cemetery' || rawType === 'park' || rawType === 'complex' || rawType === 'cemetery') normalizedType = 'park';
          else if (rawType === 'pet_funeral' || rawType === 'pet' || rawType === 'pet_memorial') normalizedType = 'pet';
          else if (rawType === 'sea_burial' || rawType === 'sea') normalizedType = 'sea';
          else if (rawType === 'sangjo') normalizedType = 'sangjo';

          const categoryMap: Record<string, any> = {
            'funeral': 'funeral_home',
            'charnel': 'columbarium',
            'natural': 'natural_burial',
            'park': 'cemetery',
            'pet': 'pet_funeral',
            'sea': 'sea_burial',
            'sangjo': 'sangjo'
          };
          const mappedCategory = categoryMap[normalizedType] || 'columbarium';

          return {
            id: f.id,
            name: f.name,
            category: mappedCategory, // Safe Normalized Category
            type: normalizedType,     // Safe Short Type
            address: f.address,
            lat: Number(f.lat || f.latitude), // Safe Number (Handle both RPC versions)
            lng: Number(f.lng || f.longitude), // Safe Number (Handle both RPC versions)
            imageUrl: f.image_url || (f.images && f.images.length > 0 ? f.images[0] : null),
            rating: Number(f.rating || 0),
            reviewCount: f.review_count || 0,
            priceRange: '가격 정보 상담',
            features: {},
            images: f.images || []
          };
        });
        setFacilities(mappedFacilities);
      }
    }, 300); // 300ms debounce
  };

  const renderContent = () => {
    switch (viewState) {
      case ViewState.MAP:
        return (
          <>
            <MapComponent
              ref={mapRef}
              facilities={filteredFacilities}
              onFacilitySelect={handleFacilitySelect}
              onBoundsChange={handleMapBoundsChange}
              initialCenter={targetMapCenter || [userLocation.lat, userLocation.lng]}
              initialZoom={targetMapZoom || (userLocation.type === 'gps' ? 14 : undefined)}
            />

            <div className="absolute bottom-24 left-4 z-30 flex flex-col gap-3 pointer-events-none">
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
                  className="bg-white p-3 rounded-xl shadow-lg text-gray-700 active:scale-95 transition-transform"
                  onClick={() => mapRef.current?.flyToLocation()}
                >
                  <Crosshair size={22} />
                </button>
              </div>
            </div>
          </>
        );

      case ViewState.LIST:
        return (
          <div className="h-full relative">
            <div className="h-full flex flex-col pt-24 pb-20 bg-gray-50">
              <div className="px-4 shrink-0">
                {/* Spacers */}
                {/* Spacers - Increased to h-40 to clear the top-44 absolute banner */}
                {showPromo && <div className="h-40"></div>}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">추천 시설 목록</h2>
                  {isDataLoading && (
                    <div className="text-xs text-primary flex items-center gap-1">
                      <Database size={12} className="animate-pulse" /> 로딩중...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 px-4 min-h-0">
                <FacilityList
                  facilities={filteredFacilities}
                  onSelect={handleFacilitySelect}
                  compareList={compareList}
                  onToggleCompare={toggleCompare}
                />
              </div>
            </div>

            {/* Floating Action Buttons Area - Adjusted z-index and bottom position */}
            <div className="absolute bottom-20 right-0 left-0 px-4 pointer-events-none z-30 flex justify-center items-end">


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
                onBack={() => {
                  window.location.hash = '';
                  setViewState(ViewState.MAP);
                }}
                onLoginClick={handleLoginClick}
              />
            </div>
          </Suspense>
        );

      case ViewState.MY_PAGE:
        return (
          <MyPageView
            isLoggedIn={!!isSignedIn}
            user={userInfo}
            userRole={userRole}
            reservations={reservations}
            facilities={facilities}
            onLoginClick={handleLoginClick}
            onReviewDeleted={handleReviewDeleted}
          />
        );

      case ViewState.GUIDE:
        return <GuideView onBack={() => setViewState(ViewState.MAP)} />;
      case ViewState.NOTICES:
        return <NoticesView onBack={() => setViewState(ViewState.MAP)} />;
      case ViewState.SUPPORT:
        return <SupportView onBack={() => setViewState(ViewState.MAP)} />;
      case ViewState.SETTINGS:
        return <SettingsView onBack={() => setViewState(ViewState.MAP)} user={userInfo} />;

      case ViewState.CONSULTATION:
        if (!consultingFacility) return null;
        return (
          <ConsultationView
            facility={consultingFacility}
            existingConsultation={selectedConsultation}
            onBack={() => {
              setViewState(ViewState.MAP);
              setConsultingFacility(null);
              setSelectedConsultation(null);
            }}
            onOpenHistory={() => setViewState(ViewState.CONSULTATION_HISTORY)}
            onOpenLogin={() => setShowLoginModal(true)}
          />
        );

      case ViewState.CONSULTATION_HISTORY:
        return (
          <ConsultationHistoryView
            facilities={facilities}
            onBack={() => setViewState(ViewState.MY_PAGE)}
            onSelectConsultation={(consultation) => {
              const facility = facilities.find(f => f.id === consultation.spaceId);
              if (facility) {
                setConsultingFacility(facility);
                setSelectedConsultation(consultation);
                setViewState(ViewState.CONSULTATION);
              } else {
                showToast("해당 시설 정보를 찾을 수 없습니다.", 'error');
              }
            }}
          />
        );

      case ViewState.FACILITY_ADMIN:
        // [Security Fix] Only allow facility_admin role
        if (userRole !== 'facility_admin') {
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
          <div className="h-full relative flex flex-col">
            <FacilityAdminView
              user={userInfo}
              facilities={facilities}
              onNavigate={(view, context) => {
                if (context?.facilityId) {
                  setAdminFacilityId(context.facilityId);
                }
                setViewState(view);
              }}
            />
          </div>
        );

      case ViewState.SUBSCRIPTION_PLANS:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <div className="h-full relative flex flex-col">
              <div className="bg-white p-4 shadow-sm border-b flex items-center gap-3">
                <button
                  onClick={() => setViewState(ViewState.FACILITY_ADMIN)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-lg">구독 플랜 설정</h1>
              </div>
              <div className="flex-1 overflow-auto">
                <SubscriptionPlans
                  facilityId={adminFacilityId || undefined}
                  type={userRole === 'sangjo_hq_admin' ? 'sangjo' : 'facility'} // 고단가 요금제 노출 조건 수정
                  onSelectPlan={async (planId) => {
                    if (adminFacilityId) {
                      try {
                        const { updateFacilitySubscription } = await import('./lib/queries');
                        await updateFacilitySubscription(adminFacilityId, planId);
                        showToast('구독 정보가 업데이트되었습니다.', 'success');
                        // Refresh data
                        window.location.reload();
                      } catch (err) {
                        showToast('구독 정보 업데이트에 실패했습니다.', 'error');
                      }
                    }
                  }}
                />
              </div>
            </div>
          </Suspense>
        );

      case ViewState.FUNERAL_COMPANIES:
        return (
          <FuneralCompanyView
            onCompanySelect={async (company, startChat) => {
              // [Fix] Fetch fresh data from DB to ensure we have products AND reviews
              let productData = company.products;
              let reviewData: any[] = [];
              let fetched = false;

              const relatedFacility = facilities.find(f => f.name === company.name && f.type === 'sangjo');
              // [Fix] Support both UUID and Legacy ID
              let searchId: string | number | null = null;

              // 1. Try to find ID from related facility or company object
              if (relatedFacility && relatedFacility.id) {
                searchId = relatedFacility.id;
              } else if (company.id && !company.id.startsWith('fc_')) {
                // Use company.id if it's not a static ID (starts with fc_)
                searchId = company.id;
              }


              // [Fix] Fully Robust Logic: UUID (Facilities) <-> Integer (Memorial_Spaces)

              // 2026-01-17: 'facilities' table has UUID but NO price_info.
              // 'memorial_spaces' table has Integer ID AND price_info.
              // 'reviews' table uses facility_id (UUID).

              if (searchId) {
                const searchIdStr = searchId.toString();
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchIdStr);

                let uuid: string | null = null;
                let legacyId: number | null = null;

                if (isUuid) {
                  uuid = searchIdStr;
                  // Fetch Legacy ID from facilities to query memorial_spaces
                  const { data: facData } = await supabase
                    .from('facilities')
                    .select('legacy_id')
                    .eq('id', uuid)
                    .maybeSingle();

                  if (facData && facData.legacy_id) {
                    const parsed = parseInt(facData.legacy_id, 10);
                    if (!isNaN(parsed)) legacyId = parsed;
                  }
                } else {
                  // It is already a legacy numeric ID (from static data?)
                  const parsed = parseInt(searchIdStr, 10);
                  if (!isNaN(parsed)) {
                    legacyId = parsed;
                    // Fetch UUID from facilities to get reviews
                    const { data: facData } = await supabase
                      .from('facilities')
                      .select('id')
                      .eq('legacy_id', searchIdStr)
                      .maybeSingle();
                    if (facData) uuid = facData.id;
                  }
                }

                // 1. Fetch Products from 'memorial_spaces' (Requires Integer ID)
                if (legacyId) {
                  const { data } = await supabase
                    .from('memorial_spaces')
                    .select('price_info')
                    .eq('id', legacyId) // Integer column
                    .maybeSingle();

                  if (data && data.price_info && data.price_info.products) {
                    productData = data.price_info.products;
                  }
                }

                // 2. Fetch Reviews from 'reviews' (Requires UUID)
                if (uuid) {
                  const { data: reviews } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('facility_id', uuid) // UUID column
                    .order('created_at', { ascending: false });

                  if (reviews) {
                    reviewData = reviews;
                  }
                }
              } else {
                // Fallback: Fetch ID by name to get reviews
                try {
                  const { data } = await supabase
                    .from('memorial_spaces')
                    .select('id, price_info')
                    .eq('name', company.name)
                    .maybeSingle();

                  if (data) {
                    if (data.price_info && data.price_info.products) {
                      productData = data.price_info.products;
                    }
                    // Now fetch reviews with this ID
                    const { data: reviews } = await supabase
                      .from('reviews')
                      .select('*')
                      .eq('facility_id', data.id)
                      .order('created_at', { ascending: false });

                    if (reviews) reviewData = reviews;
                  }
                } catch (e) { console.error('Name fallback failed', e); }
              }

              const mergedCompany = {
                ...company,
                products: productData,
                // [FIX] Map user_name to userName for ReviewCard compatibility
                reviews: reviewData.map((r: any) => ({
                  ...r,
                  userName: r.user_name || '익명',
                  userId: r.user_id,
                  date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''
                }))
              };

              setSelectedFuneralCompany(mergedCompany);
              if (startChat) {
                setShowSangjoAIConsult(true);
              }
            }}
            onBack={() => setViewState(ViewState.MAP)}
            compareList={sangjoCompareList}
            onToggleCompare={toggleSangjoCompare}
            onShowComparison={() => setShowSangjoComparison(true)}
            isLoggedIn={!!isSignedIn}
            onOpenLogin={() => setShowLoginModal(true)}
          />
        );

      case ViewState.SANGJO_DASHBOARD:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SangjoDashboard
              sangjoId={adminSangjoId || 'a-sangjo'}
              onBack={() => setViewState(ViewState.MAP)}
            />
          </Suspense>
        );

      // @ts-ignore
      case 'SUPER_ADMIN':
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
              <button onClick={() => setShowLoginModal(true)} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">
                로그인하기
              </button>
              <button onClick={() => setViewState(ViewState.MAP)} className="mt-4 text-gray-500 underline text-sm">
                메인으로 돌아가기
              </button>
            </div>
          );
        }

        // Security Check: Allow specific email OR super_admin role
        // user_id check is also done in getUserRole
        if (userInfo.email !== 'blacknacoof@gmail.com' && userRole !== 'super_admin') {
          return (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <Shield className="text-red-500 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2 text-red-600">접근 권한이 없습니다</h2>
              <p className="text-gray-600 mb-6">오직 승인된 관리자 계정(blacknacoof@gmail.com)만 접근할 수 있습니다.</p>
              <button onClick={() => setViewState(ViewState.MAP)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                메인으로 돌아가기
              </button>
            </div>
          );
        }

        return (
          <div className="h-full relative flex flex-col">
            <div className="bg-white p-4 shadow mb-4 flex flex-wrap justify-between items-center gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-bold text-base sm:text-lg whitespace-nowrap">슈퍼 관리자 : {userInfo.name}</h1>
                <button
                  onClick={() => setViewState(ViewState.SANGJO_DASHBOARD)}
                  className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold hover:bg-amber-200 whitespace-nowrap"
                >
                  상조 관제 대시보드 바로가기
                </button>
              </div>
              <button onClick={() => setViewState(ViewState.MAP)} className="text-sm p-2 bg-gray-100 rounded">나가기</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Dynamic Import to avoid circular dependency or load weight if possible, but standard import ok for now */}
              <SuperAdminDashboard />
            </div>
          </div>
        );

      default:
        return null;
    }
  };




  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="h-full w-full relative bg-gray-100 flex justify-center overflow-hidden">
        {/* Mobile Container Limit */}
        <div className="w-full h-full md:max-w-md bg-white relative shadow-2xl flex flex-col">
          {/* Role Loading Overlay Removed to prevent blocking users */}

          {/* Role Error Alert */}{/* ... */}

          {/* Role Error Alert */}
          {roleError && import.meta.env.DEV && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-sm">역할 조회 오류</h3>
                <p className="text-red-600 text-[10px] mt-1 break-all">{roleError}</p>
              </div>
              <button
                onClick={() => setRoleError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Top Bar - Only on Main Views */}
          {(viewState === ViewState.MAP || viewState === ViewState.LIST || viewState === ViewState.MY_PAGE) && (
            <>
              {/* 🚧 Step 3-1: Parallel Implementation Test - Temporary Placement */}
              {viewState !== ViewState.MY_PAGE && (
                <div className="absolute top-16 left-0 right-0 z-[60] px-4 pointer-events-none">
                  <div className="pointer-events-auto">
                    <FilterBar />
                  </div>
                </div>
              )}

              <div className={`absolute z-30 flex gap-2 transition-all duration-300 ${viewState === ViewState.LIST
                ? 'top-0 left-0 right-0 p-4 bg-white/95 backdrop-blur shadow-sm'
                : 'top-4 left-4 right-4'
                }`}>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="bg-white p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform"
                >
                  <Menu size={20} />
                </button>

                {viewState === ViewState.MY_PAGE ? (
                  <div className="flex-1 bg-white rounded-xl shadow-md flex items-center justify-center h-12">
                    <span className="font-bold text-gray-800">내 정보</span>
                  </div>
                ) : (
                  <div className="flex-1 h-12" /> // Spacer
                )}

                {
                  viewState === ViewState.LIST && (
                    <button
                      onClick={() => setViewState(ViewState.MAP)}
                      className="bg-white p-3 rounded-xl shadow-md text-primary active:scale-95 transition-transform border border-primary/20"
                      title="지도 보기"
                    >
                      <MapIcon size={20} />
                    </button>
                  )
                }





                {
                  viewState === ViewState.MY_PAGE && (
                    <button
                      onClick={() => setViewState(ViewState.SETTINGS)}
                      className="bg-white p-3 rounded-xl shadow-md text-gray-700 active:scale-95 transition-transform"
                    >
                      <Settings size={20} />
                    </button>
                  )
                }
              </div>

              {/* Promo Banner - Persistent underneath filters */}
              {
                showPromo && (viewState === ViewState.MAP || viewState === ViewState.LIST) && (
                  <div className={`absolute left-4 right-4 z-20 animate-in fade-in slide-in-from-top-2 transition-all duration-300 top-44`}>
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
                )
              }


            </>
          )}

          {/* Main Content */}
          <div className="flex-1 relative overflow-hidden">
            <Suspense fallback={<LoadingFallback />}>
              {renderContent()}
            </Suspense>
          </div>

          {/* Bottom Navigation for Mobile */}
          {/* Bottom Navigation for Mobile */}
          {
            (viewState === ViewState.MAP || viewState === ViewState.LIST || viewState === ViewState.MY_PAGE || viewState === ViewState.SETTINGS || viewState === ViewState.GUIDE || viewState === ViewState.FUNERAL_COMPANIES) && (
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-[200] safe-area-bottom">
                <button
                  onClick={() => setViewState(ViewState.MAP)}
                  className={`flex flex-col items-center ${viewState === ViewState.MAP ? 'text-primary' : 'text-gray-400'}`}
                >
                  <MapIcon size={24} strokeWidth={viewState === ViewState.MAP ? 2.5 : 2} />
                  <span className="text-[10px] mt-1 font-medium">지도</span>
                </button>
                <button
                  onClick={() => setViewState(ViewState.LIST)}
                  className={`flex flex-col items-center ${viewState === ViewState.LIST ? 'text-primary' : 'text-gray-400'}`}
                >
                  <List size={24} strokeWidth={viewState === ViewState.LIST ? 2.5 : 2} />
                  <span className="text-[10px] mt-1 font-medium">목록</span>
                </button>
                <button
                  onClick={() => setViewState(ViewState.FUNERAL_COMPANIES)}
                  className={`flex flex-col items-center ${viewState === ViewState.FUNERAL_COMPANIES ? 'text-primary' : 'text-gray-400'}`}
                >
                  <Award size={24} strokeWidth={viewState === ViewState.FUNERAL_COMPANIES ? 2.5 : 2} />
                  <span className="text-[10px] mt-1 font-medium">상조</span>
                </button>
                <button
                  onClick={() => setViewState(ViewState.MY_PAGE)}
                  className={`flex flex-col items-center ${viewState === ViewState.MY_PAGE ? 'text-primary' : 'text-gray-400'}`}
                >
                  <User size={24} strokeWidth={viewState === ViewState.MY_PAGE ? 2.5 : 2} />
                  <span className="text-[10px] mt-1 font-medium">내 정보</span>
                </button>
              </div>
            )
          }

          {/* Toast Notification */}
          {
            toast && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full px-4 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                <div className={`bg-gray-900/90 text-white px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm flex items-center justify-between gap-3 ${toast.type === 'error' ? 'bg-red-900/90' : toast.type === 'info' ? 'bg-blue-900/90' : 'bg-gray-900/90'
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
            )
          }

          {/* Overlays */}
          <SideMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onNavigate={(view) => setViewState(view)}
            reservationCount={reservations.length}
            isLoggedIn={isSignedIn}
            user={userInfo}
            onLogin={handleLoginClick}
            onLogout={handleLogout}
            userRole={userRole}
          />

          {
            showLoginModal && (
              <LoginModal
                onClose={() => setShowLoginModal(false)}
                onLogin={() => {
                  setShowLoginModal(false);
                  showToast("로그인 되었습니다!");
                }}
                onSignUpClick={() => {
                  setShowLoginModal(false);
                  setShowSignUpModal(true);
                }}
                onAdminLogin={() => {
                  setShowLoginModal(false);
                  setViewState(ViewState.ADMIN);
                  showToast("관리자 모드로 접속합니다.", 'success');
                }}
              />
            )
          }

          {
            showSignUpModal && (
              <SignUpModal
                onClose={() => setShowSignUpModal(false)}
                onSignUp={() => {
                  setShowSignUpModal(false);
                  showToast("환영합니다! 회원가입이 완료되었습니다.");
                }}
                onLoginClick={() => {
                  setShowSignUpModal(false);
                  setShowLoginModal(true);
                }}
              />
            )
          }

          {
            selectedFacility && (
              <FacilitySheet
                facility={selectedFacility}
                onClose={() => setSelectedFacility(null)}
                onBook={() => setIsBooking(true)}
                onViewMap={handleViewOnMap}
                isLoggedIn={isSignedIn}
                currentUser={userInfo}
                onAddReview={handleAddReview}
                onLoginRequired={() => {
                  setSelectedFacility(null);
                  setShowLoginModal(true);
                }}
                isInCompareList={compareList.some(f => f.id === selectedFacility.id)}
                onToggleCompare={() => toggleCompare(selectedFacility)}
                reservations={reservations}
                onOpenConsultation={() => {
                  // Keep legacy support or redirect to new chat
                  setAiChatFacility(selectedFacility);
                }}
                onOpenAiChat={() => {
                  setAiChatFacility(selectedFacility);
                }}
                onViewSangjoList={() => {
                  setViewState(ViewState.FUNERAL_COMPANIES);
                  setSelectedFacility(null);
                }}
              />
            )
          }

          {/* AI Helper - Maum-i */}
          {viewState === ViewState.MAP && !selectedFacility && !showComparison && !aiChatFacility && (
            <RecommendationStarter
              onSelectIntent={(intent) => {
                setInitialChatIntent(intent);
                setAiChatFacility({ name: '통합 AI 마음이', id: 'maum-i', type: 'assistant' } as any);
              }}
            />
          )}

          {/* Global Chat Interface (Maum-i or Specific Facility) */}


          {
            isBooking && selectedFacility && (
              <ReservationModal
                facility={selectedFacility}
                onClose={() => {
                  setIsBooking(false);
                  setIsUrgentBooking(false);
                }}
                onConfirm={handleBookingConfirm}
                reservationMode={isUrgentBooking ? 'URGENT' : 'STANDARD'}
              />
            )
          }

          {
            showComparison && (
              <ComparisonModal
                facilities={compareList}
                onClose={() => setShowComparison(false)}
                onRemove={(id) => setCompareList(prev => prev.filter(f => f.id !== id))}
                onBook={(facility) => {
                  setShowComparison(false);
                  setSelectedFacility(facility);
                  setIsBooking(true);
                }}
              />
            )
          }

          {
            selectedFuneralCompany && (
              <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-3 rounded-full shadow-lg"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>}>
                <FuneralCompanySheet
                  company={selectedFuneralCompany}
                  onClose={() => setSelectedFuneralCompany(null)}
                  onOpenAIConsult={() => {
                    setShowSangjoAIConsult(true);
                  }}
                  onOpenContract={() => {
                    setShowSangjoContract(true);
                  }}
                  currentUser={userInfo}
                  isLoggedIn={isSignedIn}
                  onOpenLogin={() => {
                    setShowLoginModal(true);
                    setSelectedFuneralCompany(null); // Close sheet to reveal login modal
                  }}
                />
              </Suspense>
            )
          }

          {
            showSangjoAIConsult && (
              <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-3 rounded-full shadow-lg"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>}>
                <SangjoConsultationModal
                  company={selectedFuneralCompany}
                  onClose={() => {
                    setShowSangjoAIConsult(false);
                    setSelectedFuneralCompany(null);
                  }}
                />
              </Suspense>
            )
          }

          {
            showSangjoContract && selectedFuneralCompany && (
              <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-3 rounded-full shadow-lg"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>}>
                <SangjoContractModal
                  company={selectedFuneralCompany}
                  onClose={() => {
                    setShowSangjoContract(false);
                    setSelectedFuneralCompany(null);
                  }}
                  onConfirm={(data) => {
                    // Create a pseudo-reservation for the contract
                    const contractReservation: Reservation = {
                      id: `CONT-${Date.now()}`,
                      facilityId: data.companyId,
                      facilityName: data.companyName,
                      date: new Date(),
                      timeSlot: data.callTime,
                      visitorName: data.name,
                      visitorCount: 1,
                      purpose: '상조 가입 상담',
                      specialRequests: `연락처: ${data.phone}`,
                      status: 'pending',
                      paymentAmount: 0,
                      paidAt: new Date(),
                      funeralCompanyId: data.companyId,
                      funeralCompanyName: data.companyName
                    };
                    handleBookingConfirm(contractReservation);
                  }}
                />
              </Suspense>
            )
          }

          {
            showSangjoComparison && (
              <Suspense fallback={<LoadingFallback />}>
                <SangjoComparisonModal
                  companies={sangjoCompareList}
                  onClose={() => setShowSangjoComparison(false)}
                  onRemove={(id) => setSangjoCompareList(prev => prev.filter(c => c.id !== id))}
                  onSelect={(company) => {
                    setShowSangjoComparison(false);
                    setSelectedFuneralCompany(company);
                  }}
                />
              </Suspense>
            )
          }

          {/* Global AI Chat Overlay */}
          {aiChatFacility && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="w-full h-full md:w-[420px] md:h-[85vh] md:rounded-2xl overflow-hidden bg-white shadow-2xl relative animate-in zoom-in-95 duration-300">
                <ChatInterface
                  facility={aiChatFacility}
                  currentUser={userInfo}
                  initialIntent={initialChatIntent}
                  userLocation={userLocation}
                  onGetCurrentPosition={getCurrentPosition}
                  handoverContext={handoverContext}
                  onClose={() => {
                    setAiChatFacility(null);
                    setInitialChatIntent(null);
                  }}
                  onSearchFacilities={(region: string) => {
                    // Simple Search Logic
                    // 1. Filter by address containing region (e.g. "신촌동")
                    const exactMatches = facilities.filter(f => f.address.includes(region) && f.type === 'funeral'); // Recommend Funeral Homes primarily for Scenario A

                    // 2. Sort by Rating/Review
                    const sorted = exactMatches.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));

                    // 3. Fallback: If no exact matches, fuzzy search or broader region?
                    // For now, return top 3 exact matches. If empty, maybe search "Seoul" if region is "Seoul Sinchon-dong"?
                    // Let's stick to exact match of user input segment.

                    return sorted.slice(0, 3);
                  }}
                  onSwitchToFacility={(target, context) => {
                    setAiChatFacility(target);
                    if (context) setHandoverContext(context);
                  }}
                  onAction={(action, data) => {
                    const isGlobalAI = aiChatFacility?.id === 'maum-i';

                    if (action === 'RESERVE') {
                      // [Feature] Direct booking from AI Recommendation
                      if (data && typeof data === 'object' && 'id' in data) {
                        if (!isSignedIn) {
                          showToast('예약을 위해 로그인이 필요합니다.', 'error');
                          setAiChatFacility(null);
                          setShowLoginModal(true);
                          return;
                        }

                        setAiChatFacility(null); // Close AI Chat
                        setSelectedFacility(data); // Set target facility
                        setIsUrgentBooking(true); // [Fix] Force Urgent Booking for "Book Now"
                        setIsBooking(true); // Open Booking Modal
                        return;
                      }

                      setAiChatFacility(null);
                      if (isGlobalAI) {
                        setViewState(ViewState.LIST);
                        return;
                      }
                      setSelectedFacility(aiChatFacility);
                      // [Fix] Do not force Urgent for standard 'Book Now'. Urgent is separate action.
                      // if (aiChatFacility.type === 'funeral') {
                      //   setIsUrgentBooking(true);
                      // }
                      setIsBooking(true);
                    } else if (action === 'MAP') {
                      setAiChatFacility(null);
                      if (isGlobalAI) {
                        handleViewOnMap();
                        return;
                      }
                      setSelectedFacility(aiChatFacility);
                      handleViewOnMap();
                    } else if (action === 'CALL_MANAGER') {
                      if (isGlobalAI) {
                        alert('고객센터(1588-0000)로 연결합니다.');
                        window.location.href = 'tel:1588-0000';
                        return;
                      }
                      alert(`담당자(${aiChatFacility.phone})에게 연결합니다.`);
                      window.location.href = `tel:${aiChatFacility.phone}`;
                    } else if (action === 'RECOMMEND') {
                      setAiChatFacility(null);
                      if (isGlobalAI) {
                        // If data (search context) is provided and it's not generic "My Location", use it
                        if (data && typeof data === 'string' && !data.includes('내 위치') && !data.includes('GPS')) {
                          setSearchQuery(data);
                        }
                        setViewState(ViewState.LIST);
                        return;
                      }
                      // For specific facility chat, use its address
                      setSearchQuery(aiChatFacility.address.split(' ')[0] || '');
                      setViewState(ViewState.LIST);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[10001] px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white font-medium max-w-md`}>
            {toast.message}
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
