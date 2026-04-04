/**
 * useFacilityData - App.tsx?먯꽌 異붿텧???쒖꽕 ?곗씠??愿由?Hook
 * Phase 4-2: facilities, selectedFacility, fetchFacilities, filteredFacilities, fetchFacilityDetails, handleFacilitySelect
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Facility, ViewState } from '../types';

/** Leaflet-compatible bounds interface (Leaflet ?쇱씠釉뚮윭由??쒓굅 ???泥? */
interface LatLngBounds {
  getSouthWest(): { lat: number; lng: number };
  getNorthEast(): { lat: number; lng: number };
}
import { FACILITIES } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { normalizeType, getCategoryDb, selectFacilityImage, formatPriceRange } from '../utils/facilityNormalizer';
import { getFacilitySubscription } from '../lib/queries/index';
import { getReviewsBySpace } from '../lib/queries/reviews';
import { useFilterStore } from '../stores/useFilterStore';
import { logger } from '../utils/logger';
import { createSignedStorageImageUrl } from '../lib/security/storageImage';
import { resolveFacilityDetailImages } from '../lib/facilityImageResolver';

// ── 첫 화면 카테고리 균형 노출 (대안 3) ──
const BALANCE_CATEGORIES = ['funeral', 'charnel', 'park', 'natural', 'pet', 'sea'] as const;
const BALANCE_PER_CATEGORY = 3;

/** 상위 18건을 6카테고리×3건 라운드로빈으로 배치, 나머지는 원본 순서 유지 */
function balanceFirstScreen(facilities: Facility[]): Facility[] {
  // 1. 카테고리별 버킷 (앞에서부터 최대 3건씩)
  const normalizeImageKey = (imageUrl?: string | null) => {
    const trimmed = imageUrl?.trim();
    return trimmed ? trimmed : null;
  };

  const buckets = new Map<string, Facility[]>();
  const usedImageUrls = new Set<string>();

  for (const cat of BALANCE_CATEGORIES) {
    const categoryCandidates = facilities.filter(f => f.type === cat);
    const bucket: Facility[] = [];
    const deferred: Facility[] = [];

    for (const facility of categoryCandidates) {
      if (bucket.length >= BALANCE_PER_CATEGORY) break;

      const imageKey = normalizeImageKey(facility.imageUrl);
      if (!imageKey || !usedImageUrls.has(imageKey)) {
        bucket.push(facility);
        if (imageKey) usedImageUrls.add(imageKey);
      } else {
        deferred.push(facility);
      }
    }

    for (const facility of deferred) {
      if (bucket.length >= BALANCE_PER_CATEGORY) break;
      bucket.push(facility);
    }

    buckets.set(cat, bucket);
  }

  // 2. 라운드로빈: cat[0], cat[0], ... cat[1], cat[1], ...
  const head: Facility[] = [];
  for (let round = 0; round < BALANCE_PER_CATEGORY; round++) {
    for (const cat of BALANCE_CATEGORIES) {
      const bucket = buckets.get(cat)!;
      if (round < bucket.length) {
        head.push(bucket[round]);
      }
    }
  }

  // 3. tail: head에 사용된 ID 제외, 원본 순서 유지
  const headIds = new Set(head.map(f => f.id));
  const tail = facilities.filter(f => !headIds.has(f.id));

  return [...head, ...tail];
}

interface UseFacilityDataParams {
  viewState: ViewState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function useFacilityData({ viewState, showToast }: UseFacilityDataParams) {
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  // ??[2-3a] stale ?묐떟 臾댁떆瑜??꾪븳 ?붿껌 ID
  const latestRequestIdRef = useRef(0);
  // 뷰포트 fetch가 완료되면 true → 초기 전체 fetch 결과 무시
  const viewportFetchedRef = useRef(false);

  const { searchQuery, selectedCategories } = useFilterStore();

  // Fetch Facilities from Supabase
  useEffect(() => {
    let mounted = true;
    const fetchFacilities = async () => {
      if (!isSupabaseConfigured()) return;

      setIsDataLoading(true);
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('verified', true);

        if (!mounted) return;
        if (error) throw error;
        // 뷰포트 fetch가 이미 완료됐으면 전체 fetch 결과로 덮어쓰지 않음
        if (viewportFetchedRef.current) return;

        if (data && data.length > 0) {
          interface FacilityRow {
            id?: string;
            name?: string;
            type?: string;
            category?: string;
            rating?: number;
            review_count?: number;
            images?: string[];
            image_url?: string;
            price_min?: number;
            address?: string;
            lat?: number;
            latitude?: number;
            lng?: number;
            longitude?: number;
            packages?: Facility['products'];
            [key: string]: unknown;
          }
          const mappedFacilities: Facility[] = (data as FacilityRow[]).map((item) => {
            const resolvedCategory = String(item.type || item.category || 'charnel');
            const itemName = item.name || '';
            const type = normalizeType(resolvedCategory, itemName);
            const mappedCategory = getCategoryDb(type);

            const ratingValue = item.rating ? Number(item.rating) : 0;
            const reviewCountValue = item.review_count ? Number(item.review_count) : 0;

            const images = Array.isArray(item.images) ? item.images : [];
            const selectedImage = selectFacilityImage(
              images, item.image_url || '', type, String(item.id || '')
            );
            const displayPriceRange = formatPriceRange(item.price_min);

            return {
              id: String(item.id || ''),
              name: item.name || '?대쫫 ?놁쓬',
              category: mappedCategory,
              type: type,
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
              galleryImages: images,
              reviews: [],
              isDetailLoaded: false,
              isVerified: true,
              dataSource: 'db',
              priceInfo: null,
              products: Array.isArray(item.packages) ? item.packages : []
            };
          });
          setFacilities(balanceFirstScreen(mappedFacilities));
        } else {
          // DB empty or RPC error
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "?곌껐 ?ㅻ쪟";
        showToast(`?곗씠??遺덈윭?ㅺ린 ?ㅽ뙣: ${message}`, 'error');
      } finally {
        if (mounted) setIsDataLoading(false);
      }
    };

    fetchFacilities();
    return () => { mounted = false; };
  }, []);

  // Filtered Facilities Logic
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // 1. Filter by Map Bounds (MAP + LIST 공통 적용)
    if (currentBounds) {
      const sw = currentBounds.getSouthWest();
      const ne = currentBounds.getNorthEast();
      result = result.filter(f => {
        if (f.lat && f.lng) {
          return f.lat >= sw.lat && f.lat <= ne.lat && f.lng >= sw.lng && f.lng <= ne.lng;
        }
        return false;
      });
    }

    // 2. Exclude sangjo from general list
    const sangjoSelected = (selectedCategories as string[]).includes('sangjo');
    if (!sangjoSelected) {
      result = result.filter(f => f.type !== 'sangjo' && f.type !== '?곸“');
    }

    // 3. Filter by Category
    if (selectedCategories.length > 0) {
      result = result.filter(f => (selectedCategories as string[]).includes(f.category || ''));
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
  }, [facilities, currentBounds, searchQuery, selectedCategories]);

  // Fetch Facility Details
  const fetchFacilityDetails = useCallback(async (facilityId: string) => {
    const requestId = ++latestRequestIdRef.current;  // ??[2-3a] 怨좎쑀 ?붿껌 ID

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

      // ??[2-3a] stale ?묐떟 臾댁떆
      if (requestId !== latestRequestIdRef.current) return;

      logger.debug(`Fetched Data from facilities:`, data);

      if (data) {
        const realUuid = data.id;

        const [subscriptionResult, rawReviewsResult, resolvedImagesResult] = await Promise.allSettled([
          getFacilitySubscription(realUuid, supabase),
          getReviewsBySpace(realUuid),
          resolveFacilityDetailImages(data, {
            signImage: (value) => createSignedStorageImageUrl(
              supabase,
              'facility-images',
              value,
            ),
          })
        ]);

        const subscription = subscriptionResult.status === 'fulfilled'
          ? subscriptionResult.value
          : null;
        if (subscriptionResult.status === 'rejected') {
          logger.error('Failed to load facility subscription while fetching detail', {
            facilityId: realUuid,
            error: subscriptionResult.reason,
          });
        }

        const rawReviews = rawReviewsResult.status === 'fulfilled'
          ? rawReviewsResult.value
          : [];
        if (rawReviewsResult.status === 'rejected') {
          logger.error('Failed to load facility reviews while fetching detail', {
            facilityId: realUuid,
            error: rawReviewsResult.reason,
          });
          showToast('시설 리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
        }

        if (resolvedImagesResult.status === 'rejected') {
          logger.error('Failed to load facility images while fetching detail', {
            facilityId: realUuid,
            error: resolvedImagesResult.reason,
          });
        }

        // ??[2-3a] 異붽? fetch ?꾩뿉??stale 泥댄겕
        if (requestId !== latestRequestIdRef.current) return;

        interface RawReview {
          id: string;
          rating: number;
          content: string;
          userName?: string;
          user_name?: string;
          date?: string;
          created_at?: string;
          [key: string]: unknown;
        }
        const reviews = (rawReviews as RawReview[] || []).map((r) => ({
          id: r.id,
          rating: r.rating,
          content: r.content,
          userName: r.userName || r.user_name || '?듬챸',
          date: r.date || (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '')
        }));

        const resolvedImages = resolvedImagesResult.status === 'fulfilled'
          ? resolvedImagesResult.value
          : { imageUrl: '', galleryImages: [] };

        const resolvedCategory = data.type || data.category || 'charnel';
        const type = normalizeType(resolvedCategory, data.name || '');
        const mappedCategory = getCategoryDb(type);

        const selectedImage = selectFacilityImage(
          resolvedImages.galleryImages || [], resolvedImages.imageUrl || '', type, String(data.id || ''), true
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
          galleryImages: resolvedImages.galleryImages || [],
          reviews: reviews.length > 0 ? reviews : [],
          naverBookingUrl: data.naver_booking_url,
          isDetailLoaded: true,
          isVerified: data.verified || false,
          dataSource: 'db',
          priceInfo: null,
          products: data.packages || [],
          aiContext: data.ai_context || '',
          subscription: subscription || undefined
        };

        if (!updatedFacility.lat && data.location && data.location.type === 'Point' && Array.isArray(data.location.coordinates) && data.location.coordinates.length >= 2) {
          updatedFacility.lng = data.location.coordinates[0];
          updatedFacility.lat = data.location.coordinates[1];
        }

        // ??[2-3b] setFacilities(prev => ...) ?대??먯꽌 prev.find()濡?stale closure 諛⑹?
        setFacilities(prev => {
          const existing = prev.find(f => f.id === realUuid || f.id === facilityId);
          if (existing) {
            if (!updatedFacility.lat) { updatedFacility.lat = existing.lat; updatedFacility.lng = existing.lng; }
            updatedFacility.rating = existing.rating;
            updatedFacility.reviewCount = existing.reviewCount;
          }
          return prev.map(f => f.id === realUuid || f.id === facilityId ? updatedFacility : f);
        });
        setSelectedFacility(updatedFacility);
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch facility detail', {
        facilityId,
        requestId,
        latestRequestId: latestRequestIdRef.current,
        error,
      });
      if (requestId === latestRequestIdRef.current) {
        showToast('?쒖꽕 ?곸꽭 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? 紐⑸줉?먯꽌 ?ㅼ떆 ?좏깮??二쇱꽭?? 諛섎났?섎㈃ 怨좉컼?쇳꽣濡?臾몄쓽??二쇱꽭??', 'error');
      }
    }
  }, [setSelectedFacility, setFacilities, showToast]);  // ??[2-3b] facilities ?쒓굅?섏뿬 stale closure 諛⑹?

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
    viewportFetchedRef,
  };
}
