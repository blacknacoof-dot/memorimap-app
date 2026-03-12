import React, { useState } from 'react';
import { FuneralCompany, Review } from '../../../types';
import { getAuthClient } from '../../../lib/supabaseClient';
import { useSession } from '../../../lib/auth';
import { Star, X, MessageCircleQuestion } from 'lucide-react';
import { ReviewCard } from '../../ReviewCard';
import { toast } from 'sonner';

interface ReviewTabProps {
    company: FuneralCompany;
    localReviews: Review[];
    isLoggedIn: boolean;
    currentUser: { id: string; name: string; email?: string } | null;
    onOpenLogin?: () => void;
    onReviewCreated: (review: Review) => void;
    onReviewDeleted: (reviewId: string) => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
    company,
    localReviews,
    isLoggedIn,
    currentUser,
    onOpenLogin,
    onReviewCreated,
    onReviewDeleted,
}) => {
    const { session } = useSession();

    const [isWritingReview, setIsWritingReview] = useState(false);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const handleSubmitReview = async () => {
        if (!isLoggedIn || !currentUser) {
            toast.error('로그인이 필요한 기능입니다.');
            if (onOpenLogin) onOpenLogin();
            return;
        }

        if (!reviewContent.trim() || reviewContent.trim().length < 10) {
            toast.error('10자 이상 성의 있는 리뷰 부탁드립니다.');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const authClient = await getAuthClient(session, { strict: true });
            const { createReview } = await import('../../../lib/queries');

            const newReview = await createReview(
                company.id,
                currentUser.id,
                reviewRating,
                reviewContent,
                currentUser.name || '익명',
                [],
                authClient
            );

            toast.success('소중한 후기가 등록되었습니다!');

            const createdReview: Review = {
                id: (newReview?.id as string) || `temp-${Date.now()}`,
                user_id: currentUser.id,
                userName: currentUser.name || '익명',
                rating: reviewRating,
                content: reviewContent,
                date: new Date().toISOString().split('T')[0],
                images: []
            };

            onReviewCreated(createdReview);

            setIsWritingReview(false);
            setReviewContent('');
        } catch (_error) {
            toast.error('후기 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        try {
            const delClient = await getAuthClient(session, { strict: true });
            const { deleteReview } = await import('../../../lib/queries');
            await deleteReview(reviewId, delClient);

            toast.success('리뷰가 삭제되었습니다.');
            onReviewDeleted(reviewId);
        } catch (_error) {
            toast.error('리뷰 삭제에 실패했습니다.');
        }
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">상담 및 이용 후기</h3>
                <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-sm font-bold text-black">{company.rating}</span>
                    <span className="text-xs text-gray-400 font-normal">({company.reviewCount})</span>
                </div>
            </div>

            {/* Write Review Section */}
            {!isWritingReview ? (
                <button
                    onClick={() => {
                        if (!isLoggedIn || !currentUser) {
                            toast.error('로그인이 필요한 기능입니다.');
                            if (onOpenLogin) onOpenLogin();
                            return;
                        }

                        setIsWritingReview(true);
                    }}
                    className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <MessageCircleQuestion size={18} />
                    후기 작성하기
                </button>
            ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-sm">후기 작성</h4>
                        <button onClick={() => setIsWritingReview(false)} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex mb-3 gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} onClick={() => setReviewRating(s)} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                                <Star size={24} className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                        placeholder="솔직한 후기를 10자 이상 남겨주세요."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                    />
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className={`text-[10px] ${reviewContent.length < 10 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                            {reviewContent.length}/10자 {reviewContent.length < 10 && '(10자 이상 성의 있는 리뷰 부탁드립니다.)'}
                        </span>
                    </div>
                    <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmittingReview ? '등록 중...' : '후기 등록'}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {(() => {
                    if (localReviews && localReviews.length > 0) {
                        return localReviews.map(review => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                isOwner={!!(currentUser && review.user_id === currentUser.id)}
                                onDelete={handleDeleteReview}
                            />
                        ));
                    } else {
                        return (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <MessageCircleQuestion size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">첫 번째 소중한 후기를 기다리고 있습니다.</p>
                            </div>
                        );
                    }
                })()}
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 leading-relaxed italic">
                "실제 서비스를 이용하신 고객님들의 솔직한 후기입니다. 본 후기는 추모맵 정책에 따라 관리되고 있습니다."
            </div>
        </div>
    );
};
