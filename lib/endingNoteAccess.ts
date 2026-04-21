import type { EndingNoteLevel } from '../types/subscription';

export interface EndingNoteDraft {
  preferences?: string[] | null;
  contact?: string | null;
  memo?: string | null;
  percent?: number | null;
}

export interface EndingNoteLimits {
  contactMaxLength: number;
  memoMaxLength: number;
  shareLimit: number | null;
}

const ENDING_NOTE_LIMITS: Record<EndingNoteLevel, EndingNoteLimits> = {
  basic: {
    contactMaxLength: 40,
    memoMaxLength: 120,
    shareLimit: 1,
  },
  full: {
    contactMaxLength: 80,
    memoMaxLength: 300,
    shareLimit: 3,
  },
  full_pdf: {
    contactMaxLength: 120,
    memoMaxLength: 1000,
    shareLimit: null,
  },
};

function normalizeSingleLine(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeMultiline(value: string, maxLength: number): string {
  return value.replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

export function getEndingNoteLimits(level: EndingNoteLevel): EndingNoteLimits {
  return ENDING_NOTE_LIMITS[level];
}

export function computeEndingNotePercent(note: { preferences: string[]; contact: string; memo: string }): number {
  let filledCount = 0;
  if (note.preferences.length > 0) filledCount += 1;
  if (note.contact.trim() !== '') filledCount += 1;
  if (note.memo.trim() !== '') filledCount += 1;
  return Math.round((filledCount / 3) * 100);
}

export function sanitizeEndingNoteDraft(level: EndingNoteLevel, draft: EndingNoteDraft | null | undefined) {
  const limits = getEndingNoteLimits(level);
  const preferences = Array.isArray(draft?.preferences)
    ? draft.preferences.filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    : [];
  const contact = normalizeSingleLine(String(draft?.contact || ''), limits.contactMaxLength);
  const memo = normalizeMultiline(String(draft?.memo || ''), limits.memoMaxLength);

  return {
    preferences,
    contact,
    memo,
    percent: computeEndingNotePercent({ preferences, contact, memo }),
  };
}
