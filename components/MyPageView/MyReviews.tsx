import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Facility, Review } from '../../types';
import { getAuthClient } from '../../lib/supabaseClient';
import { useSession } from '../../lib/auth';
import { getUserReviews } from '../../lib/queries/reviews';
import { deleteReview } from '../../lib/queries/reviewWrites';
import { ReviewCard } from '../ReviewCard';

interface Props {
  userId: string;
  facilities: Facility[];
}

export const MyReviews: React.FC<Props> = ({ userId, facilities }) => {
  const { session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const facilityNameById = useMemo(() => {
    const map = new Map<string, string>();
    facilities.forEach((facility) => map.set(String(facility.id), facility.name));
    return map;
  }, [facilities]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const client = await getAuthClient(session, { strict: true });
      setReviews(await getUserReviews(userId, client));
    } catch {
      toast.error('내 리뷰를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !session) return;
    fetchReviews();
  }, [userId, session]);

  const handleDelete = async (reviewId: string) => {
    try {
      const client = await getAuthClient(session, { strict: true });
      await deleteReview(reviewId, client);
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      toast.success('리뷰를 삭제했습니다.');
    } catch {
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  return (
    <section className="mb-4">
      <h3 className="font-bold mb-4 border-l-4 border-amber-500 pl-3">내 리뷰</h3>
      <div className="bg-white rounded-xl border p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <MessageSquare size={28} className="mb-2 text-gray-300" />
            <p className="text-sm">아직 작성한 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwner
                facilityName={facilityNameById.get(String(review.facility_id)) || '시설'}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
