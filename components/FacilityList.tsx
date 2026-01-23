import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { FacilityItem } from './FacilityItem';
import { Facility, FacilityCategoryType } from '../types';
import { useFilterStore } from '../stores/useFilterStore';

interface FacilityListProps {
    facilities: Facility[];
    onSelect: (facility: Facility) => void;
    compareList: Facility[];
    onToggleCompare: (facility: Facility) => void;
}

const FacilityListComponent: React.FC<FacilityListProps> = ({ facilities, onSelect, compareList, onToggleCompare }) => {
    // Store State
    const searchQuery = useFilterStore(s => s.searchQuery);
    const selectedCategories = useFilterStore(s => s.selectedCategories);

    // Internal Filtering Logic
    const filteredFacilities = useMemo(() => {
        return facilities.filter(facility => {
            // 1. Text Search
            const matchesSearch = !searchQuery ||
                facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                facility.address.toLowerCase().includes(searchQuery.toLowerCase());

            // 2. Category Filter
            const matchesCategory = selectedCategories.length === 0 ||
                (facility.category && selectedCategories.includes(facility.category));

            // 3. Exclude 'Sangjo' (handled in separate tab)
            const isSangjo = (facility.category as string) === 'sangjo' || (facility.category as string) === '상조';

            return matchesSearch && matchesCategory && !isSangjo;
        });
    }, [facilities, searchQuery, selectedCategories]);

    // compareList를 Set으로 변환하여 빠른 조회 성능 확보 (O(n) -> O(1))
    const compareIdSet = useMemo(
        () => new Set(compareList.map(f => f.id)),
        [compareList]
    );

    // Memoized renderer - Set 사용으로 의존성 최적화
    const itemContent = useMemo(() => {
        return (index: number, facility: any) => {
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
};

// React.memo로 감싸서 export
export const FacilityList = React.memo(FacilityListComponent);



