/**
 * useFacilityData - App.tsx?ë¨?½Œ ?°ë¶¿?????–ê½• ?ê³—ì” ???¿Â€??Hook
 * Phase 4-2: facilities, selectedFacility, fetchFacilities, filteredFacilities, fetchFacilityDetails, handleFacilitySelect
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Facility, ViewState } from '../types';

/** Leaflet-compatible bounds interface (Leaflet ??±ì” ?‰ëš®??”±???“êµ… ????ï§? */
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

// ?€?€ ì²??”ë©´ ì¹´í…Œê³ ë¦¬ ê· í˜• ?¸ì¶œ (?€??3) ?€?€
const BALANCE_CATEGORIES = ['funeral', 'charnel', 'park', 'natural', 'pet', 'sea'] as const;
const BALANCE_PER_CATEGORY = 3;

/** ?ìœ„ 18ê±´ì„ 6ì¹´í…Œê³ ë¦¬Ã—3ê±??¼ìš´?œë¡œë¹ˆìœ¼ë¡?ë°°ì¹˜, ?˜ë¨¸ì§€???ë³¸ ?œì„œ ? ì? */
function balanceFirstScreen(facilities: Facility[]): Facility[] {
  // 1. ì¹´í…Œê³ ë¦¬ë³?ë²„í‚· (?ì—?œë???ìµœë? 3ê±´ì”©)
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

  // 2. ?¼ìš´?œë¡œë¹? cat[0], cat[0], ... cat[1], cat[1], ...
  const head: Facility[] = [];
  for (let round = 0; round < BALANCE_PER_CATEGORY; round++) {
    for (const cat of BALANCE_CATEGORIES) {
      const bucket = buckets.get(cat)!;
      if (round < bucket.length) {
        head.push(bucket[round]);
      }
    }
  }

  // 3. tail: head???¬ìš©??ID ?œì™¸, ?ë³¸ ?œì„œ ? ì?
  const headIds = new Set(head.map(f => f.id));
  const tail = facilities.filter(f => !headIds.has(f.id));

  return [...head, ...tail];
}

interface UseFacilityDataParams {
  viewState: ViewState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  disableInitialFetch?: boolean;
}

export function useFacilityData({ viewState, showToast, disableInitialFetch = false }: UseFacilityDataParams) {
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  // ??[2-3a] stale ?ë¬ë–Ÿ ?¾ëŒ?†ç‘œ??ê¾ªë¸³ ?ë¶¿ê»Œ ID
  const latestRequestIdRef = useRef(0);
  // ë·°í¬??fetchê°€ ?„ë£Œ?˜ë©´ true ??ì´ˆê¸° ?„ì²´ fetch ê²°ê³¼ ë¬´ì‹œ
  const viewportFetchedRef = useRef(false);
  const viewportFetchStartedRef = useRef(false);
  const unavailableDetailIdsRef = useRef<Set<string>>(new Set());

  const { searchQuery, selectedCategories } = useFilterStore();

  // Fetch Facilities from Supabase
  useEffect(() => {
    let mounted = true;
    const fetchFacilities = async () => {
      if (disableInitialFetch) return;
      if (!isSupabaseConfigured()) return;

      setIsDataLoading(true);
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('verified', true);

        if (!mounted) return;
        if (error) throw error;
        if (viewportFetchStartedRef.current || viewportFetchedRef.current) return;
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
              name: item.name || '??€ì«???ì“¬',
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
        const message = err instanceof Error ? err.message : "?ê³Œê» ??»ìªŸ";
        showToast(`?ê³—ì” ???ºëˆ???ºë¦° ??½ë™£: ${message}`, 'error');
      } finally {
        if (mounted) setIsDataLoading(false);
      }
    };

    fetchFacilities();
    return () => { mounted = false; };
  }, [disableInitialFetch]);

  // Filtered Facilities Logic
  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // 1. Filter by Map Bounds (MAP + LIST ê³µí†µ ?ìš©)
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
      result = result.filter(f => f.type !== 'sangjo' && f.type !== '?ê³¸â€?');
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
    const requestId = ++latestRequestIdRef.current;  // ??[2-3a] ?¨ì¢?€ ?ë¶¿ê»Œ ID

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);

      let query = supabase.from('facilities').select('*');

      if (isUUID) {
        query = query.eq('id', facilityId);
      } else {
        query = query.eq('legacy_id', facilityId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) {
        if (!isUUID) unavailableDetailIdsRef.current.add(facilityId);
        return;
      }

      // ??[2-3a] stale ?ë¬ë–Ÿ ?¾ëŒ??      if (requestId !== latestRequestIdRef.current) return;

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
          showToast('?œì„¤ ë¦¬ë·°ë¥?ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ?? ? ì‹œ ???¤ì‹œ ?œë„??ì£¼ì„¸??', 'error');
        }

        if (resolvedImagesResult.status === 'rejected') {
          logger.error('Failed to load facility images while fetching detail', {
            facilityId: realUuid,
            error: resolvedImagesResult.reason,
          });
        }

        // ??[2-3a] ?°ë¶½? fetch ?ê¾©ë¿‰??stale ï§£ëŒ„ê²?        if (requestId !== latestRequestIdRef.current) return;

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
          userName: r.userName || r.user_name || '??¬ì±¸',
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

        // ??[2-3b] setFacilities(prev => ...) ??€??ë¨?½Œ prev.find()æ¿?stale closure è«›â‘¹?
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
        showToast('??–ê½• ?ê³¸ê½­ ?ëº£ë‚«???ºëˆ???? ï§ì‚µë»??¬ë•²?? ï§â‘¸ì¤?ë¨?½Œ ??¼ë–† ?ì¢ê¹®??äºŒì‡±ê½?? è«›ì„???ãˆƒ ?¨ì¢‰ì»??³ê½£æ¿??¾ëª„???äºŒì‡±ê½??', 'error');
      }
    }
  }, [setSelectedFacility, setFacilities, showToast]);  // ??[2-3b] facilities ??“êµ…??ë¿¬ stale closure è«›â‘¹?

  // Handle Facility Select
  const handleFacilitySelect = useCallback(async (facility: Facility) => {
    logger.debug('handleFacilitySelect CLICKED:', facility.name, facility.id, 'Loaded:', facility.isDetailLoaded);
    const shouldFetchDetail =
      isSupabaseConfigured() &&
      !facility.isDetailLoaded &&
      facility.id.startsWith('db-') === false &&
      !unavailableDetailIdsRef.current.has(facility.id);

    setSelectedFacility(facility);

    if (shouldFetchDetail) {
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
    viewportFetchStartedRef,
    viewportFetchedRef,
  };
}



