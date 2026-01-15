import L from 'leaflet';
import { FacilityCategoryType } from '../types';

export const FACILITY_CATEGORIES: Record<FacilityCategoryType | '상조', { label: string; color: string; icon: string }> = {
    '장례식장': {
        label: '장례식장',
        color: '#374151', // gray-700
        icon: '🏢'
    },
    '봉안시설': {
        label: '봉안시설',
        color: '#9333ea', // purple-600
        icon: '🕊️'
    },
    '자연장': {
        label: '자연장',
        color: '#65a30d', // lime-600
        icon: '🌿'
    },
    '공원묘지': {
        label: '공원묘지',
        color: '#16a34a', // green-600
        icon: '🌳'
    },
    '동물장례': {
        label: '동물장례',
        color: '#ec4899', // pink-500
        icon: '🐾'
    },
    '해양장': {
        label: '해양장',
        color: '#0891b2', // cyan-600
        icon: '🌊'
    },
    '상조': {
        label: '상조',
        color: '#3b82f6', // blue-500
        icon: '🤝'
    }
};

export const createCustomMarker = (category: string) => {
    // Safe cast or fallback
    const safeCategory = (category in FACILITY_CATEGORIES) ? category as FacilityCategoryType : '장례식장';

    // Fallback for types not strictly in FacilityCategoryType but existing in data (like 'sangjo') if any
    const meta = FACILITY_CATEGORIES[safeCategory as keyof typeof FACILITY_CATEGORIES] || FACILITY_CATEGORIES['장례식장'];

    return L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background-color: ${meta.color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; font-size: 16px;">${meta.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};
