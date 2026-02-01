import React from 'react';
import { Facility } from '../../types';
import { MapPin, Star, MessageSquare, ChevronRight } from 'lucide-react';

interface Props {
    facilities: Facility[];
    onViewDetail: (facility: Facility) => void;
}

export const RecommendList: React.FC<Props> = ({ facilities, onViewDetail }) => {
    if (!facilities || facilities.length === 0) return null;

    return (
        <div className="w-full mt-3 mb-2">
            <div className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                {facilities.map((facility) => (
                    <div
                        key={facility.id}
                        className="flex-none w-[220px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden snap-center hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onViewDetail(facility)}
                    >
                        {/* Image Area */}
                        <div className="relative h-28 bg-slate-100">
                            {facility.imageUrl ? (
                                <img
                                    src={facility.imageUrl}
                                    alt={facility.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <span className="text-xs">이미지 없음</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                {facility.category === 'funeral_home' ? '장례식장' : facility.category || '시설'}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-3">
                            <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{facility.name}</h4>

                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                <MapPin size={12} />
                                <span className="truncate">{facility.address || '주소 정보 없음'}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
                                    <Star size={12} fill="currentColor" />
                                    <span>{facility.rating ? facility.rating.toFixed(1) : '0.0'}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">({facility.reviewCount || 0})</span>
                            </div>

                            <button
                                className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                            >
                                상담 예약하기 <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Scroll Indicator Hint */}
            {facilities.length > 1 && (
                <div className="flex justify-center gap-1 mt-1">
                    {facilities.map((_, idx) => (
                        <div key={idx} className="w-1 h-1 rounded-full bg-slate-200 first:bg-indigo-400"></div>
                    ))}
                </div>
            )}
        </div>
    );
};
