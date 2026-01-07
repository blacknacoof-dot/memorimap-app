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

export const FacilityList: React.FC<FacilityListProps> = ({ facilities, onSelect, compareList, onToggleCompare }) => {

    // Memoized renderer to prevent re-creation on every render
    const itemContent = useMemo(() => {
        return (index: number, facility: any) => {
            const isCompared = compareList.some((item: any) => item.id === facility.id);
            return (
                <div className="pb-2 last:pb-0">
                    <FacilityItem
                        facility={facility}
                        onClick={onSelect}
                        isCompared={isCompared}
                        onToggleCompare={onToggleCompare}
                    // style passed by Virtuoso is handled by the wrapper div here if needed, 
                    // but Virtuoso manages height internally. FacilityItem doesn't strictly need style prop anymore 
                    // as Virtuoso renders natural height items by default.
                    />
                </div>
            );
        };
    }, [compareList, onSelect, onToggleCompare]);

    if (!facilities || facilities.length === 0) return <div className="p-4 text-center text-gray-500">시설 정보가 없습니다.</div>;

    console.log('FacilityList main component render - Total data count:', facilities.length);

    return (
        <div className="flex-1 w-full h-full min-h-[500px] bg-white">
            <Virtuoso
                style={{ height: '100%', width: '100%' }}
                totalCount={facilities.length}
                data={facilities}
                itemContent={itemContent}
                overscan={500} // Pre-render more pixels for smooth scroll
            />
        </div>
    );
};



