
/**
 * Naver Map Helper Utilities
 */

// Basic marker icon HTML generator
export const getMarkerHtml = (category: string, isSelected: boolean = false) => {
    const color = isSelected ? '#FF5F5F' : getCategoryColor(category);
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
           ${getCategoryIcon(category)}
        </div>
    `;
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'funeral_home': return '#4F46E5'; // Indigo
        case 'columbarium': return '#9333EA'; // Purple
        case 'natural_burial': return '#10B981'; // Green
        case 'cemetery': return '#F59E0B'; // Amber
        default: return '#6B7280'; // Gray
    }
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'funeral_home': return '🏢';
        case 'columbarium': return '⛩️';
        case 'natural_burial': return '🌳';
        case 'cemetery': return '🏞️';
        default: return '📍';
    }
};

// Adapter to mimic Leaflet Bounds behavior for existing code compatibility
export class LeafletCompatibleBounds {
    private _min: { y: number; x: number };
    private _max: { y: number; x: number };

    constructor(minLat: number, minLng: number, maxLat: number, maxLng: number) {
        this._min = { y: minLat, x: minLng };
        this._max = { y: maxLat, x: maxLng };
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
}
