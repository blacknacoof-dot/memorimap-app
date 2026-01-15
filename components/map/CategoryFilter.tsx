import React from 'react';
import { FacilityCategoryType } from '../../types';

interface CategoryFilterProps {
    selectedCategory: FacilityCategoryType | '전체';
    onSelectCategory: (category: FacilityCategoryType | '전체') => void;
}

export const CATEGORY_LIST: FacilityCategoryType[] = ['장례식장', '봉안시설', '자연장', '공원묘지', '동물장례', '해양장'];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    selectedCategory,
    onSelectCategory,
}) => {
    return (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 pointer-events-auto no-scrollbar">
            {/* '전체' 버튼 */}
            <button
                onClick={() => onSelectCategory('전체')}
                className={`px-4 py-2 rounded-full text-sm font-medium shadow-md whitespace-nowrap transition-colors border ${selectedCategory === '전체'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
            >
                전체
            </button>

            {/* 6가지 카테고리 버튼 */}
            {CATEGORY_LIST.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium shadow-md whitespace-nowrap transition-colors border ${selectedCategory === cat
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};
