import React from 'react';
import { FuneralCompany } from '../../../types';
import { Star, Phone, Share2, Heart, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InfoTabProps {
    company: FuneralCompany;
    isLiked: boolean;
    onShare: () => void;
    onToggleLike: () => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({ company, isLiked, onShare, onToggleLike }) => {
    return (
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
                        onClick={onShare}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={onToggleLike}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
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
                    {(company.features || []).map((feature, idx) => (
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
    );
};
