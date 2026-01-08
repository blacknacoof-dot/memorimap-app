import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Facility } from '../types';

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

// Custom Icon Logic
const createCustomIcon = (type: string) => {
  let bgColor = '#3b82f6'; // default blue
  let iconChar = '';

  switch (type) {
    case 'funeral': // 장례식장
      bgColor = '#374151'; // gray-700
      iconChar = '🏢';
      break;
    case 'pet': // 반려동물
      bgColor = '#ec4899'; // pink-500 (더 눈에 띄는 색상)
      iconChar = '🐾';
      break;
    case 'park': // 공원묘지
    case 'complex': // 공원묘지 (복합)
      bgColor = '#16a34a'; // green-600
      iconChar = '🌳';
      break;
    case 'natural': // 자연장
      bgColor = '#65a30d'; // lime-600
      iconChar = '🌿';
      break;
    case 'charnel': // 봉안시설
      bgColor = '#9333ea'; // purple-600
      iconChar = '🕊️';
      break;
    case 'sea': // 해양장
      bgColor = '#0891b2'; // cyan-600
      iconChar = '🌊';
      break;
    default:
      bgColor = '#3b82f6';
  }

  return L.divIcon({
    className: 'custom-marker-icon', // Empty class to remove default styles
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center; font-size: 16px;">${iconChar}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16], // Center
    popupAnchor: [0, -16]
  });
};

const MapComponent = forwardRef<MapRef, MapProps>(({ facilities, onFacilitySelect, onBoundsChange, initialCenter, initialZoom }, ref) => {
  const locationRef = React.useRef<MapRef>(null);

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
          {facilities
            .filter(f => f.lat && f.lng && f.lat !== 0 && f.lng !== 0)
            .map((facility) => (
              <Marker
                key={facility.id}
                position={[facility.lat, facility.lng]}
                icon={createCustomIcon(facility.type)}
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