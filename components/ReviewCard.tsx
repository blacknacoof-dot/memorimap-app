import React from 'react';
import { Star, User, Trash2 } from 'lucide-react';
import { Review } from '../types';

interface Props {
    review: Review;
    isOwner: boolean;
    onDelete: (id: string) => void;
    facilityName?: string;
}

export const ReviewCard: React.FC<Props> = ({ review, isOwner, onDelete, facilityName }) => {
    // 4. Name Masking Utility (Updated per User Request)
    const getMaskedName = (originalName: string | null | undefined) => {
        if (!originalName) return "익명";
        if (originalName === '익명') return "익명";

        // If already masked (contains '*'), return as is
        if (originalName.includes('*')) return originalName;

        const len = originalName.length;

        // 1. 2 chars: 김철 -> 김*
        if (len === 2) {
            return originalName[0] + "*";
        }

        // 2. 3+ chars: 홍길동 -> 홍**, 남궁민수 -> 남** (성 + ** 형태)
        if (len >= 3) {
            return originalName[0] + "**";
        }

        return originalName;
    };

    const displayName = isOwner ? (review.userName || '익명') : getMaskedName(review.userName);

    // console.log('Rendering Review:', { id: review.id, userName: review.userName, displayName }); 

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
                        onClick={() => {
                            if (confirm('리뷰를 삭제하시겠습니까?')) {
                                onDelete(review.id);
                            }
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="삭제"
                    >
                        <Trash2 size={16} />
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
                            onClick={() => window.open(img, '_blank')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
