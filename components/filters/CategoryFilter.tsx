import React from 'react';
import { FACILITY_CATEGORIES, FacilityCategoryType } from '../../types/facility';

interface CategoryFilterProps {
    selectedCategory: 'all' | FacilityCategoryType;
    onCategoryChange: (category: 'all' | FacilityCategoryType) => void;
}

export default function CategoryFilter({
    selectedCategory,
    onCategoryChange
}: CategoryFilterProps) {
    // Filter out 'all' since it's rendered explicitly as the first button
    const categories = FACILITY_CATEGORIES.filter(c => c.code !== 'all');

    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            <button
                onClick={() => onCategoryChange('all')}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
            >
                전체
            </button>

            {categories.map(({ label, code }) => (
                <button
                    key={code}
                    onClick={() => onCategoryChange(code as FacilityCategoryType)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${selectedCategory === code
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                        }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
