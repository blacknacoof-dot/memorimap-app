import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Facility } from '../types';
import { getMarkerHtml, LeafletCompatibleBounds } from '../utils/naverMapHelper';
import { toast } from 'sonner';

interface NaverMaps {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMapInstance;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Marker: new (opts: Record<string, unknown>) => NaverMarker;
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Event: {
    addListener: (target: unknown, event: string, handler: (...args: unknown[]) => void) => void;
    trigger: (target: unknown, event: string) => void;
  };
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

interface NaverBounds {
  getNE: () => NaverLatLng;
  getSW: () => NaverLatLng;
}

interface NaverMapInstance {
  getBounds: () => NaverBounds;
  setSize: (size: unknown) => void;
  getCenter: () => NaverLatLng;
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  panTo: (latlng: NaverLatLng, opts?: unknown) => void;
}

interface NaverMarker {
  setMap: (map: NaverMapInstance | null) => void;
  getElement: () => HTMLElement | null;
  setPosition: (latlng: unknown) => void;
}

interface MarkerClusteringInstance {
  setMap: (map: NaverMapInstance | null) => void;
}

declare global {
  interface Window {
    naver: { maps: NaverMaps };
    MarkerClustering: new (opts: Record<string, unknown>) => MarkerClusteringInstance;
  }
}

interface MapProps {
  facilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
  onBoundsChange?: (bounds: LeafletCompatibleBounds) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export interface MapRef {
  flyToLocation: () => void;
  flyTo: (center: [number, number], zoom: number) => void;
}

const MapComponent = forwardRef<MapRef, MapProps>(({ facilities, onFacilitySelect, onBoundsChange, initialCenter, initialZoom }, ref) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const clusterRef = useRef<MarkerClusteringInstance | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isClusterReady, setIsClusterReady] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationMarkerRef = useRef<NaverMarker | null>(null);

  // facilities prop은 useFacilityData에서 이미 카테고리/검색 필터링 완료
  const filteredFacilities = facilities;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapElement.current) return;

    let isMounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    // SDK 로드 대기 (index.html에서 미리 로드됨)
    const loadAndInitMap = () => {
      if (window.naver && window.naver.maps && window.naver.maps.Map) {
        // SDK already loaded, init immediately
        initMap();
        return;
      }

      // Waiting for Naver SDK
      checkInterval = setInterval(() => {
        if (window.naver && window.naver.maps && window.naver.maps.Map) {
          if (checkInterval) clearInterval(checkInterval);
          if (isMounted) {
            // SDK loaded via polling
            initMap();
          }
        }
      }, 200);

      // 15초 후 타임아웃
      setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      }, 15000);
    };

    function initMap() {
      if (!mapElement.current || !isMounted) return;

      // ✅ [Crash Prevention] SDK Safety Check
      if (!window.naver || !window.naver.maps || !window.naver.maps.Map) {
        return;
      }

      if (mapInstance.current) return;

      try {
        const center = initialCenter ?
          new window.naver.maps.LatLng(initialCenter[0], initialCenter[1]) :
          new window.naver.maps.LatLng(37.3595704, 127.105399);

        const mapOptions = {
          center: center,
          zoom: initialZoom || 15,
          minZoom: 6,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: false,
          mapTypeControl: false
        };

        const map = new window.naver.maps.Map(mapElement.current, mapOptions);
        mapInstance.current = map;

        // Event Listeners
        window.naver.maps.Event.addListener(map, 'idle', () => {
          if (onBoundsChange) {
            const bounds = map.getBounds();
            const ne = bounds.getNE();
            const sw = bounds.getSW();
            const fakeBounds = new LeafletCompatibleBounds(sw.lat(), sw.lng(), ne.lat(), ne.lng());
            onBoundsChange(fakeBounds);
          }
        });

        setIsMapReady(true);
        // Naver Map Initialized successfully

        // Fix: 초기 로드 시 지도 빈 화면 방지 - 여러 타이밍에 리사이즈 트리거
        const triggerResize = () => {
          if (map && mapElement.current && mapElement.current.clientWidth > 0) {
            map.setSize(new window.naver.maps.Size(
              mapElement.current.clientWidth,
              mapElement.current.clientHeight
            ));
            window.naver.maps.Event.trigger(map, 'resize');
          }
        };
        setTimeout(triggerResize, 0);
        setTimeout(triggerResize, 300);
        setTimeout(triggerResize, 1000);

        // ResizeObserver로 컨테이너 크기 변경 감지
        if (mapElement.current && typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => triggerResize());
          ro.observe(mapElement.current);
          // 3초 후 observer 해제 (초기 로드용)
          setTimeout(() => ro.disconnect(), 3000);
        }

        // Load MarkerClustering script
        if (!window.MarkerClustering) {
          const clusterScript = document.createElement('script');
          clusterScript.src = '/MarkerClustering.js';
          clusterScript.onload = () => {
            // MarkerClustering loaded
            if (isMounted) setIsClusterReady(true);
          };
          clusterScript.onerror = () => {
            // fallback: use individual markers
          };
          document.head.appendChild(clusterScript);
        } else {
          setIsClusterReady(true);
        }
      } catch {
        // map init failure is non-critical; map will remain blank
      }
    }

    // 지도 로드 시작
    loadAndInitMap();

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      // Clean up global callback to prevent memory leak or stale closures
      delete (window as Window & { initNaverMap?: () => void }).initNaverMap;
    };
  }, []); // Run once

  // 2. Render Markers (with clustering)
  useEffect(() => {
    if (!mapInstance.current || !window.naver || !isMapReady) return;

    // Clear existing cluster
    if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }
    // Clear individual markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create markers (without map for clustering, with map for fallback)
    const useCluster = isClusterReady && window.MarkerClustering;

    const markers = filteredFacilities
      .filter(f => f.lat && f.lng)
      .map(facility => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(facility.lat!, facility.lng!),
          map: useCluster ? null : mapInstance.current,
          title: facility.name,
          icon: {
            content: getMarkerHtml((facility.type || facility.category || 'funeral_home') as string, false),
            size: new window.naver.maps.Size(24, 24),
            anchor: new window.naver.maps.Point(12, 12)
          }
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          onFacilitySelect(facility);
        });

        return marker;
      });

    markersRef.current = markers;

    if (useCluster && markers.length > 0) {
      const clusterIconHtml = (bg: string, size: number) => ({
        content: `<div style="cursor:pointer;width:${size}px;height:${size}px;line-height:${size}px;font-size:11px;color:white;text-align:center;font-weight:bold;background:${bg};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size / 2, size / 2),
      });

      clusterRef.current = new window.MarkerClustering({
        minClusterSize: 2,
        maxZoom: 14,
        map: mapInstance.current,
        markers: markers,
        disableClickZoom: false,
        gridSize: 120,
        icons: [
          clusterIconHtml('#3B82F6', 36),
          clusterIconHtml('#2563EB', 42),
          clusterIconHtml('#1D4ED8', 50),
          clusterIconHtml('#1E40AF', 58),
        ],
        indexGenerator: [10, 50, 100, 500],
        averageCenter: true,
        stylingFunction: (clusterMarker: NaverMarker, count: number) => {
          const el = clusterMarker.getElement();
          if (el) {
            const div = el.querySelector('div');
            if (div) div.textContent = String(count);
          }
        },
      });
    }
  }, [filteredFacilities, isMapReady, isClusterReady]);

  // 3. Sync Center (Removed to prevent snapping back when user moves map)
  // The map is initialized with initialCenter, and manual movement should be preserved.
  // Full flyTo is handled by the imperative handle.

  // 4. Handle Imperative Ref (FlyToLocation)
  useImperativeHandle(ref, () => ({
    flyToLocation: () => {
      if (!mapInstance.current || !navigator.geolocation || !window.naver || !window.naver.maps) return;

      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const latLng = new window.naver.maps.LatLng(latitude, longitude);

        mapInstance.current!.setCenter(latLng);
        mapInstance.current!.setZoom(16);
        setMyLocation({ lat: latitude, lng: longitude });

        // Update Location Marker
        if (locationMarkerRef.current) {
          locationMarkerRef.current.setPosition(latLng);
        } else {
          locationMarkerRef.current = new window.naver.maps.Marker({
            position: latLng,
            map: mapInstance.current,
            icon: {
              content: '<div style="width:12px;height:12px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
              anchor: new window.naver.maps.Point(6, 6)
            }
          });
        }
      }, (err) => {
        toast.error("위치를 가져올 수 없습니다.");
      });
    },
    flyTo: (center: [number, number], zoom: number) => {
      if (!mapInstance.current || !window.naver?.maps) return;
      const latLng = new window.naver.maps.LatLng(center[0], center[1]);
      mapInstance.current.setCenter(latLng);
      mapInstance.current.setZoom(zoom);
    },
  }));

  // Render
  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
    </div>
  );
});

export default React.memo(MapComponent);