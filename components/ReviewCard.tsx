import React from 'react';
import { Star, User, Trash2 } from 'lucide-react';
import { Review } from '../types';
import { confirmAsync } from '../src/components/common/ConfirmModal';

interface Props {
    review: Review;
    isOwner: boolean;
    onDelete: (id: string) => void;
    facilityName?: string;
}

export const ReviewCard: React.FC<Props> = ({ review, isOwner, onDelete, facilityName }) => {
    const getMaskedName = (originalName: string | null | undefined, reviewId: string) => {
        if (!originalName || originalName === '익명' || originalName === 'Guest') {
            const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
            let hash = 0;
            for (let i = 0; i < reviewId.length; i += 1) {
                hash = ((hash << 5) - hash) + reviewId.charCodeAt(i);
                hash |= 0;
            }
            const index = Math.abs(hash) % surnames.length;
            return `${surnames[index]}**`;
        }

        if (originalName.includes('*')) return originalName;

        const len = originalName.length;
        if (len === 0) return '익명';

        return originalName[0] + '*'.repeat(Math.max(1, len - 1));
    };

    const displayName = isOwner ? (review.userName || '회원') : getMaskedName(review.userName, review.id);

    return (
        <div className="border-b last:border-0 pb-4 mb-2 animate-in fade-in slide-in-from-bottom-2">
            {facilityName && (
                <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1 bg-primary/5 inline-block px-2 py-1 rounded">
                    <span className="opacity-70">To:</span> {facilityName}
                </div>
            )}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {review.userImage ? (
                            <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} className="text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            {displayName}
                            {isOwner && <span className="text-[10px] text-primary border border-primary px-1 rounded">내 리뷰</span>}
                        </div>
                        <div className="text-xs text-gray-400">{review.date}</div>
                    </div>
                </div>

                {isOwner && (
                    <button
                        onClick={async () => {
                            if (await confirmAsync('리뷰를 삭제하시겠습니까?')) {
                                onDelete(review.id);
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2"
                        title="삭제"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                ))}
            </div>

            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                {review.content}
            </p>

            {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">
                    {review.images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`Review img ${idx}`}
                            className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                            onClick={() => window.open(img, '_blank', 'noopener,noreferrer')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
