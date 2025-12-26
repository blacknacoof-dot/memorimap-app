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

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">
                첫 번째 리뷰를 작성해보세요! ✍️
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {reviews.map(review => (
                <ReviewCard
                    key={review.id}
                    review={review}
                    isOwner={user?.id === review.user_id}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
};
