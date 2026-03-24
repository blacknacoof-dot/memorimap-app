import React, { useState, useEffect } from 'react';
import { X, Heart, Phone, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { EndingNoteLevel } from '../types/subscription';

interface EndingNote {
    preferences: string[];
    contact: string;
    memo: string;
    percent: number;
}

interface EndingNoteEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentNote: EndingNote | null;
    onSave: (updates: Partial<EndingNote>) => Promise<void>;
    endingNoteLevel?: EndingNoteLevel;
    onUpgrade?: () => void;
}

const PREFERENCE_OPTIONS = [
    "수목장", "자연장", "가족묘", "납골당", "화장",
    "산골", "수목장 + 가족 참여", "전통 장례", "간소한 장례"
];

export default function EndingNoteEditModal({ isOpen, onClose, currentNote, onSave, endingNoteLevel = 'full', onUpgrade }: EndingNoteEditModalProps) {
    const [preferences, setPreferences] = useState<string[]>([]);
    const [contact, setContact] = useState('');
    const [memo, setMemo] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && currentNote) {
            setPreferences(currentNote.preferences || []);
            setContact(currentNote.contact || '');
            setMemo(currentNote.memo || '');
        } else if (isOpen) {
            // 초기화
            setPreferences([]);
            setContact('');
            setMemo('');
        }
    }, [isOpen, currentNote]);

    // [Bug Fix] ESC 핸들러를 early return 전에 배치 — Hooks 순서 일관성 유지
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    if (!isOpen) return null;

    const togglePreference = (option: string) => {
        setPreferences(prev =>
            prev.includes(option)
                ? prev.filter(p => p !== option)
                : [...prev, option]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 진행률 계산 로직 (간단히 필드 채워짐에 따라 0, 33, 66, 100)
            let filledCount = 0;
            if (preferences.length > 0) filledCount++;
            if (contact.trim() !== '') filledCount++;
            if (memo.trim() !== '') filledCount++;

            const percent = Math.round((filledCount / 3) * 100);

            await onSave({
                preferences,
                contact,
                memo,
                percent
            });
            onClose();
        } catch (_error) {
            toast.error('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Simple Header */}
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-pink-500 rounded-full" />
                        <h2 className="text-sm font-bold text-gray-900">나의 엔딩 노트 작성</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                {/* Content - Compact */}
                <div className="p-5 space-y-6 max-h-[75dvh] md:max-h-[60dvh] overflow-y-auto custom-scrollbar">
                    {/* 1. 선호 방식 */}
                    <div className="space-y-3">
                        <h3 className="text-[11px] font-bold text-pink-500 flex items-center gap-1.5">
                            <Heart size={12} className="fill-pink-500" /> 나의 선호 방식
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {PREFERENCE_OPTIONS.map(option => {
                                const isSelected = preferences.includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => togglePreference(option)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isSelected
                                                ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-pink-200 hover:bg-pink-50/30'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. 비상 연락망 */}
                    <div className="space-y-3 relative">
                        <h3 className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" /> 비상 연락망
                        </h3>
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="예: 아들 김철수 (010-1234-5678)"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-pink-300 transition-all placeholder:text-gray-300"
                        />
                    </div>

                    {/* 3. 한 줄 메모 */}
                    <div className="space-y-3 relative">
                        <h3 className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                            <FileText size={12} className="text-gray-400" /> 한 줄 메모
                        </h3>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            rows={3}
                            placeholder="예: 장례식에는 웃는 얼굴 사진을 사용해주세요"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-pink-300 transition-all resize-none placeholder:text-gray-300 leading-relaxed"
                        />
                    </div>
                </div>

                {/* Footer - Simple & Compact */}
                <div className="p-4 bg-white flex gap-2 border-t border-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-[2] py-3 bg-pink-500 text-white text-[11px] font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>기록 저장하기</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
