import React, { useState, useRef, useEffect } from 'react';
import { Star, Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { createReview } from '../lib/queries';
import { useUser } from '../lib/auth';

import { Reservation } from '../types';

interface Props {
    spaceId: string;
    onSuccess: () => void;
    onLoginRequired: () => void;
    reservations?: Reservation[];
}

export const ReviewForm: React.FC<Props> = ({ spaceId, onSuccess, onLoginRequired, reservations = [] }) => {
    const { isSignedIn, user } = useUser();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check for confirmed reservation
    const hasConfirmedReservation = reservations.some(
        r => r.facilityId === spaceId && r.status === 'confirmed'
    );

    const [hasExistingReview, setHasExistingReview] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Initial Requirement Check
    useEffect(() => {
        const checkRequirements = async () => {
            if (isSignedIn && user && hasConfirmedReservation) {
                const checked = await import('../lib/queries').then(m => m.checkExistingReview(user.id, spaceId));
                setHasExistingReview(checked);
            }
            setIsChecking(false);
        };
        checkRequirements();
    }, [isSignedIn, user, spaceId, hasConfirmedReservation]);

    if (!isSignedIn) {
        return (
            <div className="bg-gray-50 p-6 rounded-xl border text-center mb-6">
                <p className="text-sm text-gray-500 mb-2">리뷰를 작성하려면 로그인이 필요합니다.</p>
                <button onClick={onLoginRequired} className="text-primary text-sm font-bold underline">
                    로그인하기
                </button>
            </div>
        );
    }

    // Reservation Check
    if (!hasConfirmedReservation) {
        return (
            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center mb-6">
                <p className="text-sm text-orange-800 mb-1 font-bold">리뷰 작성 권한이 없습니다</p>
                <p className="text-xs text-orange-600">
                    해당 시설과 계약이 확정된 고객님만 후기를 작성하실 수 있습니다.
                </p>
            </div>
        );
    }

    // Existing Review Check
    if (isChecking) {
        return <div className="p-6 text-center text-gray-400 text-xs">확인 중...</div>;
    }

    if (hasExistingReview) {
        return (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center mb-6">
                <p className="text-sm text-blue-800 mb-1 font-bold">이미 리뷰를 작성하셨습니다</p>
                <p className="text-xs text-blue-600">
                    소중한 후기 감사합니다! 작성하신 리뷰는 하단 리스트에서 확인하실 수 있습니다.
                </p>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await createReview(
                user!.id,
                spaceId,
                rating,
                content,
                user!.firstName || user!.username || '사용자',
                images
            );

            // Reset form
            setContent('');
            setRating(5);
            setImages([]);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert('리뷰 작성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Total image limit check (Max 3)
            if (images.length + newFiles.length > 3) {
                alert('이미지는 최대 3장까지 업로드 가능합니다.');
                return;
            }
            setImages(prev => [...prev, ...newFiles]);
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
                className="w-full p-3 border rounded-lg text-sm outline-none focus:border-primary resize-none bg-gray-50 focus:bg-white transition-colors"
                rows={3}
                placeholder="이 시설에 대한 솔직한 후기를 남겨주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
            />

            {/* Image Preview */}
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
                                onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
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
                        title="사진 첨부"
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
                    className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold disabled:bg-gray-300 flex items-center gap-2"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    등록하기
                </button>
            </div>
        </div>
    );
};
