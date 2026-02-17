import React from 'react';
import { useFilterStore } from '../stores/useFilterStore';
import { FacilityCategoryType } from '../types/facility';

const CATEGORIES: { id: FacilityCategoryType | 'all', label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'funeral_home', label: '장례식장' },
    { id: 'columbarium', label: '봉안시설' },
    { id: 'natural_burial', label: '자연장' },
    { id: 'cemetery', label: '공원묘지' },
    { id: 'pet_funeral', label: '동물장례' },
    { id: 'sea_burial', label: '해양장' },
];

export const FilterBar = () => {
    const selectedCategories = useFilterStore(s => s.selectedCategories);
    const toggleCategory = useFilterStore(s => s.toggleCategory);
    const resetFilters = useFilterStore(s => s.resetFilters);

    return (
        <div className="w-full pointer-events-auto">
            {/* Category Filters */}
            <div className="overflow-x-auto filter-scroll touch-pan-x no-scrollbar">
                <div className="flex gap-2 px-1 pb-2 w-max">
                    {CATEGORIES.map((cat) => {
                        const isSelected = cat.id === 'all'
                            ? selectedCategories.length === 0
                            : selectedCategories.includes(cat.id as FacilityCategoryType);

                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    if (cat.id === 'all') {
                                        resetFilters(); // 전체 클릭 시 초기화 (검색어는 유지하려면 따로 함수 필요하지만 일단 reset)
                                        // TODO: 검색어 유지하고 카테고리만 초기화하는 action 필요할 수 있음
                                    } else {
                                        toggleCategory(cat.id as FacilityCategoryType);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium shadow-sm border whitespace-nowrap transition-colors flex-shrink-0 min-h-[32px] md:min-h-[36px] ${isSelected
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white/90 backdrop-blur text-gray-900 hover:bg-white border-white/50'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
