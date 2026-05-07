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
    const resetCategories = useFilterStore(s => s.resetCategories);

    return (
        <div className="w-full pointer-events-auto" data-debug="filter-bar">
            {/* Category Filters */}
            <div className="overflow-x-auto filter-scroll touch-pan-x no-scrollbar">
                <div className="flex gap-1.5 md:gap-2 px-1 pb-1 md:pb-2 w-max">
                    {CATEGORIES.map((cat) => {
                        const isSelected = cat.id === 'all'
                            ? selectedCategories.length === 0
                            : selectedCategories.includes(cat.id as FacilityCategoryType);

                        return (
                            <button
                                key={cat.id}
                                data-testid={`filter-category-${cat.id}`}
                                onClick={() => {
                                    if (cat.id === 'all') {
                                        resetCategories();
                                    } else {
                                        toggleCategory(cat.id as FacilityCategoryType);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px] shadow-sm ${isSelected
                                    ? 'bg-primary text-white border-primary shadow-primary/15'
                                    : 'bg-white/95 backdrop-blur text-slate-700 hover:bg-white border-slate-200'
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
