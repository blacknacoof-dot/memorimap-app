import React, { useState } from 'react';
import { FuneralCompany } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { Star, Phone, ChevronRight, Award, ShieldCheck, HeartHandshake, Search, Scale, Check, Bot, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { SangjoConsultationModal } from './Consultation/SangjoConsultationModal';
import { sangjoFavoriteService } from '../services/sangjoFavoriteService';
import { useUser } from '@clerk/clerk-react';

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
    const [favoritedCompanies, setFavoritedCompanies] = useState<Set<string>>(new Set());

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
                    const { data: allReviews, error: reviewError } = await supabase
                        .from('reviews')
                        .select('*')
                        .in('facility_id', companyIds)
                        .order('created_at', { ascending: false });

                    if (reviewError) {
                        console.error('❌ [FuneralCompanyView] Reviews Error:', reviewError);
                    }

                    // Group reviews by company ID for O(1) lookup
                    const reviewsByCompany = new Map<string, any[]>();
                    allReviews?.forEach(review => {
                        const companyId = review.facility_id;
                        if (!reviewsByCompany.has(companyId)) {
                            reviewsByCompany.set(companyId, []);
                        }
                        reviewsByCompany.get(companyId)!.push(review);
                    });

                    // Map companies with their reviews
                    const mappedCompanies: FuneralCompany[] = data.map(item => {
                        const reviews = reviewsByCompany.get(item.id) || [];

                        // Attempt to find a matching static image or use default
                        const staticMatch = FUNERAL_COMPANIES.find(c => c.name.replace(/\s/g, '') === item.name.replace(/\s/g, ''));

                        // 상조 서비스 상품 (하드코딩)
                        const products = [
                            {
                                id: 'basic',
                                name: '베이직형',
                                price: 3500000,
                                badges: ['기본형'],
                                tagline: '합리적인 가격의 기본 상조 서비스',
                                description: '장례 의전에 필요한 기본 서비스를 제공합니다.',
                                serviceDetails: [
                                    { category: '의전', items: ['영정사진 제작', '부고 안내', '접객 지원'] },
                                    { category: '장례용품', items: ['수의 1벌', '관 1구', '제단 화환'] }
                                ],
                                includedServices: ['영정사진 제작', '부고 안내', '수의 1벌', '관 1구'],
                                optionalServices: ['추가 화환', '식사 추가']
                            },
                            {
                                id: 'standard',
                                name: '스탠다드형',
                                price: 5000000,
                                badges: ['표준형'],
                                tagline: '가장 많이 선택하는 표준 서비스',
                                description: '합리적인 가격에 충실한 서비스를 제공합니다.',
                                serviceDetails: [
                                    { category: '의전', items: ['영정사진 제작', '부고 안내', '접객 지원', '사회자 파견'] },
                                    { category: '장례용품', items: ['고급 수의 1벌', '고급관 1구', '제단 화환 3개'] },
                                    { category: '추가', items: ['식사 50인분', '답례품 제공'] }
                                ],
                                includedServices: ['영정사진 제작', '사회자 파견', '고급 수의', '식사 50인분'],
                                optionalServices: ['VIP 의전', '추가 식사']
                            },
                            {
                                id: 'premium',
                                name: '프리미엄형',
                                price: 10000000,
                                badges: ['고급형'],
                                tagline: '최상의 서비스로 고인을 예우하는 프리미엄 상조',
                                description: '최고급 서비스로 품격있는 마지막 인사를 준비합니다.',
                                serviceDetails: [
                                    { category: '의전', items: ['전문 사회자', '의전팀 24시간 상주'] },
                                    { category: '장례용품', items: ['최고급 수의', '최고급 관', '제단 화환 10개'] },
                                    { category: '추가', items: ['식사 100인분', '고급 답례품', '추모 영상 제작'] }
                                ],
                                includedServices: ['전문 사회자', '의전팀 24시간', '최고급 수의', '식사 100인분', '추모 영상'],
                                optionalServices: ['해외 현지 의전', '프리미엄 답례품 업그레이드']
                            }
                        ];

                        // 갤러리 이미지 - DB에서 가져오거나 기본 이미지 사용
                        const galleryImages = item.gallery_images && item.gallery_images.length > 0
                            ? item.gallery_images
                            : [
                                'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
                                'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
                                'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400'
                            ];

                        return {
                            id: item.id.toString(),
                            name: item.name,
                            rating: item.rating || 4.8,
                            reviewCount: item.review_count || 0,
                            imageUrl: staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
                            description: item.description || staticMatch?.description || `${item.name}의 프리미엄 상조 서비스입니다.`,
                            features: (item.features && item.features.length > 0) ? item.features : (staticMatch?.features || ["전국 의전망", "24시간 상담"]),
                            phone: item.phone || item.contact || '1588-0000',
                            priceRange: item.priceRange || '문의',
                            benefits: item.benefits || ["회원 전용 혜택"],
                            galleryImages: galleryImages,
                            products: products,
                            reviews: reviews.map((r: any) => ({
                                id: r.id,
                                userId: r.user_id,
                                user_id: r.user_id,
                                userName: '익명',
                                facility_id: r.facility_id,
                                rating: r.rating,
                                content: r.content,
                                images: r.images || [],
                                created_at: r.created_at,
                                date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toLocaleDateString()
                            }))
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
            loadFavorites();
        }
    }, [user]);

    const loadFavorites = async () => {
        if (!user) return;
        try {
            const favorites = await sangjoFavoriteService.getFavorites(user.id);
            setFavoritedCompanies(new Set(favorites.map(f => f.company_id)));
        } catch (error) {
            console.error('Failed to load sangjo favorites:', error);
        }
    };

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
            const isFavorite = await sangjoFavoriteService.toggleFavorite(user.id, company);

            setFavoritedCompanies(prev => {
                const next = new Set(prev);
                if (isFavorite) {
                    next.add(company.id);
                } else {
                    next.delete(company.id);
                }
                return next;
            });
        } catch (error) {
            console.error('Failed to toggle sangjo favorite:', error);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.includes(searchQuery) || c.description.includes(searchQuery)
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 relative">
            {/* Search Header Container - Condensed for Mobile */}
            <div className="px-4 mb-1.5 shrink-0">
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
                            className={`absolute right-2 top-2 p-2 rounded-full transition-all shadow-sm z-10 ${favoritedCompanies.has(company.id)
                                ? 'bg-red-50 text-red-500'
                                : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                            title={favoritedCompanies.has(company.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                            <Heart
                                size={18}
                                fill={favoritedCompanies.has(company.id) ? 'currentColor' : 'none'}
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
                                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <HeartHandshake size={13} className="text-primary" />
                                <span className="text-[10px] font-bold text-primary truncate max-w-[180px]">
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
                />
            )}
        </div>
    );
};
