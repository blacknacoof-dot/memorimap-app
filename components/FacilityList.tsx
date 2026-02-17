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

export const FacilityList = React.memo<FacilityListProps>(({ facilities, onSelect, compareList, onToggleCompare }) => {
    // Store State
    const searchQuery = useFilterStore(s => s.searchQuery);
    const selectedCategories = useFilterStore(s => s.selectedCategories);

    // Internal Filtering Logic
    const filteredFacilities = useMemo(() => {
        // 주소 정규화 매핑 (축약형↔정식명)
        const REGION_ALIASES: Record<string, string[]> = {
            '서울': ['서울특별시'], '서울특별시': ['서울'],
            '경기': ['경기도'], '경기도': ['경기'],
            '부산': ['부산광역시'], '부산광역시': ['부산'],
            '광주': ['광주광역시'], '광주광역시': ['광주'],
            '대전': ['대전광역시'], '대전광역시': ['대전'],
            '인천': ['인천광역시'], '인천광역시': ['인천'],
        };

        return facilities.filter(facility => {
            // 1. Text Search — 시/도 단위 우선매칭
            let matchesSearch = true;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const nameMatch = facility.name.toLowerCase().includes(q);
                // 주소 첫 토큰(시/도) 우선 매칭
                const addrLower = facility.address?.toLowerCase() || '';
                const firstToken = addrLower.split(' ')[0];
                const directMatch = firstToken.includes(q) || addrLower.includes(q);
                // 정규화 매핑: "서울" 검색 시 "서울특별시" 주소도 매칭
                const aliases = REGION_ALIASES[searchQuery] || [];
                const aliasMatch = aliases.some(alias => addrLower.startsWith(alias.toLowerCase()));
                matchesSearch = nameMatch || directMatch || aliasMatch;
            }

            // 2. Category Filter — DB 필드는 type (category 없음)
            const facilityType = (facility as any).type || facility.category;
            const matchesCategory = selectedCategories.length === 0 ||
                (facilityType && selectedCategories.includes(facilityType));

            // 3. Exclude 'Sangjo' (handled in separate tab)
            const isSangjo = facilityType === 'sangjo' || facilityType === '상조';

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
});



