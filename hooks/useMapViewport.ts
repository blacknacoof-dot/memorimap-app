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
}
import { fetchFacilitiesInView } from '../lib/queries';
import { normalizeType, getCategoryDb, selectFacilityImage, formatPriceRange } from '../utils/facilityNormalizer';

interface UseMapViewportParams {
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>;
  setCurrentBounds: React.Dispatch<React.SetStateAction<LatLngBounds | null>>;
  session: { getToken: (opts?: Record<string, unknown>) => Promise<string | null> } | null;
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

export function useMapViewport({ setFacilities, setCurrentBounds, session }: UseMapViewportParams) {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [targetMapCenter, setTargetMapCenter] = useState<[number, number] | undefined>(undefined);
  const [targetMapZoom, setTargetMapZoom] = useState<number | undefined>(undefined);
  const mapDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // ? [2-2a] 언마운트 방어용 ref
  const isMountedRef = useRef(true);
  // ? [5-3] AbortController - stale viewport fetch 방지
  const abortControllerRef = useRef<AbortController | null>(null);

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
    setCurrentBounds(bounds);

    // Server-Side Viewport Fetching (Debounced)
    if (mapDebounceRef.current) {
      clearTimeout(mapDebounceRef.current);
    }

    mapDebounceRef.current = setTimeout(async () => {
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

        const fetchedData = await fetchFacilitiesInView(bounds, token, signal);

        if (!isMountedRef.current || signal.aborted) return; // ? [5-3] stale 체크

        if (fetchedData && fetchedData.length > 0) {
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
          if (isMountedRef.current && !signal.aborted) setFacilities(mappedFacilities); // ? [5-3] stale 체크
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
