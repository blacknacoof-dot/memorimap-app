import { describe, expect, it } from 'vitest';

import { shouldAttemptChunkReload } from './chunkRecovery';

describe('shouldAttemptChunkReload', () => {
  it('allows the first reload attempt when no prior state exists', () => {
    expect(shouldAttemptChunkReload('https://memorimap.kr/assets/index-a.js', null)).toBe(true);
  });

  it('blocks repeated reload attempts for the same entry url', () => {
    const state = JSON.stringify({
      entryUrl: 'https://memorimap.kr/assets/index-a.js',
      attemptedAt: Date.now(),
      reason: 'chunkloaderror',
    });

    expect(shouldAttemptChunkReload('https://memorimap.kr/assets/index-a.js', state)).toBe(false);
  });

  it('allows a reload attempt again after the app entry url changes', () => {
    const state = JSON.stringify({
      entryUrl: 'https://memorimap.kr/assets/index-a.js',
      attemptedAt: Date.now(),
      reason: 'entry-changed',
    });

    expect(shouldAttemptChunkReload('https://memorimap.kr/assets/index-b.js', state)).toBe(true);
  });

  it('ignores malformed stored state instead of blocking recovery forever', () => {
    expect(shouldAttemptChunkReload('https://memorimap.kr/assets/index-a.js', '{bad-json')).toBe(true);
  });
});
