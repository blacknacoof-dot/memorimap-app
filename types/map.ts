export interface MapProvider {
    initialize(container: HTMLElement, options?: any): void;
    setCenter(lat: number, lng: number): void;
    setZoom(level: number): void;
    fitBounds(bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }): void;
    addMarker(marker: MapMarker): void;
    clearMarkers(): void;
}

export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    category?: string;
    icon?: string | any; // Allow flexible icon types
    onClick?: () => void;
}

export interface MapBounds {
    _min: { y: number; x: number }; // SouthWest
    _max: { y: number; x: number }; // NorthEast
}
