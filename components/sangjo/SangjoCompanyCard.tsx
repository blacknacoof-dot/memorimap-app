import React from 'react';
import { FuneralCompany } from '../../types';
import { Star, ShieldCheck, HeartHandshake, Scale, Check, Heart } from 'lucide-react';

interface SangjoCompanyCardProps {
    company: FuneralCompany;
    isFavorited: boolean;
    isCompared: boolean;
    onSelect: () => void;
    onToggleFavorite: (e: React.MouseEvent) => void;
    onToggleCompare: (e: React.MouseEvent) => void;
}

export const SangjoCompanyCard: React.FC<SangjoCompanyCardProps> = ({
    company,
    isFavorited,
    isCompared,
    onSelect,
    onToggleFavorite,
    onToggleCompare,
}) => {
    return (
        <div
            onClick={onSelect}
            className={`bg-white rounded-2xl p-2.5 shadow-sm border transition-all active:scale-[0.98] group relative ${isCompared ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 hover:shadow-md'
                }`}
        >
            {/* Favorite Button - Heart Icon */}
            <button
                onClick={onToggleFavorite}
                className={`absolute right-2 top-2 p-3 rounded-full transition-all shadow-sm z-10 ${isFavorited
                    ? 'bg-red-50 text-red-500'
                    : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                title={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
                <Heart
                    size={18}
                    fill={isFavorited ? 'currentColor' : 'none'}
                    strokeWidth={2}
                />
            </button>

            {/* Compare Button - Icon Only Style */}
            <button
                onClick={onToggleCompare}
                className={`absolute right-2 bottom-2 p-3 rounded-full transition-colors border shadow-sm z-10 ${isCompared
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                title={isCompared ? "비교함에서 제거" : "비교함에 추가"}
            >
                {isCompared ? <Check size={14} /> : <Scale size={14} />}
            </button>
            <div className="flex gap-3">
                <div className="relative shrink-0">
                    <img
                        src={company.imageUrl}
                        alt={company.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-sm border border-gray-50">
                        <ShieldCheck size={14} className="text-green-500" />
                    </div>
                </div>

                <div className="flex-1 min-w-0 pr-10">
                    <div className="flex justify-between items-start mb-0.5">
                        <h3 className="font-bold text-[15px] text-gray-900 group-hover:text-primary transition-colors break-all line-clamp-2">
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
    );
};
