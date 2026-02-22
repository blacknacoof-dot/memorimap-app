/**
 * useMapViewport - App.tsx에서 추출한 지도 뷰포트 관리 Hook
 * Phase 4-2: mapBounds, targetMapCenter, targetMapZoom, handleMapBoundsChange
 */
import React, { useState, useRef } from 'react';
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
  session: any;
}

export function useMapViewport({ setFacilities, setCurrentBounds, session }: UseMapViewportParams) {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [targetMapCenter, setTargetMapCenter] = useState<[number, number] | undefined>(undefined);
  const [targetMapZoom, setTargetMapZoom] = useState<number | undefined>(undefined);
  const mapDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleMapBoundsChange = (bounds: LatLngBounds) => {
    setMapBounds(bounds);
    setCurrentBounds(bounds);

    // Server-Side Viewport Fetching (Debounced)
    if (mapDebounceRef.current) {
      clearTimeout(mapDebounceRef.current);
    }

    mapDebounceRef.current = setTimeout(async () => {
      // Get Fresh Token for Map Requests
      let token: string | undefined;
      try {
        if (session) {
          token = await session.getToken({ template: 'supabase' }) || undefined;
        }
      } catch (e) {
        console.warn('Failed to get token for map fetch:', e);
      }

      const fetchedData = await fetchFacilitiesInView(bounds, token);
      if (fetchedData && fetchedData.length > 0) {
        const mappedFacilities: Facility[] = fetchedData.map((f: any) => {
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
        setFacilities(mappedFacilities);
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
