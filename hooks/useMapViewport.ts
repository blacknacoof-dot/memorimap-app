/**
 * useMapViewport - App.tsx에서 추출한 지도 뷰포트 관리 Hook
 * Phase 4-2: mapBounds, targetMapCenter, targetMapZoom, handleMapBoundsChange
 */
import React, { useState, useRef, useEffect } from 'react';
import { Facility } from '../types';

/** Leaflet-compatible bounds interface (Leaflet 라이브러리 제거 후 대체) */
interface LatLngBounds {
  getSouthWest(): { lat: number; lng: number };
  getNorthEast(): { lat: number; lng: number };
  getZoom?(): number | undefined;
}
import { fetchFacilitiesInView } from '../lib/queries';
import { normalizeType, getCategoryDb, selectFacilityImage, formatPriceRange } from '../utils/facilityNormalizer';

interface UseMapViewportParams {
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>;
  setCurrentBounds: React.Dispatch<React.SetStateAction<LatLngBounds | null>>;
  session: { getToken: (opts?: Record<string, unknown>) => Promise<string | null> } | null;
  onViewportFetchStart?: () => void;
}

const isAbortRequestError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error && typeof error === 'object') {
    const maybeError = error as { name?: unknown; message?: unknown };
    if (maybeError.name === 'AbortError') return true;
    if (typeof maybeError.message === 'string' && maybeError.message.toLowerCase().includes('aborted')) return true;
  }
  return false;
};

export function useMapViewport({ setFacilities, setCurrentBounds, session, onViewportFetchStart }: UseMapViewportParams) {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [targetMapCenter, setTargetMapCenter] = useState<[number, number] | undefined>(undefined);
  const [targetMapZoom, setTargetMapZoom] = useState<number | undefined>(undefined);
  const mapDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // ? [2-2a] 언마운트 방어용 ref
  const isMountedRef = useRef(true);
  // ? [5-3] AbortController - stale viewport fetch 방지
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousViewportSignatureRef = useRef<string>('');
  const previousRequestedBoundsRef = useRef<string>('');


  const normalizeFacilities = (items: Facility[]) =>
    [...items].sort((a, b) => a.id.localeCompare(b.id));


  const isSameFacilities = (prev: Facility[], next: Facility[]) => {
    const normalizedPrev = normalizeFacilities(prev);
    const normalizedNext = normalizeFacilities(next);

    if (normalizedPrev.length !== normalizedNext.length) return false;

    for (let i = 0; i < normalizedPrev.length; i += 1) {
      const prevFacility = normalizedPrev[i];
      const nextFacility = normalizedNext[i];

      if (
        prevFacility.id !== nextFacility.id ||
        prevFacility.lat !== nextFacility.lat ||
        prevFacility.lng !== nextFacility.lng ||
        prevFacility.category !== nextFacility.category ||
        prevFacility.type !== nextFacility.type
      ) {
        return false;
      }
    }

    return true;
  };

  const getBoundsSignature = (bounds: LatLngBounds) => {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return [sw.lat, sw.lng, ne.lat, ne.lng, bounds.getZoom?.() ?? ''].join(':');
  };

  const hasMeaningfulBoundsChange = (prevSignature: string, bounds: LatLngBounds) => {
    if (!prevSignature) return true;

    const [prevSwLat, prevSwLng, prevNeLat, prevNeLng, prevZoom] = prevSignature.split(':').map(Number);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const nextZoom = bounds.getZoom?.();

    // Zoom-only changes must refresh the viewport result set too.
    if (nextZoom !== undefined && prevZoom !== undefined && nextZoom !== prevZoom) {
      return true;
    }

    const delta =
      Math.abs(prevSwLat - sw.lat) +
      Math.abs(prevSwLng - sw.lng) +
      Math.abs(prevNeLat - ne.lat) +
      Math.abs(prevNeLng - ne.lng);

    return delta >= 0.002;
  };

  // ? [2-2a] cleanup useEffect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (mapDebounceRef.current) clearTimeout(mapDebounceRef.current);
      abortControllerRef.current?.abort(); // ? [5-3] cleanup 시 abort
    };
  }, []);

  const handleMapBoundsChange = (bounds: LatLngBounds) => {
    setMapBounds(bounds);

    // Server-Side Viewport Fetching (Debounced)
    if (mapDebounceRef.current) {
      clearTimeout(mapDebounceRef.current);
    }

    mapDebounceRef.current = setTimeout(async () => {
      const nextBoundsSignature = getBoundsSignature(bounds);
      if (!hasMeaningfulBoundsChange(previousRequestedBoundsRef.current, bounds)) return;
      previousRequestedBoundsRef.current = nextBoundsSignature;
      onViewportFetchStart?.();
      // ? [5-3] 이전 요청 취소 + 새 컨트롤러 생성
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        // Get Fresh Token for Map Requests
        let token: string | undefined;
        try {
          if (session) {
            token = await session.getToken({ template: 'supabase' }) || undefined;
          }
        } catch {
          // 토큰 획득 실패 시 비인증 요청으로 계속
        }

        if (!isMountedRef.current || signal.aborted) return; // ? [5-3] stale 체크

        const fetchedData = await fetchFacilitiesInView(bounds, token, signal, {
          zoomLevel: bounds.getZoom?.(),
        });

        if (!isMountedRef.current || signal.aborted) return; // ? [5-3] stale 체크

        if (fetchedData) {
          interface ViewFacilityRow {
            id: string;
            name: string;
            type?: string;
            category?: string;
            address: string;
            lat?: number;
            latitude?: number;
            lng?: number;
            longitude?: number;
            images?: string[];
            image_url?: string;
            rating?: number;
            review_count?: number;
            price_min?: number;
            [key: string]: unknown;
          }
          const mappedFacilities: Facility[] = fetchedData.map((f: ViewFacilityRow) => {
            const rawType = f.type || f.category || 'charnel';
            const normalizedType = normalizeType(rawType, f.name || '');
            const mappedCategory = getCategoryDb(normalizedType);

            const selectedImage = selectFacilityImage(
              f.images || [], f.image_url || '', normalizedType, String(f.id || '')
            );
            const displayPriceRange = formatPriceRange(f.price_min);

            return {
              id: f.id,
              name: f.name,
              category: mappedCategory,
              type: normalizedType,
              address: f.address,
              lat: Number(f.lat || f.latitude),
              lng: Number(f.lng || f.longitude),
              imageUrl: selectedImage,
              rating: Number(f.rating || 0),
              reviewCount: f.review_count || 0,
              priceRange: displayPriceRange,
              features: {},
              images: f.images || []
            };
          });
          const nextSignature = normalizeFacilities(mappedFacilities)
            .map((facility) => [facility.id, facility.lat, facility.lng, facility.category ?? '', facility.type ?? ''].join(':'))
            .join('|');

          if (isMountedRef.current && !signal.aborted) {
            setCurrentBounds(bounds);
            if (previousViewportSignatureRef.current !== nextSignature) {
              previousViewportSignatureRef.current = nextSignature;
              setFacilities((prev) => {
                if (isSameFacilities(prev, mappedFacilities)) return prev;
                return mappedFacilities;
              }); // ? [5-3] stale 체크
            }
          }
        }
      } catch (error) {
        if (signal.aborted || isAbortRequestError(error)) return;
        // ? [2-2b] Silent fail: non-abort errors are ignored and retried on next viewport move
      }
    }, 300);
  };

  return {
    mapBounds,
    targetMapCenter,
    setTargetMapCenter,
    targetMapZoom,
    setTargetMapZoom,
    handleMapBoundsChange,
  };
}

