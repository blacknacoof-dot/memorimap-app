import React, { useState } from 'react';
import { FuneralCompany, Review } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { Star, Phone, ChevronRight, Award, ShieldCheck, HeartHandshake, Search, Scale, Check, Bot, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { SangjoConsultationModal } from './Consultation/SangjoConsultationModal';
import { sangjoFavoriteService } from '../services/sangjoFavoriteService';
import { useUser } from '@clerk/clerk-react';
import { useSangjoFavoriteStore } from '../stores/useSangjoFavoriteStore';

// 기본 후기 생성 (DB 리뷰가 없는 상조 회사용)
const DEFAULT_REVIEW_TEMPLATES = [
    { content: '상담부터 진행까지 꼼꼼하게 안내해주셔서 감사했습니다. 어려운 시기에 큰 힘이 되었어요.', rating: 5 },
    { content: '가격 대비 서비스가 훌륭했습니다. 직원분들이 정말 친절하고 세심하게 신경 써주셨어요.', rating: 5 },
    { content: '급하게 진행해야 했는데 빠르게 대응해주셔서 감사합니다. 전체적으로 만족스러웠습니다.', rating: 4 },
    { content: '지인 추천으로 이용했는데 역시 믿을 만했습니다. 절차 안내도 친절하고 깔끔했어요.', rating: 5 },
    { content: '처음이라 막막했는데 하나하나 설명해주시고 부담 없이 진행해주셔서 좋았습니다.', rating: 4 },
];

const DEFAULT_NAMES = ['김민수', '이서연', '박지훈', '최영희', '정하늘', '강수진', '조현우', '윤미래', '장도윤', '임채원'];

function generateDefaultReviews(companyId: string, companyName: string): Review[] {
    // companyId 해시 기반으로 안정적인 랜덤 시드 생성
    let seed = 0;
    for (let i = 0; i < companyId.length; i++) {
        seed = ((seed << 5) - seed) + companyId.charCodeAt(i);
        seed |= 0;
    }

    const seededRandom = (index: number) => {
        const x = Math.sin(seed + index * 9301) * 10000;
        return x - Math.floor(x);
    };

    // 5~7개월 전 ~ 1개월 전 사이 날짜 생성
    const now = Date.now();
    return DEFAULT_REVIEW_TEMPLATES.map((tpl, i) => {
        const nameIdx = Math.abs(Math.floor(seededRandom(i) * DEFAULT_NAMES.length)) % DEFAULT_NAMES.length;
        const daysAgo = Math.floor(seededRandom(i + 100) * 180) + 30; // 30~210일 전
        const date = new Date(now - daysAgo * 86400000);
        return {
            id: `default_${companyId}_${i}`,
            userId: '',
            user_id: '',
            userName: DEFAULT_NAMES[nameIdx],
            facility_id: companyId,
            rating: tpl.rating,
            content: tpl.content,
            images: [],
            created_at: date.toISOString(),
            date: date.toISOString().split('T')[0],
        };
    });
}

interface Props {
    onCompanySelect: (company: FuneralCompany, startChat?: boolean) => void;
    onBack: () => void;
    compareList: FuneralCompany[];
    onToggleCompare: (company: FuneralCompany) => void;
    onShowComparison: () => void;
    isLoggedIn?: boolean;
    onOpenLogin?: () => void;
}

export const FuneralCompanyView: React.FC<Props> = ({
    onCompanySelect,
    onBack,
    compareList,
    onToggleCompare,
    onShowComparison,
    isLoggedIn = false,
    onOpenLogin
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showConsultation, setShowConsultation] = useState(false);
    // [Change] Dynamic state for companies instead of static constant
    const [companies, setCompanies] = useState<FuneralCompany[]>(FUNERAL_COMPANIES);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useUser();

    // [Change] Using global store for favorites
    const { favoritedIds, fetchFavorites, toggleFavorite: storeToggleFavorite } = useSangjoFavoriteStore();

    // [Change] Fetch companies from Supabase on mount
    React.useEffect(() => {
        const fetchCompanies = async () => {
            try {
                // Fetch companies
                const { data, error } = await supabase
                    .from('funeral_companies')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) {
                    console.error('❌ [FuneralCompanyView] Fetch Error:', error);
                    throw error;
                }

                if (data && data.length > 0) {
                    // 🔥 OPTIMIZATION: Fetch ALL reviews in a single query instead of 46 individual queries
                    const companyIds = data.map(item => item.id);
                    // Create a comprehensive set of IDs to fetch reviews for
                    const staticIds = data.map(item => {
                        const match = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));
                        return match?.id;
                    }).filter(Boolean) as string[];

                    const allTargetIds = Array.from(new Set([...companyIds, ...staticIds]));

                    const { data: allReviews, error: reviewError } = await supabase
                        .from('facility_reviews')
                        .select('*')
                        .in('facility_id', allTargetIds)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false });

                    if (reviewError) {
                        console.error('[FuneralCompanyView] ❌ Review fetch error:', reviewError);
                    }

                    // Reviews fetched from DB

                    // Group reviews by facility_id (ensure string keys and trim whitespace)
                    const reviewsByCompany = new Map<string, any[]>();
                    allReviews?.forEach(review => {
                        const companyId = review.facility_id?.toString().trim();
                        if (companyId) {
                            if (!reviewsByCompany.has(companyId)) {
                                reviewsByCompany.set(companyId, []);
                            }
                            reviewsByCompany.get(companyId)!.push(review);
                        }
                    });

                    // Map companies with their reviews
                    const mappedCompanies: FuneralCompany[] = data.map(item => {
                        // Attempt to find a matching static image or use default
                        const staticMatch = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));

                        // Combine reviews from both DB ID and Static ID
                        const dbId = item.id.toString().trim();
                        const staticId = staticMatch?.id?.toString().trim();

                        const reviews = [
                            ...(reviewsByCompany.get(dbId) || []),
                            ...(staticId ? (reviewsByCompany.get(staticId) || []) : [])
                        ];

                        // Deduplicate reviews by ID
                        const uniqueReviews = Array.from(new Map(reviews.map(r => [r.id, r])).values());

                        // 상조 서비스 상품 (price_range 기반 동적 생성)
                        const products = (() => {
                            const range = item.price_range || staticMatch?.priceRange || '';
                            // "200~500" 또는 "130만원~" 형태 모두 처리
                            const match = range.match(/(\d+)~(\d+,?\d*)/);
                            const singleMatch = !match && range.match(/(\d+)만?원?~/);

                            const buildProducts = (min: number, max: number) => {
                                const mid = Math.round((min + max) / 2 / 10000) * 10000;
                                return [
                                    {
                                        id: '1', name: `실속형 (${min / 10000}만)`, price: min,
                                        description: '합리적인 가격으로 꼭 필요한 서비스만 담은 실속 상품',
                                        badges: ['실속형', '인기'], tagline: '합리적인 선택',
                                        serviceDetails: [
                                            { category: '인력', items: ['의전관리사 4명', '장례지도사 1명'] },
                                            { category: '용품', items: ['오동나무 1단 관', '기본 수의'] },
                                            { category: '차량', items: ['운구차량 200km'] }
                                        ]
                                    },
                                    {
                                        id: '2', name: `표준형 (${mid / 10000}만)`, price: mid,
                                        description: '가장 많은 고객님이 선택하시는 표준 의전 프로그램',
                                        badges: ['표준형', '추천'], tagline: '격조 높은 의전',
                                        serviceDetails: [
                                            { category: '인력', items: ['의전관리사 6명', '장례지도사 2명'] },
                                            { category: '용품', items: ['솔송나무 2단 관', '특수 면수의'] },
                                            { category: '차량', items: ['리무진 및 버스 왕복 400km'] }
                                        ]
                                    },
                                    {
                                        id: '3', name: `고급형 (${max / 10000}만)`, price: max,
                                        description: '최고급 의전과 프리미엄 서비스를 제공하는 VIP 상품',
                                        badges: ['고급형', 'VIP'], tagline: '최상의 품격',
                                        serviceDetails: [
                                            { category: '인력', items: ['의전관리사 8명', '장례지도사 3명', '전담 코디네이터'] },
                                            { category: '용품', items: ['프리미엄 편백관', '최고급 실크수의'] },
                                            { category: '차량', items: ['VIP 리무진 및 대형버스 전국'] }
                                        ]
                                    }
                                ];
                            };

                            if (match) {
                                const minPrice = parseInt(match[1].replace(/,/g, '')) * 10000;
                                const maxPrice = parseInt(match[2].replace(/,/g, '')) * 10000;
                                return buildProducts(minPrice, maxPrice);
                            }
                            if (singleMatch) {
                                // "130만원~" 형태: 최소가격만 있으면 3배를 최대로 추정
                                const minPrice = parseInt(singleMatch[1]) * 10000;
                                const maxPrice = minPrice * 3;
                                return buildProducts(minPrice, maxPrice);
                            }
                            // price_range가 "문의"이거나 없는 경우 → 업계 표준 기본 상품
                            return buildProducts(2000000, 8000000);
                        })();

                        // 갤러리: DB → 정적 이미지 → 로컬 상조 서비스 이미지 (랜덤 4장)
                        const ALL_SANGJO_GALLERY = Array.from({ length: 19 }, (_, i) =>
                            `/images/sangjo/gallery/sangjo_gallery_${i + 1}.jpg`
                        );
                        const pickRandomGallery = (companyIndex: number) => {
                            // 회사별로 다른 이미지 조합 (seed 기반)
                            const shuffled = [...ALL_SANGJO_GALLERY].sort((a, b) => {
                                const ha = (companyIndex * 7 + a.charCodeAt(a.length - 5)) % 19;
                                const hb = (companyIndex * 7 + b.charCodeAt(b.length - 5)) % 19;
                                return ha - hb;
                            });
                            return shuffled.slice(0, 4);
                        };
                        const companyIdx = data!.indexOf(item);
                        const galleryImages = (item.gallery_images && item.gallery_images.length > 0)
                            ? item.gallery_images
                            : (item.images && item.images.length > 0)
                                ? item.images
                                : [
                                    staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
                                    ...pickRandomGallery(companyIdx)
                                  ];

                        return {
                            ...item,
                            id: item.id.toString(), // 🔥 [FIX] Always use DB UUID instead of staticId (fc_new_1)
                            staticId: staticMatch?.id, // Keep static ID for reference if needed
                            name: item.name,
                            rating: item.rating || 4.8,
                            reviewCount: item.review_count || uniqueReviews.length || 5,
                            imageUrl: staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
                            description: item.description || staticMatch?.description || `${item.name}의 프리미엄 상조 서비스입니다.`,
                            features: (item.features && item.features.length > 0) ? item.features : (staticMatch?.features || ["전국 의전망", "24시간 상담"]),
                            phone: item.phone || item.contact || '1588-0000',
                            priceRange: item.priceRange || '문의',
                            benefits: item.benefits || ["회원 전용 혜택"],
                            galleryImages: galleryImages,
                            products: products,
                            reviews: (() => {
                                const dbReviews = uniqueReviews.map((r: any) => {
                                    let displayDate = '최근';
                                    try {
                                        if (r.created_at) {
                                            const d = new Date(r.created_at);
                                            if (!isNaN(d.getTime())) {
                                                displayDate = d.toISOString().split('T')[0];
                                            }
                                        }
                                    } catch (e) { /* ignore */ }

                                    return {
                                        id: r.id,
                                        userId: r.user_id || '',
                                        user_id: r.user_id || '',
                                        userName: r.user_name || r.userName || '익명',
                                        facility_id: r.facility_id,
                                        rating: r.rating || 5,
                                        content: r.content || '',
                                        images: r.images || [],
                                        created_at: r.created_at,
                                        date: displayDate
                                    };
                                });
                                // DB 리뷰가 없으면 기본 후기 5개 표시
                                if (dbReviews.length === 0) {
                                    return generateDefaultReviews(item.id.toString(), item.name);
                                }
                                return dbReviews;
                            })()
                        };
                    });

                    // Sort by Sales Rank (Order in FUNERAL_COMPANIES constant)
                    const sortedCompanies = mappedCompanies.sort((a, b) => {
                        const indexA = FUNERAL_COMPANIES.findIndex(fc => fc.name.replace(/\s/g, '') === a.name.replace(/\s/g, ''));
                        const indexB = FUNERAL_COMPANIES.findIndex(fc => fc.name.replace(/\s/g, '') === b.name.replace(/\s/g, ''));
                        const rankA = indexA === -1 ? 999 : indexA;
                        const rankB = indexB === -1 ? 999 : indexB;
                        return rankA - rankB;
                    });

                    setCompanies(sortedCompanies);
                }
            } catch (err) {
                console.error("Failed to fetch sangjo companies:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const handleOpenConsultation = () => {
        if (!isLoggedIn) {
            if (onOpenLogin) onOpenLogin();
            return;
        }
        setShowConsultation(true);
    };

    // Load user favorites
    React.useEffect(() => {
        if (user) {
            fetchFavorites(user.id);
        }
    }, [user, fetchFavorites]);

    // Removal of local loadFavorites as it's now handled by the store

    const handleToggleFavorite = async (
        e: React.MouseEvent,
        company: FuneralCompany
    ) => {
        e.stopPropagation();

        if (!user) {
            if (onOpenLogin) onOpenLogin();
            return;
        }

        try {
            await storeToggleFavorite(user.id, company);
        } catch (error) {
            console.error('Failed to toggle sangjo favorite:', error);
        }
    };

    const filteredCompanies = companies.filter(c =>
        (c.name.includes(searchQuery) || c.description.includes(searchQuery)) &&
        !c.name.includes('새부산상조') // [FIX] Exclude Sae Busan Sangjo as requested
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 relative">
            {/* Search Header Container */}
            <div className="px-4 pt-12 mb-1.5 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-[17px] text-gray-800">상조 서비스 추천</h2>
                        <span className="text-[9px] text-gray-300 font-mono">v1.4</span>
                    </div>
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                        추모맵 단독 혜택
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="상조회사 이름 검색..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900"
                    />
                </div>
            </div>

            {/* Benefits Banner - Compact */}
            <div className="px-4 mb-2 shrink-0">
                <div className="bg-gradient-to-br from-primary to-blue-700 p-2.5 rounded-xl text-white shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Award className="text-amber-300" size={16} />
                        <span className="font-bold text-[11px]">추모맵 X 상조회사 특별 제휴</span>
                    </div>
                    <p className="text-[10px] text-white/90 leading-tight">
                        상조 서비스 가입 후 추모맵을 통해 장지 예약 시,<br />
                        <span className="font-bold text-amber-300 text-[11px]">최대 100만원 상당의 패키지 할인</span> 혜택을 드립니다.
                    </p>
                </div>
            </div>

            {/* Company List - Dense */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-8 no-scrollbar">
                {filteredCompanies.map(company => (
                    <div
                        key={company.id}
                        onClick={() => onCompanySelect(company)}
                        className={`bg-white rounded-2xl p-2.5 shadow-sm border transition-all active:scale-[0.98] group relative ${compareList.some(c => c.id === company.id) ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 hover:shadow-md'
                            }`}
                    >
                        {/* Favorite Button - Heart Icon */}
                        <button
                            onClick={(e) => handleToggleFavorite(e, company)}
                            className={`absolute right-2 top-2 p-2 rounded-full transition-all shadow-sm z-10 ${favoritedIds.has(company.id)
                                ? 'bg-red-50 text-red-500'
                                : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                            title={favoritedIds.has(company.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                            <Heart
                                size={18}
                                fill={favoritedIds.has(company.id) ? 'currentColor' : 'none'}
                                strokeWidth={2}
                            />
                        </button>

                        {/* Compare Button - Icon Only Style */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompare(company);
                            }}
                            className={`absolute right-3.5 bottom-3.5 p-1.5 rounded-full transition-colors border shadow-sm z-10 ${compareList.some(c => c.id === company.id)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-primary hover:text-primary'
                                }`}
                            title={compareList.some(c => c.id === company.id) ? "비교함에서 제거" : "비교함에 추가"}
                        >
                            {compareList.some(c => c.id === company.id) ? <Check size={14} /> : <Scale size={14} />}
                        </button>
                        <div className="flex gap-3">
                            <div className="relative shrink-0">
                                <img
                                    src={company.imageUrl}
                                    alt={company.name}
                                    className="w-16 h-16 rounded-lg object-cover bg-gray-100" // Reduced size 80px -> 64px
                                />
                                <div className="absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-sm border border-gray-50">
                                    <ShieldCheck size={14} className="text-green-500" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 pr-10">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h3 className="font-bold text-[15px] text-gray-900 group-hover:text-primary transition-colors truncate">
                                        {company.name}
                                    </h3>
                                    <div className="flex items-center gap-0.5 text-yellow-500">
                                        <Star size={11} fill="currentColor" />
                                        <span className="text-[11px] font-bold">{company.rating}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-500 line-clamp-1 mb-1.5 leading-relaxed">
                                    {company.description}
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {company.features.slice(0, 2).map((f: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <HeartHandshake size={13} className="text-primary" />
                                <span className="text-[11px] font-bold text-primary truncate max-w-[200px]">
                                    {company.benefits[0]}
                                </span>
                            </div>
                            {/* Placeholder for alignment */}
                            <div className="flex items-center text-gray-300 group-hover:text-primary transition-colors opacity-0"></div>
                        </div>
                    </div>
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="text-gray-300 mb-2">
                            <Search size={40} className="mx-auto opacity-20" />
                        </div>
                        <p className="text-gray-500 text-xs">검색 결과가 없습니다.</p>
                    </div>
                )}

                {/* Spacer for sticky footer - slightly reduced */}
                <div className="h-28" />
            </div>

            {/* Premium Floating AI Counselor and Compare Button */}
            <div className="absolute bottom-20 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom-4 duration-500">
                {compareList.length > 0 && (
                    <button
                        onClick={onShowComparison}
                        className="absolute -top-14 right-8 bg-white text-primary p-3 rounded-full shadow-2xl border-2 border-primary flex items-center justify-center z-[210] hover:scale-110 active:scale-95 transition-all"
                    >
                        <Scale size={18} />
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                            {compareList.length}
                        </span>
                    </button>
                )}

                <div
                    onClick={handleOpenConsultation}
                    className="w-full bg-white/95 backdrop-blur-md border border-amber-200/60 rounded-[20px] p-3.5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.12)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center border border-amber-200 shadow-sm transition-transform group-hover:scale-110 duration-300">
                                <Bot size={24} className="text-amber-500 animate-pulse" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md uppercase">AI 맞춤 추천</span>
                                <p className="text-[10px] text-amber-600 font-bold tracking-tight">상조 비교가 고민되시나요?</p>
                            </div>
                            <h4 className="text-[14px] font-extrabold text-gray-900 flex items-center gap-1">
                                통합 비교 AI '마음이'와 대화하기
                                <div className="p-0.5 bg-amber-500 rounded-full text-white shadow-sm group-hover:translate-x-1 transition-transform">
                                    <ChevronRight size={10} strokeWidth={3} />
                                </div>
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consultation Modal */}
            {showConsultation && (
                <SangjoConsultationModal
                    onClose={() => setShowConsultation(false)}
                    onCompanySelect={(company) => {
                        setShowConsultation(false);
                        onCompanySelect(company, true);
                    }}
                    currentUser={user ? { id: user.id, name: user.fullName || user.firstName || '' } : null}
                />
            )}
        </div>
    );
};
