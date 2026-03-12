import React, { useState } from 'react';
import {
    ChevronDown, ChevronRight, ExternalLink,
    FileText, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useAdministrativeChecklist } from '../hooks/useAdministrativeChecklist';
import { ADMIN_CHECKLIST_DATA, groupByUrgency } from '../lib/administrativeChecklistData';
import type { AdminChecklistCategory } from '../types/db';

const URGENCY_CONFIG = {
    high: { label: '긴급 (기한 있음)', colorClass: 'text-red-600', Icon: AlertTriangle },
    medium: { label: '중요', colorClass: 'text-amber-600', Icon: FileText },
    low: { label: '해당 시 처리', colorClass: 'text-green-600', Icon: CheckCircle2 },
} as const;

export const AdministrativeChecklist: React.FC = () => {
    const { items, loading, toggleItem, updateNotes, completedCount, totalCount } = useAdministrativeChecklist();
    const [expandedCategory, setExpandedCategory] = useState<AdminChecklistCategory | null>(null);
    const [editingNotes, setEditingNotes] = useState<{ category: AdminChecklistCategory; value: string } | null>(null);

    const grouped = groupByUrgency(ADMIN_CHECKLIST_DATA);
    const isCompleted = (cat: AdminChecklistCategory) => items.find(i => i.category === cat)?.is_completed ?? false;
    const getNotes = (cat: AdminChecklistCategory) => items.find(i => i.category === cat)?.notes ?? '';

    if (loading) {
        return <div className="animate-pulse h-40 bg-gray-100 rounded-2xl" />;
    }

    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-gray-900">
                    장례 후 행정 체크리스트
                </h2>
                <span className="text-xs text-gray-500 font-bold">{completedCount}/{totalCount} ({percent}%)</span>
            </div>

            {/* 진행 바 */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>

            {/* 면책 문구 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 leading-relaxed">
                본 정보는 일반적인 참고용이며 법적 효력이 없습니다. 구체적인 사항은 관할 기관 또는 법률 전문가에게 문의하세요.
            </div>

            {/* 긴급도별 그룹 */}
            {(['high', 'medium', 'low'] as const).map(urgency => {
                const config = URGENCY_CONFIG[urgency];
                const { Icon } = config;
                const groupItems = grouped[urgency];

                return (
                    <div key={urgency} className="mb-4">
                        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1 ${config.colorClass}`}>
                            <Icon size={14} />
                            {config.label}
                        </h3>
                        <div className="space-y-2">
                            {groupItems.map(item => {
                                const completed = isCompleted(item.category);
                                const notes = getNotes(item.category);
                                const expanded = expandedCategory === item.category;
                                const isEditing = editingNotes?.category === item.category;

                                return (
                                    <div
                                        key={item.category}
                                        className={`border rounded-xl overflow-hidden transition-colors ${
                                            completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        {/* 메인 행 */}
                                        <div className="flex items-center gap-3 px-3 py-3">
                                            <button
                                                onClick={() => toggleItem(item.category)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs transition-colors ${
                                                    completed
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-gray-300 hover:border-emerald-400'
                                                }`}
                                            >
                                                {completed && '✓'}
                                            </button>
                                            <button
                                                onClick={() => setExpandedCategory(expanded ? null : item.category)}
                                                className="flex-1 text-left min-w-0"
                                            >
                                                <h4 className={`text-sm font-bold ${completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                    {item.title}
                                                </h4>
                                                {item.deadline && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{item.deadline}</p>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setExpandedCategory(expanded ? null : item.category)}
                                                className="p-1 text-gray-400 shrink-0"
                                            >
                                                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        </div>

                                        {/* 상세 패널 */}
                                        {expanded && (
                                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                                                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>

                                                {item.documents.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 mb-1 font-bold">필요 서류</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.documents.map(doc => (
                                                                <span key={doc} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                                    {doc}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.links.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.links.map(link => (
                                                            <a
                                                                key={link.url}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                                                            >
                                                                <ExternalLink size={12} />
                                                                {link.label}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 메모 */}
                                                <div>
                                                    <p className="text-[10px] text-gray-400 mb-1 font-bold">메모</p>
                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editingNotes?.value ?? ''}
                                                                onChange={(e) => setEditingNotes(prev => prev ? { ...prev, value: e.target.value } : null)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                                rows={3}
                                                                placeholder="메모를 입력하세요..."
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (editingNotes) {
                                                                            await updateNotes(editingNotes.category, editingNotes.value);
                                                                            setEditingNotes(null);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold"
                                                                >
                                                                    저장
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingNotes(null)}
                                                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs"
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setEditingNotes({ category: item.category, value: notes })}
                                                            className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                                                        >
                                                            {notes || '메모를 추가하려면 탭하세요'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </section>
    );
};
