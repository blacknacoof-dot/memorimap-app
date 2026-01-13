import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Facility } from '../types';
import { FACILITIES } from '../constants';

const REGION_COORDINATES: Record<string, { center: [number, number], zoom: number }> = {
    '서울': { center: [37.5665, 126.9780], zoom: 11 },
    // ... other regions if needed defaults
};

export const useFacilities = () => {
    const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
    const [isDataLoading, setIsDataLoading] = useState(false);

    const fetchFacilities = useCallback(async () => {
        if (!isSupabaseConfigured()) return;

        setIsDataLoading(true);
        try {
            // Default center (Seoul) for initial fetch
            const center = REGION_COORDINATES['서울'].center;

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
                const mappedFacilities: Facility[] = data.map((item: any) => {
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

                    // Simulation Logic
                    const idNum = item.id ? item.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
                    const pseudoRandom = (idNum % 10);
                    const simulatedRating = pseudoRandom < 2 ? 3 : (pseudoRandom < 6 ? 4 : 5);
                    const simulatedReviewCount = 3 + (idNum % 6);

                    // Image Logic
                    const rawImages = item.images || [];
                    const dbImageUrl = item.image_url || '';

                    const isBadUrl = (url: string) => {
                        if (!url) return true;
                        const badPatterns = [
                            'placeholder', 'placehold.it', 'placehold.co',
                            'unsplash',
                            'mediahub.seoul.go.kr',
                            'noimage', 'no-image', 'guitar'
                        ];
                        return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
                    };

                    let selectedImage = rawImages.find((url: string) => !isBadUrl(url)) || (isBadUrl(dbImageUrl) ? null : dbImageUrl);

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
            }
        } catch (err: any) {
            console.error("Failed to fetch facilities:", err);
            // Optionally handle error state
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    const loadFacilityDetails = useCallback(async (facilityId: string) => {
        try {
            // Determine table based on ID format (UUID vs BigInt)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
            const tableName = isUUID ? 'facilities' : 'memorial_spaces';

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', facilityId)
                .single();

            if (error) throw error;

            if (data) {
                // Dynamic imports to avoid circular deps if any, or just standard import if possible. 
                // Keeping dynamic style from App.tsx for safety or just import at top?
                // Let's use dynamic imports here to match previous behavior if queries uses types that might cycle.
                const { getFacilitySubscription, getReviewsBySpace, getFacilityImages } = await import('../lib/queries');

                const [subscription, rawReviews, images] = await Promise.all([
                    getFacilitySubscription(facilityId),
                    getReviewsBySpace(facilityId),
                    getFacilityImages(facilityId)
                ]);

                const reviews = (rawReviews || []).map((r: any) => ({
                    ...r,
                    userName: r.userName || r.user_name || '익명',
                    date: r.date || (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '')
                }));

                // Type inference (reused logic - arguably extract to helper)
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

                const details = data.details || {};

                setFacilities(prev => prev.map(f => {
                    if (f.id !== facilityId) return f;

                    const updated: Facility = {
                        ...f, // Keep existing lat/lng and basic info as fallback
                        name: data.name,
                        type: type,
                        religion: details.religion || 'none',
                        address: data.address,
                        // Use existing lat/lng if available, else try to parse location
                        lat: f.lat,
                        lng: f.lng,
                        priceRange: details.price_range || '가격 정보 상담',
                        rating: Number(details.rating || f.rating),
                        reviewCount: Number(details.review_count || f.reviewCount),
                        imageUrl: (data.images && data.images[0]) || (data.gallery_images && data.gallery_images[0]) || f.imageUrl,
                        description: details.description || '',
                        features: details.features || [],
                        phone: data.contact || '',
                        prices: details.prices || [],
                        galleryImages: data.gallery_images || images || (data.images || []),
                        reviews: reviews.length > 0 ? reviews : [],
                        naverBookingUrl: details.naver_booking_url,
                        isDetailLoaded: true,
                        isVerified: data.is_verified || false,
                        dataSource: 'db',
                        priceInfo: details.price_info || [],
                        aiContext: details.ai_context || '',
                        subscription: subscription || undefined
                    };

                    // Parse location if valid Point
                    if (data.location && data.location.type === 'Point' && Array.isArray(data.location.coordinates)) {
                        updated.lng = data.location.coordinates[0];
                        updated.lat = data.location.coordinates[1];
                    }
                    return updated;
                }));
            }
        } catch (err) {
            console.error("Detail fetch error:", err);
        }
    }, [setFacilities]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    return { facilities, setFacilities, isDataLoading, fetchFacilities, loadFacilityDetails };
};
