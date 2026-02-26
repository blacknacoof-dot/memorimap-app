import React from 'react';
import { FuneralCompany, SangjoProduct, ServiceDetail } from '../../../types';
import { CheckCircle2 } from 'lucide-react';

interface PriceTabProps {
    company: FuneralCompany;
}

export const PriceTab: React.FC<PriceTabProps> = ({ company }) => {
    return (
        <div className="space-y-6">
            <h3 className="font-bold text-lg">서비스 상품 구성</h3>

            <div className="space-y-4">
                {(() => {
                    // Fallback Logic
                    const products = company.products && company.products.length > 0
                        ? company.products
                        : ((company as FuneralCompany & { priceInfo?: { products?: SangjoProduct[] }; packages?: SangjoProduct[] }).priceInfo?.products || (company as FuneralCompany & { packages?: SangjoProduct[] }).packages || []);

                    if (products.length === 0) {
                        return (
                            <div className="p-4 bg-gray-50 rounded-2xl text-center text-sm text-gray-400 py-10">
                                상품 정보를 준비 중입니다.
                            </div>
                        );
                    }

                    return products.map((prod: SangjoProduct & { badges?: string[] }, idx: number) => {
                        const isPremium = prod.badges?.includes('고급형');
                        const isStandard = prod.badges?.includes('표준형');

                        return (
                            <div
                                key={idx}
                                className={`rounded-2xl shadow-sm relative overflow-hidden border ${isPremium ? 'bg-slate-900 border-slate-800 text-white' :
                                    isStandard ? 'bg-blue-600 border-blue-500 text-white' :
                                        'bg-white border-gray-100'
                                    }`}
                            >
                                <div className="p-5 border-b border-white/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-0.5 text-[10px] font-bold rounded mb-2 inline-block ${isPremium ? 'bg-amber-400 text-black' :
                                            isStandard ? 'bg-blue-400 text-white' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {prod.badges?.[0] || '기본형'}
                                        </div>
                                        <span className={`font-bold text-lg ${isPremium || isStandard ? 'text-white' : 'text-primary'
                                            }`}>{prod.price > 0 ? `${(prod.price / 10000).toLocaleString()}만원` : '상담 문의'}</span>
                                    </div>
                                    <div className="mb-1">
                                        <span className={`font-bold text-xl block ${isPremium || isStandard ? 'text-white' : 'text-gray-900'
                                            }`}>{prod.name}</span>
                                        {prod.tagline && <span className={`text-xs ${isPremium || isStandard ? 'text-white/70' : 'text-primary'
                                            }`}>{prod.tagline}</span>}
                                    </div>
                                    <p className={`text-xs mt-2 break-words ${isPremium || isStandard ? 'text-white/80' : 'text-gray-500'
                                        }`}>{prod.description}</p>
                                </div>

                                <div className={`p-4 space-y-4 ${isPremium || isStandard ? 'bg-white' : ''}`}>
                                    {prod.serviceDetails && prod.serviceDetails.map((detail: ServiceDetail, dIdx: number) => (
                                        <div key={dIdx} className="flex gap-3 text-sm">
                                            <span className="font-bold text-gray-700 w-12 shrink-0 text-xs break-keep">{detail.category}</span>
                                            <div className="text-gray-600 flex-1 text-xs space-y-1 break-words min-w-0">
                                                {detail.items.map((item: string, iIdx: number) => (
                                                    <div key={iIdx} className="flex items-start gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {prod.faq && prod.faq.length > 0 && (
                                    <div className={`px-4 py-3 border-t border-dashed bg-gray-50/50 ${isPremium || isStandard ? 'border-gray-200' : 'border-gray-100'}`}>
                                        <span className="text-[10px] font-bold text-blue-600 mb-1 block italic">자주 묻는 질문</span>
                                        <div className="space-y-1">
                                            {prod.faq.slice(0, 1).map((f: { q: string; a: string }, fIdx: number) => (
                                                <div key={fIdx} className="text-[11px]">
                                                    <div className="font-medium text-gray-800 break-words">Q: {f.q}</div>
                                                    <div className="text-gray-500 break-words">A: {f.a}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                })()}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500">
                * 위 금액은 표준 금액이며, 실제 서비스 구성에 따라 달라질 수 있습니다.<br />
                * 장지 이용료(납골당 등)는 포함되지 않은 순수 상조 서비스 금액입니다.
            </div>
        </div>
    );
};
