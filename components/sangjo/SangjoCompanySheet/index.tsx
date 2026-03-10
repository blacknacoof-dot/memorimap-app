import React, { useState, useMemo } from 'react';
import { FuneralCompany, Review } from '../../../types';
import { getAuthClient } from '../../../lib/supabaseClient';
import { useSession } from '../../../lib/auth';
import { X, Bot, ShieldCheck } from 'lucide-react';
import { useSangjoFavoriteStore } from '../../../stores/useSangjoFavoriteStore';
import { toast } from 'sonner';
import { InfoTab } from './InfoTab';
import { BenefitsTab } from './BenefitsTab';
import { PriceTab } from './PriceTab';
import { GalleryTab } from './GalleryTab';
import { ReviewTab } from './ReviewTab';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onOpenAIConsult: () => void;
    onOpenContract: () => void;
    currentUser?: { id: string; name: string; email?: string } | null;
    isLoggedIn?: boolean;
    onOpenLogin?: () => void;
}

export const FuneralCompanySheet: React.FC<Props> = ({ company, onClose, onOpenAIConsult, onOpenContract, currentUser, isLoggedIn = false, onOpenLogin }) => {
    const { session } = useSession();

    const [activeTab, setActiveTab] = useState<'info' | 'gallery' | 'reviews' | 'benefits' | 'price'>('info');

    // 기본 후기 생성 (company별 안정적 시드)
    const defaultReviews = useMemo(() => {
        const templates = [
            { content: '상담부터 진행까지 꼼꼼하게 안내해주셔서 감사했습니다. 어려운 시기에 큰 힘이 되었어요.', rating: 5 },
            { content: '가격 대비 서비스가 훌륭했습니다. 직원분들이 정말 친절하고 세심하게 신경 써주셨어요.', rating: 5 },
            { content: '급하게 진행해야 했는데 빠르게 대응해주셔서 감사합니다. 전체적으로 만족스러웠습니다.', rating: 4 },
            { content: '지인 추천으로 이용했는데 역시 믿을 만했습니다. 절차 안내도 친절하고 깔끔했어요.', rating: 5 },
            { content: '처음이라 막막했는데 하나하나 설명해주시고 부담 없이 진행해주셔서 좋았습니다.', rating: 4 },
        ];
        const names = ['김민수', '이서연', '박지훈', '최영희', '정하늘'];
        let seed = 0;
        for (let i = 0; i < company.id.length; i++) {
            seed = ((seed << 5) - seed) + company.id.charCodeAt(i);
            seed |= 0;
        }
        const sr = (idx: number) => { const x = Math.sin(seed + idx * 9301) * 10000; return x - Math.floor(x); };
        const now = 1741564800000; // 2025-03-10 기준 (고정값, 순수 렌더링)
        return templates.map((tpl, i): Review => {
            const daysAgo = Math.floor(sr(i + 100) * 180) + 30;
            const date = new Date(now - daysAgo * 86400000);
            return {
                id: `default_${company.id}_${i}`,
                userId: '', user_id: '', userName: names[i],
                facility_id: company.id, rating: tpl.rating, content: tpl.content,
                images: [], created_at: date.toISOString(), date: date.toISOString().split('T')[0],
            };
        });
    }, [company.id]);

    // Reviews: company 데이터 우선, 없으면 기본 후기
    const initialReviews = (company.reviews && company.reviews.length > 0) ? company.reviews : defaultReviews;
    const [localReviews, setLocalReviews] = useState<Review[]>(initialReviews);

    // Using global store for favorite state
    const { favoritedIds, toggleFavorite: storeToggleFavorite } = useSangjoFavoriteStore();
    const isLiked = favoritedIds.has(company.id);

    // Share Handler
    const handleShare = async () => {
        const shareData = {
            title: 'Memorimap 추모맵',
            text: `${company.name} - ${company.description}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('주소가 복사되었습니다!');
            }
        } catch (err) {
            // Share cancelled or unsupported — no action needed
        }
    };

    // Like Handler
    const handleToggleLike = async () => {
        if (!isLoggedIn || !currentUser) {
            toast.error('로그인이 필요한 기능입니다.');
            if (onOpenLogin) onOpenLogin();
            return;
        }

        try {
            const client = await getAuthClient(session, { strict: true });
            await storeToggleFavorite(currentUser.id, company, client);
        } catch (error) {
            toast.error('좋아요 처리에 실패했습니다.');
        }
    };

    const handleReviewCreated = (review: Review) => {
        setLocalReviews(prev => [review, ...prev]);
    };

    const handleReviewDeleted = (reviewId: string) => {
        setLocalReviews(prev => prev.filter(r => r.id !== reviewId));
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[250] bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[95dvh] h-[85dvh] md:h-[80dvh] flex flex-col md:max-w-md md:mx-auto pb-safe">
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
            </div>

            {/* Hero */}
            <div className="relative h-28 md:h-40 shrink-0">
                <img src={company.imageUrl} alt={company.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black/30 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-white backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                <div className="absolute bottom-4 left-4 text-white">
                    <div className="bg-primary px-2 py-0.5 text-[10px] font-bold rounded mb-1 inline-block uppercase tracking-wider">
                        Premium Funeral Service
                    </div>
                    <h2 className="text-2xl font-bold">{company.name}</h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b overflow-x-auto no-scrollbar">
                {[
                    { id: 'info', label: '정보' },
                    { id: 'gallery', label: '갤러리' },
                    { id: 'reviews', label: '후기' },
                    { id: 'benefits', label: '제휴혜택' },
                    { id: 'price', label: '서비스구성' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-none md:flex-1 px-4 md:px-2 py-3 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === tab.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 no-scrollbar">
                {activeTab === 'info' && (
                    <InfoTab
                        company={company}
                        isLiked={isLiked}
                        onShare={handleShare}
                        onToggleLike={handleToggleLike}
                    />
                )}

                {activeTab === 'benefits' && (
                    <BenefitsTab company={company} />
                )}

                {activeTab === 'price' && (
                    <PriceTab company={company} />
                )}

                {activeTab === 'gallery' && (
                    <GalleryTab company={company} />
                )}

                {activeTab === 'reviews' && (
                    <ReviewTab
                        company={company}
                        localReviews={localReviews}
                        isLoggedIn={isLoggedIn}
                        currentUser={currentUser || null}
                        onOpenLogin={onOpenLogin}
                        onReviewCreated={handleReviewCreated}
                        onReviewDeleted={handleReviewDeleted}
                    />
                )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t bg-white pb-safe flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                <button
                    onClick={onOpenAIConsult}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Bot size={20} className="text-primary" />
                    AI 상담
                </button>
                <button
                    onClick={onOpenContract}
                    className="flex-[1.5] bg-gray-900 text-amber-500 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={20} />
                    가입/계약 신청
                </button>
            </div>
        </div >
    );
};
