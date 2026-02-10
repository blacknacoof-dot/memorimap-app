import { useState, useRef, useCallback } from 'react';
import { LatLngBounds } from 'leaflet';
import { Facility } from '../types';
import { fetchFacilitiesInView } from '../lib/queries';

interface UseMapHandlersReturn {
  mapBounds: LatLngBounds | null;
  currentBounds: LatLngBounds | null;
  targetMapCenter: [number, number] | undefined;
  targetMapZoom: number | undefined;
  handleBoundsChange: (bounds: LatLngBounds) => void;
  handleMapBoundsChange: (bounds: LatLngBounds, session: any) => Promise<void>;
  setTargetMapCenter: React.Dispatch<React.SetStateAction<[number, number] | undefined>>;
  setTargetMapZoom: React.Dispatch<React.SetStateAction<number | undefined>>;
  setCurrentBounds: React.Dispatch<React.SetStateAction<LatLngBounds | null>>;
}

export const useMapHandlers = (
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>
): UseMapHandlersReturn => {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [targetMapCenter, setTargetMapCenter] = useState<[number, number] | undefined>(undefined);
  const [targetMapZoom, setTargetMapZoom] = useState<number | undefined>(undefined);
  const mapDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setCurrentBounds(bounds);
  }, []);

  const handleMapBoundsChange = useCallback(async (bounds: LatLngBounds, session: any) => {
    setMapBounds(bounds);

    // Debounced server-side fetching
    if (mapDebounceRef.current) {
      clearTimeout(mapDebounceRef.current);
    }

    mapDebounceRef.current = setTimeout(async () => {
      try {
        let token: string | undefined;
        if (session) {
          token = await session.getToken({ template: 'supabase' }) || undefined;
        }

        const fetchedData = await fetchFacilitiesInView(bounds, token);
        if (fetchedData && fetchedData.length > 0) {
          // Transform fetched data to match Facility interface
          const mappedFacilities: Facility[] = fetchedData.map((f: any) => {
            const rawType = f.type || f.category || 'charnel';
            let normalizedType = 'charnel';

            if (rawType.includes('funeral')) normalizedType = 'funeral';
            else if (rawType.includes('charnel') || rawType.includes('columbarium')) normalizedType = 'charnel';
            else if (rawType.includes('natural')) normalizedType = 'natural';
            else if (rawType.includes('park') || rawType.includes('cemetery')) normalizedType = 'park';
            else if (rawType.includes('pet')) normalizedType = 'pet';
            else if (rawType.includes('sea')) normalizedType = 'sea';

            const categoryMap: Record<string, any> = {
              'funeral': 'funeral_home',
              'charnel': 'columbarium',
              'natural': 'natural_burial',
              'park': 'cemetery',
              'pet': 'pet_funeral',
              'sea': 'sea_burial'
            };

            return {
              id: f.id,
              name: f.name,
              category: categoryMap[normalizedType] || 'columbarium',
              type: normalizedType,
              address: f.address,
              lat: Number(f.lat || f.latitude),
              lng: Number(f.lng || f.longitude),
              imageUrl: f.image_url || (f.images && f.images.length > 0 ? f.images[0] : null),
              rating: Number(f.rating || 0),
              reviewCount: Number(f.review_count || 0),
              priceRange: '가격 정보 상담',
              description: '',
              features: [],
              phone: '',
              prices: [],
              galleryImages: f.images || [],
              reviews: [],
              isDetailLoaded: false,
              isVerified: true,
              dataSource: 'db'
            };
          });

          setFacilities(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newFacilities = mappedFacilities.filter(f => !existingIds.has(f.id));
            return [...prev, ...newFacilities];
          });
        }
      } catch (error) {
        console.error('Failed to fetch facilities in view:', error);
      }
    }, 300);
  }, [setFacilities]);

  return {
    mapBounds,
    currentBounds,
    targetMapCenter,
    targetMapZoom,
    handleBoundsChange,
    handleMapBoundsChange,
    setTargetMapCenter,
    setTargetMapZoom,
    setCurrentBounds
  };
};
