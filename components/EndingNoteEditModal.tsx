import React, { useEffect, useState } from 'react';
import { X, Heart, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { getEndingNoteLimits, sanitizeEndingNoteDraft } from '../lib/endingNoteAccess';
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
  '수목장',
  '자연장',
  '가족장',
  '화장',
  '매장',
  '해양장',
  '수목장 + 가족 참여',
  '전통 의식',
  '간소한 의식',
];

export default function EndingNoteEditModal({
  isOpen,
  onClose,
  currentNote,
  onSave,
  endingNoteLevel = 'full',
  onUpgrade,
}: EndingNoteEditModalProps) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [contact, setContact] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const limits = getEndingNoteLimits(endingNoteLevel);

  useEffect(() => {
    if (!isOpen) return;

    setPreferences(currentNote?.preferences || []);
    setContact(currentNote?.contact || '');
    setMemo(currentNote?.memo || '');
  }, [currentNote, isOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const togglePreference = (option: string) => {
    setPreferences((prev) =>
      prev.includes(option)
        ? prev.filter((value) => value !== option)
        : [...prev, option],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(sanitizeEndingNoteDraft(endingNoteLevel, {
        preferences,
        contact,
        memo,
      }));
      onClose();
    } catch {
      toast.error('엔딩노트 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-50 bg-white p-5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1.5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-bold text-gray-900">나의 엔딩노트 작성</h2>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar max-h-[75dvh] space-y-6 overflow-y-auto p-5 md:max-h-[60dvh]">
          {endingNoteLevel === 'basic' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-medium leading-5 text-amber-800">
                무료 플랜은 연락처 1개, 메모 {limits.memoMaxLength}자, 공유 1개까지 작성할 수 있습니다.
              </p>
              {onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="mt-2 text-[11px] font-bold text-amber-900 underline underline-offset-2"
                >
                  요금제 보기
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-pink-500">
              <Heart size={12} className="fill-pink-500" />
              선호 방식
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PREFERENCE_OPTIONS.map((option) => {
                const isSelected = preferences.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => togglePreference(option)}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500 text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-pink-200 hover:bg-pink-50/30'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-800">
                <Phone size={12} className="text-gray-400" />
                비상 연락처
              </h3>
              <span className="text-[10px] text-gray-400">{contact.length}/{limits.contactMaxLength}</span>
            </div>
            <input
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              maxLength={limits.contactMaxLength}
              placeholder="가족 또는 지인 연락처 1개"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-[11px] placeholder:text-gray-300 transition-all focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-800">
                <FileText size={12} className="text-gray-400" />
                마지막 메모
              </h3>
              <span className="text-[10px] text-gray-400">{memo.length}/{limits.memoMaxLength}</span>
            </div>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              maxLength={limits.memoMaxLength}
              rows={4}
              placeholder="남기고 싶은 말이나 요청 사항을 적어 주세요."
              className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-[11px] leading-relaxed placeholder:text-gray-300 transition-all focus:outline-none focus:ring-1 focus:ring-pink-300"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-50 bg-white p-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[11px] font-bold text-gray-400 transition-colors hover:text-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] rounded-xl bg-pink-500 py-3 text-[11px] font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '기록 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
