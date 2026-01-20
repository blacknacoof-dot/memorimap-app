import React, { useState, useEffect } from 'react';
import { FuneralCompany } from '../types';
import { supabase } from '../lib/supabaseClient';
import { X, Star, Phone, MessageCircleQuestion, Heart, Share2, CheckCircle2, ShieldCheck, CreditCard, Gift, Bot, ChevronRight, Camera, User, ClipboardCheck } from 'lucide-react';
import { ReviewCard } from './ReviewCard';

interface Props {
    company: FuneralCompany;
    onClose: () => void;
    onOpenAIConsult: () => void;
    onOpenContract: () => void;
    currentUser?: any; // Pass user object
    isLoggedIn?: boolean;
    onOpenLogin?: () => void; // New prop for login redirection
}

export const FuneralCompanySheet: React.FC<Props> = ({ company, onClose, onOpenAIConsult, onOpenContract, currentUser, isLoggedIn = false, onOpenLogin }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'benefits' | 'price' | 'gallery' | 'reviews'>('info');
    const [isLiked, setIsLiked] = useState(false);

    // Review Writing State
    const [isWritingReview, setIsWritingReview] = useState(false);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const handleSubmitReview = async () => {
        if (!isLoggedIn || !currentUser) {
            alert('로그인이 필요한 기능입니다.');
            if (onOpenLogin) onOpenLogin();
            return;
        }

        if (!reviewContent.trim()) {
            alert('후기 내용을 입력해주세요.');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const { createReview } = await import('../lib/queries');
            await createReview(
                company.id,
                currentUser.id,
                reviewRating,
                reviewContent,
                [] // images array
            );

            alert('소중한 후기가 등록되었습니다!');
            setIsWritingReview(false);
            setReviewContent('');
            window.location.reload();
        } catch (error) {
            console.error('Review submission failed:', error);
            alert('후기 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // 1. Check Like Status
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (isLoggedIn && currentUser && company) {
                const { data } = await supabase
                    .from('user_likes')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('target_id', company.id)
                    .maybeSingle(); // Changed from single() to avoid 406 error
                setIsLiked(!!data);
            }
        };
        checkLikeStatus();
    }, [isLoggedIn, currentUser, company]);

    // 2. Share Handler
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
                alert('주소가 복사되었습니다!');
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    // 3. Like Handler
    const handleToggleLike = async () => {
        if (!isLoggedIn || !currentUser) {
            alert('로그인이 필요한 기능입니다.');
            if (onOpenLogin) onOpenLogin(); // Redirect to login
            return;
        }

        const previousState = isLiked;
        setIsLiked(!isLiked); // Optimistic

        try {
            if (previousState) {
                await supabase
                    .from('user_likes')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('target_id', company.id);
            } else {
                await supabase
                    .from('user_likes')
                    .insert({
                        user_id: currentUser.id,
                        target_id: company.id,
                        category: 'sangjo'
                    });
            }
        } catch (error) {
            console.error('Like failed:', error);
            setIsLiked(previousState);
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-[250] bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] h-[80vh] flex flex-col md:max-w-md md:mx-auto">
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer"></div>
            </div>

            {/* Hero */}
            <div className="relative h-40 shrink-0">
                <img src={company.imageUrl} alt={company.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm"
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
            <div className="flex border-b">
                {[
                    { id: 'info', label: '정보' },
                    { id: 'gallery', label: '갤러리' },
                    { id: 'reviews', label: '후기' },
                    { id: 'benefits', label: '제휴혜택' },
                    { id: 'price', label: '서비스구성' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-4 text-sm font-bold ${activeTab === tab.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-400'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {activeTab === 'info' && (
                    <>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold text-black">{company.rating}</span>
                                    <span className="text-gray-400 text-sm">({company.reviewCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Phone size={14} />
                                    <span>{company.phone}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={handleToggleLike}
                                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : "text-gray-500"} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-3">회사 소개</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {company.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-3">주요 특징</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {company.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                        <span className="text-xs font-medium text-gray-700">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <ShieldCheck className="text-primary mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-sm text-blue-900 mb-1">안심 보증 서비스</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    본 업체는 소비자 피해보상보험에 가입되어 있으며, 추모맵과의 단독 제휴로 서비스 미이행 시 100% 보상을 약속합니다.
                                </p>
                            </div>

                            {company.specialties && company.specialties.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-primary" />
                                        업체 특화 서비스
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {company.specialties.map((spec, sIdx) => (
                                            <span key={sIdx} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-[11px] font-medium border border-gray-100">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'benefits' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-amber-500" />
                            추모맵 회원 단독 혜택
                        </h3>

                        {company.benefits.map((benefit, idx) => (
                            <div key={idx} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                    <span className="text-amber-600 font-bold text-sm">{idx + 1}</span>
                                </div>
                                <span className="text-sm font-bold text-amber-900">{benefit}</span>
                            </div>
                        ))}

                        <div className="mt-8 p-4 bg-gray-900 rounded-2xl text-white">
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                <CreditCard size={16} className="text-amber-400" />
                                혜택 적용 방법
                            </h4>
                            <ol className="text-xs space-y-2 text-gray-300 list-decimal list-inside">
                                <li>하단 'AI 상담' 버튼을 통해 상담 시작</li>
                                <li>AI 상담 후 전문가 연결 요청 시 "추모맵 회원"임을 말씀해주세요</li>
                                <li>서비스 이용 후 장지(납골당 등) 예약 시 추가 혜택 적용</li>
                            </ol>
                        </div>

                        {company.supportPrograms && company.supportPrograms.length > 0 && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-sm text-gray-800 mb-4">정부 지원 및 제휴 프로그램</h4>
                                <div className="space-y-3">
                                    {company.supportPrograms.map((prog, pIdx) => (
                                        <div key={pIdx} className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span>{prog}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'price' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg">서비스 상품 구성</h3>

                        <div className="space-y-4">
                            {(() => {
                                // Fallback Logic
                                const products = company.products && company.products.length > 0
                                    ? company.products
                                    : (company as any).priceInfo?.products || (company as any).price_info?.products || [];

                                if (products.length === 0) {
                                    return (
                                        <div className="p-4 bg-gray-50 rounded-2xl text-center text-sm text-gray-400 py-10">
                                            상품 정보를 준비 중입니다.
                                        </div>
                                    );
                                }

                                return products.map((prod: any, idx: number) => {
                                    const isPremium = prod.badges?.includes('고급형');
                                    const isStandard = prod.badges?.includes('표준형');

                                    return (
                                        <div
                                            key={idx} // prod.id may be missing in fallback
                                            className={`rounded-2xl shadow-sm relative overflow-hidden border ${isPremium ? 'bg-slate-900 border-slate-800 text-white' :
                                                isStandard ? 'bg-blue-600 border-blue-500 text-white' :
                                                    'bg-white border-gray-100'
                                                }`}
                                        >
                                            <div className="p-5 border-b border-white/10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`px-2 py-0.5 text-[10px] font-bold rounded mb-2 inline-block ${isPremium ? 'bg-amber-400 text-black' :
                                                        isStandard ? 'bg-blue-400 text-white' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {prod.badges?.[0] || '기본형'}
                                                    </div>
                                                    <span className={`font-bold text-lg ${isPremium || isStandard ? 'text-white' : 'text-primary'
                                                        }`}>{(prod.price / 10000).toLocaleString()}만원</span>
                                                </div>
                                                <div className="mb-1">
                                                    <span className={`font-bold text-xl block ${isPremium || isStandard ? 'text-white' : 'text-gray-900'
                                                        }`}>{prod.name}</span>
                                                    {prod.tagline && <span className={`text-xs ${isPremium || isStandard ? 'text-white/70' : 'text-primary'
                                                        }`}>{prod.tagline}</span>}
                                                </div>
                                                <p className={`text-xs mt-2 ${isPremium || isStandard ? 'text-white/80' : 'text-gray-500'
                                                    }`}>{prod.description}</p>
                                            </div>

                                            <div className={`p-4 space-y-4 ${isPremium || isStandard ? 'bg-white' : ''}`}>
                                                {prod.serviceDetails && prod.serviceDetails.map((detail: any, dIdx: number) => (
                                                    <div key={dIdx} className="flex gap-3 text-sm">
                                                        <span className="font-bold text-gray-700 w-12 shrink-0 text-xs">{detail.category}</span>
                                                        <div className="text-gray-600 flex-1 text-xs space-y-1">
                                                            {detail.items.map((item: string, iIdx: number) => (
                                                                <div key={iIdx} className="flex items-start gap-1.5">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                                                                    <span>{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {prod.faq && prod.faq.length > 0 && (
                                                <div className={`px-4 py-3 border-t border-dashed bg-gray-50/50 ${isPremium || isStandard ? 'border-gray-200' : 'border-gray-100'}`}>
                                                    <span className="text-[10px] font-bold text-blue-600 mb-1 block italic">자주 묻는 질문</span>
                                                    <div className="space-y-1">
                                                        {prod.faq.slice(0, 1).map((f: any, fIdx: number) => (
                                                            <div key={fIdx} className="text-[11px]">
                                                                <div className="font-medium text-gray-800">Q: {f.q}</div>
                                                                <div className="text-gray-500">A: {f.a}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            })()}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500">
                            * 위 금액은 표준 금액이며, 실제 서비스 구성에 따라 달라질 수 있습니다.<br />
                            * 장지 이용료(납골당 등)는 포함되지 않은 순수 상조 서비스 금액입니다.
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">갤러리</h3>
                            <span className="text-xs text-gray-400">총 {company.galleryImages?.length || 0}장</span>
                        </div>

                        {company.galleryImages && company.galleryImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {company.galleryImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                                        onClick={() => window.open(img, '_blank')}
                                    >
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <Camera size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">등록된 갤러리 이미지가 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
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
                                        alert('로그인이 필요한 기능입니다.');
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
                                    <button onClick={() => setIsWritingReview(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex mb-3 gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button key={s} onClick={() => setReviewRating(s)}>
                                            <Star size={24} className={s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                                    placeholder="솔직한 후기를 남겨주세요."
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                />
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
                                // 🔕 DEBUG LOGS - 나중에 최적화할 때 다시 켜기
                                // console.log('[FuneralCompanySheet] Company reviews:', company.reviews);
                                // console.log('[FuneralCompanySheet] Review count:', company.reviewCount);
                                // console.log('[FuneralCompanySheet] Company ID:', company.id);

                                if (company.reviews && company.reviews.length > 0) {
                                    return company.reviews.map(review => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            isOwner={currentUser && review.userId === currentUser.id}
                                            onDelete={() => { }}
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
                )}
            </div>

            {/* Footer CTA */}
            <div className="p-4 border-t bg-white safe-area-pb flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
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
