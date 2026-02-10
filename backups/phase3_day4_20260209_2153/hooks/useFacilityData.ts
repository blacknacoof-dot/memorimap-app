import { useState, useEffect, useCallback, useMemo } from 'react';
import { Facility, ViewState, FacilityCategoryType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { FACILITIES } from '../constants';
import { logger } from '../utils/logger';
import { getFacilitySubscription } from '../lib/queries';

interface UseFacilityDataReturn {
  facilities: Facility[];
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>;
  selectedFacility: Facility | null;
  setSelectedFacility: React.Dispatch<React.SetStateAction<Facility | null>>;
  isDataLoading: boolean;
  fetchFacilities: () => Promise<void>;
  fetchFacilityDetails: (facilityId: string) => Promise<void>;
  handleFacilitySelect: (facility: Facility) => Promise<void>;
  handleAddReview: (facilityId: string, content: string, rating: number) => void;
  handleReviewDeleted: (facilityId: string, reviewId: string, rating: number) => void;
}

const isBadUrl = (url: string): boolean => {
  if (!url) return true;
  const badPatterns = [
    'placeholder', 'placehold.it', 'placehold.co',
    'mediahub.seoul.go.kr',
    'noimage', 'no-image', 'guitar',
    '_random', '/defaults/'
  ];
  return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
};

const getDefaultImage = (type: string, id: string): string => {
  const defaultMap: Record<string, string[]> = {
    'funeral': [
      '/images/defaults/funeral/funeral_1.jpg',
      '/images/defaults/funeral/funeral_2.jpg',
      '/images/defaults/funeral/funeral_3.jpg',
      '/images/defaults/funeral/funeral_4.jpg',
      '/images/defaults/funeral/funeral_5.jpg',
      '/images/defaults/funeral/funeral_6.jpg',
      '/images/defaults/funeral/funeral_7.jpg',
      '/images/defaults/funeral/funeral_8.jpg'
    ],
    'charnel': [
      '/images/defaults/columbarium/columbarium_1.jpg',
      '/images/defaults/columbarium/columbarium_2.jpg',
      '/images/defaults/columbarium/columbarium_3.jpg',
      '/images/defaults/columbarium/columbarium_4.jpg',
      '/images/defaults/columbarium/columbarium_5.jpg',
      '/images/defaults/columbarium/columbarium_6.jpg',
      '/images/defaults/columbarium/columbarium_7.jpg',
      '/images/defaults/columbarium/columbarium_8.jpg',
      '/images/defaults/columbarium/columbarium_9.jpg',
      '/images/defaults/columbarium/columbarium_10.jpg',
      '/images/defaults/columbarium/columbarium_11.jpg',
      '/images/defaults/columbarium/columbarium_12.jpg',
      '/images/defaults/columbarium/columbarium_13.jpg'
    ],
    'natural': [
      '/images/defaults/natural/natural_1.png',
      '/images/defaults/natural/natural_2.png',
      '/images/defaults/natural/natural_3.png',
      '/images/defaults/natural/natural_4.png',
      '/images/defaults/natural/natural_5.png',
      '/images/defaults/natural/natural_6.png',
      '/images/defaults/natural/natural_7.png',
      '/images/defaults/natural/natural_8.png'
    ],
    'park': [
      '/images/defaults/cemetery/cemetery_1.png',
      '/images/defaults/cemetery/cemetery_2.png',
      '/images/defaults/cemetery/cemetery_3.png',
      '/images/defaults/cemetery/cemetery_4.png',
      '/images/defaults/cemetery/cemetery_5.png',
      '/images/defaults/cemetery/cemetery_6.png',
      '/images/defaults/cemetery/cemetery_7.png',
      '/images/defaults/cemetery/cemetery_8.png',
      '/images/defaults/cemetery/cemetery_9.png',
      '/images/defaults/cemetery/cemetery_10.png',
      '/images/defaults/cemetery/cemetery_11.png'
    ],
    'pet': [
      'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg',
      'https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=800',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800'
    ],
    'sea': [
      'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg',
      'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=800',
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800',
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?q=80&w=800'
    ]
  };

  const options = defaultMap[type] || defaultMap['funeral'];
  const idHash = id ? String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const variantIndex = idHash % options.length;
  return options[variantIndex];
};

export const useFacilityData = (userInfo: any): UseFacilityDataReturn => {
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Fetch facilities from Supabase
  const fetchFacilities = useCallback(async () => {
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

          let type: string = 'charnel';
          if (resolvedCategory.includes('funeral')) type = 'funeral';
          else if (resolvedCategory.includes('charnel') || resolvedCategory.includes('columbarium')) type = 'charnel';
          else if (resolvedCategory.includes('natural')) type = 'natural';
          else if (resolvedCategory.includes('park') || resolvedCategory.includes('cemetery')) type = 'park';
          else if (resolvedCategory.includes('pet')) type = 'pet';
          else if (resolvedCategory.includes('sea')) type = 'sea';

          const categoryMap: Record<string, string> = {
            'funeral': 'funeral_home',
            'charnel': 'columbarium',
            'natural': 'natural_burial',
            'park': 'cemetery',
            'pet': 'pet_funeral',
            'sea': 'sea_burial'
          };

          const rawImages = item.images || [];
          const dbImageUrl = item.image_url || '';

          let selectedImage = rawImages.find((url: string) => !isBadUrl(url));
          if (!selectedImage && dbImageUrl && !isBadUrl(dbImageUrl)) {
            selectedImage = dbImageUrl;
          }

          if (!selectedImage) {
            const isOnlyMissing = (url: string) => {
              if (!url) return true;
              return ['placeholder', 'noimage', 'guitar'].some(p => url.toLowerCase().includes(p));
            };
            selectedImage = rawImages.find((url: string) => !isOnlyMissing(url)) || 
                           (isOnlyMissing(dbImageUrl) ? null : dbImageUrl);
          }

          if (!selectedImage) {
            selectedImage = getDefaultImage(type, item.id);
          }

          return {
            id: item.id?.toString(),
            name: item.name || '이름 없음',
            category: (categoryMap[type] || 'columbarium') as FacilityCategoryType,
            type: type as any,
            address: item.address || '',
            lat: Number(item.lat || item.latitude || 0),
            lng: Number(item.lng || item.longitude || 0),
            priceRange: '가격 정보 상담',
            rating: Number(item.rating || 0),
            reviewCount: Number(item.review_count || 0),
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
      }
    } catch (err: any) {
      console.error('Failed to fetch facilities:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Fetch facility details
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

      if (data) {
        const realUuid = data.id;

        const [subscription, rawReviews, images] = await Promise.all([
          getFacilitySubscription(realUuid),
          import('../lib/queries').then(m => m.getReviewsBySpace(realUuid)),
          import('../lib/queries').then(m => m.getFacilityImages(realUuid))
        ]);

        // Update facility with details
        setFacilities(prev => prev.map(f => {
          if (f.id === realUuid || f.id === facilityId) {
            return {
              ...f,
              reviews: rawReviews || [],
              galleryImages: images || [],
              isDetailLoaded: true,
              subscription: subscription || undefined
            };
          }
          return f;
        }));
      }
    } catch (err) {
      console.error('Detail fetch error:', err);
    }
  }, []);

  const handleFacilitySelect = useCallback(async (facility: Facility) => {
    logger.debug('handleFacilitySelect:', facility.name, facility.id);
    setSelectedFacility(facility);

    if (isSupabaseConfigured() && !facility.isDetailLoaded) {
      await fetchFacilityDetails(facility.id);
    }
  }, [fetchFacilityDetails]);

  const handleAddReview = useCallback((facilityId: string, content: string, rating: number) => {
    const newReview = {
      id: `r-new-${Date.now()}`,
      userId: userInfo?.id || 'anon',
      user_id: userInfo?.id || 'anon',
      facility_id: facilityId,
      userName: userInfo?.name || '익명',
      rating,
      date: new Date().toLocaleDateString(),
      content
    };

    setFacilities(prev => prev.map(f => {
      if (f.id === facilityId) {
        const newCount = (f.reviewCount || 0) + 1;
        const newRating = Number((((f.rating || 0) * (f.reviewCount || 0) + rating) / newCount).toFixed(1));
        return {
          ...f,
          reviews: [newReview, ...(f.reviews || [])],
          reviewCount: newCount,
          rating: newRating
        };
      }
      return f;
    }));
  }, [userInfo]);

  const handleReviewDeleted = useCallback((facilityId: string, reviewId: string, rating: number) => {
    setFacilities(prev => prev.map(f => {
      if (f.id === facilityId) {
        const newReviews = (f.reviews || []).filter(r => r.id !== reviewId);
        const newCount = Math.max(0, (f.reviewCount || 0) - 1);
        let newRating = 0;
        if (newCount > 0) {
          const currentTotalScore = (f.rating || 0) * (f.reviewCount || 0);
          newRating = Number(((currentTotalScore - rating) / newCount).toFixed(1));
          newRating = Math.max(0, Math.min(5, newRating));
        }
        return {
          ...f,
          reviews: newReviews,
          reviewCount: newCount,
          rating: newRating
        };
      }
      return f;
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    setFacilities,
    selectedFacility,
    setSelectedFacility,
    isDataLoading,
    fetchFacilities,
    fetchFacilityDetails,
    handleFacilitySelect,
    handleAddReview,
    handleReviewDeleted
  };
};
