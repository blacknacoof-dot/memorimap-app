import { describe, expect, it } from 'vitest';

import { getEndingNoteLimits, sanitizeEndingNoteDraft } from '../../lib/endingNoteAccess';

describe('ending note access', () => {
  it('allows contact and short memo on basic plans', () => {
    expect(getEndingNoteLimits('basic')).toEqual({
      contactMaxLength: 40,
      memoMaxLength: 120,
      shareLimit: 1,
    });
  });

  it('preserves all fields for full plans', () => {
    expect(sanitizeEndingNoteDraft('full', {
      preferences: ['family'],
      contact: '010-1111-2222',
      memo: 'Please keep the ceremony simple.',
    })).toEqual({
      preferences: ['family'],
      contact: '010-1111-2222',
      memo: 'Please keep the ceremony simple.',
      percent: 100,
    });
  });

  it('clips contact and memo to the basic plan limits', () => {
    const basic = sanitizeEndingNoteDraft('basic', {
      preferences: ['nature'],
      contact: '010-1111-2222 ext-1234567890 emergency contact overflow',
      memo: 'x'.repeat(160),
    });

    expect(basic.preferences).toEqual(['nature']);
    expect(basic.contact).toHaveLength(40);
    expect(basic.memo).toHaveLength(120);
    expect(basic.percent).toBe(100);
  });
});
