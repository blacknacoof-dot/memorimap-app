import React from 'react';
import { Facility } from '../../types';
import { MapPin, Star, ChevronRight } from 'lucide-react';

interface Props {
    facilities: Facility[];
    onViewDetail: (facility: Facility) => void;
}

export const RecommendList: React.FC<Props> = ({ facilities, onViewDetail }) => {
    if (!facilities || facilities.length === 0) return null;

    return (
        <div className="w-full mt-3 mb-2 space-y-2">
            {facilities.map((facility) => (
                <div
                    key={facility.id}
                    className="flex bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onViewDetail(facility)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${facility.name} 상세보기`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail(facility); } }}
                >
                    {/* Image */}
                    <div className="relative w-24 h-24 shrink-0 bg-slate-100">
                        {facility.imageUrl ? (
                            <img
                                src={facility.imageUrl}
                                alt={facility.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="text-[10px]">이미지 없음</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-2.5 min-w-0 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-[15px] text-slate-800 leading-tight whitespace-normal break-keep">{facility.name}</h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                <MapPin size={10} className="shrink-0" />
                                <span className="truncate">{facility.address || '주소 정보 없음'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold">
                                    <Star size={11} fill="currentColor" />
                                    <span>{facility.rating ? facility.rating.toFixed(1) : '0.0'}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">({facility.reviewCount || 0})</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetail(facility);
                                }}
                                aria-label={`${facility.name} 상세보기`}
                                className="py-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-colors flex items-center gap-0.5"
                            >
                                상세보기 <ChevronRight size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
