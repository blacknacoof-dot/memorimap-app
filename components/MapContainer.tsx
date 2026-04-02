import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Facility } from '../types';
import { getMarkerHtml, LeafletCompatibleBounds } from '../utils/naverMapHelper';
import { toast } from 'sonner';

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;
let naverMapScriptPromise: Promise<void> | null = null;

const loadNaverMapSdk = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Naver Maps SDK can only load in the browser.'));
  }

  if (window.naver?.maps?.Map) {
    return Promise.resolve();
  }

  if (naverMapScriptPromise) {
    return naverMapScriptPromise;
  }

  if (!NAVER_MAP_CLIENT_ID) {
    return Promise.reject(new Error('VITE_NAVER_MAP_CLIENT_ID is not configured.'));
  }

  naverMapScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-map-sdk="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Naver Maps SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.naverMapSdk = 'true';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Naver Maps SDK.'));
    document.head.appendChild(script);
  }).catch((error) => {
    naverMapScriptPromise = null;
    throw error;
  });

  return naverMapScriptPromise;
};

interface NaverMaps {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMapInstance;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Marker: new (opts: Record<string, unknown>) => NaverMarker;
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  Event: {
    addListener: (target: unknown, event: string, handler: (...args: unknown[]) => void) => unknown;
    removeListener: (listener: unknown) => void;
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
  setIcon?: (icon: Record<string, unknown>) => void;
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
  getBounds: () => LeafletCompatibleBounds | null;
}

// ✅ [1-1] 좌표 유효성 검증 (한반도 범위 제한)
const isValidCoord = (lat: number | undefined | null, lng: number | undefined | null): boolean => {
  if (lat == null || lng == null) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  // 한반도 및 주변 범위 (제주~북한 포함)
  if (lat < 33 || lat > 43 || lng < 124 || lng > 132) return false;
  return true;
};

const MapComponent = forwardRef<MapRef, MapProps>(({ facilities, onFacilitySelect, onBoundsChange, initialCenter, initialZoom }, ref) => {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const clusterRef = useRef<MarkerClusteringInstance | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isClusterReady, setIsClusterReady] = useState(false);
  const [_myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationMarkerRef = useRef<NaverMarker | null>(null);

  // ✅ [1-2a] idle 리스너 핸들 저장용 ref
  const idleListenerRef = useRef<unknown>(null);
  // ✅ [1-2b] setTimeout ID 저장용 ref
  const resizeTimerIds = useRef<number[]>([]);
  // ✅ [1-2b] ResizeObserver 저장용 ref
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // ✅ [1-2c] 마커 클릭 리스너 핸들 저장용 ref (per-marker Map)
  const markerListenerMapRef = useRef<Map<string, unknown>>(new Map());
  // ✅ 아이콘 캐시 (카테고리별 — getMarkerHtml 반복 호출 방지)
  const iconCacheRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  // ✅ onFacilitySelect 최신 참조 유지 (리스너 재등록 최소화)
  const onFacilitySelectRef = useRef(onFacilitySelect);
  useEffect(() => { onFacilitySelectRef.current = onFacilitySelect; }, [onFacilitySelect]);

  // facilities prop은 useFacilityData에서 이미 카테고리/검색 필터링 완료
  const filteredFacilities = facilities;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapElement.current) return;

    let isMounted = true;
    let checkInterval: NodeJS.Timeout | null = null;
    const registerTimeout = (callback: () => void, delay: number): number => {
      const timeoutId = window.setTimeout(callback, delay);
      resizeTimerIds.current.push(timeoutId);
      return timeoutId;
    };
    const clearRegisteredTimeouts = () => {
      resizeTimerIds.current.forEach(id => clearTimeout(id));
      resizeTimerIds.current = [];
    };

    // SDK 로드 대기 (index.html에서 미리 로드됨)
    const loadAndInitMap = () => {
      let sdkLoadFailed = false;

      loadNaverMapSdk().catch(() => {
        sdkLoadFailed = true;
        toast.error('지도 SDK를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      });

      if (window.naver && window.naver.maps && window.naver.maps.Map) {
        initMap();
        return;
      }

      checkInterval = setInterval(() => {
        if (sdkLoadFailed) {
          if (checkInterval) clearInterval(checkInterval);
          return;
        }
        if (window.naver && window.naver.maps && window.naver.maps.Map) {
          if (checkInterval) clearInterval(checkInterval);
          if (isMounted) {
            initMap();
          }
        }
      }, 200);

      // 15초 후 타임아웃
      // ✅ [5-2] SDK 폴링 타이머도 resizeTimerIds에 저장하여 cleanup 보장
      registerTimeout(() => {
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
        // ✅ [1-2a] idle 리스너 핸들을 ref에 저장
        idleListenerRef.current = window.naver.maps.Event.addListener(map, 'idle', () => {
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
        // ✅ [1-2b] setTimeout ID를 ref에 저장
        registerTimeout(triggerResize, 0);
        registerTimeout(triggerResize, 300);
        registerTimeout(triggerResize, 1000);

        // ResizeObserver로 컨테이너 크기 변경 감지
        if (mapElement.current && typeof ResizeObserver !== 'undefined') {
          resizeObserverRef.current = new ResizeObserver(() => triggerResize());
          resizeObserverRef.current.observe(mapElement.current);
          // 3초 후 observer 해제 (초기 로드용)
          registerTimeout(() => resizeObserverRef.current?.disconnect(), 3000);
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
      // ✅ [1-2b] setTimeout 전부 해제
      clearRegisteredTimeouts();
      // ✅ [1-2b] ResizeObserver 해제
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      // ✅ [1-2a] idle 리스너 해제
      if (idleListenerRef.current && window.naver?.maps?.Event) {
        window.naver.maps.Event.removeListener(idleListenerRef.current);
        idleListenerRef.current = null;
      }
      // Clean up global callback to prevent memory leak or stale closures
      delete (window as Window & { initNaverMap?: () => void }).initNaverMap;
    };
  }, []); // Run once

  // 2. Render Markers (with clustering) — ✅ [5-4] diff 기반 증분 업데이트
  // ✅ [5-4] 이전 마커를 facility.id 기준으로 추적
  const prevMarkerMapRef = useRef<Map<string, NaverMarker>>(new Map());
  const prevMarkerStateRef = useRef<Map<string, { lat: number; lng: number; iconCategory: string }>>(new Map());

  useEffect(() => {
    if (!mapInstance.current || !window.naver || !isMapReady) return;

    const useCluster = Boolean(isClusterReady && window.MarkerClustering);

    // ✅ [1-1] isValidCoord로 NaN/범위 밖 좌표 필터링
    const validFacilities = filteredFacilities.filter(f => isValidCoord(f.lat, f.lng));
    const newIds = new Set(validFacilities.map(f => f.id));
    const prevMap = prevMarkerMapRef.current;
    const prevStateMap = prevMarkerStateRef.current;

    // ✅ 아이콘 캐시: 카테고리별 1회만 생성 (7종 캐시 vs ~2000회 반복 생성 제거)
    const getOrCreateIcon = (category: string) => {
      const cached = iconCacheRef.current.get(category);
      if (cached) return cached;
      const icon = {
        content: getMarkerHtml(category, false),
        size: new window.naver.maps.Size(24, 24),
        anchor: new window.naver.maps.Point(12, 12),
      };
      iconCacheRef.current.set(category, icon);
      return icon;
    };

    // ✅ 1단계: 삭제 — 이전에 있었으나 새 목록에 없는 마커 + 해당 리스너만 제거
    let markersChanged = false;
    for (const [id, marker] of prevMap) {
      if (!newIds.has(id)) {
        marker.setMap(null);
        prevMap.delete(id);
        prevStateMap.delete(id);
        const listener = markerListenerMapRef.current.get(id);
        if (listener && window.naver?.maps?.Event) {
          window.naver.maps.Event.removeListener(listener);
        }
        markerListenerMapRef.current.delete(id);
        markersChanged = true;
      }
    }

    // ✅ 2단계: 추가/업데이트 — 새 마커만 생성, 기존 마커는 위치/아이콘만 갱신
    for (const facility of validFacilities) {
      const nextLat = facility.lat!;
      const nextLng = facility.lng!;
      const nextIconCategory = (facility.type || facility.category || 'funeral_home') as string;
      const nextMarkerState = { lat: nextLat, lng: nextLng, iconCategory: nextIconCategory };
      const markerPosition = new window.naver.maps.LatLng(nextLat, nextLng);
      let marker = prevMap.get(facility.id);

      if (!marker) {
        // 새 마커 생성 + 리스너 즉시 등록 (ref 패턴으로 최신 콜백 보장)
        marker = new window.naver.maps.Marker({
          position: markerPosition,
          map: useCluster ? null : mapInstance.current,
          title: facility.name,
          icon: getOrCreateIcon(nextIconCategory)
        });
        prevMap.set(facility.id, marker);
        prevStateMap.set(facility.id, nextMarkerState);
        const fid = facility.id;
        const listener = window.naver.maps.Event.addListener(marker, 'click', () => {
          const latest = filteredFacilities.find(f => f.id === fid);
          onFacilitySelectRef.current(latest || facility);
        });
        markerListenerMapRef.current.set(fid, listener);
        markersChanged = true;
        continue;
      }

      // 기존 마커: 위치/아이콘 변경분만 갱신 (리스너 유지)
      const prevState = prevStateMap.get(facility.id);
      const isPositionChanged = !prevState || prevState.lat !== nextLat || prevState.lng !== nextLng;
      if (isPositionChanged) {
        marker.setPosition(markerPosition);
        markersChanged = true;
      }

      const isIconChanged = !prevState || prevState.iconCategory !== nextIconCategory;
      if (isIconChanged) {
        const nextIcon = getOrCreateIcon(nextIconCategory);
        if (typeof marker.setIcon === 'function') {
          marker.setIcon(nextIcon);
        } else {
          marker.setMap(null);
          marker = new window.naver.maps.Marker({
            position: markerPosition,
            map: useCluster ? null : mapInstance.current,
            title: facility.name,
            icon: nextIcon
          });
          prevMap.set(facility.id, marker);
          // 마커 재생성 시 리스너도 재등록
          const oldListener = markerListenerMapRef.current.get(facility.id);
          if (oldListener && window.naver?.maps?.Event) {
            window.naver.maps.Event.removeListener(oldListener);
          }
          const fid = facility.id;
          const listener = window.naver.maps.Event.addListener(marker, 'click', () => {
            const latest = filteredFacilities.find(f => f.id === fid);
            onFacilitySelectRef.current(latest || facility);
          });
          markerListenerMapRef.current.set(fid, listener);
        }
      }

      marker.setMap(useCluster ? null : mapInstance.current);
      prevStateMap.set(facility.id, nextMarkerState);
    }

    // ✅ 3단계: 클러스터 — 마커 변경 시에만 재구성 (변경 없으면 skip)
    markersRef.current = Array.from(prevMap.values());

    if (markersChanged || !clusterRef.current) {
      // 기존 클러스터 해제
      if (clusterRef.current) {
        clusterRef.current.setMap(null);
        clusterRef.current = null;
      }

      if (useCluster && markersRef.current.length > 0) {
        const clusterIconHtml = (bg: string, size: number) => ({
          content: `<div style="cursor:pointer;width:${size}px;height:${size}px;line-height:${size}px;font-size:11px;color:white;text-align:center;font-weight:bold;background:${bg};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          size: new window.naver.maps.Size(size, size),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        });

        markersRef.current.forEach(m => m.setMap(null));

        clusterRef.current = new window.MarkerClustering({
          minClusterSize: 2,
          maxZoom: 14,
          map: mapInstance.current,
          markers: markersRef.current,
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
      } else {
        markersRef.current.forEach(m => m.setMap(mapInstance.current));
      }
    }

    // ✅ 마커 리스너 cleanup (per-marker Map 기반)
    return () => {
      for (const [, listener] of markerListenerMapRef.current) {
        if (window.naver?.maps?.Event) {
          window.naver.maps.Event.removeListener(listener);
        }
      }
      markerListenerMapRef.current.clear();
    };
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
      }, (_err) => {
        toast.error("위치를 가져올 수 없습니다.");
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }); // ✅ [3-1] GPS timeout 추가
    },
    flyTo: (center: [number, number], zoom: number) => {
      if (!mapInstance.current || !window.naver?.maps) return;
      const latLng = new window.naver.maps.LatLng(center[0], center[1]);
      mapInstance.current.setCenter(latLng);
      mapInstance.current.setZoom(zoom);
    },
    getBounds: () => {
      if (!mapInstance.current) return null;
      const bounds = mapInstance.current.getBounds();
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      return new LeafletCompatibleBounds(sw.lat(), sw.lng(), ne.lat(), ne.lng());
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
