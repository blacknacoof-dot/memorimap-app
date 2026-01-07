import React from 'react';
import { Check, Scale, Award, Bot, Database } from 'lucide-react';
import { Facility } from '../types';

interface FacilityItemProps {
    facility: Facility;
    onClick: (facility: Facility) => void;
    isCompared: boolean;
    onToggleCompare: (facility: Facility) => void;
    style?: React.CSSProperties; // Required for react-window
}

export const FacilityItem = React.memo(({ facility, onClick, isCompared, onToggleCompare, style }: FacilityItemProps) => {
    return (
        <div style={style} className="px-1 py-2"> {/* Wrapper for style prop and padding */}
            <div
                onClick={() => onClick(facility)}
                className="bg-white p-4 rounded-xl shadow-sm border flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors group h-full"
            >
                {facility.imageUrl && !facility.imageUrl.includes('placeholder') && !facility.imageUrl.includes('via.placeholder') ? (
                    <img
                        src={facility.imageUrl}
                        className="w-20 h-20 object-cover rounded-lg bg-gray-200 shrink-0"
                        alt={facility.name}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-[10px] text-center px-1">
                        {facility.name.slice(0, 6)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <div className="text-xs text-primary font-bold shrink-0">
                            {facility.type === 'charnel' ? '봉안시설' :
                                facility.type === 'natural' ? '자연장' :
                                    facility.type === 'funeral' ? '장례식장' :
                                        facility.type === 'sea' ? '해양장' :
                                            facility.type === 'pet' ? '동물장묘' :
                                                facility.type === 'complex' ? '공원묘지' : '공원묘지'}
                        </div>
                        {facility.subscription?.plan?.name_en === 'premium' && (
                            <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white p-0.5 rounded-full shadow-sm" title="프리미엄 실버">
                                <Award size={10} />
                            </div>
                        )}
                        {facility.subscription?.plan?.name_en === 'enterprise' && (
                            <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white p-0.5 rounded-full shadow-sm" title="프리미엄 골드">
                                <Award size={10} />
                            </div>
                        )}
                        {facility.subscription?.plan && facility.subscription.plan.name_en !== 'free' && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 text-primary text-[9px] rounded font-bold border border-primary/10 shrink-0">
                                <Bot size={10} /> AI상담
                            </div>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-800 truncate">{facility.name}</h3>
                    <div className="text-xs text-gray-500 mt-1 truncate">{facility.address}</div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-yellow-500 text-xs">★ {Math.round(facility.rating || 0)}</span>
                        <span className="text-gray-400 text-xs">({facility.reviewCount || 0})</span>
                    </div>
                </div>

                <div className="flex flex-col justify-end shrink-0 pl-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(facility);
                        }}
                        className={`p-2 rounded-full transition-colors border shadow-sm ${isCompared
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-primary hover:text-primary'
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
