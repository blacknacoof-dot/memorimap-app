import L from 'leaflet';
import { FacilityCategoryType } from '../types';

// Keys must match FacilityCategoryType values + 'sangjo'
export const FACILITY_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
    'funeral_home': {
        label: '장례식장',
        color: '#374151', // gray-700
        icon: '🏢'
    },
    'columbarium': {
        label: '봉안시설',
        color: '#9333ea', // purple-600
        icon: '🕊️'
    },
    'natural_burial': {
        label: '자연장',
        color: '#65a30d', // lime-600
        icon: '🌿'
    },
    'cemetery': {
        label: '공원묘지',
        color: '#16a34a', // green-600
        icon: '🌳'
    },
    'pet_funeral': {
        label: '동물장례',
        color: '#ec4899', // pink-500
        icon: '🐾'
    },
    'sea_burial': {
        label: '해양장',
        color: '#0891b2', // cyan-600
        icon: '🌊'
    },
    'sangjo': {
        label: '상조',
        color: '#3b82f6', // blue-500
        icon: '🤝'
    }
};

export const createCustomMarker = (category: string) => {
    // category is now English internal type (e.g., 'funeral_home')
    const meta = FACILITY_CATEGORIES[category] || FACILITY_CATEGORIES['funeral_home'];

    return L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="background-color: ${meta.color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; font-size: 16px;">${meta.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};
