import { useState, useCallback } from 'react';
import { Facility, FuneralCompany } from '../types';

interface UseComparisonReturn {
  // Facility comparison
  compareList: Facility[];
  showComparison: boolean;
  setShowComparison: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCompare: (facility: Facility) => void;
  removeFromCompare: (id: string) => void;
  
  // Sangjo comparison
  sangjoCompareList: FuneralCompany[];
  showSangjoComparison: boolean;
  setShowSangjoComparison: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSangjoCompare: (company: FuneralCompany) => void;
  removeFromSangjoCompare: (id: string) => void;
}

/**
 * 시설/상조 업체 비교함 관리 Hook
 * @param showToast 토스트 표시 함수
 * @returns 비교함 상태 및 제어 함수
 */
export const useComparison = (
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
): UseComparisonReturn => {
  // Facility comparison state
  const [compareList, setCompareList] = useState<Facility[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // Sangjo comparison state
  const [sangjoCompareList, setSangjoCompareList] = useState<FuneralCompany[]>([]);
  const [showSangjoComparison, setShowSangjoComparison] = useState(false);

  /**
   * 시설 비교함 토글
   */
  const toggleCompare = useCallback((facility: Facility) => {
    setCompareList(prev => {
      const exists = prev.find(f => f.id === facility.id);
      if (exists) {
        showToast("비교함에서 제거되었습니다.", 'info');
        return prev.filter(f => f.id !== facility.id);
      }
      if (prev.length >= 3) {
        showToast("비교함에는 최대 3개까지만 담을 수 있습니다.", 'error');
        return prev;
      }
      showToast("비교함에 추가되었습니다. 하단 아이콘을 눌러 비교핳보세요!", 'success');
      return [...prev, facility];
    });
  }, [showToast]);

  /**
   * 상조 업체 비교함 토글
   */
  const toggleSangjoCompare = useCallback((company: FuneralCompany) => {
    setSangjoCompareList(prev => {
      const exists = prev.find(c => c.id === company.id);
      if (exists) {
        showToast("비교함에서 제외되었습니다.");
        return prev.filter(c => c.id !== company.id);
      }
      if (prev.length >= 3) {
        showToast("최대 3개 업체까지만 비교 가능합니다.", 'info');
        return prev;
      }
      showToast("비교함에 추가되었습니다.");
      return [...prev, company];
    });
  }, [showToast]);

  /**
   * 시설 비교함에서 제거
   */
  const removeFromCompare = useCallback((id: string) => {
    setCompareList(prev => prev.filter(f => f.id !== id));
  }, []);

  /**
   * 상조 업체 비교함에서 제거
   */
  const removeFromSangjoCompare = useCallback((id: string) => {
    setSangjoCompareList(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    // Facility
    compareList,
    showComparison,
    setShowComparison,
    toggleCompare,
    removeFromCompare,

    // Sangjo
    sangjoCompareList,
    showSangjoComparison,
    setShowSangjoComparison,
    toggleSangjoCompare,
    removeFromSangjoCompare
  };
};

export default useComparison;
