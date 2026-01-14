import React, { useState } from 'react';
import { FuneralCompany } from '../types';
import { FUNERAL_COMPANIES } from '../constants';
import { Star, Phone, ChevronRight, Award, ShieldCheck, HeartHandshake, Search, Scale, Check, Bot } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { SangjoConsultationModal } from './Consultation/SangjoConsultationModal';

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

    // [Change] Fetch companies from Supabase on mount
    React.useEffect(() => {
        const fetchCompanies = async () => {
            try {
                // Use singleton instance
                const { data, error } = await supabase
                    .from('memorial_spaces')
                    .select('*')
                    .eq('type', 'sangjo')
                    .order('id', { ascending: true });

                if (data && data.length > 0) {
                    // Map DB data to FuneralCompany interface
                    const mappedCompanies: FuneralCompany[] = data.map(item => {
                        // Attempt to find a matching static image or use default
                        const staticMatch = FUNERAL_COMPANIES.find(c => c.name === item.name);

                        return {
                            id: item.id.toString(), // Convert int ID to string
                            name: item.name,
                            rating: item.rating || 4.8, // Default high rating for trusted partners
                            reviewCount: item.review_count || 120,
                            imageUrl: staticMatch?.imageUrl || item.image_url || '/images/default_sangjo.png',
                            // [Fix] Prioritize DB description/features over static match
                            description: item.description || staticMatch?.description || `${item.name}의 프리미엄 상조 서비스입니다.`,
                            features: (item.features && item.features.length > 0) ? item.features : (staticMatch?.features || ["전국 의전망", "24시간 상담"]),
                            phone: item.phone || item.contact || '1588-0000',
                            priceRange: item.priceRange || '문의',
                            benefits: item.benefits || ["회원 전용 혜택"],
                            galleryImages: item.gallery_images || [], // ✅ Map newly added gallery images
                            products: item.price_info?.products // Include fetched products
                        };
                    });

                    // Merge: Use fetched list, but if filtered by search, just filter this list.
                    // Prioritize fetched data.
                    setCompanies(mappedCompanies);
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

    const filteredCompanies = companies.filter(c =>
        c.name.includes(searchQuery) || c.description.includes(searchQuery)
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 pt-1 relative">
            {/* Search Header Container - Restored Wrapper */}
            <div className="px-4 mb-2 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-lg text-gray-800">상조 서비스 추천</h2>
                        <span className="text-[9px] text-gray-300 font-mono">v1.3</span>
                    </div>
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                        추모맵 단독 혜택
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="상조회사 이름 검색..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900"
                    />
                </div>
            </div>

            {/* Benefits Banner */}
            <div className="px-4 mb-3 shrink-0">
                <div className="bg-gradient-to-br from-primary to-blue-700 p-3.5 rounded-2xl text-white shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Award className="text-amber-300" size={18} />
                        <span className="font-bold text-xs">추모맵 X 상조회사 특별 제휴</span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-relaxed">
                        상조 서비스 가입 후 추모맵을 통해 장지 예약 시,<br />
                        <span className="font-bold text-amber-300 text-xs">최대 100만원 상당의 패키지 할인</span> 혜택을 드립니다.
                    </p>
                </div>
            </div>

            {/* Company List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-8 no-scrollbar">
                {filteredCompanies.map(company => (
                    <div
                        key={company.id}
                        onClick={() => onCompanySelect(company)}
                        className={`bg-white rounded-2xl p-3 shadow-sm border transition-all active:scale-[0.98] group relative ${compareList.some(c => c.id === company.id) ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 hover:shadow-md'
                            }`}
                    >
                        {/* Compare Button - Icon Only Style */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompare(company);
                            }}
                            className={`absolute right-4 bottom-4 p-2 rounded-full transition-colors border shadow-sm z-10 ${compareList.some(c => c.id === company.id)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-primary hover:text-primary'
                                }`}
                            title={compareList.some(c => c.id === company.id) ? "비교함에서 제거" : "비교함에 추가"}
                        >
                            {compareList.some(c => c.id === company.id) ? <Check size={16} /> : <Scale size={16} />}
                        </button>
                        <div className="flex gap-4">
                            <div className="relative shrink-0">
                                <img
                                    src={company.imageUrl}
                                    alt={company.name}
                                    className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                                />
                                <div className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-sm border border-gray-50">
                                    <ShieldCheck size={16} className="text-green-500" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 pr-12">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                                        {company.name}
                                    </h3>
                                    <div className="flex items-center gap-0.5 text-yellow-500">
                                        <Star size={12} fill="currentColor" />
                                        <span className="text-xs font-bold">{company.rating}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                                    {company.description}
                                </p>

                                <div className="flex flex-wrap gap-1.5">
                                    {company.features.slice(0, 2).map((f: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <HeartHandshake size={14} className="text-primary" />
                                <span className="text-[11px] font-bold text-primary truncate max-w-[180px]">
                                    {company.benefits[0]}
                                </span>
                            </div>
                            {/* Placeholder for alignment */}
                            <div className="flex items-center text-gray-300 group-hover:text-primary transition-colors opacity-0"></div>
                        </div>
                    </div>
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="text-gray-300 mb-2">
                            <Search size={48} className="mx-auto opacity-20" />
                        </div>
                        <p className="text-gray-500 text-sm">검색 결과가 없습니다.</p>
                    </div>
                )}

                {/* Spacer for sticky footer */}
                <div className="h-32" />
            </div>

            {/* Premium Floating AI Counselor and Compare Button */}
            <div className="absolute bottom-20 left-0 right-0 px-4 z-40 animate-in slide-in-from-bottom-4 duration-500">
                {compareList.length > 0 && (
                    <button
                        onClick={onShowComparison}
                        className="absolute -top-14 right-8 bg-white text-primary p-3.5 rounded-full shadow-2xl border-2 border-primary flex items-center justify-center z-[210] hover:scale-110 active:scale-95 transition-all"
                    >
                        <Scale size={20} />
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                            {compareList.length}
                        </span>
                    </button>
                )}

                <div
                    onClick={handleOpenConsultation}
                    className="w-full bg-white/95 backdrop-blur-md border border-amber-200/60 rounded-[24px] p-4 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.12)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm transition-transform group-hover:scale-110 duration-300">
                                <Bot size={28} className="text-amber-500 animate-pulse" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md uppercase">AI 맞춤 추천</span>
                                <p className="text-[10px] text-amber-600 font-bold tracking-tight">상조 비교가 고민되시나요?</p>
                            </div>
                            <h4 className="text-[15px] font-extrabold text-gray-900 flex items-center gap-1.5">
                                통합 비교 AI '마음이'와 대화하기
                                <div className="p-1 bg-amber-500 rounded-full text-white shadow-sm group-hover:translate-x-1 transition-transform">
                                    <ChevronRight size={12} strokeWidth={3} />
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
