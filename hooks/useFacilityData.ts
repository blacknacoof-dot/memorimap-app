/**
 * useFacilityData - App.tsx에서 추출한 시설 데이터 관리 Hook
 * Phase 4-2: facilities, selectedFacility, fetchFacilities, filteredFacilities, fetchFacilityDetails, handleFacilitySelect
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Facility, ViewState } from '../types';
import { FACILITIES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { normalizeType, getCategoryDb, getCategoryLabel, selectFacilityImage, formatPriceRange } from '../utils/facilityNormalizer';
import { getFacilitySubscription } from '../lib/queries';
import { useFilterStore } from '../stores/useFilterStore';
import { logger } from '../utils/logger';

interface UseFacilityDataParams {
  viewState: ViewState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function useFacilityData({ viewState, showToast }: UseFacilityDataParams) {
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<L.LatLngBounds | null>(null);

  const { searchQuery, selectedCategories } = useFilterStore();

  // Fetch Facilities from Supabase
  useEffect(() => {
    const fetchFacilities = async () => {
      if (!isSupabaseConfigured()) return;

      setIsDataLoading(true);
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedFacilities = data.map((item: any) => {
            const resolvedCategory = item.type || item.category || 'charnel';
            const name = item.name || '';
            const type = normalizeType(resolvedCategory, name);
            const mappedCategory = getCategoryDb(type);

            const ratingValue = item.rating ? Number(item.rating) : 0;
            const reviewCountValue = item.review_count ? Number(item.review_count) : 0;

            const selectedImage = selectFacilityImage(
              item.images || [], item.image_url || '', type, String(item.id || '')
            );
            const displayPriceRange = formatPriceRange(item.price_min);

            return {
              id: item.id?.toString(),
              name: item.name || '이름 없음',
              category: mappedCategory,
              type: type,
              db_type: item.type,
              religion: 'none',
              address: item.address || '',
              lat: Number(item.lat || item.latitude || 0),
              lng: Number(item.lng || item.longitude || 0),
              priceRange: displayPriceRange,
              rating: ratingValue,
              reviewCount: reviewCountValue,
              imageUrl: selectedImage,
              description: '',
              features: [],
              phone: '',
              prices: [],
              galleryImages: item.images || [],
              reviews: [],
              isDetailLoaded: false,
              isVerified: true,
              dataSource: 'db',
              priceInfo: item.price_info || null,
              products: item.price_info?.products || []
            };
          });
          setFacilities(mappedFacilities);
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
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // 1. Filter by Map Bounds if on MAP view
    if (viewState === ViewState.MAP && currentBounds) {
      result = result.filter(f => {
        if (f.lat && f.lng) {
          try {
            const latLng = L.latLng(f.lat, f.lng);
            return currentBounds.contains(latLng);
          } catch (e) {
            return true;
          }
        }
        return false;
      });
    }

    // 2. Exclude sangjo from general list
    const sangjoSelected = selectedCategories.includes('sangjo' as any);
    if (!sangjoSelected) {
      result = result.filter(f => f.type !== 'sangjo');
    }

    // 3. Filter by Category
    if (selectedCategories.length > 0) {
      result = result.filter(f => selectedCategories.includes(f.category as any) || selectedCategories.includes(f.type as any));
    }

    // 4. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q)
      );
    }

    return result;
  }, [facilities, currentBounds, searchQuery, selectedCategories, viewState]);

  // Fetch Facility Details
  const fetchFacilityDetails = useCallback(async (facilityId: string) => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

      let query = supabase.from('facilities').select('*');

      if (isUUID) {
        query = query.eq('id', facilityId);
      } else {
        query = query.eq('legacy_id', facilityId);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      logger.debug(`Fetched Data from facilities:`, data);

      if (data) {
        const realUuid = data.id;

        const [subscription, rawReviews, images] = await Promise.all([
          getFacilitySubscription(realUuid),
          import('../lib/queries').then(m => m.getReviewsBySpace(realUuid)),
          import('../lib/queries').then(m => m.getFacilityImages(realUuid))
        ]);

        const reviews = (rawReviews || []).map((r: any) => ({
          ...r,
          userName: r.userName || r.user_name || '익명',
          date: r.date || (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '')
        }));

        const resolvedCategory = data.type || data.category || 'charnel';
        const type = normalizeType(resolvedCategory, data.name || '');
        const mappedCategory = getCategoryLabel(type);

        const selectedImage = selectFacilityImage(
          data.images || [], data.image_url || '', type, String(data.id || ''), true
        );

        const updatedFacility: Facility = {
          id: data.id?.toString(),
          name: data.name,
          category: mappedCategory,
          type: type,
          religion: data.religion || 'none',
          address: data.address,
          lat: Number(data.lat || (data.location?.coordinates ? data.location.coordinates[1] : 0)),
          lng: Number(data.lng || (data.location?.coordinates ? data.location.coordinates[0] : 0)),
          priceRange: formatPriceRange(data.price_min),
          rating: Number(data.rating || 0),
          reviewCount: Number(data.reviews_count || 0),
          imageUrl: selectedImage || 'https://placehold.co/800x600?text=No+Image',
          description: data.description || '',
          features: data.ai_features || data.features || [],
          phone: data.phone || data.contact || '',
          prices: data.prices || [],
          galleryImages: data.images || [],
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
          updatedFacility.rating = existing.rating;
          updatedFacility.reviewCount = existing.reviewCount;
        }

        setFacilities(prev => prev.map(f => f.id === realUuid || f.id === facilityId ? updatedFacility : f));
        setSelectedFacility(updatedFacility);
      }
    } catch (err) {
      console.error("Detail fetch error:", err);
    }
  }, [facilities, setSelectedFacility, setFacilities]);

  // Handle Facility Select
  const handleFacilitySelect = useCallback(async (facility: Facility) => {
    logger.debug('handleFacilitySelect CLICKED:', facility.name, facility.id, 'Loaded:', facility.isDetailLoaded);
    setSelectedFacility(facility);

    if (isSupabaseConfigured() && !facility.isDetailLoaded && facility.id.startsWith('db-') === false) {
      await fetchFacilityDetails(facility.id);
    }
  }, [setSelectedFacility, fetchFacilityDetails]);

  return {
    facilities,
    setFacilities,
    selectedFacility,
    setSelectedFacility,
    isDataLoading,
    filteredFacilities,
    fetchFacilityDetails,
    handleFacilitySelect,
    currentBounds,
    setCurrentBounds,
  };
}
