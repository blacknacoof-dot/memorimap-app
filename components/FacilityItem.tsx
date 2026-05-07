import React from 'react';
import { Check, Scale, Award, Bot, BadgeCheck } from 'lucide-react';
import { Facility } from '../types';
import { normalizeSubscriptionPlanId } from '../lib/subscriptionPlanIds';
import { OptimizedImage } from './ui/OptimizedImage';
import { getCategoryLabel } from '../utils/facilityNormalizer';

/** 이미지 디버그 로그 플래그 — 필요 시 true로 변경 */
const IMAGE_DEBUG = import.meta.env.DEV && false;

const DEBUG_IMAGE_SAMPLE_NAMES = new Set([
    '일산백장례서비스',
    '하늘문 봉안당',
    '팔공산도림사추모공원',
    '청솔공원 자연장지',
    '강릉펫사랑',
]);

function getFallbackByType(type?: string) {
    switch (type) {
        case 'charnel':
        case 'columbarium':
        case 'charnel_house':
        case 'memorial':
            return '/images/defaults/cemetery/cemetery_1.webp';
        case 'park':
        case 'cemetery':
        case 'park_cemetery':
        case 'complex':
            return '/images/defaults/cemetery/cemetery_1.webp';
        case 'natural':
        case 'natural_burial':
        case 'tree_burial':
            return '/images/defaults/natural/natural_1.webp';
        case 'pet':
        case 'pet_funeral':
        case 'pet_memorial':
        case 'sea':
        case 'sea_burial':
        case 'funeral':
        case 'funeral_home':
        case 'funeral_hall':
        default:
            return '/images/defaults/funeral/funeral_1.webp';
    }
}

interface FacilityItemProps {
    facility: Facility;
    onClick: (facility: Facility) => void;
    isCompared: boolean;
    onToggleCompare: (facility: Facility) => void;
    style?: React.CSSProperties; // Required for react-window
}

export const FacilityItem = React.memo(({ facility, onClick, isCompared, onToggleCompare, style }: FacilityItemProps) => {
    const normalizedPlanId = normalizeSubscriptionPlanId(facility.subscription?.plan?.name_en || facility.subscription?.plan_name);

    if (IMAGE_DEBUG && DEBUG_IMAGE_SAMPLE_NAMES.has(facility.name)) {
        console.info('[image-debug:FacilityItem:render]', {
            name: facility.name,
            type: facility.type,
            imageUrl: facility.imageUrl,
            galleryImages: facility.galleryImages,
        });
    }

    return (
        <div style={style} className="px-1 py-1.5"> {/* Wrapper for style prop and padding */}
            <div
                onClick={() => onClick(facility)}
                data-testid={`facility-card-${facility.id}`}
                data-debug="facility-list-card"
                className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors group h-full"
            >
                {facility.imageUrl && !facility.imageUrl.includes('placeholder') && !facility.imageUrl.includes('via.placeholder') ? (
                    <OptimizedImage
                        src={facility.imageUrl}
                        alt={facility.name}
                        width={88}
                        height={88}
                        className="rounded-xl shrink-0"
                        objectFit="cover"
                        loading="lazy"
                        fallbackSrc={getFallbackByType(facility.type)}
                    />
                ) : (
                    <div className="w-[88px] h-[88px] rounded-xl bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 text-[10px] text-center px-1">
                        {facility.name.slice(0, 6)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <div className="text-[12px] text-primary font-bold shrink-0" data-debug="facility-list-card-meta">
                            {getCategoryLabel(facility.type || '') || facility.category}
                        </div>
                        {normalizedPlanId === 'PREMIUM' && (
                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white p-0.5 rounded-full shadow-sm" title="프리미엄 실버">
                                <Award size={10} />
                            </div>
                        )}
                        {normalizedPlanId === 'ENTERPRISE' && (
                            <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white p-0.5 rounded-full shadow-sm" title="프리미엄 골드">
                                <Award size={10} />
                            </div>
                        )}
                        {facility.subscription?.plan && normalizedPlanId !== 'FREE' && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 text-primary text-[9px] rounded font-bold border border-primary/10 shrink-0">
                                <Bot size={10} /> AI상담
                            </div>
                        )}
                        {facility.price_transparency && (
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] rounded font-bold border border-emerald-100 shrink-0"
                                 title="가격 공개 인증 시설">
                                <BadgeCheck size={10} />
                                <span className="hidden md:inline">가격 공개</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-extrabold text-[16px] text-slate-900 leading-snug break-words line-clamp-2" data-debug="facility-list-card-title">{facility.name}</h3>
                    <div className="text-[13px] text-slate-500 mt-1 truncate" data-debug="facility-list-card-address">{facility.address}</div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-amber-500 text-xs">★ {Math.round(facility.rating || 0)}</span>
                        <span className="text-slate-400 text-xs">({facility.reviewCount || 0})</span>
                    </div>
                </div>

                <div className="flex flex-col justify-center shrink-0 pl-1">
                    <button
                        data-debug="facility-list-card-compare-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(facility);
                        }}
                        className={`p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-full transition-colors border shadow-sm ${isCompared
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-primary hover:text-primary'
                            }`}
                        title={isCompared ? "비교함에서 제거" : "비교함에 추가"}
                    >
                        {isCompared ? <Check size={18} /> : <Scale size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
});
