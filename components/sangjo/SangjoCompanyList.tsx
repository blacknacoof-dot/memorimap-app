import React, { useState } from 'react';
import { FuneralCompany } from '../../types';
import { Search, Award, Scale, Bot, ChevronRight } from 'lucide-react';
import { getAuthClient } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { SangjoConsultationModal } from '../Consultation/SangjoConsultationModal';
import { useUser, useSession } from '../../lib/auth';
import { useSangjoFavoriteStore } from '../../stores/useSangjoFavoriteStore';
import { useSangjoCompanies } from '../../hooks/sangjo/useSangjoCompanies';
import { SangjoCompanyCard } from './SangjoCompanyCard';
import UpgradePrompt from '../UpgradePrompt';

interface Props {
    onCompanySelect: (company: FuneralCompany, startChat?: boolean) => void;
    onBack: () => void;
    compareList: FuneralCompany[];
    onToggleCompare: (company: FuneralCompany) => void;
    onShowComparison: () => void;
    isLoggedIn?: boolean;
    onOpenLogin?: () => void;
}

export const SangjoCompanyList: React.FC<Props> = ({
    onCompanySelect,
    onBack: _onBack,
    compareList,
    onToggleCompare,
    onShowComparison,
    isLoggedIn = false,
    onOpenLogin
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showConsultation, setShowConsultation] = useState(false);
    const { companies, isLoading: _isLoading } = useSangjoCompanies();
    const { user } = useUser();
    const { session } = useSession();

    const {
        favoritedIds,
        fetchFavorites,
        toggleFavorite: storeToggleFavorite,
        quotaExceeded,
        clearQuotaExceeded
    } = useSangjoFavoriteStore();

    const handleOpenConsultation = () => {
        setShowConsultation(true);
    };

    // Load user favorites
    React.useEffect(() => {
        const loadFavs = async () => {
            if (!user) return;
            try {
                const client = await getAuthClient(session, { strict: true });
                fetchFavorites(user.id, client);
            } catch {
                // 미로그인 시 무시
            }
        };
        loadFavs();
    }, [user, session, fetchFavorites]);

    const handleToggleFavorite = async (e: React.MouseEvent, company: FuneralCompany) => {
        e.stopPropagation();
        if (!user) {
            if (onOpenLogin) onOpenLogin();
            return;
        }
        try {
            const client = await getAuthClient(session, { strict: true });
            await storeToggleFavorite(user.id, company, client);
        } catch (_error) {
            toast.error('즐겨찾기 변경에 실패했습니다.');
        }
    };

    const filteredCompanies = companies.filter(c =>
        (c.name.includes(searchQuery) || (c.description || '').includes(searchQuery)) &&
        !c.name.includes('새부산상조')
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 relative">
            {/* Search Header */}
            <div className="px-4 pt-4 mb-1.5 shrink-0">
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
                        className="w-full h-11 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900"
                    />
                </div>
            </div>

            {/* Benefits Banner */}
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

            {/* Company List */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-28 no-scrollbar">
                {filteredCompanies.map(company => (
                    <SangjoCompanyCard
                        key={company.id}
                        company={company}
                        isFavorited={favoritedIds.has(company.id)}
                        isCompared={compareList.some(c => c.id === company.id)}
                        onSelect={() => onCompanySelect(company)}
                        onToggleFavorite={(e) => handleToggleFavorite(e, company)}
                        onToggleCompare={(e) => {
                            e.stopPropagation();
                            onToggleCompare(company);
                        }}
                    />
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="text-gray-300 mb-2">
                            <Search size={40} className="mx-auto opacity-20" />
                        </div>
                        <p className="text-gray-500 text-xs">검색 결과가 없습니다.</p>
                    </div>
                )}

                <div className="h-10" />
            </div>

            {/* Floating AI Counselor + Compare Button */}
            <div className="absolute bottom-[5.15rem] left-0 right-0 px-3 z-40 animate-in slide-in-from-bottom-4 duration-500">
                {compareList.length > 0 && (
                    <button
                        onClick={onShowComparison}
                        className="absolute -top-11 right-7 bg-white text-primary p-2.5 rounded-full shadow-2xl border-2 border-primary flex items-center justify-center z-[210] hover:scale-110 active:scale-95 transition-all"
                    >
                        <Scale size={18} />
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                            {compareList.length}
                        </span>
                    </button>
                )}

                <div
                    onClick={handleOpenConsultation}
                    className="w-full bg-white/95 backdrop-blur-md border border-amber-200/60 rounded-2xl px-3 py-2.5 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all hover:border-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.12)]"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                            <div className="w-9 h-9 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center border border-amber-200 shadow-sm transition-transform group-hover:scale-110 duration-300">
                                <Bot size={21} className="text-amber-500 animate-pulse" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md uppercase">AI 맞춤 추천</span>
                                <p className="text-[10px] text-amber-600 font-bold tracking-tight">상조 선택이 고민되시나요?</p>
                            </div>
                            <h4 className="text-[13px] font-extrabold text-gray-900 flex items-center gap-1">
                                AI 마음이와 비교 상담
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
                    companies={companies}
                    onCompanySelect={(company) => {
                        setShowConsultation(false);
                        onCompanySelect(company, true);
                    }}
                    onLoginRequired={onOpenLogin}
                    currentUser={user ? { id: user.id, name: user.fullName || user.firstName || '' } : null}
                />
            )}

            <UpgradePrompt
                isOpen={!!quotaExceeded}
                onClose={clearQuotaExceeded}
                featureName="상조 즐겨찾기"
                current={quotaExceeded?.current ?? 0}
                limit={quotaExceeded?.limit ?? 0}
            />
        </div>
    );
};

// Backward compatibility alias
export const FuneralCompanyView = SangjoCompanyList;
