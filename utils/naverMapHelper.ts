
/**
 * Naver Map Helper Utilities
 */

// 카테고리 → 색상/아이콘 매핑 (한글 DB값 포함)
const CATEGORY_COLORS: Record<string, string> = {
    funeral_home: '#3B82F6', columbarium: '#8B5CF6', natural_burial: '#10B981',
    cemetery: '#059669', pet_funeral: '#F59E0B', sea_burial: '#0EA5E9', sangjo: '#6366F1',
    // 한글 fallback
    '장례식장': '#3B82F6', '봉안시설': '#8B5CF6', '자연장': '#10B981',
    '공원묘지': '#059669', '동물장례': '#F59E0B', '해양장': '#0EA5E9', '상조': '#6366F1',
    // legacy
    funeral: '#3B82F6', charnel: '#8B5CF6', natural: '#10B981',
    pet: '#F59E0B', sea: '#0EA5E9',
};

const CATEGORY_ICONS: Record<string, string> = {
    funeral_home: '🏛️', columbarium: '🕯️', natural_burial: '🌳',
    cemetery: '⛰️', pet_funeral: '🐾', sea_burial: '🌊', sangjo: '🤝',
    // 한글 fallback
    '장례식장': '🏛️', '봉안시설': '🕯️', '자연장': '🌳',
    '공원묘지': '⛰️', '동물장례': '🐾', '해양장': '🌊', '상조': '🤝',
    // legacy
    funeral: '🏛️', charnel: '🕯️', natural: '🌳',
    pet: '🐾', sea: '🌊',
};

// Basic marker icon HTML generator
export const getMarkerHtml = (category: string, isSelected: boolean = false) => {
    const color = isSelected ? '#FF5F5F' : (CATEGORY_COLORS[category] || '#6B7280');
    const icon = CATEGORY_ICONS[category] || '📍';
    const zIndex = isSelected ? 10 : 1;
    const scale = isSelected ? 1.2 : 1.0;

    return `
        <div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transform: scale(${scale});
            z-index: ${zIndex};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        ">
           ${icon}
        </div>
    `;
};

// Adapter to mimic Leaflet Bounds behavior for existing code compatibility
export class LeafletCompatibleBounds {
    private _min: { y: number; x: number };
    private _max: { y: number; x: number };
    private _zoom?: number;

    constructor(minLat: number, minLng: number, maxLat: number, maxLng: number, zoom?: number) {
        this._min = { y: minLat, x: minLng };
        this._max = { y: maxLat, x: maxLng };
        this._zoom = zoom;
    }

    // Leaflet's contains method: contains(latLng: [number, number] | LatLng)
    contains(latLng: [number, number] | { lat: number; lng: number }): boolean {
        let lat, lng;
        if (Array.isArray(latLng)) {
            [lat, lng] = latLng;
        } else {
            lat = latLng.lat;
            lng = latLng.lng;
        }

        return (
            lat >= this._min.y &&
            lat <= this._max.y &&
            lng >= this._min.x &&
            lng <= this._max.x
        );
    }

    // Naver specific (if needed internally)
    getRaw() {
        return { min: this._min, max: this._max };
    }

    // Leaflet's getSouthWest() adapter
    getSouthWest() {
        return {
            lat: this._min.y,
            lng: this._min.x
        };
    }

    // Leaflet's getNorthEast() adapter
    getNorthEast() {
        return {
            lat: this._max.y,
            lng: this._max.x
        };
    }

    getZoom() {
        return this._zoom;
    }
}
