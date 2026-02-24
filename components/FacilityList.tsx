import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { FacilityItem } from './FacilityItem';
import { Facility } from '../types';

interface FacilityListProps {
    facilities: Facility[];
    onSelect: (facility: Facility) => void;
    compareList: Facility[];
    onToggleCompare: (facility: Facility) => void;
}

export const FacilityList = React.memo<FacilityListProps>(({ facilities, onSelect, compareList, onToggleCompare }) => {
    // facilities prop은 useFacilityData에서 이미 카테고리/검색/상조제외 필터링 완료
    const filteredFacilities = facilities;

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
        return <div className="p-4 text-center text-gray-500">검색 결과가 없습니다.</div>;
    }

    // 개발 모드에서만 렌더링 로그 출력
    // if (import.meta.env.DEV) {
    //     console.log('FacilityList render - Filtered:', filteredFacilities.length, 'Total:', facilities.length);
    // }

    return (
        <div className="flex-1 w-full h-full min-h-[500px] bg-white">
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



