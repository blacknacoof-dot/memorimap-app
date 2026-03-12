import { useState, useEffect, useCallback } from 'react';
import { Facility } from '../types';
import { supabase } from '../lib/supabaseClient';

interface GeoPosition {
    lat: number;
    lng: number;
}

export interface NearbyFacility extends Facility {
    _distance?: number;
}

interface UseNearbyFacilitiesResult {
    facilities: NearbyFacility[];
    loading: boolean;
    error: string | null;
    position: GeoPosition | null;
    retry: () => void;
    manualSearch: (address: string) => void;
}

// Haversine 거리 계산 (km)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 주요 도시 좌표 (Geocoding API 대체)
const CITY_COORDS: Record<string, GeoPosition> = {
    '서울': { lat: 37.5665, lng: 126.978 },
    '부산': { lat: 35.1796, lng: 129.0756 },
    '대구': { lat: 35.8714, lng: 128.6014 },
    '인천': { lat: 37.4563, lng: 126.7052 },
    '광주': { lat: 35.1595, lng: 126.8526 },
    '대전': { lat: 36.3504, lng: 127.3845 },
    '울산': { lat: 35.5384, lng: 129.3114 },
    '경기': { lat: 37.4138, lng: 127.5183 },
    '세종': { lat: 36.4800, lng: 127.2550 },
    '강원': { lat: 37.8228, lng: 128.1555 },
    '제주': { lat: 33.4996, lng: 126.5312 },
};

export function useNearbyFacilities(autoStart = true): UseNearbyFacilitiesResult {
    const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<GeoPosition | null>(null);

    const fetchNearby = useCallback(async (lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            // 1차: 장례식장 10km 반경 (search_facilities_v2 RPC 직접 호출)
            const { data: first } = await supabase.rpc('search_facilities_v2', {
                lat, lng, radius_meters: 10000, category: 'funeral_home', limit: 10,
            });

            let data = first;

            // 2차: 결과 없으면 카테고리 무관 15km
            if (!data || data.length === 0) {
                const { data: second } = await supabase.rpc('search_facilities_v2', {
                    lat, lng, radius_meters: 15000, category: null, limit: 10,
                });
                data = second;
            }

            const sorted: NearbyFacility[] = (data || [])
                .map((f: Facility) => ({
                    ...f,
                    _distance: haversineKm(
                        lat, lng,
                        f.lat ?? f.latitude ?? 0,
                        f.lng ?? f.longitude ?? 0
                    ),
                }))
                .sort((a: NearbyFacility, b: NearbyFacility) => (a._distance ?? 0) - (b._distance ?? 0))
                .slice(0, 3);

            setFacilities(sorted);
        } catch {
            setError('시설 검색 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    const requestGPS = useCallback(() => {
        if (!navigator.geolocation) {
            setError('위치 서비스를 지원하지 않는 브라우저입니다.');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(geo);
                fetchNearby(geo.lat, geo.lng);
            },
            () => {
                setLoading(false);
                setError('위치 정보를 가져올 수 없습니다. 주소를 직접 입력해주세요.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [fetchNearby]);

    const manualSearch = useCallback((address: string) => {
        const match = Object.entries(CITY_COORDS).find(([key]) => address.includes(key));
        const geo = match ? match[1] : CITY_COORDS['서울'];
        setPosition(geo);
        fetchNearby(geo.lat, geo.lng);
    }, [fetchNearby]);

    useEffect(() => {
        if (autoStart) requestGPS();
    }, [autoStart, requestGPS]);

    return { facilities, loading, error, position, retry: requestGPS, manualSearch };
}
