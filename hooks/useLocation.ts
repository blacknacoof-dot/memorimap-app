import { useState, useEffect, useCallback } from 'react';

export interface LocationState {
    lat: number;
    lng: number;
    addressText?: string;
    type: 'gps' | 'manual' | 'default';
}

export const useLocation = () => {
    const [location, setLocation] = useState<LocationState>({
        lat: 37.5665, // Default: Seoul
        lng: 126.9780,
        type: 'default'
    });
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateLocation = useCallback((lat: number, lng: number, address?: string, type: LocationState['type'] = 'manual') => {
        setLocation({ lat, lng, addressText: address, type });
    }, []);

    const getCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
            return;
        }

        setIsLocating(true);
        // Desktop browsers often time out with high accuracy (GPS). 
        // We prioritize speed and availability (Wi-Fi/IP) over precision for the initial check.
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    type: 'gps'
                });
                setIsLocating(false);
                setError(null);
            },
            (err) => {
                // [Fix] Handle permission denied silently (User Request)
                if (err.code === err.PERMISSION_DENIED) {
                    // User denied - Just fallback silently without warning
                    setLocation({
                        lat: 37.5665,
                        lng: 126.9780,
                        type: 'default'
                    });
                    setError(null);
                } else {
                    // Actual error - Log it
                    console.warn('Geolocation failed, falling back to default:', err);
                    setLocation({
                        lat: 37.5665,
                        lng: 126.9780,
                        type: 'default'
                    });
                    setError('위치 정보를 가져올 수 없습니다. 기본 위치로 설정합니다.');
                }
                setIsLocating(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    }, []);

    return {
        location,
        isLocating,
        error,
        updateLocation,
        getCurrentPosition
    };
};
