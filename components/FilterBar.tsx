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

interface FilterBarProps {
    align?: 'start' | 'end';
}

export const FilterBar = ({ align = 'start' }: FilterBarProps) => {
    const selectedCategories = useFilterStore(s => s.selectedCategories);
    const toggleCategory = useFilterStore(s => s.toggleCategory);
    const resetCategories = useFilterStore(s => s.resetCategories);
    const buttonAlignClass = align === 'end' ? 'items-end' : 'items-start';

    return (
        <div className="w-full pointer-events-auto">
            {/* Category Filters */}
            <div className="overflow-x-auto filter-scroll touch-pan-x no-scrollbar">
                <div className="flex items-start md:items-center gap-1.5 md:gap-2 px-1 pb-0.5 md:pb-2 w-max">
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
                                className={`h-11 md:h-auto flex ${buttonAlignClass} md:items-center justify-center flex-shrink-0 touch-manipulation`}
                            >
                                <span
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors min-h-[34px] flex items-center shadow-sm ${isSelected
                                        ? 'bg-primary text-white border-primary shadow-primary/15'
                                        : 'bg-white/95 backdrop-blur text-slate-700 hover:bg-white border-slate-200'
                                        }`}
                                >
                                    {cat.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
