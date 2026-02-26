import React from 'react';
import { FuneralCompany } from '../../../types';
import { Gift, CreditCard } from 'lucide-react';

interface BenefitsTabProps {
    company: FuneralCompany;
}

export const BenefitsTab: React.FC<BenefitsTabProps> = ({ company }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Gift size={20} className="text-amber-500" />
                추모맵 회원 단독 혜택
            </h3>

            {(company.benefits || []).map((benefit, idx) => (
                <div key={idx} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                        <span className="text-amber-600 font-bold text-sm">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-900">{benefit}</span>
                </div>
            ))}

            <div className="mt-8 p-4 bg-gray-900 rounded-2xl text-white">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <CreditCard size={16} className="text-amber-400" />
                    혜택 적용 방법
                </h4>
                <ol className="text-xs space-y-2 text-gray-300 list-decimal list-inside">
                    <li>하단 'AI 상담' 버튼을 통해 상담 시작</li>
                    <li>AI 상담 후 전문가 연결 요청 시 "추모맵 회원"임을 말씀해주세요</li>
                    <li>서비스 이용 후 장지(납골당 등) 예약 시 추가 혜택 적용</li>
                </ol>
            </div>

            {company.supportPrograms && company.supportPrograms.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                    <h4 className="font-bold text-sm text-gray-800 mb-4">정부 지원 및 제휴 프로그램</h4>
                    <div className="space-y-3">
                        {company.supportPrograms.map((prog, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>{prog}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
