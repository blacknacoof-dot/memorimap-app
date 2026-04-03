import React, { useCallback, useEffect, useState } from 'react';
import { ReviewCard } from './ReviewCard';
import { deleteReview } from '../lib/queries';
import { getReviewsBySpace } from '../lib/queries/reviews';
import { Review } from '../types';
import { Loader2 } from 'lucide-react';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../utils/logger';

interface Props {
    spaceId: string;
    refreshTrigger: number;
}

// Fallback reviews shown only when DB has no reviews.
const SAMPLE_REVIEWS: Omit<Review, 'id' | 'facility_id'>[] = [
    {
        user_id: 'sample1',
        userName: '김**',
        rating: 5,
        content: '시설이 깔끔하고 직원분들이 친절해서 만족했습니다. 안내도 자세해서 좋았습니다.',
        date: '2024-11-15',
    },
    {
        user_id: 'sample2',
        userName: '이**',
        rating: 4,
        content: '위치가 좋고 전체 진행이 매끄러웠습니다. 필요한 설명을 충분히 들을 수 있었어요.',
        date: '2024-10-22',
    },
    {
        user_id: 'sample3',
        userName: '박**',
        rating: 5,
        content: '조용하고 차분한 분위기여서 가족 모두 편안하게 시간을 보낼 수 있었습니다.',
        date: '2024-09-30',
    },
    {
        user_id: 'sample4',
        userName: '최**',
        rating: 4,
        content: '전반적으로 만족스러웠고 상담 응대가 빠르고 정확했습니다. 재방문 의사 있습니다.',
        date: '2024-08-18',
    },
    {
        user_id: 'sample5',
        userName: '정**',
        rating: 5,
        content: '처음 방문이었는데 절차를 쉽게 설명해주셔서 부담 없이 진행할 수 있었습니다.',
        date: '2024-07-05',
    },
];

export const ReviewList: React.FC<Props> = ({ spaceId, refreshTrigger }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const { user } = useUser();
    const { session } = useSession();

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReviewsBySpace(spaceId);
            setReviews(data);
            setLoadError(false);
        } catch (error: unknown) {
            logger.error('Failed to fetch review list', { spaceId, error });
            setReviews([]);
            setLoadError(true);
            toast.error('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    }, [spaceId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews, refreshTrigger]);

    const handleDelete = async (id: string) => {
        try {
            const client = await getAuthClient(session);
            await deleteReview(id, client);
            setReviews((prev) => prev.filter((r) => r.id !== id));
            toast.success('리뷰를 삭제했습니다.');
        } catch (error: unknown) {
            logger.error('Failed to delete review', { reviewId: id, error });
            toast.error('리뷰 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    const displayReviews: Review[] = reviews.length > 0
        ? reviews
        : SAMPLE_REVIEWS.map((r, idx) => ({
            ...r,
            id: `sample-${idx}`,
            facility_id: spaceId,
        }));

    return (
        <div className="space-y-2">
            {loadError && (
                <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center justify-between gap-2">
                    <span>리뷰를 가져오지 못했습니다.</span>
                    <button
                        onClick={fetchReviews}
                        className="rounded border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                    >
                        다시 불러오기
                    </button>
                </div>
            )}
            {displayReviews.map((review) => (
                <ReviewCard
                    key={review.id}
                    review={review}
                    isOwner={user?.id === review.user_id}
                    onDelete={review.id.startsWith('sample-') ? () => {} : handleDelete}
                />
            ))}
        </div>
    );
};
