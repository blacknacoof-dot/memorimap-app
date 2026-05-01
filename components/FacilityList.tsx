import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { SearchX } from 'lucide-react';
import { FacilityItem } from './FacilityItem';
import { Facility } from '../types';
import { useFilterStore } from '../stores/useFilterStore';

interface FacilityListProps {
    facilities: Facility[];
    onSelect: (facility: Facility) => void;
    compareList: Facility[];
    onToggleCompare: (facility: Facility) => void;
}

export const FacilityList = React.memo<FacilityListProps>(({ facilities, onSelect, compareList, onToggleCompare }) => {
    // facilities prop은 useFacilityData에서 이미 카테고리/검색/상조제외 필터링 완료
    const filteredFacilities = facilities;
    const resetCategories = useFilterStore(s => s.resetCategories);
    const setSearchQuery = useFilterStore(s => s.setSearchQuery);

    // compareList를 Set으로 변환하여 빠른 조회 성능 확보 (O(n) -> O(1))
    const compareIdSet = useMemo(
        () => new Set(compareList.map(f => f.id)),
        [compareList]
    );

    // Memoized renderer - Set 사용으로 의존성 최적화
    const itemContent = useMemo(() => {
        return (index: number, facility: Facility) => {
            const isCompared = compareIdSet.has(facility.id);
            return (
                <div className="pb-2 last:pb-0">
                    <FacilityItem
                        facility={facility}
                        onClick={onSelect}
                        isCompared={isCompared}
                        onToggleCompare={onToggleCompare}
                    />
                </div>
            );
        };
    }, [compareIdSet, onSelect, onToggleCompare]);

    if (!filteredFacilities || filteredFacilities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                <SearchX size={48} className="text-gray-300" />
                <div>
                    <p className="text-gray-600 font-medium mb-1">조건에 맞는 시설을 찾지 못했어요.</p>
                    <p className="text-gray-400 text-sm">다른 지역이나 카테고리를 선택해 보세요.</p>
                </div>
                <button
                    onClick={() => { resetCategories(); setSearchQuery(''); }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                >
                    조건 변경하기
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full h-full min-h-0 bg-transparent" data-debug="facility-list">
            <Virtuoso
                style={{ height: '100%', width: '100%' }}
                totalCount={filteredFacilities.length}
                data={filteredFacilities}
                itemContent={itemContent}
                overscan={500}
            />
        </div>
    );
});



