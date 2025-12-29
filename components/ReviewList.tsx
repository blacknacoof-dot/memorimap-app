import React, { useEffect, useState } from 'react';
import { ReviewCard } from './ReviewCard';
import { getReviewsBySpace, deleteReview } from '../lib/queries';
import { Review } from '../types';
import { Loader2 } from 'lucide-react';
import { useUser } from '../lib/auth';

interface Props {
    spaceId: string;
    refreshTrigger: number; // Increment to force refresh
}

// 샘플 리뷰 데이터 (DB에 리뷰가 없을 때 표시)
const SAMPLE_REVIEWS: Omit<Review, 'id' | 'space_id'>[] = [
    { user_id: 'sample1', userName: '김**', rating: 5, content: '시설이 깔끔하고 직원분들이 친절하셨습니다. 주차도 편리했어요.', date: '2024-11-15' },
    { user_id: 'sample2', userName: '이**', rating: 4, content: '위치가 좋고 안내가 잘 되어있어요. 재방문 의사 있습니다.', date: '2024-10-22' },
    { user_id: 'sample3', userName: '박**', rating: 5, content: '조용하고 편안한 분위기였습니다. 추천드립니다.', date: '2024-09-30' },
    { user_id: 'sample4', userName: '최**', rating: 4, content: '전체적으로 만족스러웠습니다. 가격 대비 좋은 편이에요.', date: '2024-08-18' },
    { user_id: 'sample5', userName: '정**', rating: 5, content: '처음 방문했는데 상담도 친절하게 해주시고 좋았습니다.', date: '2024-07-05' },
];

export const ReviewList: React.FC<Props> = ({ spaceId, refreshTrigger }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await getReviewsBySpace(spaceId);
            setReviews(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [spaceId, refreshTrigger]);

    const handleDelete = async (id: string) => {
        try {
            await deleteReview(id, spaceId);
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('리뷰 삭제 중 오류가 발생했습니다.');
        }
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    // 실제 리뷰가 없으면 샘플 리뷰 표시
    const displayReviews: Review[] = reviews.length > 0
        ? reviews
        : SAMPLE_REVIEWS.map((r, idx) => ({
            ...r,
            id: `sample-${idx}`,
            space_id: spaceId,
        }));

    return (
        <div className="space-y-2">
            {displayReviews.map(review => (
                <ReviewCard
                    key={review.id}
                    review={review}
                    isOwner={user?.id === review.user_id}
                    onDelete={review.id.startsWith('sample-') ? undefined : handleDelete}
                />
            ))}
        </div>
    );
};
