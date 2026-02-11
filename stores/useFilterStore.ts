import { create } from 'zustand';
import { FacilityCategoryType } from '../types/facility';

interface FilterState {
    searchQuery: string;
    selectedCategories: FacilityCategoryType[];
    sortBy: 'name' | 'created_at' | 'distance';

    // Actions
    setSearchQuery: (query: string) => void;
    toggleCategory: (category: FacilityCategoryType) => void;
    setSortBy: (sort: 'name' | 'created_at' | 'distance') => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    searchQuery: '',
    selectedCategories: [],
    sortBy: 'created_at', // 기본값

    setSearchQuery: (query) => set({ searchQuery: query }),

    toggleCategory: (category) => set((state) => {
        const isSelected = state.selectedCategories.includes(category);
        return {
            selectedCategories: isSelected
                ? state.selectedCategories.filter(c => c !== category)
                : [...state.selectedCategories, category]
        };
    }),

    setSortBy: (sort) => set({ sortBy: sort }),

    resetFilters: () => set({ searchQuery: '', selectedCategories: [], sortBy: 'created_at' }),
}));
