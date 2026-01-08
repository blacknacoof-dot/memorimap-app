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
                console.warn('Geolocation error:', err);
                setError('위치 정보를 가져올 수 없습니다.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
