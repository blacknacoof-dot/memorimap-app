import React, { useState, useRef, useEffect } from 'react';
import { Star, Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { createReview } from '../lib/queries';
import { useUser, useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { logger } from '../utils/logger';
import { reviewSubmissionSchema } from '../lib/validation/reviewSchema';

interface Props {
    spaceId: string;
    onSuccess: () => void;
    onLoginRequired: () => void;
}

export const ReviewForm: React.FC<Props> = ({ spaceId, onSuccess, onLoginRequired }) => {
    const { isSignedIn, user } = useUser();
    const { session } = useSession();
    const userId = user?.id;
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [hasConfirmedReservation, setHasConfirmedReservation] = useState(false);
    const [hasExistingReview, setHasExistingReview] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkRequirements = async () => {
            if (!isSignedIn || !userId) {
                if (!isMounted) return;
                setHasConfirmedReservation(false);
                setHasExistingReview(false);
                setIsChecking(false);
                return;
            }

            setIsChecking(true);
            try {
                const client = await getAuthClient(session);
                const { checkExistingReview, checkConfirmedReservationForReview } = await import('../lib/queries');
                const [confirmedReservationExists, existingReview] = await Promise.all([
                    checkConfirmedReservationForReview(userId, spaceId, client),
                    checkExistingReview(userId, spaceId, client),
                ]);

                if (!isMounted) return;
                setHasConfirmedReservation(confirmedReservationExists);
                setHasExistingReview(existingReview);
            } catch (error: unknown) {
                if (!isMounted) return;
                logger.error('Failed to check review requirements', {
                    spaceId,
                    userId,
                    error,
                });
                toast.error('리뷰 작성 조건을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
                setHasConfirmedReservation(false);
                setHasExistingReview(false);
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                }
            }
        };

        checkRequirements();

        return () => {
            isMounted = false;
        };
    }, [isSignedIn, userId, spaceId, session]);

    if (!isSignedIn) {
        return (
            <div className="bg-gray-50 p-6 rounded-xl border text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">리뷰를 작성하려면 로그인이 필요합니다.</p>
                <button onClick={onLoginRequired} className="text-primary text-sm font-bold underline">
                    로그인하고 리뷰 쓰기
                </button>
            </div>
        );
    }

    if (isChecking) {
        return <div className="p-6 text-center text-gray-400 text-xs">리뷰 작성 조건 확인 중...</div>;
    }

    if (hasExistingReview) {
        return (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center mb-6">
                <p className="text-sm text-blue-800 mb-1 font-bold">이미 작성한 리뷰가 있습니다</p>
                <p className="text-xs text-blue-600">
                    같은 시설에는 리뷰를 한 번만 작성할 수 있습니다. 수정 또는 삭제가 필요하면 마이페이지에서 관리해 주세요.
                </p>
            </div>
        );
    }

    if (!hasConfirmedReservation) {
        return (
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center mb-6">
                <p className="text-sm text-orange-800 mb-1 font-bold">예약 완료 이용자만 리뷰를 작성할 수 있습니다</p>
                <p className="text-xs text-orange-600">
                    실제 이용 경험 기반 후기만 받기 위해 예약 이력이 있는 경우에만 작성 가능합니다.
                </p>
            </div>
        );
    }

    const handleSubmit = async () => {
        const reviewValidation = reviewSubmissionSchema.safeParse({ content });
        if (!reviewValidation.success) {
            toast.warning('리뷰 내용은 10자 이상 1000자 이하로 입력해 주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const authClient = await getAuthClient(session);
            const imageUrls: string[] = [];
            if (images.length > 0) {
                const { uploadReviewImage } = await import('../lib/queries');
                for (const file of images) {
                    const url = await uploadReviewImage(user!.id, file, authClient);
                    imageUrls.push(url);
                }
            }

            await createReview(
                spaceId,
                user!.id,
                rating,
                reviewValidation.data.content,
                user!.firstName || user!.username || 'user',
                imageUrls,
                authClient,
            );

            setContent('');
            setRating(5);
            setImages([]);
            onSuccess();
        } catch (error: unknown) {
            logger.error('Failed to submit review', {
                spaceId,
                userId,
                imageCount: images.length,
                error,
            });
            toast.error('리뷰 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            if (images.length + newFiles.length > 3) {
                toast.warning('이미지는 최대 3개까지 업로드할 수 있습니다.');
                return;
            }
            setImages((prev) => [...prev, ...newFiles]);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl border mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800">리뷰 작성</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)}>
                            <Star
                                size={24}
                                className={`transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                data-testid="review-content-input"
                className="w-full p-3 border rounded-lg text-sm outline-none focus:border-primary resize-none bg-gray-50 focus:bg-white transition-colors"
                rows={3}
                placeholder="실제 이용 경험을 바탕으로 솔직한 후기를 남겨주세요. (최소 10자)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1 px-1">
                <span className={`text-[10px] ${content.length < 10 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {content.length}/1000
                    {content.length < 10 && ' (10자 이상 입력해 주세요)'}
                </span>
            </div>

            {images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                    {images.map((file, idx) => (
                        <div key={idx} className="relative w-16 h-16 shrink-0">
                            <img
                                src={URL.createObjectURL(file)}
                                alt="preview"
                                className="w-full h-full object-cover rounded-lg border"
                            />
                            <button
                                onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-primary p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="이미지 첨부"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <span className="text-xs text-gray-400">{images.length} / 3</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    data-testid="review-submit-button"
                    className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold disabled:bg-gray-300 flex items-center gap-2"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    리뷰 등록
                </button>
            </div>
        </div>
    );
};
