import React from 'react';
import { FuneralCompany } from '../types';
import { X, Star, Trash2, ShieldCheck, HeartHandshake, Gift, Scale } from 'lucide-react';

interface Props {
    companies: FuneralCompany[];
    onClose: () => void;
    onRemove: (id: string) => void;
    onSelect: (company: FuneralCompany) => void;
}

export const SangjoComparisonModal: React.FC<Props> = ({ companies, onClose, onRemove, onSelect }) => {
    if (companies.length === 0) return null;

    const ComparisonRow = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <div className="border-b border-gray-100 flex min-w-max md:min-w-0">
            <div className="w-[100px] md:w-[120px] bg-gray-50/50 p-4 flex flex-col items-center justify-center gap-1 shrink-0">
                <Icon size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{title}</span>
            </div>
            <div className="flex flex-1">
                {children}
            </div>
        </div>
    );

    const CompanyCell = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={`w-[140px] md:w-[200px] p-4 flex flex-col items-center justify-center text-center shrink-0 border-l border-gray-100 ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl h-full md:h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Scale size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">상조 업체 상세 비교</h2>
                            <p className="text-[10px] text-gray-500">선택하신 {companies.length}개 업체를 비교합니다 (최대 3개)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="text-gray-500" />
                    </button>
                </div>

                {/* Comparison Content */}
                <div className="flex-1 overflow-auto no-scrollbar bg-white">
                    <div className="flex flex-col h-full">
                        {/* Company Headers (Sticky) */}
                        <div className="sticky top-0 z-20 bg-white border-b shadow-sm flex min-w-max md:min-w-0">
                            <div className="w-[100px] md:w-[120px] bg-gray-50 shrink-0" />
                            {companies.map(company => (
                                <div key={company.id} className="w-[140px] md:w-[200px] p-4 shrink-0 relative flex flex-col items-center">
                                    <button
                                        onClick={() => onRemove(company.id)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="w-12 h-12 rounded-full overflow-hidden mb-2 border-2 border-primary/10">
                                        <img src={company.imageUrl} alt={company.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold text-xs text-gray-900 truncate w-full text-center">{company.name}</h3>
                                    <div className="flex items-center text-yellow-500 gap-0.5 mt-1">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-[10px] font-bold text-gray-600">{company.rating}</span>
                                    </div>
                                </div>
                            ))}
                            {companies.length < 3 && Array(3 - companies.length).fill(0).map((_, i) => (
                                <div key={`empty-${i}`} className="w-[140px] md:w-[200px] shrink-0 border-l border-dashed border-gray-100 flex flex-col items-center justify-center p-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                                        <Scale size={16} />
                                    </div>
                                    <span className="text-[9px] text-gray-300 mt-2">추가 비교 가능</span>
                                </div>
                            ))}
                        </div>

                        {/* Comparison Rows */}
                        <div className="flex-1">
                            <ComparisonRow title="예상 비용" icon={HeartHandshake}>
                                {companies.map(c => (
                                    <CompanyCell key={c.id}>
                                        <span className="text-xs font-bold text-primary">{c.priceRange}</span>
                                    </CompanyCell>
                                ))}
                            </ComparisonRow>

                            <ComparisonRow title="제휴 혜택" icon={Gift}>
                                {companies.map(c => (
                                    <CompanyCell key={c.id}>
                                        <ul className="text-left w-full space-y-1">
                                            {c.benefits.map((b, i) => (
                                                <li key={i} className="text-[9px] text-gray-600 flex items-start gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1 shrink-0" />
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </CompanyCell>
                                ))}
                            </ComparisonRow>

                            <ComparisonRow title="특화 서비스" icon={ShieldCheck}>
                                {companies.map(c => (
                                    <CompanyCell key={c.id}>
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {c.specialties?.map((s, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </CompanyCell>
                                ))}
                            </ComparisonRow>

                            <ComparisonRow title="지원 프로그램" icon={HeartHandshake}>
                                {companies.map(c => (
                                    <CompanyCell key={c.id}>
                                        <ul className="text-left w-full space-y-1">
                                            {c.supportPrograms?.map((p, i) => (
                                                <li key={i} className="text-[9px] text-gray-600 leading-tight">
                                                    • {p}
                                                </li>
                                            ))}
                                        </ul>
                                    </CompanyCell>
                                ))}
                            </ComparisonRow>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-0 bg-white border-t p-4 flex min-w-max md:min-w-0">
                            <div className="w-[100px] md:w-[120px] shrink-0" />
                            {companies.map(c => (
                                <div key={c.id} className="w-[140px] md:w-[200px] px-2 shrink-0">
                                    <button
                                        onClick={() => onSelect(c)}
                                        className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-md"
                                    >
                                        자세히 보기
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
