import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Reservation } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { ReviewList } from '../ReviewList';

interface Props {
  facilityId: string;
  facilityRating: number;
  facilityReviewCount: number;
  reviewRefreshTrigger: number;
  setReviewRefreshTrigger: (fn: (prev: number) => number) => void;
  onLoginRequired: () => void;
  reservations: Reservation[];
}

export const ReviewTab: React.FC<Props> = ({
  facilityId, facilityRating, facilityReviewCount,
  reviewRefreshTrigger, setReviewRefreshTrigger,
  onLoginRequired, reservations,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <MessageSquare size={20} className="text-primary" />
        방문자 리뷰 <span className="text-gray-400 text-sm font-normal">({facilityReviewCount})</span>
      </h3>
      <div className="text-yellow-500 font-bold text-lg">★ {Math.round(facilityRating || 0)}</div>
    </div>
    <div className="mb-4">
      <ReviewForm
        spaceId={facilityId}
        onSuccess={() => setReviewRefreshTrigger(prev => prev + 1)}
        onLoginRequired={onLoginRequired}
        reservations={reservations}
      />
    </div>
    <ReviewList spaceId={facilityId} refreshTrigger={reviewRefreshTrigger} />
  </div>
);
