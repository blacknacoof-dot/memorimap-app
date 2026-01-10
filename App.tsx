import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter } from 'react-router-dom';
import MapComponent, { MapRef } from './components/MapContainer';
import { FacilitySheet } from './components/FacilitySheet';
import { ReservationModal } from './components/ReservationModal';
import { SideMenu } from './components/SideMenu';
import { ComparisonModal } from './components/ComparisonModal';
import { LoginModal } from './components/LoginModal';
import { SignUpModal } from './components/SignUpModal';
import { Facility, Reservation, ViewState, Review, FuneralCompany } from './types';
import { RecommendationStarter } from './components/RecommendationStarter';
import { Consultation } from './types/consultation';
import { Menu, Search, Filter, Crosshair, Map as MapIcon, User, List, Settings, Scale, Ticket, X, Check, AlertCircle, Database, Shield, Award, ArrowLeft, Bot, Loader2 } from 'lucide-react';
import { FACILITIES } from './constants';
import { useUser, useClerk } from './lib/auth';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { useAuthSync } from './lib/useAuthSync';
import { getFacilitySubscription, incrementAiUsage } from './lib/queries';
import { FacilityList } from './components/FacilityList';
import { useLocation } from './hooks/useLocation';

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
  const [showFilters, setShowFilters] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true); // Promo Banner State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('전체');

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

        // RPC Call: search_facilities
        const { data, error } = await supabase
          .rpc('search_facilities', {
            lat: center[0],
            lng: center[1],
            radius_meters: 500000, // 500km (Covering whole Korea)
            filter_category: null
          });

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedFacilities = data.map((item: any) => {
            // Category Mapping
            let type: any = 'charnel';
            const name = item.name || '';
            const category = item.category || '';

            if (category === 'funeral_hall' || category === 'funeral') type = 'funeral';
            else if (category === 'charnel_house' || category === 'charnel') type = 'charnel';
            else if (category === 'natural_burial' || category === 'natural') type = 'natural';
            else if (category === 'park_cemetery' || category === 'park') type = 'park';
            else if (category === 'pet_funeral' || category === 'pet') type = 'pet';
            else if (category === 'sea_burial' || category === 'sea') type = 'sea';
            else if (category === 'sangjo' || category === 'sangjo_company' || name.includes('프리드라이프') || name.includes('대명스테이션') || name.includes('보람상조') || name.includes('교원라이프')) type = 'sangjo';

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
                'unsplash', // Known guitar image source in this DB
                'mediahub.seoul.go.kr', // Known broken/placeholder source
                'noimage', 'no-image', 'guitar'
              ];
              return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
            };

            // Selection Logic: Pick the first good one from images[] or use image_url
            let selectedImage = rawImages.find((url: string) => !isBadUrl(url)) || (isBadUrl(dbImageUrl) ? null : dbImageUrl);

            // Ultimate Fallback: Category-based placeholder if nothing found
            if (!selectedImage) {
              const defaultMap: Record<string, string> = {
                'funeral': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg',
                'charnel': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg',
                'natural': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg',
                'park': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
                'pet': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
                'sea': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
                'complex': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg',
                'sangjo': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg'
              };
              selectedImage = defaultMap[type] || defaultMap['funeral'];
            }

            return {
              id: item.id?.toString(),
              name: item.name || '이름 없음',
              type: type,
              religion: 'none',
              address: item.address || '',
              lat: Number(item.lat),
              lng: Number(item.lng),
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
          showToast(`총 ${mappedFacilities.length}개의 시설 정보를 불러왔습니다.`, 'info');
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
  const filteredFacilities = facilities.filter(f => {
    // 0. Remove Invalid Data
    if (f.name === '--------' || f.name.includes('--------')) return false;

    // 1. Geo Filter (Current visible area)
    if (currentBounds && !searchQuery) {
      if (!currentBounds.contains([f.lat, f.lng])) return false;
    }
    // 1. Search Query
    if (searchQuery && !f.name.includes(searchQuery) && !f.address.includes(searchQuery)) {
      return false;
    }
    // 2. Category Filter
    if (selectedFilter !== '전체') {
      if (selectedFilter === '공원묘지') {
        return f.type === 'park' || f.type === 'complex';
      }
      else {
        if (f.type === 'park' || f.type === 'complex') return false;
        if (selectedFilter === '장례식장' && f.type !== 'funeral') return false;
        if (selectedFilter === '봉안시설' && f.type !== 'charnel') return false;
        if (selectedFilter === '자연장' && f.type !== 'natural') return false;
        if (selectedFilter === '해양장' && f.type === 'sea') return true;
        if (selectedFilter === '해양장' && f.type !== 'sea') return false;
        if (selectedFilter === '동물장례' && f.type !== 'pet') return false;
      }
    }
    // 3. Exclude Sangjo from general views (They have their own dedicated tab)
    if (f.type === 'sangjo') return false;

    return true;
  });

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
      const { data, error } = await supabase
        .from('facilities') // Switch to new table
        .select('*')
        .eq('id', facilityId)
        .single();

      if (error) throw error;
      if (data) {
        // Fetch subscription, reviews and images
        // Note: Relation names in getReviewsBySpace/getFacilityImages/getFacilitySubscription might still point to old table or need verification
        // assuming standard relations or logic inside them handles it?
        // Actually queries.ts functions might still use 'memorial_spaces' relation...
        // But getFacilitySubscription uses 'facility_subscriptions'.
        // getReviewsBySpace uses 'facility_reviews'.
        // So they should work IF the foreign keys are valid or logic doesnt strictly join.
        // Actually logic:
        const [subscription, reviews, images] = await Promise.all([
          getFacilitySubscription(facilityId),
          import('./lib/queries').then(m => m.getReviewsBySpace(facilityId)),
          import('./lib/queries').then(m => m.getFacilityImages(facilityId))
        ]);

        // Map Category
        let type: any = 'charnel';
        const name = data.name || '';
        const category = data.category || '';

        if (category === 'funeral_hall' || category === 'funeral') type = 'funeral';
        else if (category === 'charnel_house' || category === 'charnel') type = 'charnel';
        else if (category === 'natural_burial' || category === 'natural') type = 'natural';
        else if (category === 'park_cemetery' || category === 'park') type = 'park';
        else if (category === 'pet_funeral' || category === 'pet') type = 'pet';
        else if (category === 'sea_burial' || category === 'sea') type = 'sea';
        else if (category === 'sangjo' || category === 'sangjo_company' || name.includes('프리드라이프') || name.includes('대명스테이션') || name.includes('보람상조') || name.includes('교원라이프')) type = 'sangjo';

        // Parse Details
        const details = data.details || {};

        const updatedFacility: Facility = {
          id: data.id?.toString(),
          name: data.name,
          type: type,
          religion: details.religion || 'none',
          address: data.address,
          lat: Number(data.location?.coordinates ? data.location.coordinates[1] : 0),
          lng: Number(data.location?.coordinates ? data.location.coordinates[0] : 0),
          // Supabase returns GeoJSON for geography columns usually?
          // Actually supabase-js might return it as string or object.
          // Wait, 'search_facilities' RPC returns lat/lng columns explicitly.
          // But 'facilities' table select('*') returns 'location' column.
          // I need to be careful here. ST_AsGeoJSON? 
          // Safest to keep using the lat/lng from the LIST view if possible, or assume user won't notice until we fix detail fetch.
          // Or Use the RPC logic even for details? No.
          // Let's assume for now we use the lat/lng from the passed facility object via state update?
          // But here we are creating a fresh object.
          // Let's rely on data.location if standard format, OR better: use ST_X/ST_Y in select?
          // I'll assume for this step I might miss lat/lng in detail fetch unless I change the query.
          // .select('*, st_x(location::geometry) as lng, st_y(location::geometry) as lat') NOT supported in standard PostgREST easily without view/rpc.
          // Workaround: Use the lat/lng from the state since we just verified it in the map?
          // But fetchFacilityDetails creates a NEW object.
          // I will try to parse data.location if it comes as GeoJSON { type: 'Point', coordinates: [lng, lat] }


          priceRange: details.price_range || '가격 정보 상담',
          rating: Number(details.rating || 0), // Use details if available
          reviewCount: Number(details.review_count || 0),
          imageUrl: (data.images && data.images[0]) || 'https://placehold.co/800x600?text=No+Image',
          description: details.description || '',
          features: details.features || [],
          phone: data.contact || '',
          prices: details.prices || [],
          galleryImages: images.length > 0 ? images : (data.images || []),
          reviews: reviews.length > 0 ? reviews : [],
          naverBookingUrl: details.naver_booking_url,
          isDetailLoaded: true,
          isVerified: data.is_verified || false,
          dataSource: 'db',
          priceInfo: details.price_info || [],
          aiContext: details.ai_context || '',
          subscription: subscription || undefined
        };

        // Fix Lat/Lng from GeoJSON if possible
        if (data.location && data.location.type === 'Point' && Array.isArray(data.location.coordinates)) {
          updatedFacility.lng = data.location.coordinates[0];
          updatedFacility.lat = data.location.coordinates[1];
        } else {
          // Fallback: Use what we have in state if possible? 
          // Without lat/lng, marker might jump. 
          // But usually details are shown in a Sheet, not moving the marker.
          // MapController uses selectedFacility.lat/lng...
          // IMPORTANT: The previous LIST fetch had valid lat/lng.
          // I should MERGE with existing facility to preserve lat/lng!
          const existing = facilities.find(f => f.id === facilityId);
          if (existing) {
            updatedFacility.lat = existing.lat;
            updatedFacility.lng = existing.lng;
            updatedFacility.rating = updatedFacility.rating || existing.rating; // Keep simulated if 0
            updatedFacility.reviewCount = updatedFacility.reviewCount || existing.reviewCount;
          }
        }

        setFacilities(prev => prev.map(f => f.id === facilityId ? updatedFacility : f));
        setSelectedFacility(updatedFacility);
      }
    } catch (err) {
      console.error("Detail fetch error:", err);
    }
  };

  const handleFacilitySelect = async (facility: Facility) => {
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
      setTargetMapCenter([selectedFacility.lat, selectedFacility.lng]);
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
      user_id: user?.id || 'anon',
      space_id: facilityId,
      userName: userInfo?.name || '익명',
      rating,
      date: new Date().toLocaleDateString(),
      content
    };

    const updateFacility = (f: Facility) => {
      const currentReviews = f.reviews || [];
      const newCount = f.reviewCount + 1;
      const newRating = Number(((f.rating * f.reviewCount + rating) / newCount).toFixed(1));

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
      const newCount = Math.max(0, f.reviewCount - 1);

      // Calculate new average rating
      let newRating = 0;
      if (newCount > 0) {
        // (Current Total Score - Deleted Rating) / New Count
        // Current Total Score = Current Rating * Current Count
        // Note: Using stored review data if available might be more accurate, 
        // but simple calculation is often enough for optimistic UI.
        const currentTotalScore = f.rating * f.reviewCount;
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
  const renderContent = () => {
    switch (viewState) {
      case ViewState.MAP:
        return (
          <>
            <MapComponent
              ref={mapRef}
              facilities={filteredFacilities}
              onFacilitySelect={handleFacilitySelect}
              onBoundsChange={handleBoundsChange}
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
                {showFilters && !showPromo && <div className="h-10"></div>}
                {!showFilters && showPromo && <div className="h-16"></div>}
                {showFilters && showPromo && <div className="h-28"></div>}
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
              <button
                onClick={() => setViewState(ViewState.MAP)}
                className="pointer-events-auto bg-dark text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95 transform hover:-translate-y-1"
              >
                <MapIcon size={16} />
                지도에서 보기
              </button>

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
              <PartnerInquiryView onBack={() => {
                window.location.hash = '';
                setViewState(ViewState.MAP);
              }} />
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
              // [Fix] Fetch fresh data from DB to ensure we have products
              // The RPC used for list view lacks 'price_info', so we fetch explicitly.
              let productData = company.products;
              let fetched = false;

              const relatedFacility = facilities.find(f => f.name === company.name && f.type === 'sangjo');

              // Strategy 1: Fetch by ID (if strictly integer)
              if (relatedFacility && relatedFacility.id) {
                try {
                  const searchId = (typeof relatedFacility.id === 'string' && !isNaN(parseInt(relatedFacility.id)))
                    ? parseInt(relatedFacility.id, 10)
                    : relatedFacility.id;

                  // Only query if it became a number (skips UUIDs)
                  if (typeof searchId === 'number') {
                    const { data } = await supabase
                      .from('memorial_spaces')
                      .select('price_info')
                      .eq('id', searchId)
                      .maybeSingle();

                    if (data && data.price_info && data.price_info.products) {
                      productData = data.price_info.products;
                      fetched = true;
                    }
                  }
                } catch (e) {
                  console.error('Failed to fetch detailed product info by ID', e);
                }
              }

              // Strategy 2: Fetch by Name (Fallback if ID failed or generated no products)
              if (!fetched) {
                try {
                  const { data } = await supabase
                    .from('memorial_spaces')
                    .select('price_info')
                    .eq('name', company.name)
                    .maybeSingle();

                  if (data && data.price_info && data.price_info.products) {
                    productData = data.price_info.products;
                  }
                } catch (e) { console.error('Name fallback failed', e); }
              }

              const mergedCompany = {
                ...company,
                products: productData
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


  const handleSearchSubmit = () => {
    // Check if query matches a region
    const query = searchQuery.trim();
    // Check exact match or if query contains region name (e.g. "서울시" -> "서울")
    // Simple lookup first
    let region = REGION_COORDINATES[query];

    // If not found, try partial match (e.g., user types '경기도' matches '경기')
    if (!region) {
      const regionName = Object.keys(REGION_COORDINATES).find(key => query.includes(key));
      if (regionName) {
        region = REGION_COORDINATES[regionName];
      }
    }

    if (region) {
      setTargetMapCenter(region.center);
      setTargetMapZoom(region.zoom);
      setViewState(ViewState.MAP); // Ensure we are on the map
      showToast(`${query} 지역으로 이동합니다.`);
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
                  <div className="flex-1 bg-white rounded-xl shadow-md flex items-center px-4">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit();
                        }
                      }}
                      placeholder="지역명(서울, 경기...) 또는 시설명 검색"
                      className="w-full h-12 outline-none text-sm bg-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
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
                  viewState !== ViewState.MY_PAGE && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-3 rounded-xl shadow-md transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                    >
                      <Filter size={20} />
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
                  <div className={`absolute left-4 right-4 z-20 animate-in fade-in slide-in-from-top-2 transition-all duration-300 ${showFilters ? 'top-32' : 'top-20'
                    }`}>
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

              {/* Filter Bar */}
              {
                showFilters && (viewState === ViewState.MAP || viewState === ViewState.LIST) && (
                  <div className="absolute top-20 left-0 right-0 z-20 overflow-x-auto filter-scroll touch-pan-x">
                    <div className="flex gap-2 px-4 pb-2 w-max">
                      {/* Simplified Filters: User Request */}
                      {['전체', '장례식장', '봉안시설', '자연장', '공원묘지', '동물장례', '해양장'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setSelectedFilter(f)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm border whitespace-nowrap transition-colors flex-shrink-0 ${selectedFilter === f
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white/90 backdrop-blur text-gray-900 hover:bg-white'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                      {/* Explicit Spacer for Scroll - Larger to ensure no cut-off on tiny screens */}
                      <div className="w-16 shrink-0 h-4" />
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
                    const sorted = exactMatches.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);

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
      </div>
    </HashRouter>
  );
};

export default App;
