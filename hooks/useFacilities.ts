import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Facility } from '../types';
import { FACILITIES } from '../constants';

const REGION_COORDINATES: Record<string, { center: [number, number], zoom: number }> = {
    '서울': { center: [37.5665, 126.9780], zoom: 11 },
    '경기': { center: [37.4138, 127.5183], zoom: 10 },
    '인천': { center: [37.4563, 126.7052], zoom: 11 },
    '강원': { center: [37.8228, 128.1555], zoom: 9 },
    // Add other regions as needed
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
            // This matches the SQL function signature we fixed: (lat, lng, radius_meters, filter_category)
            const { data, error } = await supabase
                .rpc('search_facilities', {
                    lat: center[0],
                    lng: center[1],
                    radius_meters: 500000, // 500km (Covering whole Korea)
                    filter_category: null
                });

            if (error) throw error;

            const mappedFacilities: Facility[] = (data || []).map((item: any) => {
                // Category Mapping: Robust matching for Korean types
                let category: any = '봉안시설'; // Default fallback
                const dbCategory = (item.category || '').trim();
                const name = (item.name || '');

                if (dbCategory.includes('funeral') || dbCategory.includes('장례')) category = '장례식장';
                else if (dbCategory.includes('charnel') || dbCategory.includes('봉안') || dbCategory.includes('납골')) category = '봉안시설';
                else if (dbCategory.includes('natural') || dbCategory.includes('자연장') || dbCategory.includes('수목') || dbCategory.includes('잔디')) category = '자연장';
                else if (dbCategory.includes('park') || dbCategory.includes('공원') || dbCategory.includes('묘지') || dbCategory === 'complex') category = '공원묘지';
                else if (dbCategory.includes('pet') || dbCategory.includes('반려') || dbCategory.includes('동물')) category = '동물장례';
                else if (dbCategory.includes('sea') || dbCategory.includes('해양') || dbCategory.includes('바다')) category = '해양장';

                // Sangjo check
                if (dbCategory.includes('sangjo') || dbCategory.includes('상조') || name.includes('상조')) category = '상조';

                // Simulation Logic (For demo purposes)
                const idNum = item.id ? item.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0;
                const pseudoRandom = (idNum % 10);
                const simulatedRating = pseudoRandom < 2 ? 3 : (pseudoRandom < 6 ? 4 : 5);
                const simulatedReviewCount = 3 + (idNum % 6);

                // Image Logic: Filtering bad URLs
                const rawImages = item.images || [];
                const dbImageUrl = item.image_url || '';

                const isBadUrl = (url: string) => {
                    if (!url) return true;
                    const badPatterns = [
                        'placeholder', 'placehold.it', 'placehold.co',
                        'unsplash', 'mediahub.seoul.go.kr',
                        'noimage', 'no-image', 'guitar',
                        'charnel_final', 'funeral_final'
                    ];
                    return badPatterns.some(pattern => url.toLowerCase().includes(pattern));
                };

                let selectedImage = rawImages.find((url: string) => !isBadUrl(url)) || (isBadUrl(dbImageUrl) ? null : dbImageUrl);

                // Default Image Fallback
                if (!selectedImage) {
                    const defaultMap: Record<string, string> = {
                        '장례식장': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg?v=1',
                        '봉안시설': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/charnel.jpg?v=1',
                        '자연장': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/natural.jpg?v=1',
                        '공원묘지': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/park.jpg?v=1',
                        '동물장례': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/pet.jpg?v=1',
                        '해양장': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/sea.jpg?v=1',
                        '상조': 'https://xvmpvzldezpoxxsarizm.supabase.co/storage/v1/object/public/facility-images/defaults/funeral.jpg?v=1'
                    };
                    selectedImage = defaultMap[category] || defaultMap['봉안시설'];
                }

                return {
                    id: item.id?.toString(),
                    name: item.name || '이름 없음',
                    category: category,
                    type: category,
                    religion: 'none',
                    address: item.address || '',
                    // Ensure lat/lng are Numbers
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
        } catch (err: any) {
            console.error("Failed to fetch facilities:", err);
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
                // Dynamic imports to match previous structure
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

                // Re-use Category Mapping logic for consistency
                let category: any = '봉안시설';
                const dbCategory = (data.category || '').trim();
                const name = data.name || '';

                if (dbCategory.includes('funeral') || dbCategory.includes('장례')) category = '장례식장';
                else if (dbCategory.includes('charnel') || dbCategory.includes('봉안') || dbCategory.includes('납골')) category = '봉안시설';
                else if (dbCategory.includes('natural') || dbCategory.includes('자연장') || dbCategory.includes('수목') || dbCategory.includes('잔디')) category = '자연장';
                else if (dbCategory.includes('park') || dbCategory.includes('공원') || dbCategory.includes('묘지') || dbCategory === 'complex') category = '공원묘지';
                else if (dbCategory.includes('pet') || dbCategory.includes('반려') || dbCategory.includes('동물')) category = '동물장례';
                else if (dbCategory.includes('sea') || dbCategory.includes('해양') || dbCategory.includes('바다')) category = '해양장';
                if (dbCategory.includes('sangjo') || dbCategory.includes('상조') || name.includes('상조')) category = '상조';

                const details = data.details || {};

                setFacilities(prev => prev.map(f => {
                    if (f.id !== facilityId) return f;

                    // Priority: data.lat (new column) -> data.location (PostGIS) -> f.lat (existing state)
                    let newLat = f.lat;
                    let newLng = f.lng;

                    if (data.lat && data.lng) {
                        newLat = Number(data.lat);
                        newLng = Number(data.lng);
                    } else if (data.location && data.location.type === 'Point' && Array.isArray(data.location.coordinates)) {
                        newLng = data.location.coordinates[0];
                        newLat = data.location.coordinates[1];
                    }

                    return {
                        ...f,
                        name: data.name,
                        category: category,
                        type: category,
                        religion: details.religion || 'none',
                        address: data.address,
                        lat: newLat,
                        lng: newLng,
                        priceRange: details.price_range || '가격 정보 상담',
                        rating: Number(details.rating || f.rating),
                        reviewCount: Number(details.review_count || f.reviewCount),
                        imageUrl: (data.images && data.images[0]) || (data.gallery_images && data.gallery_images[0]) || f.imageUrl,
                        description: details.description || data.description || '', // Check top-level description too
                        features: details.features || data.features || [],
                        phone: data.contact || data.phone || '', // Check contact/phone fields
                        prices: details.prices || data.prices || [],
                        galleryImages: data.gallery_images || images || (data.images || []),
                        reviews: reviews.length > 0 ? reviews : [],
                        naverBookingUrl: details.naver_booking_url,
                        isDetailLoaded: true,
                        isVerified: data.is_verified || false,
                        dataSource: 'db',
                        priceInfo: details.price_info || data.price_info || [],
                        aiContext: details.ai_context || data.ai_context || '',
                        subscription: subscription || undefined,
                        products: details.price_info?.products || []
                    };
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
