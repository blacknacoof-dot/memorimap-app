import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Facility } from '../types';
import { useFilterStore } from '../stores/useFilterStore';

// Fix for Leaflet default icons in React/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Import markercluster styles
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MapProps {
  facilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export interface MapRef {
  flyToLocation: () => void;
}

const LocationMarker = forwardRef<MapRef, {}>((props, ref) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  const flyToLocation = () => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15); // Zoom in closer for 'My Location'
    });
  };

  useImperativeHandle(ref, () => ({
    flyToLocation
  }));

  return position === null ? null : (
    <Marker position={position}>
      <Popup>현재 위치</Popup>
    </Marker>
  );
});

const MapEvents = ({ onBoundsChange }: { onBoundsChange?: (bounds: L.LatLngBounds) => void }) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      onBoundsChange?.(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange?.(map.getBounds());
    }
  });

  // Trigger initial bounds
  useEffect(() => {
    if (map) {
      // Small timeout to ensure map is ready and layout is stable
      const timer = setTimeout(() => {
        onBoundsChange?.(map.getBounds());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [map, onBoundsChange]);

  return null;
};

const MapController = ({ center, zoom }: { center?: [number, number], zoom?: number }) => {
  const map = useMap();
  const prevCenter = React.useRef<[number, number] | undefined>(undefined);
  const prevZoom = React.useRef<number | undefined>(undefined);

  useEffect(() => {
    if (center) {
      const isCenterChanged = !prevCenter.current ||
        prevCenter.current[0] !== center[0] ||
        prevCenter.current[1] !== center[1];

      const isZoomChanged = zoom !== undefined && prevZoom.current !== zoom;

      if (isCenterChanged || isZoomChanged) {
        prevCenter.current = center;
        prevZoom.current = zoom;
        map.flyTo(center, zoom || 15, { animate: true, duration: 1.5 });
      }
    }
  }, [center, zoom, map]);
  return null;
};

import { createCustomMarker } from '../utils/mapHelpers';

// ... (remove createCustomIcon)

const MapComponent = forwardRef<MapRef, MapProps>(({ facilities, onFacilitySelect, onBoundsChange, initialCenter, initialZoom }, ref) => {
  const locationRef = React.useRef<MapRef>(null);

  // Store State for Filtering
  const searchQuery = useFilterStore(s => s.searchQuery);
  const selectedCategories = useFilterStore(s => s.selectedCategories);

  // Internal Filtering Logic (Duplicate of FacilityList for now - parallel implementation)
  const filteredFacilities = React.useMemo(() => {
    return facilities.filter(facility => {
      const matchesSearch = !searchQuery ||
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategories.length === 0 ||
        (facility.category && selectedCategories.includes(facility.category));

      // 3. Exclude 'Sangjo'
      const isSangjo = (facility.category as string) === 'sangjo' || (facility.category as string) === '상조';

      return matchesSearch && matchesCategory && !isSangjo;
    });
  }, [facilities, searchQuery, selectedCategories]);

  useImperativeHandle(ref, () => ({
    flyToLocation: () => {
      if (locationRef.current) {
        locationRef.current.flyToLocation();
      }
    }
  }));

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={initialCenter || [37.35, 127.15]}
        zoom={initialZoom || 10}
        style={{ height: '100%', width: '100%', transform: 'translate3d(0,0,0)' }}
        zoomControl={false}
      >
        <MapController center={initialCenter} zoom={initialZoom} />
        <MapEvents onBoundsChange={onBoundsChange} />
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/help/terms_maps/">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&hl=ko&x={x}&y={y}&z={z}"
        />
        <LocationMarker ref={locationRef} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
        >
          {filteredFacilities
            .filter(f => f.lat && f.lng && f.lat !== 0 && f.lng !== 0)
            .map((facility) => (
              <Marker
                key={facility.id}
                position={[facility.lat as number, facility.lng as number]}
                icon={createCustomMarker((facility.category as string) || '')}
                eventHandlers={{
                  click: () => onFacilitySelect(facility),
                }}
              />
            ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
});

export default React.memo(MapComponent);