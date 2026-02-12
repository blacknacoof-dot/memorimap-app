/**
 * useReviews - App.tsx에서 추출한 리뷰 핸들러 Hook
 * Phase 4-3: handleAddReview, handleReviewDeleted
 */
import { useCallback } from 'react';
import { Facility, Review } from '../types';

interface UseReviewsParams {
  userId: string | undefined;
  userName: string;
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>;
  selectedFacility: Facility | null;
  setSelectedFacility: React.Dispatch<React.SetStateAction<Facility | null>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function useReviews({
  userId,
  userName,
  setFacilities,
  selectedFacility,
  setSelectedFacility,
  showToast,
}: UseReviewsParams) {

  const handleAddReview = useCallback((facilityId: string, content: string, rating: number) => {
    const newReview: Review = {
      id: `r-new-${Date.now()}`,
      userId: userId || 'anon',
      user_id: userId || 'anon',
      facility_id: facilityId,
      userName: userName || '익명',
      rating,
      date: new Date().toLocaleDateString(),
      content
    };

    const updateFacility = (f: Facility) => {
      const currentReviews = f.reviews || [];
      const newCount = (f.reviewCount || 0) + 1;
      const newRating = Number((((f.rating || 0) * (f.reviewCount || 0) + rating) / newCount).toFixed(1));

      return {
        ...f,
        reviews: [newReview, ...currentReviews],
        reviewCount: newCount,
        rating: newRating
      };
    };

    setFacilities(prev => prev.map(f => f.id === facilityId ? updateFacility(f) : f));

    if (selectedFacility && selectedFacility.id === facilityId) {
      setSelectedFacility(prev => prev ? updateFacility(prev) : null);
    }
    showToast("리뷰가 등록되었습니다.");
  }, [userId, userName, setFacilities, selectedFacility, setSelectedFacility, showToast]);

  const handleReviewDeleted = useCallback((facilityId: string, reviewId: string, rating: number) => {
    const updateFacility = (f: Facility) => {
      const currentReviews = f.reviews || [];
      const newReviews = currentReviews.filter(r => r.id !== reviewId);
      const newCount = Math.max(0, (f.reviewCount || 0) - 1);

      let newRating = 0;
      if (newCount > 0) {
        const currentTotalScore = (f.rating || 0) * (f.reviewCount || 0);
        newRating = Number(((currentTotalScore - rating) / newCount).toFixed(1));
        newRating = Math.max(0, Math.min(5, newRating));
      }

      return {
        ...f,
        reviews: newReviews,
        reviewCount: newCount,
        rating: newRating
      };
    };

    setFacilities(prev => prev.map(f => f.id === facilityId ? updateFacility(f) : f));

    if (selectedFacility && selectedFacility.id === facilityId) {
      setSelectedFacility(prev => prev ? updateFacility(prev) : null);
    }
    showToast("리뷰가 삭제되었습니다.", 'info');
  }, [setFacilities, selectedFacility, setSelectedFacility, showToast]);

  return {
    handleAddReview,
    handleReviewDeleted,
  };
}
