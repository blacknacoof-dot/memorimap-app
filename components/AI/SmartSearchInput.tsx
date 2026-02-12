import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFilterStore } from '../../stores/useFilterStore';
import { Search, X, AlertCircle, Building2, Map as MapIcon } from 'lucide-react';

interface SmartSearchInputProps {
  /** Controlled value (if omitted, uses useFilterStore) */
  value?: string;
  /** Controlled onChange (if omitted, uses useFilterStore) */
  onChange?: (value: string) => void;
  /** Action callback: urgent=긴급상담, search=장례식장검색, map=지도이동 */
  onAction?: (type: 'urgent' | 'search' | 'map', region: string) => void;
  /** Custom class for container */
  className?: string;
  /** Compact mode for FilterBar (smaller height) */
  compact?: boolean;
}

const REGION_KEYWORDS = [
  '서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  '분당', '강남', '수원', '일산', '판교', '고양', '용인', '성남',
  '안산', '화성', '평택', '안양', '남양주', '의정부', '시흥', '파주',
  '김포', '광명', '군포', '이천', '오산', '하남', '양주', '구리',
  '안성', '포천', '의왕', '여주', '동두천', '과천', '부천',
];

const URGENT_KEYWORDS = ['급해요', '긴급', '빨리', '도와주세요', '임종', '위급', '사망', '부고'];

const QUICK_CHIPS = [
  { label: '분당 장례식장', icon: '🏥' },
  { label: '급해요', icon: '🚨' },
  { label: '서울 추모시설', icon: '🗺️' },
];

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value: controlledValue,
  onChange: controlledOnChange,
  onAction,
  className,
  compact = false,
}) => {
  // Controlled vs store mode
  const storeQuery = useFilterStore(s => s.searchQuery);
  const storeSetQuery = useFilterStore(s => s.setSearchQuery);
  const query = controlledValue !== undefined ? controlledValue : storeQuery;
  const setQuery = controlledOnChange || storeSetQuery;

  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect region & urgency
  const detectedRegion = REGION_KEYWORDS.find(r => query.includes(r));
  const isUrgent = URGENT_KEYWORDS.some(u => query.includes(u));
  const hasActions = !!detectedRegion || isUrgent;
  const showQuickChips = isFocused && !query;

  // Show dropdown when text has actions or show quick chips on empty focus
  useEffect(() => {
    setShowDropdown((query.length > 0 && hasActions) || showQuickChips);
  }, [query, hasActions, showQuickChips]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = useCallback((type: 'urgent' | 'search' | 'map') => {
    onAction?.(type, detectedRegion || query);
    setShowDropdown(false);
  }, [onAction, detectedRegion, query]);

  const handleChipClick = useCallback((label: string) => {
    setQuery(label);
  }, [setQuery]);

  return (
    <div ref={containerRef} className={`relative w-full ${className || ''}`}>
      {/* Search Input */}
      <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ring-1 ring-black/5 ${
        isFocused ? 'ring-primary/30 border-primary/20' : ''
      }`}>
        <div className={`flex items-center px-4 bg-white ${compact ? 'h-12' : 'h-14'}`}>
          <Search size={compact ? 18 : 20} className="text-primary mr-3 shrink-0" />
          <input
            id="smart-search-input"
            name="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (query.length > 0 && hasActions) setShowDropdown(true);
            }}
            placeholder="지역, 시설, 또는 '급해요' 입력"
            className={`w-full h-full outline-none bg-transparent text-gray-900 placeholder:text-gray-400 font-medium ${
              compact ? 'text-sm' : 'text-base'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              aria-label="검색어 초기화"
            >
              <X size={compact ? 16 : 18} />
            </button>
          )}
        </div>
      </div>

      {/* Smart Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Chips (empty input) */}
          {showQuickChips && (
            <div className="p-4">
              <p className="text-xs text-gray-400 font-medium mb-3">이렇게 검색해 보세요</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip.label)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-colors"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {hasActions && (
            <div className="py-2">
              {/* Urgent */}
              {isUrgent && (
                <button
                  onClick={() => handleAction('urgent')}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors border-b border-gray-50 group text-left"
                >
                  <div className="bg-red-100 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertCircle size={22} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600 text-base">긴급 장례 상담</span>
                      {detectedRegion && (
                        <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                          {detectedRegion} 지역
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-400 font-medium mt-0.5">상담 전문가 바로 연결</p>
                  </div>
                </button>
              )}

              {/* Search facilities */}
              {detectedRegion && (
                <button
                  onClick={() => handleAction('search')}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors border-b border-gray-50 group text-left"
                >
                  <div className="bg-blue-100 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <Building2 size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 text-base">'{detectedRegion}' 장례식장 검색</span>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">검색 결과 및 상세 정보 보기</p>
                  </div>
                </button>
              )}

              {/* Map area */}
              {detectedRegion && (
                <button
                  onClick={() => handleAction('map')}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-emerald-50 transition-colors group text-left"
                >
                  <div className="bg-emerald-100 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                    <MapIcon size={22} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 text-base">'{detectedRegion}' 주변 추모시설</span>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">봉안당, 수목장 등 지도에서 찾기</p>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
