import { useState, useEffect } from 'react';
import { Reservation, Facility } from '../../types';
import { getMyReservations, cancelReservation, getUserPhoneNumber } from '../../lib/queries';
import { favoriteService, Favorite } from '../../services/favoriteService';
import type { SangjoFavorite } from '../../services/sangjoFavoriteService';
import { confirmAsync } from '../../src/components/common/ConfirmModal';
import { toast } from 'sonner';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { normalizeType } from '../../utils/facilityNormalizer';

export type ActiveTab = 'consultations' | 'pending' | 'confirmed' | 'cancelled' | 'favorites' | 'sangjo_favorites' | 'reviews';

interface UseMyPageProps {
  isLoggedIn: boolean;
  user: { id: string; name: string; email: string; imageUrl?: string } | null;
  facilities: Facility[];
}

export function useMyPage({ isLoggedIn, user, facilities: _facilities }: UseMyPageProps) {
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('favorites');
  const [userPhone, setUserPhone] = useState<string>('');
  const [myFavorites, setMyFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [extraFacilities, setExtraFacilities] = useState<Map<string, Facility>>(new Map());
  const [sangjoFavorites, setSangjoFavorites] = useState<SangjoFavorite[]>([]);
  const [isLoadingSangjoFavorites, setIsLoadingSangjoFavorites] = useState(false);
  const [consultationCount, setConsultationCount] = useState(0);
  const [journeyRefreshKey, setJourneyRefreshKey] = useState(0);
  const { session } = useSession();

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchMyReservations();
      fetchUserPhone();
      fetchMyFavorites();
      fetchSangjoFavorites();
      fetchConsultationCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  async function fetchUserPhone() {
    if (!user) return;
    const client = await getAuthClient(session);
    const phone = await getUserPhoneNumber(user.id, client);
    setUserPhone(phone || '');
  }

  async function fetchMyReservations() {
    if (!user) return;
    setIsLoadingReservations(true);
    try {
      const client = await getAuthClient(session);
      const data = await getMyReservations(user.id, client);
      setMyReservations(data as unknown as Reservation[]);
    } catch {
      // silent
    } finally {
      setIsLoadingReservations(false);
    }
  }

  async function fetchMyFavorites() {
    if (!isLoggedIn || !user?.id) return;
    setIsLoadingFavorites(true);
    try {
      const client = await getAuthClient(session);
      const { data: favData, error: favError } = await client
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (favError) { setIsLoadingFavorites(false); return; }
      const data = (favData || []) as Favorite[];
      setMyFavorites(data);

      const facilityIds = data.map(fav => String(fav.facility_id)).filter(Boolean);
      if (facilityIds.length > 0) {
        const { data: facData } = await client.from('facilities').select('*').in('id', facilityIds);
        if (facData && facData.length > 0) {
          const mappedFacs: Facility[] = facData.map((f: Record<string, unknown>) => ({
            id: String(f.id || ''),
            legacy_id: f.legacy_id as string | number | undefined,
            name: String(f.name || '이름 없음'),
            address: String(f.address || ''),
            imageUrl: String(f.image_url || (Array.isArray(f.images) && f.images[0]) || ''),
            type: normalizeType(String(f.type || ''), String(f.name || '')),
            rating: Number(f.rating || 0),
            reviewCount: Number(f.review_count || 0),
            lat: Number(f.lat || f.latitude || 0),
            lng: Number(f.lng || f.longitude || 0),
            category: 'funeral_home' as const,
          }));
          setExtraFacilities(() => {
            const newMap = new Map<string, Facility>();
            mappedFacs.forEach(f => {
              newMap.set(String(f.id), f);
              if (f.legacy_id) newMap.set(String(f.legacy_id), f);
            });
            return newMap;
          });
        }
      }
    } catch (_error) {
      // silent
    } finally {
      setIsLoadingFavorites(false);
    }
  }

  async function fetchConsultationCount() {
    if (!user) return;
    try {
      const client = await getAuthClient(session);
      const { count } = await client
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setConsultationCount(count || 0);
    } catch (_err) {
      // silent
    }
  }

  async function fetchSangjoFavorites() {
    if (!user) return;
    setIsLoadingSangjoFavorites(true);
    try {
      const client = await getAuthClient(session);
      const { data, error } = await client
        .from('sangjo_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSangjoFavorites(data || []);
    } catch (_err) {
      // silent
    } finally {
      setIsLoadingSangjoFavorites(false);
    }
  }

  async function handleRemoveFavorite(facilityId: string) {
    if (!user) return;
    if (!await confirmAsync('즐겨찾기를 해제하시겠습니까?')) return;
    try {
      const client = await getAuthClient(session, { strict: true });
      await favoriteService.toggleFavorite(user.id, facilityId, client);
      setMyFavorites(prev => prev.filter(f => f.facility_id !== facilityId));
      toast.success('즐겨찾기가 해제되었습니다.');
    } catch {
      toast.error('오류가 발생했습니다.');
    }
  }

  async function handleRemoveSangjoFavorite(favId: string) {
    if (!user) return;
    if (!await confirmAsync('즐겨찾기를 해제하시겠습니까?')) return;
    try {
      const client = await getAuthClient(session, { strict: true });
      const { error } = await client
        .from('sangjo_favorites')
        .delete()
        .eq('id', favId)
        .eq('user_id', user.id);
      if (error) throw error;
      setSangjoFavorites(prev => prev.filter(f => f.id !== favId));
      toast.success('즐겨찾기가 해제되었습니다.');
    } catch {
      toast.error('오류가 발생했습니다.');
    }
  }

  async function handleCancelReservation(reservationId: string) {
    if (!await confirmAsync('정말로 예약을 취소하시겠습니까?')) return;
    try {
      const client = await getAuthClient(session, { strict: true });
      await cancelReservation(reservationId, client);
      setMyReservations(prev => prev.map(r =>
        r.id === reservationId ? { ...r, status: 'cancelled' as const } : r
      ));
      setSelectedReservation(null);
      toast.success('예약이 취소되었습니다.');
    } catch {
      toast.error('예약 취소 중 오류가 발생했습니다.');
    }
  }

  const pendingCount = myReservations.filter(r => r.status === 'pending' || r.status === 'urgent').length;
  const filteredReservations = myReservations.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending' || r.status === 'urgent';
    if (activeTab === 'confirmed') return r.status === 'confirmed';
    if (activeTab === 'cancelled') return r.status === 'cancelled';
    return false;
  });

  return {
    myReservations, isLoadingReservations,
    selectedReservation, setSelectedReservation,
    showEditProfile, setShowEditProfile,
    showLegalModal, setShowLegalModal,
    activeTab, setActiveTab,
    userPhone,
    myFavorites, isLoadingFavorites, extraFacilities,
    sangjoFavorites, isLoadingSangjoFavorites,
    consultationCount, journeyRefreshKey, setJourneyRefreshKey,
    pendingCount, filteredReservations,
    handleRemoveFavorite, handleRemoveSangjoFavorite, handleCancelReservation,
    fetchUserPhone,
  };
}
